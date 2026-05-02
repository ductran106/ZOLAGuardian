# PROMPT THI CÔNG — PHASE 2 Web UI Bảng Điểm + Manual Override
## Dành cho: Cursor Agent (Worker)
## Issued by: Ông Thầu (Claude)
## Date: 2026-05-02

---

## CONTEXT

Dự án `zalo-guardian`. ProBook: `/home/duc/zalo-guardian/`
PC-Boss: `C:\Users\ANTRACH_DOUBLE\zalo-guardian\`
Đọc `docs/HANDOFF_ZCA.md` trước.

### Đã có sẵn (KHÔNG làm lại):
- Bảng `jobs` có `base_points`, `points_source`, `override_points`, `override_by` ✅
- Bảng `daily_scores` đang cập nhật realtime ✅
- Web UI đang chạy tại port 3456 ✅
- API `/api/features`, `/api/groups`, `/api/violations` đã có ✅

---

## NHIỆM VỤ: Thêm 3 trang mới vào Web UI

### Trang 1: `/scores` — Bảng điểm ngày
### Trang 2: `/jobs` — Danh sách lịch xe + Manual Override
### Trang 3: Export Excel

---

## BƯỚC 1 — Thêm API endpoints vào webui/

### Tạo file `webui/api/scores.js`

```js
// webui/api/scores.js
import { Router } from 'express';
import db from '../../core/db.js';

const router = Router();

