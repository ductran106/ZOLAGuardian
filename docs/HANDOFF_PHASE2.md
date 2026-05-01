# HANDOFF — Zalo Guardian v2.0 — Phase 2
## Tạo: 2026-05-01

## Trạng thái Phase 1
- 22/22 Gates PASS
- Service running: systemd user service, Linger=yes
- Web UI: http://192.168.1.24:3456

## Thay đổi so với HANDOFF_ONG_THAU_NEW.md

### Files đã sửa
- core/zalo.js — thêm watch filter + MSG log
- modules/guardian/index.js — fix cache error (|| "")
- modules/guardian/spam.js — fix sticker type, emoji shortcode, safeContent
- modules/guardian/notifier.js — hiển thị tên (ID) thay vì ID thuần
- webui/api/features.js — thêm groupsRouter
- webui/server.js — mount /api/groups
- webui/public/index.html + app.js + style.css — thêm section Groups

### Thông tin đã xác nhận
- Hoang Long userId: 7162499132938525408
- adminIds: ["3590927100252748627","7162499132938525408","2287316777534438968"]
- zca-js sendMessage đúng: api.sendMessage(text, id) — 2 args string
- Emoji Zalo dạng shortcode: :p :d :o — isEmojiOnly dùng regex :[a-z]
- Sticker msgType thật: "chat.sticker"
- MSG log filter: chỉ emit zalo:message cho watched groups

## Phase 2 — Crawler
Mục tiêu: Lưu toàn bộ lịch sử chat group vào SQLite
Module: modules/crawler/
Gate checklist: TBD

## Bước tiếp theo
1. Thiết kế Gate checklist Phase 2
2. Build modules/crawler/
3. Test crawl lịch sử Tiền Điểm Tiền Xe
