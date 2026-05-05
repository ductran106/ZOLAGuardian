# Hướng dẫn sử dụng Zalo Guardian (cho người mới)

Tài liệu này mô tả **từng phần trên Web UI** và cách vận hành cơ bản. Đọc theo thứ tự lần đầu; sau đó dùng mục lục để tra cứu.

---

## Mục lục

1. [Phần mềm này làm gì?](#1-phần-mềm-này-làm-gì)
2. [Trước khi mở Web UI](#2-trước-khi-mở-web-ui)
3. [Mở dashboard và đăng nhập](#3-mở-dashboard-và-đăng-nhập)
4. [Thanh trạng thái & làm mới dữ liệu](#4-thanh-trạng-thái--làm-mới-dữ-liệu)
5. [Khối Tổng quan & đăng nhập Zalo (QR)](#5-khối-tổng-quan--đăng-nhập-zalo-qr)
6. [Feature flags (nâng cao)](#6-feature-flags-nâng-cao)
7. [Xuất DOCX (quote + @All)](#7-xuất-docx-quote--all)
8. [Nhóm & Guardian](#8-nhóm--guardian)
9. [Tra UID theo tên](#9-tra-uid-theo-tên)
10. [Whitelist / Blacklist spam](#10-whitelist--blacklist-spam)
11. [Vi phạm gần đây](#11-vi-phạm-gần-đây)
12. [Tab Bảng điểm](#12-tab-bảng-điểm)
13. [Tab Lịch xe](#13-tab-lịch-xe)
14. [File cấu hình & biến môi trường (tóm tắt)](#14-file-cấu-hình--biến-môi-trường-tóm-tắt)
15. [Gợi ý an toàn & bảo mật](#15-gợi-ý-an-toàn--bảo-mật)
16. [Sự cố thường gặp](#16-sự-cố-thường-gặp)

---

## 1. Phần mềm này làm gì?

- **Kết nối tài khoản Zalo** (bot) để **lắng nghe tin nhắn nhóm** mà tài khoản tham gia.
- **Shield / Guardian:** có thể **phát hiện vi phạm** (spam link, từ khóa, lặp tin, sticker/emoji, v.v.) tùy cấu hình từng nhóm.
- **Web UI** (trang trong trình duyệt): bật/tắt từng nhóm, sửa rule, xem vi phạm, **bảng điểm / lịch xe** (nếu anh dùng tính năng phase 2), **xuất file Word (DOCX)** từ tin đã lưu trong database.
- Dữ liệu chạy qua **SQLite** trên máy chủ (`data/guardian.db` — không nên commit lên Git).

Anh **không cần** biết lập trình để dùng Web UI; chỉ cần đúng **địa chỉ**, **mật khẩu** (nếu bật), và biết **restart** dịch vụ khi đổi đăng nhập Zalo.

---

## 2. Trước khi mở Web UI

### 2.1. Bot phải đang chạy

Trên máy chủ thường dùng một trong hai cách:

- Chạy tay: trong thư mục dự án, sau `npm install`, gõ: `node index.js`
- Hoặc dịch vụ **systemd** (Linux): ví dụ `systemctl --user start zalo-guardian` (tên unit có thể khác tùy máy anh).

Nếu tiến trình **không chạy**, mở trình duyệt sẽ **không vào được** dashboard.

### 2.2. Cổng Web UI (`webuiPort`)

Trong file **`config.json`** (ở thư mục gốc dự án) có mục **`webuiPort`**:

- Ví dụ **3456** (thường dùng trên một máy).
- Máy khác có thể đặt **3457** — tùy anh; **không đổi** nếu đang dùng ổn định.

Địa chỉ kiểu: `http://ĐỊA_CHỈ_MÁY_CHỦ:3456`

### 2.3. Truy cập từ xa (Tailscale / LAN)

Nếu anh dùng **Tailscale**: vào bằng IP Tailscale của máy chạy bot, ví dụ `http://100.x.x.x:3456`. Chi tiết bảo mật xem thêm `docs/OPERATIONS.md`.

---

## 3. Mở dashboard và đăng nhập

1. Mở trình duyệt (Chrome, Edge, …).
2. Gõ địa chỉ **đúng IP/domain + cổng** (mục 2.2).
3. Nếu trên máy chủ đã cấu hình **Basic Auth** (`WEBUI_BASIC_USER` và `WEBUI_BASIC_PASSWORD` trong `.env` hoặc biến môi trường), trình duyệt sẽ hỏi **user / password** — nhập giống khi cấu hình.
4. Sau khi vào, anh thấy tiêu đề **Zalo Guardian** và các khối bên dưới.

**Lưu ý:** Nếu không hỏi mật khẩu, có thể Basic Auth **chưa bật** (chỉ nên dùng khi máy an toàn / test).

---

## 4. Thanh trạng thái & làm mới dữ liệu

- Góc trên có **pill** (nhãn):
  - **Realtime** (màu bật): trình duyệt **đang nối WebSocket** với server — khi có thay đổi, trang có thể **tự cập nhật** một phần dữ liệu.
  - **Offline**: mất kết nối realtime; trang vẫn dùng được nhưng có thể **cũ** hơn thực tế.
- Trang còn **tự làm mới định kỳ** (khoảng vài chục giây) để đồng bộ Tổng quan, nhóm, vi phạm, spam list.

Nếu pill **Offline** lâu: kiểm tra mạng, hoặc tải lại trang (F5).

---

## 5. Khối Tổng quan & đăng nhập Zalo (QR)

Đây là nơi xem **bot có đang nối Zalo không** và **đăng nhập bằng QR** khi cần.

### 5.1. Dòng chữ gợi ý (hint)

Phần mềm hiển thị **một đoạn mô tả** theo tình huống, ví dụ:

- Chưa cấu hình đường dẫn **zca-js** hoặc file **credentials**.
- Đã **kết nối Zalo** — có thể dùng **Log out** (xem mục 5.4).
- Đang bật **`ZALO_GUARDIAN_SKIP_ZALO=1`** → **không** kết nối Zalo (chỉ Web UI + DB); QR có thể bị tắt cho đến khi anh tắt biến này và khởi động lại tiến trình.

Đọc kỹ dòng hint **trước khi** bấm nút.

### 5.2. Nút « Đăng nhập Zalo (QR) »

**Khi nào dùng:** Tài khoản chưa có file đăng nhập hợp lệ, hoặc anh muốn đăng nhập lại.

**Cách làm:**

1. Bấm **Đăng nhập Zalo (QR)** (nếu nút không mờ — nút mờ nghĩa là môi trường chưa cho phép, xem hint).
2. Xuất hiện **mã QR** — mở app **Zalo trên điện thoại**, quét mã, làm theo bước xác nhận trên điện thoại.
3. Trạng thái có thể hiện: đang chờ quét → đã quét → xác nhận → **đang lưu file** → **xong**.
4. Khi báo **đã lưu credentials**, anh cần **restart** tiến trình bot trên máy chủ (`node index.js` hoặc systemd) để bot **đọc file mới** và **bật listener** nhận tin.

**Sai sót thường gặp:** Quét xong nhưng quên **restart** → Web UI báo đã lưu nhưng bot chưa nhận tin.

### 5.3. Nút « Hủy QR »

Dùng khi đang chờ quét mà anh muốn **dừng** phiên QR.

### 5.4. Nút « Log out Zalo »

Chỉ hiện khi **đã kết nối Zalo**. Thao tác logout theo luồng phần mềm: thường kèm **sao lưu / xóa file credentials** và cần **restart** — đọc đúng thông báo trên màn hình tại thời điểm anh bấm.

---

## 6. Feature flags (nâng cao)

Trong khối **Tổng quan**, mở phần **Feature flags (nâng cao)**.

- Mỗi **chip** là một công tắc (ví dụ bật/tắt module **Shield Guardian** hoặc phần **bot** tùy phiên bản).
- Bấm **Bật / Tắt** trên chip → gửi lên server và **lưu**.

**Newbie:** Nếu không chắc, **đừng đổi** cho đến khi hiểu rõ hoặc được hướng dẫn — tắt nhầm có thể **ngừng kiểm duyệt** nhóm.

---

## 7. Xuất DOCX (quote + @All)

Khối **« Xuất DOCX (cụm quote + admin @All) »** dùng để **tải file Word** tổng hợp tin trong **khoảng giờ** anh chọn, theo **một nhóm**.

### 7.1. Ý nghĩa (đơn giản)

- **Giờ** tính theo **Asia/Ho_Chi_Minh** (giống gợi ý trên giao diện).
- Tin **ngoài khung giờ** có thể được đánh dấu kiểu **thiếu** trong văn bản xuất (theo thiết kế pipeline DOCX).
- **Khối @All:** mặc định lấy tin có **@All** trong khung giờ; có thể chế độ **chỉ @All của admin** (ô tick « Chỉ @All của admin »).

### 7.2. Các ô cần chọn trước khi tải

| Ô | Việc cần làm |
|---|----------------|
| **Ngày** | Chọn ngày cần xuất. |
| **Từ / Đến** | Khung giờ trong ngày (ví dụ 08:00–22:00). |
| **Nhóm** | Chọn đúng nhóm trong danh sách **dropdown**. |

Rồi bấm **« Tải DOCX »** — trình duyệt sẽ **tải file** (hoặc mở hộp thoại lưu file).

### 7.3. Danh sách « Theo dõi xuất DOCX »

- Phần **danh sách bên dưới** là các nhóm anh **đánh dấu để theo dõi** (lưu trong DB).
- **Cột thời gian** (bên phải mỗi dòng): **tin mới nhất** đã có trong database cho nhóm đó (từ listener). Giúp biết nhóm đã **có dữ liệu cache** chưa.
- **Thêm nhóm vào theo dõi:** chọn nhóm ở dropdown → bấm **« Thêm nhóm (ô trên) vào theo dõi xuất DOCX »**.
- **Xóa** một dòng: bấm **Xóa** trên dòng đó.
- **Bấm vào dòng** (phần chính): có thể **chọn nhanh** nhóm đó vào dropdown để xuất.

### 7.4. « Đồng bộ nhóm Zalo (tất cả nhóm đang tham gia) »

- Kéo **toàn bộ nhóm** mà tài khoản Zalo đang tham gia vào **dropdown chọn nhóm** (cần **Zalo đã đăng nhập** và bot chạy).
- Sau khi đồng bộ, anh chọn nhóm và xuất DOCX như bình thường.

---

## 8. Nhóm & Guardian

### 8.1. Đưa danh sách nhóm vào Web UI

- **Đồng bộ nhóm (bot là Admin):** lấy các nhóm mà bot được coi là **admin/trưởng nhóm** (theo metadata Zalo). Dùng khi anh **quản trị** các nhóm đó.
- **Đồng bộ nhóm Zalo** trong phần DOCX (mục 7.4) là **tất cả nhóm đang tham gia** — khác phạm vi với nút « bot là Admin ».

Sau đồng bộ, danh sách **thẻ nhóm** hiện bên dưới.

### 8.2. Ô « Tìm nhóm »

Gõ **tên hoặc ID** để lọc danh sách dài.

### 8.3. « Hiện tất cả nhóm » / « Ẩn nhóm tắt Shield »

- Mặc định có thể chỉ hiện nhóm đang **bật Shield** (gọn).
- Bấm để **đảo** giữa hai chế độ (xem đúng nút trên giao diện anh đang dùng).

### 8.4. « Tắt Guardian — tất cả nhóm »

**Tắt Shield cho mọi nhóm** trong danh sách — thao tác **mạnh**. Chỉ dùng khi anh **chắc** muốn tạm ngừng toàn bộ kiểm duyệt.

### 8.5. Trên mỗi thẻ nhóm

| Phần | Ý nghĩa |
|------|---------|
| **Công tắc Shield** | Bật = Guardian **hoạt động** cho nhóm đó; Tắt = **không** xử lý vi phạm cho nhóm đó. |
| **Thoát nhóm** | Bot **rời nhóm Zalo** và **xóa** nhóm khỏi danh sách watch — **không hoàn tác**. Hỏi xác nhận trước khi chạy. |
| **Bật/tắt vi phạm theo room** (mở rộng) | Từng loại vi phạm có thể **bật/tắt riêng** cho nhóm (URL blacklist, keyword, lặp tin, emoji, sticker, thu hồi, admin xóa, …). Sau khi tick, bấm **« Lưu rule vi phạm »**. |
| **Miễn kiểm spam (admin)** | Danh sách **UID Zalo** (một dòng một ID) được **miễn** kiểm spam. **Không** tự đồng bộ từ Zalo — anh nhập/sửa tay. Bấm **« Lưu admin »**. |

**Luật lặp tin** (repeat): do thông số trong `config` / DB — xem gợi ý ngay trên giao diện (ngưỡng số tin giống nhau trong cửa sổ thời gian, v.v.).

---

## 9. Tra UID theo tên

1. Gõ **ít nhất 2 ký tự** tên hiển thị (ví dụ tên trên Zalo).
2. (Tuỳ chọn) Chọn **một nhóm** trong dropdown để giới hạn phạm vi.
3. Bấm **« Tra UID »**.

Kết quả hiện bảng: tên, **UID**, nhóm, các mốc thời gian **lần thấy / lần cuối** (theo cache tin nhắn đã lưu).

**Lưu ý:** Chỉ tra được người đã **xuất hiện trong tin** đã cache — nếu chưa có tin, không có dòng.

---

## 10. Whitelist / Blacklist spam

Dữ liệu lưu trong **SQLite**, đổi **có hiệu ngay**, không cần restart bot (trừ khi có gì đó đặc biệt).

### 10.1. Whitelist

| Loại | Ý nghĩa |
|------|---------|
| **Host** | Domain được **cho phép** link (giống danh host cho phép trong config). |
| **Chuỗi trong tin** | Nếu tin **chứa** đoạn chuỗi đó → **bỏ qua** toàn bộ kiểm spam cho tin đó. |

Thêm: chọn loại → nhập giá trị → **Thêm**. Xóa từng dòng trong bảng nếu cần.

### 10.2. Blacklist

| Loại | Ý nghĩa |
|------|---------|
| **Keyword blacklist** | Chặn theo **chuỗi con** (substring). |
| **URL/Link regex blacklist** | Chặn theo **biểu thức regex** cho URL/link. Regex sai có thể bị API từ chối khi lưu. |

### 10.3. Đồng bộ với file `config.json`

- **« Nạp config.json → DB »:** đưa rule từ **file** vào database (không xóa thủ công các dòng đã có — chủ yếu **bổ sung** mục chưa có).
- **« Ghi DB → config.json »:** ghi ngược rule đang có trên UI vào **file** để backup / chỉnh tay sau.

Khi hai nguồn **lệch nhau**, có thể có thông báo **mẫu** so sánh — đọc để biết mục chỉ có ở file hay chỉ có ở DB.

---

## 11. Vi phạm gần đây

- Liệt kê vi phạm **theo nhóm** — mỗi nhóm là một khối **có thể mở/đóng**.
- Trong bảng: **thời gian**, **người gửi**, **loại vi phạm**, **chi tiết**.

Dùng để **đối chiếu** sau khi Guardian xử lý (xóa tin, thông báo, v.v. tùy cấu hình).

---

## 12. Tab « Bảng điểm »

1. Bấm tab **« Bảng điểm »** trên thanh điều hướng.
2. Chọn **ngày** (mặc định có thể là hôm nay).
3. (Tuỳ chọn) Chọn **một nhóm** hoặc để **tất cả**.
4. Bấm **« Xem »**.

Bảng hiển thị: lịch đăng/nhận, điểm cộng/trừ, điểm net — theo logic **scheduler/scorer** của dự án.

**« Export CSV »:** tải file CSV theo **ngày / nhóm** đang chọn (qua API export).

---

## 13. Tab « Lịch xe »

1. Bấm tab **« Lịch xe »**.
2. Chọn **ngày** và **trạng thái** (OPEN / MATCHED / CONFIRMED / CANCELLED / tất cả).
3. Bấm **« Xem »**.

Cột **Override:** có thể nhập **điểm** và **ghi chú** cho một job rồi bấm **✓** để **ghi đè điểm** (tính năng chỉnh tay cho từng dòng).

---

## 14. File cấu hình & biến môi trường (tóm tắt)

| File / nguồn | Vai trò |
|----------------|---------|
| **`config.json`** | Cổng Web UI, đường dẫn tuỳ chọn, spam mặc định, v.v. **Không** commit lên Git khi public. |
| **`.env`** | Ghi đè đường dẫn credentials, zca-js, Telegram, Basic Auth Web UI, v.v. Xem **`/.env.example`**. |
| **`config.example.json`** | Mẫu để copy thành `config.json` lần đầu. |

Chi tiết biến môi trường: đọc phần đầu file **`core/loadConfig.js`** (comment trong code).

---

## 15. Gợi ý an toàn & bảo mật

- Bật **Basic Auth** cho Web UI khi truy cập qua mạng (user + password trong `.env`).
- **Không** để lộ file **`config.json`**, **`.env`**, **`data/zalo-credentials.json`**.
- Xem thêm **`docs/OPERATIONS.md`** và **`docs/SECURITY.md`**.

---

## 16. Sự cố thường gặp

| Hiện tượng | Gợi ý xử lý |
|-------------|-------------|
| **Không vào được trang** | Kiểm tra bot có chạy không; đúng **IP và cổng**; firewall. |
| **QR xong nhưng bot không nhận tin** | **Restart** tiến trình sau khi lưu credentials. |
| **`EADDRINUSE` port 3456** (Linux) | Cổng bị tiến trình `node` cũ giữ — tìm và **tắt** process đó hoặc `fuser -k 3456/tcp` rồi restart dịch vụ (chỉ khi chắc không có app khác dùng cổng đó). |
| **Nút QR mờ / không bấm được** | Đọc **hint** — có thể đang **SKIP_ZALO**, thiếu **zca-js**, hoặc chưa cấu hình **credentials path**. |
| **Đồng bộ nhóm trống** | Zalo chưa kết nối; hoặc tài khoản **không** có nhóm đủ điều kiện (tuỳ chế độ đồng bộ). |
| **DOCX không có nội dung / thiếu tin** | Khung giờ sai; nhóm chưa có **cache tin** trong DB; listener chưa chạy. |

---

*Tài liệu này mô tả giao diện và luồng dùng phổ biến; chi tiết kỹ thuật API/events nằm trong `docs/Contract.md`. Nếu phiên bản trên máy anh khác nhẹ (nhánh dev), một số nhãn có thể đổi — so với màn hình thực tế là chuẩn.*
