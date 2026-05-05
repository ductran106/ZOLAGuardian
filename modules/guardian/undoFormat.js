/**
 * Từ tên nhóm dạng "[1-1 RETURN] Tái định cư" → token cuối trong ngoặc vuông: "RETURN".
 * Không có [...] thì trả về tên đã trim.
 */
export function shortGroupLabel(groupName) {
  const s = String(groupName ?? "").trim();
  if (!s) return "Nhóm";
  const m = s.match(/\[([^\]]+)\]/);
  if (m) {
    const parts = m[1].trim().split(/\s+/).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return s;
}
