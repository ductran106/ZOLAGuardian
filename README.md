# Zalo Guardian

Bot Zalo + Shield Guardian (spam, lặp tin, sticker/emoji, thu hồi/xóa tin) và Web UI điều khiển.

- Chạy: `npm install` rồi `node index.js` (hoặc service `systemd` trên server).
- Cấu hình: `config.json` (không commit), có thể ghi đè bằng `.env` — xem `core/loadConfig.js` và `.env.example`.
- Vận hành & bảo mật Web UI: `docs/OPERATIONS.md`.
- Hợp đồng kỹ thuật (events, API): `docs/Contract.md`.

## Cổng Web UI theo môi trường (không đổi cổng script)

| Môi trường điển hình | `webuiPort` trong `config.json` |
|----------------------|-----------------------------------|
| **duc-ProBook** (`~/zalo-guardian`) | **3456** |
| **i32100 clean** (`~/zalo-guardian-clean`) | **3457** |

`config.example.json` dùng **3456** làm mặc định; trên i32100 giữ file `config.json` riêng với **3457** (đã vận hành như vậy — không ghi đè khi deploy).

## Script tiện (Windows / Linux)

- `run-clean-webui.bat` / bật `ZALO_GUARDIAN_SKIP_ZALO=1`: chỉ Web UI + DB, không cần cookie Zalo.
- `run-clean-full.bat`: chạy đầy đủ (tắt SKIP Zalo, cần `.env` / credentials).
- `run-clean-webui.sh`: tương tự full stack trên Linux (`exec node index.js`).

**Khởi động an toàn:** `index.js` bọc `startZalo` trong `try/catch` — nếu đăng nhập Zalo lỗi, Guardian + Web UI vẫn chạy (đăng nhập lại bằng QR trên Web UI).
