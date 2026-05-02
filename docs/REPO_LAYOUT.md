# Cấu trúc repo (một cây thư mục)

Trên Windows, một số công cụ có thể hiển thị đường dẫn với `/` hoặc `\` nhưng **chỉ có một bản** file thật:

- `core/` — DB, event bus, Zalo, spam rules effectives  
- `modules/guardian/` — Guardian (spam, undo, notifier, telegram)  
- `webui/` — Express server, API, static UI  

Import trong code dùng **forward slash** (chuẩn ES module), ví dụ `modules/guardian/spam.js`.

Không có hai thư mục `modules` trùng lặp; chỉ khác ký tự phân tách khi liệt kê file trên Windows.
