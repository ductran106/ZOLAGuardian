# PROMPT THI CÔNG PHASE 2 — Zalo Guardian Scheduler & Scorer
## Dành cho: Cursor Agent (Worker)
## Issued by: Ông Thầu (Claude)
## Date: 2026-05-02

---

## CONTEXT

Bạn là Cursor Agent (Worker) cho dự án `zalo-guardian`.
Kết nối ProBook theo SSH config đã có trong project.
- ProBook: `/home/duc/zalo-guardian/`
- PC-Boss: `C:\Users\ANTRACH_DOUBLE\zalo-guardian\`

Đọc `docs/HANDOFF_ZCA.md` trước khi làm bất cứ điều gì.

### Những gì đã có sẵn (KHÔNG làm lại):
- `messages` table đã có `quote_msg_id`, `quote_owner_id` ✅
- `core/zalo.js` đã ghi `msg.data.quote.globalMsgId` vào DB ✅
- Service đang chạy ổn định ✅

---

## NHIỆM VỤ: Build modules/scheduler/

### Cấu trúc cần tạo:
```
modules/scheduler/
├── index.js      ← entry, subscribe zalo:message
├── parser.js     ← nhận dạng loại tin, extract giá/điểm
└── scorer.js     ← upsert daily_scores
```

---

## BƯỚC 1 — Thêm 2 tables mới vào core/db.js

Tìm khối migrate ALTER TABLE (cuối hàm init).
Thêm tiếp 2 đoạn sau:

```js
try {
  db.prepare(`CREATE TABLE IF NOT EXISTS jobs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    msg_id          TEXT UNIQUE,
    group_id        TEXT,
    poster_id       TEXT,
    poster_name     TEXT,
    taker_id        TEXT,
    taker_name      TEXT,
    taker_msg_id    TEXT,
    confirm_msg_id  TEXT,
    cancel_msg_id   TEXT,
    raw_content     TEXT,
    price           INTEGER,
    trip_type       TEXT,
    base_points     REAL,
    status          TEXT DEFAULT 'OPEN',
    job_date        TEXT,
    ts              INTEGER,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();
} catch(e) {}

try {
  db.prepare(`CREATE TABLE IF NOT EXISTS daily_scores (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         TEXT,
    display_name    TEXT,
    group_id        TEXT,
    date            TEXT,
    jobs_posted     INTEGER DEFAULT 0,
    jobs_taken      INTEGER DEFAULT 0,
    points_earned   REAL DEFAULT 0,
    points_deducted REAL DEFAULT 0,
    net_points      REAL DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, group_id, date)
  )`).run();
} catch(e) {}
```

---

## BƯỚC 2 — Tạo modules/scheduler/parser.js

```js
// modules/scheduler/parser.js
// Mục đích: Parse tin nhắn lịch xe, áp barem điểm Return

export function extractPrice(content) {
  const c = String(content).toLowerCase().replace(/\./g, '').replace(/,/g, '');
  const mTr = c.match(/(\d+(?:\.\d+)?)\s*tr/);
  if (mTr) return Math.round(parseFloat(mTr[1]) * 1000);
  const mK = c.match(/(\d+)\s*k/);
  if (mK) return parseInt(mK[1]);
  return 0;
}

export function detectTripType(content) {
  const c = String(content).toLowerCase();
  if (/tiễn|tien\s*sb/i.test(c)) return 'TIEN';
  if (/đón\s*sb|don\s*sb/i.test(c)) return 'DON_SB';
  if (/gầm\s*cao|gam\s*cao|7c\b/i.test(c)) return 'GAM_CAO';
  if (/2\s*chiều|2c\b|hai\s*chiều/i.test(c)) return 'TINH_2C';
  return 'TINH_1C';
}

export function calcPoints(price, tripType) {
  if (!price || price <= 0) return 0;
  const p = tripType === 'GAM_CAO' ? price + 700 : price;

  if (tripType === 'TIEN') {
    if (p < 200) return 0;
    if (p <= 250) return 0.5;
    return 1;
  }
  if (tripType === 'DON_SB') {
    if (p < 200) return 0;
    if (p < 300) return 0.5;
    return 1;
  }
  // TINH_1C, TINH_2C, GAM_CAO
  const is2C = tripType === 'TINH_2C';
  if (p < 200) return 0;
  if (p < 300) return 0.5;
  if (p < (is2C ? 600 : 700)) return 1;
  if (p < (is2C ? 800 : 900)) return 1.5;
  if (p < (is2C ? 1100 : 1200)) return 2;
  if (p < 1400) return 2.5;
  if (p < 1800) return 3;
  if (p < 2000) return 3.5;
  return 0; // trên 2tr: chủ lịch tự ghi +-
}

export function parseMessage(content) {
  const c = String(content || '');
  const lower = c.toLowerCase().trim();

  // Hủy
  if (/(hủy|huỷ|ktly|cancel|hoãn)/i.test(lower))
    return { type: 'CANCEL' };

  // Nhận/confirm lịch: bắt đầu bằng @tên + từ khóa ok
  if (/^@\S/.test(c) && /(ok|0k|oka|bay|ib|inbox|okl|okie)/i.test(lower))
    return { type: 'TAKE' };

  // Đăng lịch: có giá và KHÔNG bắt đầu bằng @
  const price = extractPrice(c);
  if (price > 0 && !/^@/.test(c.trim())) {
    const tripType = detectTripType(c);
    const points = calcPoints(price, tripType);
    return { type: 'POST', price, tripType, points };
  }

  return { type: 'OTHER' };
}
```

---

## BƯỚC 3 — Tạo modules/scheduler/scorer.js

```js
// modules/scheduler/scorer.js
// Mục đích: Cộng/trừ điểm vào daily_scores

import { db } from '../../core/db.js';

const log = (...a) =>
  console.log(`[${new Date().toISOString()}] [scorer]`, ...a);

export function upsertScore(userId, displayName, groupId, date, earned, deducted, posted, taken) {
  try {
    const ex = db.prepare(
      'SELECT id FROM daily_scores WHERE user_id=? AND group_id=? AND date=?'
    ).get(String(userId), groupId, date);

    if (ex) {
      db.prepare(`
        UPDATE daily_scores SET
          jobs_posted     = jobs_posted + ?,
          jobs_taken      = jobs_taken + ?,
          points_earned   = points_earned + ?,
          points_deducted = points_deducted + ?,
          net_points      = net_points + ?
        WHERE user_id=? AND group_id=? AND date=?
      `).run(posted, taken, earned, deducted, earned - deducted,
             String(userId), groupId, date);
    } else {
      db.prepare(`
        INSERT INTO daily_scores
          (user_id, display_name, group_id, date,
           jobs_posted, jobs_taken, points_earned, points_deducted, net_points)
        VALUES (?,?,?,?,?,?,?,?,?)
      `).run(String(userId), displayName, groupId, date,
             posted, taken, earned, deducted, earned - deducted);
    }
  } catch(e) {
    log(`upsertScore error: ${e.message}`);
  }
}
```

---

## BƯỚC 4 — Tạo modules/scheduler/index.js

```js
// modules/scheduler/index.js
// Mục đích: Subscribe zalo:message, điều phối parser + DB jobs + scorer

import { eventBus } from '../../core/eventBus.js';
import { db } from '../../core/db.js';
import { parseMessage } from './parser.js';
import { upsertScore } from './scorer.js';

const log = (...a) =>
  console.log(`[${new Date().toISOString()}] [scheduler]`, ...a);

const SCHEDULER_GROUPS = [
  '8912027696462383403',  // [1-1 RETURN] Tái định cư
  '2718828458346611005',  // [1_1 RET 2] ROOM LỊCH
];

export function startScheduler() {
  eventBus.on('zalo:message', ({ msg }) => {
    const d       = msg.data || msg;
    const groupId = String(d.idTo    || '');
    const userId  = String(d.uidFrom || '');
    const name    = String(d.dName   || '');
    const msgId   = String(d.msgId   || '');
    const ts      = parseInt(d.ts)   || Date.now();
    const content = typeof d.content === 'object'
      ? JSON.stringify(d.content)
      : String(d.content || '');
    // quote.globalMsgId là số → phải String() khi so sánh với TEXT trong DB
    const quoteId = d.quote?.globalMsgId
      ? String(d.quote.globalMsgId) : null;
    const jobDate = new Date(ts).toISOString().slice(0, 10);

    if (!SCHEDULER_GROUPS.includes(groupId)) return;

    const parsed = parseMessage(content);

    // ── POST: đăng lịch ──────────────────────────────────────────
    if (parsed.type === 'POST') {
      try {
        db.prepare(`
          INSERT OR IGNORE INTO jobs
            (msg_id, group_id, poster_id, poster_name, raw_content,
             price, trip_type, base_points, status, job_date, ts)
          VALUES (?,?,?,?,?,?,?,?,'OPEN',?,?)
        `).run(msgId, groupId, userId, name, content,
               parsed.price, parsed.tripType, parsed.points,
               jobDate, ts);
        log(`POST: ${name} | ${parsed.price}k ${parsed.tripType} → ${parsed.points}đ`);
      } catch(e) { log(`POST err: ${e.message}`); }
      return;
    }

    // ── TAKE: nhận lịch (quote vào tin POST) ──────────────────────
    if (parsed.type === 'TAKE' && quoteId) {
      // Case 1: quote vào tin POST → MATCHED
      const openJob = db.prepare(
        "SELECT * FROM jobs WHERE msg_id=? AND status='OPEN'"
      ).get(quoteId);

      if (openJob) {
        try {
          db.prepare(
            "UPDATE jobs SET taker_id=?, taker_name=?, taker_msg_id=?, status='MATCHED' WHERE id=?"
          ).run(userId, name, msgId, openJob.id);
          log(`MATCHED: [${openJob.poster_name}] ← ${name}`);
        } catch(e) { log(`MATCHED err: ${e.message}`); }
        return;
      }

      // Case 2: quote vào tin TAKE (poster confirm lại taker) → CONFIRMED
      const matchedJob = db.prepare(
        "SELECT * FROM jobs WHERE taker_msg_id=? AND poster_id=? AND status='MATCHED'"
      ).get(quoteId, userId);

      if (matchedJob) {
        try {
          db.prepare(
            "UPDATE jobs SET status='CONFIRMED', confirm_msg_id=? WHERE id=?"
          ).run(msgId, matchedJob.id);

          // Cộng điểm poster
          upsertScore(
            matchedJob.poster_id, matchedJob.poster_name,
            groupId, jobDate,
            matchedJob.base_points, 0, 1, 0
          );
          // Trừ điểm taker
          upsertScore(
            matchedJob.taker_id, matchedJob.taker_name,
            groupId, jobDate,
            0, matchedJob.base_points, 0, 1
          );

          log(`CONFIRMED: ${matchedJob.poster_name} +${matchedJob.base_points}đ | ${matchedJob.taker_name} -${matchedJob.base_points}đ`);
        } catch(e) { log(`CONFIRMED err: ${e.message}`); }
        return;
      }
    }

    // ── CANCEL: hủy lịch ─────────────────────────────────────────
    if (parsed.type === 'CANCEL') {
      const activeJob = db.prepare(`
        SELECT * FROM jobs
        WHERE group_id=?
          AND (poster_id=? OR taker_id=?)
          AND status IN ('OPEN','MATCHED')
          AND ts > ?
        ORDER BY ts DESC LIMIT 1
      `).get(groupId, userId, userId, ts - 30 * 60 * 1000); // trong 30 phút

      if (activeJob) {
        try {
          db.prepare(
            "UPDATE jobs SET status='CANCELLED', cancel_msg_id=? WHERE id=?"
          ).run(msgId, activeJob.id);
          log(`CANCELLED: job #${activeJob.id} by ${name}`);
        } catch(e) { log(`CANCEL err: ${e.message}`); }
      }
    }
  });

  log('Scheduler module started.');
}
```

---

## BƯỚC 5 — Mount scheduler vào index.js (entry point)

Mở `index.js` (root của project).
Tìm dòng import startGuardian hoặc các import module khác.

Thêm:
```js
import { startScheduler } from './modules/scheduler/index.js';
```

Tìm chỗ gọi `startGuardian()` hoặc tương tự.
Thêm ngay sau:
```js
startScheduler();
```

---

## BƯỚC 6 — Deploy & Verify

```bash
# Sync lên ProBook
scp -r modules/scheduler/ duc@[PROBOOK_IP]:/home/duc/zalo-guardian/modules/
scp core/db.js duc@[PROBOOK_IP]:/home/duc/zalo-guardian/core/db.js
scp index.js duc@[PROBOOK_IP]:/home/duc/zalo-guardian/index.js

