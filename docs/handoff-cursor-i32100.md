# Handoff: `zalo-guardian-clean` trên i32100 (Cursor agent)

Tài liệu này tóm tắt **bối cảnh đã làm trong phiên chat** để agent / người mới làm việc với **`/home/duc/zalo-guardian-clean`** trên máy **i32100** một cách nhất quán, không nhầm với bản production khác.

---

## Mục đích bản `zalo-guardian-clean`

- **Sandbox / thử nghiệm**: DB và `config.json` tách khỏi bản chính (`zalo-guardian`), cổng Web UI khác để chạy song song.
- **Windows (máy dev)**: thư mục `C:\Users\ANTRACH_DOUBLE\zalo-guardian-clean` — copy mã từ repo chính, `config` xuất phát từ `config.example.json`, **`webuiPort`: 3457**.
- **Linux (i32100)**: cùng ý nghĩa, path chuẩn: **`/home/duc/zalo-guardian-clean`**.

Bản production bot thường nằm ở **`/home/duc/zalo-guardian`** trên **ProBook** (`deploy.bat` đẩy từ Windows). **Không** gộp nhầm với `zalo-guardian-clean`.

---

## Máy i32100 — SSH và Node

| Mục | Giá trị |
|-----|---------|
| Host | `i32100` (đã resolve qua mạng nội bộ / Tailscale trong môi trường đã dùng) |
| User | `duc` |
| Key SSH (Windows) | `%USERPROFILE%\.ssh\id_ed25519_guardian` |
| Node / npm | **`/home/duc/bin/node`**, **`/home/duc/bin/npm`** (không nằm trong PATH mặc định của SSH non-login) |

**Bắt buộc** khi chạy lệnh từ xa không qua login shell:

```bash
export PATH="/home/duc/bin:/usr/bin:/bin"
```

Hoặc dùng:

```bash
bash -lc 'export PATH=/home/duc/bin:/usr/bin:/bin; cd /home/duc/zalo-guardian-clean && …'
```

Nếu viết **systemd** cho bản clean, thêm `Environment=PATH=/home/duc/bin:/usr/bin:/bin` (và biến khác nếu cần).

---

## Nội dung đã triển khai trên i32100

1. **Đồng bộ từ Windows**: đóng gói `zalo-guardian-clean` (loại trừ `node_modules`, `data`), `scp` lên i32100, giải nén vào `/home/duc/zalo-guardian-clean`.
2. **`npm install`** chạy **trên Linux** (không copy `node_modules` từ Windows).
3. Script **`run-clean-webui.sh`** trong thư mục clean: set `PATH`, `ZALO_GUARDIAN_SKIP_ZALO=1`, `node index.js`.

---

## Chế độ bỏ qua Zalo (Web UI + DB, không zca-js)

Trong **repo chính** (`zalo-guardian`), `index.js` có nhánh:

- Nếu **`ZALO_GUARDIAN_SKIP_ZALO=1`** → không gọi `startZalo`; Guardian + scheduler + Web UI vẫn khởi động.

Biến có thể đặt trong `.env` (được `core/loadConfig.js` load trước khi app chạy) hoặc export trong shell.

Dùng khi: thử UI/API, schema DB mới, không cần file credentials / `zca-js`.

---

## Cổng và tunnel

- Bản clean mặc định: **Web UI `3457`** (`config.json` trên clean).
- Tunnel từ máy Windows tới Web UI trên i32100:

  ```bash
  ssh -i "%USERPROFILE%\.ssh\id_ed25519_guardian" -L 3457:127.0.0.1:3457 duc@i32100
  ```

  Sau đó trên Windows mở **`http://127.0.0.1:3457`**.

- **Lưu ý**: Công cụ fetch/MCP của agent thường **không** truy cập được `localhost` trên máy user; kiểm tra tunnel nên dùng `curl` trên máy user hoặc Simple Browser trong Cursor.

---

## Chạy nhanh trên i32100 (sau SSH)

```bash
cd /home/duc/zalo-guardian-clean
./run-clean-webui.sh
```

Hoặc tay:

```bash
bash -lc 'export PATH=/home/duc/bin:/usr/bin:/bin; cd /home/duc/zalo-guardian-clean && ZALO_GUARDIAN_SKIP_ZALO=1 node index.js'
```

---

## Hướng nâng cấp tính năng (gợi ý cho agent mới)

1. **Ưu tiên chỉnh mã trên repo Windows** `zalo-guardian` (hoặc clone git), rồi **đồng bộ** file tương ứng lên i32100 (`scp`/`rsync` từng module hoặc tarball), **tránh** sửa trực tiếp trên server mà không đưa ngược về repo nếu muốn giữ một nguồn sự thật.
2. Hoặc làm việc **trực tiếp** trên `/home/duc/zalo-guardian-clean` qua SSH, rồi **commit/patch** mang về Windows — cần thống nhất với chủ repo.
3. Sau khi đổi dependency: trên i32100 chạy `npm install` với `PATH` như trên.
4. Nếu bật đủ Zalo trên bản clean: trong `.env` đặt `ZALO_CREDENTIALS_PATH`, `ZCA_JS_PATH`, và **tắt** / xóa `ZALO_GUARDIAN_SKIP_ZALO` (hoặc đặt rỗng).
5. **DB**: `data/guardian.db` tạo tại thư mục gốc project; bản clean không dùng chung DB với `zalo-guardian` production trên cùng máy nếu path khác nhau.

---

## So sánh nhanh

| | `zalo-guardian` (chính) | `zalo-guardian-clean` |
|--|-------------------------|------------------------|
| Windows path | `...\zalo-guardian` | `...\zalo-guardian-clean` |
| i32100 path | (thường không phải mục tiêu handoff này) | `/home/duc/zalo-guardian-clean` |
| Web UI port (mặc định đã set) | thường `3456` trong `config.example` | **`3457`** |
| `node_modules` trên Linux | cài tại chỗ | cài tại chỗ, **không** copy từ Windows |

---

## ProBook (tham chiếu, tránh nhầm)

- IP Tailscale đã dùng cho deploy: **`100.124.121.122`**, user `duc`, path **`/home/duc/zalo-guardian`**.
- `deploy.bat` trên Windows đồng bộ **lên** ProBook; **không** tự động đồng bộ sang i32100 hay `zalo-guardian-clean`.

---

*Tạo/cập nhật theo yêu cầu handoff phiên Cursor — mục đích: nâng cấp tính năng cho `/home/duc/zalo-guardian-clean` trên i32100.*
