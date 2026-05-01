// modules/guardian/violationScreenshot.js
// Render PNG từ một khối text thuần (giống screenshot lưu bằng chứng).
//
// Ubuntu / máy bot: cài cairo + `npm install canvas` (đã khai báo trong package.json).
// Không có canvas → trả null; Telegram vẫn nhận đủ tin nhắn text.

const log = (m) =>
  console.log(`[${new Date().toISOString()}] [violationScreenshot] ${m}`);

function hardWrap(str, maxChars) {
  const s = String(str ?? "");
  const n = Math.max(12, maxChars | 0);
  const lines = [];
  for (let i = 0; i < s.length; i += n) {
    lines.push(s.slice(i, i + n));
  }
  return lines.length ? lines : [""];
}

/**
 * Vẽ PNG từ đúng chuỗi plain text gửi Telegram (nội dung giống tin nhắn).
 * @returns {Promise<Buffer|null>}
 */
export async function renderPlainTextProofPng(plainText) {
  let createCanvas;
  try {
    ({ createCanvas } = await import("canvas"));
  } catch (e) {
    log(`Không load canvas: ${e.message} — chỉ gửi text Telegram`);
    return null;
  }

  const raw = String(plainText || "");
  const maxLineChars = 88;
  const lines = [];
  for (const para of raw.split(/\r?\n/)) {
    if (para.length <= maxLineChars) lines.push(para);
    else lines.push(...hardWrap(para, maxLineChars));
  }
  const capped = lines.slice(0, 140);

  const width = 920;
  const pad = 22;
  const fontSize = 16;
  const lineHeight = 22;
  const height = Math.min(
    8200,
    pad * 2 + Math.max(1, capped.length) * lineHeight + 24
  );

  try {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#0f1118";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#4c6ef5";
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, width - 4, height - 4);

    ctx.fillStyle = "#eaeaf0";
    ctx.font = `${fontSize}px "Segoe UI", "DejaVu Sans", system-ui, sans-serif`;

    let y = pad + fontSize;
    for (const line of capped) {
      ctx.fillText(line, pad, y);
      y += lineHeight;
    }

    return canvas.toBuffer("image/png");
  } catch (e) {
    log(`Vẽ PNG FAIL: ${e.message}`);
    return null;
  }
}