// GET /api/scores?date=2026-05-02&group_id=xxx
router.get('/', (req, res) => {
  const { date, group_id } = req.query;
  let query = `
    SELECT user_id, display_name, group_id, date,
           jobs_posted, jobs_taken, points_earned, points_deducted, net_points
    FROM daily_scores
    WHERE 1=1
  `;
  const params = [];
  if (date) { query += ' AND date = ?'; params.push(date); }
  if (group_id) { query += ' AND group_id = ?'; params.push(group_id); }
  query += ' ORDER BY net_points DESC';
  try {
    const rows = db.prepare(query).all(...params);
    res.json({ ok: true, data: rows });
  } catch(e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;
```

### Tạo file `webui/api/jobs.js`

```js
// webui/api/jobs.js
import { Router } from 'express';
import db from '../../core/db.js';

const router = Router();

// GET /api/jobs?date=2026-05-02&status=OPEN&group_id=xxx
router.get('/', (req, res) => {
  const { date, status, group_id } = req.query;
  let query = `
    SELECT id, msg_id, group_id, poster_name, taker_name,
           raw_content, price, trip_type, base_points,
           points_source, override_points, override_note,
           status, job_date, ts
    FROM jobs WHERE 1=1
  `;
  const params = [];
  if (date) { query += ' AND job_date = ?'; params.push(date); }
  if (status) { query += ' AND status = ?'; params.push(status); }
  if (group_id) { query += ' AND group_id = ?'; params.push(group_id); }
  query += ' ORDER BY ts DESC LIMIT 200';
  try {
    const rows = db.prepare(query).all(...params);
    res.json({ ok: true, data: rows });
  } catch(e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/jobs/:id/override — Manual override điểm
router.post('/:id/override', (req, res) => {
  const { id } = req.params;
  const { points, note } = req.body;
  if (points === undefined || isNaN(parseFloat(points))) {
    return res.status(400).json({ ok: false, error: 'points required' });
  }
  try {
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
    if (!job) return res.status(404).json({ ok: false, error: 'job not found' });

    db.prepare(`
      UPDATE jobs SET override_points = ?, override_note = ?, override_by = 'admin'
      WHERE id = ?
    `).run(parseFloat(points), note || '', id);

    // Nếu job đã CONFIRMED → cập nhật lại daily_scores
    if (job.status === 'CONFIRMED') {
      const oldPts = job.override_points ?? job.base_points;
      const newPts = parseFloat(points);
      const diff = newPts - oldPts;
      if (diff !== 0) {
        // Update poster
        db.prepare(`
          UPDATE daily_scores SET points_earned = points_earned + ?, net_points = net_points + ?
          WHERE user_id = ? AND group_id = ? AND date = ?
        `).run(diff, diff, job.poster_id, job.group_id, job.job_date);
        // Update taker
        db.prepare(`
          UPDATE daily_scores SET points_deducted = points_deducted + ?, net_points = net_points - ?
          WHERE user_id = ? AND group_id = ? AND date = ?
        `).run(diff, diff, job.taker_id, job.group_id, job.job_date);
      }
    }

    res.json({ ok: true });
  } catch(e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;
```

### Tạo file `webui/api/export.js`

```js
// webui/api/export.js
import { Router } from 'express';
import db from '../../core/db.js';

const router = Router();

// GET /api/export/scores?date=2026-05-02 → CSV
router.get('/scores', (req, res) => {
  const { date, group_id } = req.query;
  let query = `
    SELECT display_name, group_id, date,
           jobs_posted, jobs_taken,
           points_earned, points_deducted, net_points
    FROM daily_scores WHERE 1=1
  `;
  const params = [];
  if (date) { query += ' AND date = ?'; params.push(date); }
  if (group_id) { query += ' AND group_id = ?'; params.push(group_id); }
  query += ' ORDER BY net_points DESC';

  try {
    const rows = db.prepare(query).all(...params);
    const header = 'Tên,Group,Ngày,Lịch đăng,Lịch nhận,Điểm cộng,Điểm trừ,Điểm net\n';
    const csv = header + rows.map(r =>
      `"${r.display_name}","${r.group_id}","${r.date}",${r.jobs_posted},${r.jobs_taken},${r.points_earned},${r.points_deducted},${r.net_points}`
    ).join('\n');
    const filename = `scores_${date || 'all'}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\ufeff' + csv); // BOM for Excel UTF-8
  } catch(e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;
```

---

## BƯỚC 2 — Mount routes vào webui/server.js

Tìm file `webui/server.js`.
Tìm đoạn mount các routes hiện có (import + app.use).

Thêm:
```js
import scoresRouter from './api/scores.js';
import jobsRouter from './api/jobs.js';
import exportRouter from './api/export.js';

// Thêm vào chỗ mount routes:
app.use('/api/scores', scoresRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/export', exportRouter);
```

---

## BƯỚC 3 — Thêm trang Scores + Jobs vào Web UI

Mở `webui/public/index.html`.
Tìm navigation (menu tabs hoặc section headers).

### Thêm tab navigation:
```html
<button class="tab-btn" onclick="showTab('scores')">📊 Bảng điểm</button>
<button class="tab-btn" onclick="showTab('jobs')">🚗 Lịch xe</button>
```

### Thêm section Bảng điểm (sau các section hiện có):
```html
<div id="tab-scores" class="tab-content" style="display:none">
  <div class="section-header">
    <h2>📊 Bảng điểm</h2>
    <div class="controls">
      <input type="date" id="score-date" />
      <select id="score-group">
        <option value="">Tất cả group</option>
        <option value="8912027696462383403">[1-1 RETURN] Tái định cư</option>
        <option value="2718828458346611005">[1_1 RET 2] ROOM LỊCH</option>
      </select>
      <button onclick="loadScores()">🔍 Xem</button>
      <button onclick="exportScores()">⬇️ Export CSV</button>
    </div>
  </div>
  <table id="scores-table">
    <thead>
      <tr>
        <th>#</th><th>Tên</th><th>Lịch đăng</th>
        <th>Lịch nhận</th><th>Điểm cộng</th>
        <th>Điểm trừ</th><th>Điểm net</th>
      </tr>
    </thead>
    <tbody id="scores-body"></tbody>
  </table>
</div>
```

### Thêm section Lịch xe (Jobs):
```html
<div id="tab-jobs" class="tab-content" style="display:none">
  <div class="section-header">
    <h2>🚗 Lịch xe</h2>
    <div class="controls">
      <input type="date" id="job-date" />
      <select id="job-status">
        <option value="">Tất cả</option>
        <option value="OPEN">OPEN</option>
        <option value="MATCHED">MATCHED</option>
        <option value="CONFIRMED">CONFIRMED</option>
        <option value="CANCELLED">CANCELLED</option>
      </select>
      <button onclick="loadJobs()">🔍 Xem</button>
    </div>
  </div>
  <table id="jobs-table">
    <thead>
      <tr>
        <th>Người đăng</th><th>Người nhận</th><th>Giá</th>
        <th>Loại</th><th>Điểm</th><th>Nguồn</th>
        <th>Status</th><th>Override</th>
      </tr>
    </thead>
    <tbody id="jobs-body"></tbody>
  </table>
</div>
```

---

## BƯỚC 4 — Thêm JS vào webui/public/app.js

Thêm vào cuối file:

```js
// ── Tab navigation ──────────────────────────────────
function showTab(name) {
  document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
  const el = document.getElementById('tab-' + name);
  if (el) el.style.display = 'block';
}

// ── Scores ───────────────────────────────────────────
async function loadScores() {
  const date = document.getElementById('score-date').value;
  const group = document.getElementById('score-group').value;
  let url = '/api/scores?';
  if (date) url += 'date=' + date + '&';
  if (group) url += 'group_id=' + group;
  const res = await fetch(url);
  const { data } = await res.json();
  const tbody = document.getElementById('scores-body');
  tbody.innerHTML = data.map((r, i) => `
    <tr>
      <td>${i+1}</td>
      <td>${r.display_name}</td>
      <td>${r.jobs_posted}</td>
      <td>${r.jobs_taken}</td>
      <td style="color:green">+${r.points_earned}</td>
      <td style="color:red">-${r.points_deducted}</td>
      <td style="font-weight:bold">${r.net_points}</td>
    </tr>
  `).join('');
}

function exportScores() {
  const date = document.getElementById('score-date').value;
  const group = document.getElementById('score-group').value;
  let url = '/api/export/scores?';
  if (date) url += 'date=' + date + '&';
  if (group) url += 'group_id=' + group;
  window.location.href = url;
}

// ── Jobs ─────────────────────────────────────────────
async function loadJobs() {
  const date = document.getElementById('job-date').value;
  const status = document.getElementById('job-status').value;
  let url = '/api/jobs?';
  if (date) url += 'date=' + date + '&';
  if (status) url += 'status=' + status;
  const res = await fetch(url);
  const { data } = await res.json();
  const tbody = document.getElementById('jobs-body');
  tbody.innerHTML = data.map(r => {
    const pts = r.override_points ?? r.base_points;
    const src = r.override_points != null ? '✏️ OVERRIDE' : r.points_source;
    return `
      <tr>
        <td>${r.poster_name}</td>
        <td>${r.taker_name || '-'}</td>
        <td>${r.price}k</td>
        <td>${r.trip_type}</td>
        <td>${pts}đ</td>
        <td><span class="${r.points_source === 'EXPLICIT' ? 'badge-green' : 'badge-gray'}">${src}</span></td>
        <td><span class="status-${r.status.toLowerCase()}">${r.status}</span></td>
        <td>
          <input type="number" step="0.25" min="0" max="10"
            id="override-${r.id}" value="${pts}" style="width:60px"/>
          <input type="text" placeholder="ghi chú"
            id="note-${r.id}" style="width:100px"/>
          <button onclick="overrideJob(${r.id})">✓</button>
        </td>
      </tr>
    `;
  }).join('');
}

async function overrideJob(id) {
  const points = document.getElementById('override-' + id).value;
  const note = document.getElementById('note-' + id).value;
  const res = await fetch('/api/jobs/' + id + '/override', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ points: parseFloat(points), note })
  });
  const data = await res.json();
  if (data.ok) {
    alert('✅ Override thành công');
    loadJobs();
  } else {
    alert('❌ Lỗi: ' + data.error);
  }
}

// Set default date = today
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().slice(0, 10);
  const sd = document.getElementById('score-date');
  const jd = document.getElementById('job-date');
  if (sd) sd.value = today;
  if (jd) jd.value = today;
});
```

---

## BƯỚC 5 — Deploy & Verify

```bash
scp webui/api/scores.js webui/api/jobs.js webui/api/export.js \
    duc@[IP]:/home/duc/zalo-guardian/webui/api/

scp webui/server.js duc@[IP]:/home/duc/zalo-guardian/webui/server.js
scp webui/public/index.html duc@[IP]:/home/duc/zalo-guardian/webui/public/index.html
scp webui/public/app.js duc@[IP]:/home/duc/zalo-guardian/webui/public/app.js

# Restart
fuser -k 3456/tcp 2>/dev/null; systemctl --user restart zalo-guardian

# Verify endpoints
curl -s http://192.168.1.24:3456/api/scores?date=$(date +%Y-%m-%d) | head -c 200
curl -s http://192.168.1.24:3456/api/jobs?date=$(date +%Y-%m-%d) | head -c 200
```

---

## BÁO CÁO sau khi xong

1. Service active không?
2. `/api/scores` trả data không? Paste 3 dòng đầu
3. `/api/jobs` trả data không? Paste 3 dòng đầu
4. Tab Bảng điểm và Lịch xe hiển thị trên UI không?
5. Lỗi gì gặp (nếu có)?

---

## LƯU Ý

- Export CSV có BOM (`\ufeff`) để Excel đọc đúng UTF-8 tiếng Việt
- Override chỉ tác động khi job đã CONFIRMED — OPEN/MATCHED chỉ lưu giá trị chờ
- Không dùng thư viện xlsx nặng — dùng CSV đơn giản, anh mở bằng Excel là đủ

---

*Issued by Ông Thầu (Claude) — 2026-05-02*
*Next: Test Manual Override thật + Tạo HANDOFF_PHASE2.md cập nhật*
