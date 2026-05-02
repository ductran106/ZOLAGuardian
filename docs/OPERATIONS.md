# Vận hành Zalo Guardian

## Web UI + Tailscale + Basic Auth

1. Bật Tailscale trên máy chạy bot và máy trình duyệt (điện thoại/laptop admin).
2. Trên máy bot, đặt biến môi trường (hoặc `.env`):

   - `WEBUI_BASIC_USER` — tài khoản đăng nhập dashboard  
   - `WEBUI_BASIC_PASSWORD` — mật khẩu  

   Chỉ khi **cả hai** được đặt thì Basic Auth mới bật. Để trống = không hỏi mật khẩu (tiện dev, không khuyến nghị production).

3. Truy cập dashboard bằng IP Tailscale của máy bot, ví dụ:  
   `http://100.x.x.x:3456` — trình duyệt sẽ hỏi user/pass (Basic Auth).

4. Không bật bind riêng theo IP (theo lựa chọn vận hành): dựa vào **Tailscale + ACL** và **Basic Auth** để giới hạn người truy cập.

## Đồng bộ `config.json` và `spam_list` (DB)

- **Nạp config.json → DB:** đưa rule từ file vào SQLite (không ghi đè mục trùng).  
- **Ghi DB → config.json:** lưu lại rule đang dùng trên UI vào file.  
- Khi thấy “lệch dữ liệu”, phần **mẫu** (tối đa vài dòng) cho biết mục chỉ có ở config hoặc chỉ có ở DB.

## Cấm mọi link web trong nhóm

Dùng **URL/Link regex blacklist** (trong `config` là `urlPatterns` / DB block `kind=regex`):

- Mẫu mặc định trong `config.example.json`:  
  - `https?:\/\/\S+` — bắt hầu hết URL `http(s)://…`  
  - `www\.[^\s]+` — bắt dạng `www....`  

**Whitelist host** (`linkAllowHosts`) dùng để **cho phép** domain nội bộ (nhà xe, site riêng) khỏi bị xóa.

## Rule vi phạm theo nhóm (`group_violation_rules`) — migration tên cũ → mới

Trước đây DB có thể lưu loại cũ: `LINK_SPAM`, `REPEAT`, `UNDO`, …  
Code hiện dùng tên mới: `URL_BLACKLIST`, `REPEAT_SPAM`, `MESSAGE_RECALLED_SELF`, …

Khi khởi động, bot **tự chạy migration một lần**:

- Với mỗi nhóm (`group_id`): nếu có dòng **cũ** và đã có dòng **mới** tương ứng, hai trạng thái “bật/tắt” được gộp theo kiểu **cả hai đều bật thì mới coi là bật** (nếu một trong hai tắt → coi là tắt).  
- Sau đó xóa dòng loại cũ để tránh trùng.

Như vậy toggle trên Web UI luôn khớp loại mới, không mất ý “admin đã tắt rule này”.

## Regex URL blacklist — validate và an toàn khi chạy

- **Khi lưu rule trên API:** nếu `kind = regex` mà pattern không compile được, API trả `400` và không ghi DB.  
- **Khi quét tin nhắn:** nếu vì lý do nào đó pattern trong DB vẫn lỗi, bot **bỏ qua pattern đó** và ghi log, **không crash** toàn process.

## Cache tin nhắn (`messages`) — `INSERT OR IGNORE`

Bảng cache dùng `msg_id` làm khóa duy nhất: tin **mới** với cùng `msg_id` (hiếm) sẽ **không cập nhật** dòng cũ — chỉ ảnh hưởng tra cứu nội dung cũ / UNDO. Nếu sau này cần luôn giữ bản mới nhất, có thể đổi sang `UPSERT` (chưa làm mặc định).

## npm audit

Chấp nhận rủi ro có bản ghi **high** trong dependency cho đến khi nâng version có kiểm thử — xem `docs/SECURITY.md`.
