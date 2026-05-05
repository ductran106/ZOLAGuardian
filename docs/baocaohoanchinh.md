# BÁO CÁO HOÀN CHỈNH — Zalo Guardian
## Ngày báo cáo: 2026-05-01

## 1) Mục tiêu triển khai
- Xây dựng và vận hành bot kiểm duyệt nhóm Zalo theo thời gian thực.
- Tăng tốc xử lý vi phạm (phát hiện, cảnh báo, xóa tin, thông báo quản trị).
- Cung cấp Web UI để đội vận hành tự quản lý nhóm, rule spam, và cấu hình phòng.
- Chuẩn hóa cảnh báo gửi Telegram/Zalo để dễ theo dõi và truy vết.

## 2) Phạm vi đã hoàn thành

### 2.1 Backend / Guardian
- Hoàn thiện pipeline xử lý sự kiện: nhận tin nhắn, phát hiện vi phạm, xóa tin, ghi DB, phát cảnh báo.
- Tách xử lý thông báo Telegram sang module riêng `modules/guardian/telegramNotify.js`.
- Chuẩn hóa thông báo vi phạm cho các loại:
  - `LINK_SPAM` (hiển thị ra người dùng dưới tên `LINK_SPAM_BLACKLIST`)
  - `STICKER`
  - `SPAM_Emoji`
  - `REPEAT`
  - `UNDO`
- Bổ sung logic `UNDO`:
  - Chỉ xử lý ở room đang bật Shield.
  - Gửi thông báo vào chính room.
  - Hỗ trợ thông báo full/short theo điều kiện nội dung thu hồi có biến thể `ok/0k`.
- Bỏ chụp ảnh bằng chứng theo yêu cầu vận hành; giữ kênh thông báo text ổn định.

### 2.2 Spam detection
- Nâng cấp phát hiện emoji/emoticon để phủ rộng Unicode + token đặc thù Zalo.
- Chuẩn hóa quy tắc bỏ qua admin theo `admin_ids` từng room.
- Cập nhật rule `REPEAT` theo yêu cầu nghiệp vụ:
  - Vi phạm nếu **5 tin giống nhau trong 20 giây**.
  - Hoặc **4 tin giống nhau liền nhau cùng 1 người** (không có người khác xen giữa).

### 2.3 Web UI
- Thêm quản trị nhóm trực quan:
  - Bật/tắt Shield theo từng room.
  - Bật/tắt Shield hàng loạt.
  - Rời nhóm nhanh từ UI.
  - Tìm kiếm nhóm.
- Vi phạm gần đây hiển thị dạng accordion theo room.
- Quản trị whitelist/blacklist dạng bảng có sửa/xóa trực tiếp.
- Thêm cấu hình theo room:
  - Nút show/hide cho ô **Miễn kiểm spam (admin IDs)**.
  - Toggle bật/tắt từng loại vi phạm theo room (`LINK_SPAM`, `SPAM_Emoji`, `STICKER`, `REPEAT`, `UNDO`).

### 2.4 Cấu hình & bảo mật
- Chuyển cấu hình nhạy cảm sang `.env`:
  - credentials path, zca path, Telegram token/chat ID...
- Bổ sung `core/loadConfig.js` để merge `config.json` + biến môi trường.
- Thêm `.env.example`, `config.example.json`, cập nhật `.gitignore` để tránh lộ secrets.

### 2.5 Vận hành / triển khai
- Triển khai nhiều vòng qua SSH lên máy đích `duc-ProBook`.
- Service `zalo-guardian` chạy bằng systemd user service, restart thành công sau mỗi đợt.
- Kiểm tra endpoint Web UI trả `HTTP 200`.
- Đã commit + push toàn bộ thay đổi lên GitHub:
  - Repo: `https://github.com/ductran106/ZOLAGuardian`
  - Branch: `main`
  - Commit mới nhất đợt này: `b67b261`

## 3) Kết quả kiểm chứng thực tế
- Bot phát hiện vi phạm ổn định theo các rule đã bật.
- Trường hợp "phát hiện nhưng không xóa" được xác minh đúng theo quyền nhóm:
  - Tin của admin cùng cấp bot: có thể không xóa được.
  - Tin của member thường: xóa bình thường.
- Room `[1-1 RETURN] Tái định cư`:
  - Shield đang bật (`enabled=1`).
  - Có phát sinh vi phạm `REPEAT` và bot đã xóa thành công các case ghi log gần nhất.

## 4) Cấu hình vận hành hiện tại (đã áp dụng)
- `repeatThreshold = 5`
- `repeatWindowSeconds = 20`
- `repeatConsecutiveThreshold = 4`
- `blockSticker = true`
- `blockEmojiOnly = true`
- `emojiMode = strict`
- Quyền miễn kiểm spam theo room quản lý bằng `admin_ids` trong DB/Web UI.

## 5) Vấn đề đã xử lý trong quá trình triển khai
- Khắc phục lỗi đồng bộ nhóm mới bật Shield nhưng bot chưa bảo vệ (bỏ filter cứng theo watchGroups ban đầu).
- Khắc phục các trường hợp regex emoji/ok-variant chưa phủ hết.
- Tối ưu format thông báo Telegram cho ngắn gọn, chuyên nghiệp, dễ đọc.
- Hoàn thiện API quản trị nhóm/rule để Web UI thao tác trực tiếp.

## 6) Rủi ro còn lại & lưu ý
- Xóa tin nhắn phụ thuộc quyền thực tế của bot trong từng nhóm.
- Một số payload quote của Zalo không ổn định, hệ thống đã có fallback gửi plain text.
- Nếu tăng/giảm độ nhạy spam, nên điều chỉnh từng bước và theo dõi log 24-48h trước khi chốt.

## 7) Đề xuất giai đoạn tiếp theo
- Thêm dashboard số liệu theo ngày/tuần (vi phạm theo room, theo loại, theo user).
- Thêm cơ chế “cảnh báo trước khi xóa” cho một số room đông để giảm false-positive.
- Tách profile cấu hình theo từng room trọng điểm (độ nhạy khác nhau theo mục đích phòng).
- Bổ sung runbook vận hành sự cố (mất quyền bot, login timeout, Telegram failover).

## 8) Kết luận
Hệ thống Zalo Guardian hiện đã đạt trạng thái vận hành thực tế, có Web UI quản trị đầy đủ, cảnh báo đa kênh, và rule spam đã tinh chỉnh theo hành vi room thực tế. Mức độ sẵn sàng triển khai sử dụng thường xuyên: **Tốt**.

