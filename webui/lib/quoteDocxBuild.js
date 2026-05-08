/**
 * Gom cụm tin quote (mở rộng cha ngoài khung giờ) + xuất DOCX tương thích vibecode-docx-processor (parser CHAT_LINE_RE).
 * Chỉ xuất cụm có ≥2 tin liên kết qua trích dẫn; tin đơn lẻ (không quote / không được quote trong tập) bị loại.
 * Khối @All: mặc định mọi tin trong khung có @All (không chỉ admin trong DB). ?at_all_scope=admin để chỉ lấy user_id ∈ admin_ids.
 * Cha của quote: CAST(msg_id) = CAST(quote_msg_id) để khớp globalMsgId/msgId giữa các kiểu.
 * Mỗi cụm = thành phần liên thông theo chuỗi quote; trong cụm sắp theo giờ. Màu nền: một màu cho cả cụm,
 * xen kẽ xanh / đỏ giữa các cụm; một dòng trống giữa các cụm. "free" → highlight vàng trên nền cụm.
 * Bổ sung: chèn các tin "thu hồi" do bot gửi (sender_id = botUserId + marker nội dung)
 * vào đúng timeline giữa các cụm quote.
 *
 * Lưu ý: docx v9 serialize `paragraph.shading` (w:shd fill) ra XML rỗng — không hiển thị nền.
 * Dùng highlight toàn dòng (GREEN/RED) để Word luôn vẽ được (đã kiểm tra OOXML).
 *
 * Định dạng tham chiếu vibecode-docx-processor `src/exporter_docx.py`: python-docx
 * `add_paragraph` + highlight run — font/spacing theo Word Normal; em gần sát bằng
 * Calibri 11pt, space-after 8pt, line 1.15 (w:lineRule auto / 276).
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HighlightColor,
  LineRuleType,
} from "docx";

const ALL_TAG_RE = /\b@All\b/;
const BOT_RECALL_MARKER_A = "Tin nhắn thu hồi";
const BOT_RECALL_MARKER_B = "Nội dung đã thu hồi";

/** Calibri 11pt — cùng cỡ mặc định Word Normal (vibecode / python-docx; docx = half-points) */
const FONT_MAIN = "Calibri";
const SIZE_MAIN = 22;

/**
 * Space-after mỗi dòng (twips, 1 pt = 20) ≈ 8 pt — bám Word Normal / file OK từ vibecode.
 * Áp cả dòng cuối cụm (giống mỗi add_paragraph() trong exporter_docx.py).
 */
const LINE_PARAGRAPH_AFTER_TWIPS = 160;

const FREE_RE = /\bfree\b/gi;

/** Xen kẽ màu nền giữa các cụm (0 = xanh, 1 = đỏ, …). */
function toneHighlightForClusterIndex(clusterIdx) {
  return clusterIdx % 2 === 0 ? HighlightColor.GREEN : HighlightColor.RED;
}

/**
 * Highlight nền cụm (green/red) + chỗ khớp "free" → vàng.
 * @param {string} text
 * @param {string} baseHl typeof HighlightColor.* — màu nền dòng
 */
function buildRunsWithToneAndFree(text, baseHl) {
  const line = String(text);
  const runs = [];
  let last = 0;
  FREE_RE.lastIndex = 0;
  let m;
  while ((m = FREE_RE.exec(line)) !== null) {
    if (m.index > last) {
      runs.push(
        new TextRun({
          text: line.slice(last, m.index),
          font: FONT_MAIN,
          size: SIZE_MAIN,
          highlight: baseHl,
        })
      );
    }
    runs.push(
      new TextRun({
        text: m[0],
        font: FONT_MAIN,
        size: SIZE_MAIN,
        highlight: HighlightColor.YELLOW,
      })
    );
    last = m.index + m[0].length;
  }
  runs.push(
    new TextRun({
      text: line.slice(last),
      font: FONT_MAIN,
      size: SIZE_MAIN,
      highlight: baseHl,
    })
  );
  return runs;
}

function paragraphClusterLine(line, baseHl) {
  return new Paragraph({
    spacing: {
      before: 0,
      after: LINE_PARAGRAPH_AFTER_TWIPS,
      line: 276,
      lineRule: LineRuleType.AUTO,
    },
    children: buildRunsWithToneAndFree(line, baseHl),
  });
}

/** Một dòng trống giữa cụm — cùng font/line height với dòng chat (vibecode: add_paragraph(\"\")). */
function emptySeparatorParagraph() {
  return new Paragraph({
    spacing: {
      before: 0,
      after: 0,
      line: 276,
      lineRule: LineRuleType.AUTO,
    },
    children: [
      new TextRun({
        text: "",
        font: FONT_MAIN,
        size: SIZE_MAIN,
      }),
    ],
  });
}

