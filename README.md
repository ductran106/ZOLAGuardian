# Zalo Guardian

Bot Zalo + Shield Guardian (spam, lặp tin, sticker/emoji, thu hồi/xóa tin) và Web UI điều khiển.

- Chạy: `npm install` rồi `node index.js` (hoặc service `systemd` trên server).
- Cấu hình: `config.json` (không commit), có thể ghi đè bằng `.env` — xem `core/loadConfig.js` và `.env.example`.
- Vận hành & bảo mật Web UI: `docs/OPERATIONS.md`.
- Hợp đồng kỹ thuật (events, API): `docs/Contract.md`.
