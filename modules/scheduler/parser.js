// modules/scheduler/parser.js
// Mục đích: Parse tin nhắn lịch xe, áp barem điểm Return

export function extractPrice(content) {
  const c = String(content).toLowerCase().replace(/\./g, "").replace(/,/g, "");
  const mTr = c.match(/(\d+(?:\.\d+)?)\s*tr/);
  if (mTr) return Math.round(parseFloat(mTr[1]) * 1000);
  const mK = c.match(/(\d+)\s*k/);
  if (mK) return parseInt(mK[1], 10);
  return 0;
}

export function detectTripType(content) {
  const c = String(content).toLowerCase();
  if (/tiễn|tien\s*sb/i.test(c)) return "TIEN";
  if (/đón\s*sb|don\s*sb/i.test(c)) return "DON_SB";
  if (/gầm\s*cao|gam\s*cao|7c\b/i.test(c)) return "GAM_CAO";
  if (/2\s*chiều|2c\b|hai\s*chiều/i.test(c)) return "TINH_2C";
  return "TINH_1C";
}

export function extractScoreFromContent(content) {
  const c = String(content || "");
  // Tìm số điểm hợp lệ: 0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 3.5, 4
  // Bội số của 0.25, từ 0.25 đến 4
  const pattern =
    /(?:^|[\s_.,>=-])([0-4](?:[.,][027]5?|[.,]5)?)(?:\s*[dđ₫])?(?:\s*(?:dbcl|ibcl|tt|diem|điểm))?\s*(?:$|[\s,;])/gi;
  const candidates = [];
  for (const m of c.matchAll(pattern)) {
    const raw = m[1].replace(",", ".");
    const val = parseFloat(raw);
    if (isNaN(val) || val <= 0 || val > 4) continue;
    // Phải là bội số của 0.25
    if (Math.round(val * 4) / 4 !== val) continue;
    // Không phải tiền (theo sau bởi k/tr/000)
    const after = c.slice(m.index + m[0].length - 1);
    if (/^[kK]\b/.test(after.trim())) continue;
    if (/^tr\b/i.test(after.trim())) continue;
    // Không phải thời gian (theo sau bởi h, phút, p)
    if (/^(?:h|phút|phut|\bp\b)/i.test(after.trim())) continue;
    candidates.push(val);
  }
  // Lấy candidate cuối cùng (pattern repo cũ: quét từ cuối lên)
  return candidates.length > 0 ? candidates[candidates.length - 1] : null;
}

export function calcPoints(price, tripType) {
  if (!price || price <= 0) return 0;
  const p = tripType === "GAM_CAO" ? price + 700 : price;

  if (tripType === "TIEN") {
    if (p < 200) return 0;
    if (p <= 250) return 0.5;
    return 1;
  }
  if (tripType === "DON_SB") {
    if (p < 200) return 0;
    if (p < 300) return 0.5;
    return 1;
  }
  // TINH_1C, TINH_2C, GAM_CAO
  const is2C = tripType === "TINH_2C";
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
  const c = String(content || "");
  const lower = c.toLowerCase().trim();

  // Hủy
  if (/(hủy|huỷ|ktly|cancel|hoãn)/i.test(lower))
    return { type: "CANCEL" };

  // Nhận/confirm lịch: bắt đầu bằng @tên + từ khóa ok
  if (/^@\S/.test(c) && /(ok|0k|oka|bay|ib|inbox|okl|okie)/i.test(lower))
    return { type: "TAKE" };

  // Đăng lịch: có giá và KHÔNG bắt đầu bằng @
  const price = extractPrice(c);
  if (price > 0 && !/^@/.test(c.trim())) {
    const tripType = detectTripType(c);
    const scoreFromContent = extractScoreFromContent(c);
    const points =
      scoreFromContent !== null ? scoreFromContent : calcPoints(price, tripType);
    const pointsSource = scoreFromContent !== null ? "EXPLICIT" : "BAREM";
    return { type: "POST", price, tripType, points, pointsSource };
  }

  return { type: "OTHER" };
}