/** @param {string} dateStr YYYY-MM-DD */
/** @param {string} timeStart timeEnd HH:MM hoặc HH:MM:SS */
export function vnDayTimeRangeMs(dateStr, timeStart, timeEnd) {
  const datePart = String(dateStr).trim();
  const [Y, M, D] = datePart.split("-").map((x) => Number(x));
  if (!Y || !M || !D) throw new Error("date_invalid");

  const parseHM = (s) => {
    const p = String(s).trim().split(":");
    const h = Number(p[0]);
    const m = Number(p[1] ?? 0);
    const sec = Math.floor(Number(p[2] ?? 0));
    if (
      !Number.isFinite(h) ||
      !Number.isFinite(m) ||
      h < 0 ||
      h > 23 ||
      m < 0 ||
      m > 59 ||
      sec < 0 ||
      sec > 59
    ) {
      throw new Error("time_invalid");
    }
    return { h, m, sec };
  };

  const st = parseHM(timeStart);
  const et = parseHM(timeEnd);
  const pad = (n) => String(n).padStart(2, "0");
  const isoStart = `${Y}-${pad(M)}-${pad(D)}T${pad(st.h)}:${pad(st.m)}:${pad(st.sec)}+07:00`;
  const isoEnd = `${Y}-${pad(M)}-${pad(D)}T${pad(et.h)}:${pad(et.m)}:${pad(et.sec)}.999+07:00`;
  const startMs = Date.parse(isoStart);
  const endMs = Date.parse(isoEnd);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
    throw new Error("range_invalid");
  }
  if (startMs > endMs) throw new Error("time_order");
  return { startMs, endMs };
}

export function formatTsVN(ms) {
  const d = new Date(Number(ms));
  const f = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = f.formatToParts(d);
  const g = (t) => parts.find((p) => p.type === t)?.value ?? "";
  return `${g("day")}/${g("month")}/${g("year")} ${g("hour")}:${g("minute")}:${g("second")}`;
}

function normalizeContent(content) {
  let s = typeof content === "string" ? content : JSON.stringify(content ?? "");
  s = s.replace(/\r\n/g, "\n").replace(/\s+/g, " ").trim();
  return s;
}

function sanitizeSender(name) {
  const s = String(name || "?").replace(/\s+/g, " ").trim();
  return s.replace(/:/g, "∶");
}

function normalizeUid(v) {
  return String(v || "").trim().replace(/_0$/i, "");
}

function formatChatLine(row, missing) {
  const tsStr = formatTsVN(row.ts);
  const name = sanitizeSender(row.display_name || row.user_id);
  const body = normalizeContent(row.content);
  const inner = missing ? `*Missing* ${body}` : body;
  return `[${tsStr}] ${name}: ${inner}`;
}

class UnionFind {
  constructor(ids) {
    /** @type {Record<string, string>} */
    this.p = {};
    for (const id of ids) this.p[id] = id;
  }

  find(a) {
    if (this.p[a] !== a) this.p[a] = this.find(this.p[a]);
    return this.p[a];
  }

  union(a, b) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.p[rb] = ra;
  }
}

/**
 * @param {import("better-sqlite3").Database} db
 * @param {{ group_id: string, date: string, time_start: string, time_end: string }} q
 */