# Restart
systemctl --user restart zalo-guardian

# Check log
journalctl --user -u zalo-guardian -n 10 --no-pager
```

---

## BƯỚC 7 — Test nhanh sau deploy

Sau khi service start, chạy query verify tables đã tạo:

```bash
sqlite3 /home/duc/zalo-guardian/data/guardian.db ".tables"
sqlite3 /home/duc/zalo-guardian/data/guardian.db "SELECT COUNT(*) FROM jobs;"
sqlite3 /home/duc/zalo-guardian/data/guardian.db "SELECT COUNT(*) FROM daily_scores;"
```

Chờ 5 phút rồi check xem có job POST nào được detect không:
```bash
sqlite3 /home/duc/zalo-guardian/data/guardian.db \
  "SELECT poster_name, price, trip_type, base_points, status, job_date FROM jobs ORDER BY id DESC LIMIT 10;"
```

---

## BÁO CÁO sau khi xong

1. Service start OK không (`active`/`failed`)?
2. Log có dòng `[scheduler] Scheduler module started.` không?
3. Tables `jobs` và `daily_scores` có tồn tại không?
4. Sau 5-10 phút: có job POST nào được detect không? Paste 5 dòng đầu.
5. File nào đã tạo/sửa?
6. Lỗi nào gặp (nếu có)?

---

## LƯU Ý QUAN TRỌNG

- `quote.globalMsgId` là **number** trong zca-js → phải `String()` khi so sánh với cột TEXT trong SQLite
- SCHEDULER_GROUPS chỉ xử lý 2 group lịch xe — KHÔNG xử lý group khác
- Parser dùng **rule-based** — không dùng AI/LLM
- Phase này chỉ build backend logic — Web UI điểm sẽ là task riêng sau khi verify data chính xác

---

*Issued by Ông Thầu (Claude) — 2026-05-02*
*Next after this task: Web UI bảng điểm + Export Excel/Word*