export async function buildQuoteDocxBuffer(db, q) {
  const groupId = String(q.group_id || "").trim();
  const date = String(q.date || "").trim();
  const timeStart = String(q.time_start || "").trim() || "00:00";
  const timeEnd = String(q.time_end || "").trim() || "23:59";
  const botUserId = normalizeUid(q.bot_user_id || "");

  if (!groupId) throw new Error("group_id_required");
  if (!date) throw new Error("date_required");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("date_invalid");

  const { startMs, endMs } = vnDayTimeRangeMs(date, timeStart, timeEnd);

  const wg = db
    .prepare("SELECT name, admin_ids FROM watch_groups WHERE group_id = ?")
    .get(groupId);
  let adminSet = new Set();
  try {
    const arr = JSON.parse(wg?.admin_ids || "[]");
    if (Array.isArray(arr)) {
      adminSet = new Set(arr.map((x) => String(x)));
    }
  } catch {
    adminSet = new Set();
  }

  const inWindow = db
    .prepare(
      `SELECT msg_id, group_id, user_id, display_name, content, ts,
              quote_msg_id, quote_owner_id
       FROM messages
       WHERE group_id = ? AND ts >= ? AND ts <= ?
       ORDER BY ts ASC`
    )
    .all(groupId, startMs, endMs);

  const stmtParentByQuoteRef = db.prepare(
    `SELECT msg_id, group_id, user_id, display_name, content, ts, quote_msg_id, quote_owner_id
     FROM messages
     WHERE group_id = ? AND CAST(msg_id AS TEXT) = CAST(? AS TEXT)`
  );

  /** @type {Map<string, object & { missing?: boolean }>} */
  const expanded = new Map();
  for (const row of inWindow) {
    const id = String(row.msg_id);
    expanded.set(id, { ...row, missing: false });
  }

  const queue = [...inWindow];
  while (queue.length) {
    const m = queue.shift();
    const qid = m.quote_msg_id ? String(m.quote_msg_id).trim() : "";
    if (!qid) continue;
    if (expanded.has(qid)) continue;
    const parent = stmtParentByQuoteRef.get(groupId, qid);
    if (!parent) continue;
    const pid = String(parent.msg_id);
    if (expanded.has(pid)) continue;
    const missing = Number(parent.ts) < startMs || Number(parent.ts) > endMs;
    expanded.set(pid, { ...parent, missing });
    queue.push(parent);
  }

  const ids = [...expanded.keys()];
  const uf = new UnionFind(ids);
  for (const row of expanded.values()) {
    const mid = String(row.msg_id);
    const parentId = row.quote_msg_id ? String(row.quote_msg_id).trim() : "";
    if (parentId && expanded.has(parentId)) {
      uf.union(mid, parentId);
    }
  }

  /** @type {Map<string, object[]>} */
  const bucket = new Map();
  for (const id of ids) {
    const r = uf.find(id);
    if (!bucket.has(r)) bucket.set(r, []);
    bucket.get(r).push(expanded.get(id));
  }

  const clusters = [...bucket.values()]
    .map((rows) =>
      [...rows].sort((a, b) => Number(a.ts) - Number(b.ts))
    )
    .sort(
      (a, b) =>
        Math.min(...a.map((x) => Number(x.ts))) -
        Math.min(...b.map((x) => Number(x.ts)))
    );

  /** Chỉ cụm có ít nhất hai tin nối quote với nhau (trong tập đã mở rộng). */
  const linkedClusters = clusters.filter((cl) => cl.length >= 2);

  const clusterMsgIds = new Set();
  for (const cl of linkedClusters) {
    for (const row of cl) {
      clusterMsgIds.add(String(row.msg_id));
    }
  }

  const adminOnlyAtAll =
    String(q.at_all_scope || "").toLowerCase() === "admin";

  const adminRows = inWindow.filter((row) => {
    const c = normalizeContent(row.content);
    if (!ALL_TAG_RE.test(c)) return false;
    if (clusterMsgIds.has(String(row.msg_id))) return false;
    if (adminOnlyAtAll) {
      const uid = String(row.user_id || "");
      if (!adminSet.has(uid)) return false;
    }
    return true;
  }).sort((a, b) => Number(a.ts) - Number(b.ts));

  /** Tin bot báo thu hồi: sender_id = botUserId + có marker mẫu */
  const recallRows = inWindow
    .filter((row) => {
      const c = normalizeContent(row.content);
      const isRecallNotice =
        c.includes(BOT_RECALL_MARKER_A) && c.includes(BOT_RECALL_MARKER_B);
      if (!isRecallNotice) return false;
      if (clusterMsgIds.has(String(row.msg_id))) return false;
      // Nếu chưa cấu hình BOT_USER_ID thì fallback theo marker để không bỏ sót.
      if (!botUserId) return true;
      const uid = normalizeUid(row.user_id || "");
      return uid === botUserId;
    })
    .sort((a, b) => Number(a.ts) - Number(b.ts));

  const children = [];

  /** Xen kẽ màu theo từng cụm quote; khối admin @All là một cụm riêng. */
  let clusterRound = 0;

  if (linkedClusters.length === 0 && recallRows.length === 0 && adminRows.length === 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "(Không có cụm tin trích dẫn liên kết trong khung giờ.)",
            font: FONT_MAIN,
            size: SIZE_MAIN,
          }),
        ],
      })
    );
  } else {
    const timelineBlocks = [
      ...linkedClusters.map((rows, idx) => ({
        kind: "cluster",
        rows,
        ts: Math.min(...rows.map((x) => Number(x.ts))),
        idx,
      })),
      ...recallRows.map((row, idx) => ({
        kind: "recall",
        rows: [{ ...row, missing: false }],
        ts: Number(row.ts) || 0,
        idx,
      })),
    ].sort((a, b) => a.ts - b.ts || a.idx - b.idx);

    timelineBlocks.forEach((block, bi) => {
      if (bi > 0) {
        children.push(emptySeparatorParagraph());
      }
      const baseHl = toneHighlightForClusterIndex(clusterRound++);
      for (const row of block.rows) {
        children.push(
          paragraphClusterLine(
            formatChatLine(row, !!row.missing),
            baseHl
          )
        );
      }
    });

    if (adminRows.length > 0) {
      if (timelineBlocks.length > 0) {
        children.push(emptySeparatorParagraph());
      }
      const baseHlAdmin = toneHighlightForClusterIndex(clusterRound++);
      for (const row of adminRows) {
        children.push(
          paragraphClusterLine(
            formatChatLine(row, false),
            baseHlAdmin
          )
        );
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

export function safeExportFilename(date, groupId) {
  const g = String(groupId).replace(/[^\w.-]+/g, "_").slice(-24);
  return `quote_export_${date}_${g}.docx`;
}
