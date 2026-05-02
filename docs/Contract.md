# Contract — zalo-guardian

## `config.json` (không commit)

| Trường | Ý nghĩa |
|--------|---------|
| `credentialsPath` | File JSON imei/cookie/userAgent |
| `zcaPath` | Đường dẫn tới bundle `zca-js` (`dist/index.js`) |
| `botUserId` | ID bot (tham chiếu vận hành) |
| `dmAdminId` | Admin nhận DM cảnh báo |
| `watchGroups` | Nhóm seed + `adminIds` + `alertGroupId` |
| `spam` | `linkAllowHosts`, `urlPatterns`, `keywordPatterns`, `linkPatterns` (alias `urlPatterns`), repeat thresholds, emoji/sticker flags, `allowTextSubstrings` |
| `webuiPort` | Cổng HTTP Web UI |
| `webuiBasicUser` / `webuiBasicPassword` | Tuỳ chọn — Basic Auth (ưu tiên ghi đè bằng `WEBUI_BASIC_*` trong `.env`) |

## Loại vi phạm (lưu trong `violations.type` và toggle `group_violation_rules`)

| Type | Ghi chú ngắn |
|------|----------------|
| `URL_BLACKLIST` | Regex URL/link khớp `urlPatterns` |
| `KEYWORD_SPAM` | Keyword substring khớp `keywordPatterns` |
| `REPEAT_SPAM` | Lặp tin (cửa sổ hoặc liền nhóm) |
| `EMOJI_SPAM` | Chỉ emoji/emoticon |
| `STICKER_SPAM` | Tin sticker |
| `MESSAGE_RECALLED_SELF` | Thu hồi / xóa — cùng người với tác giả tin trong cache |
| `MESSAGE_DELETED_BY_ADMIN` | Xóa — người thao tác khác tác giả tin trong cache |

## Events (`eventBus`)

| Event | Payload | Nguồn |
|-------|---------|--------|
| `zalo:connect` | `{ userId }` | `core/zalo.js` |
| `zalo:message` | `{ api, msg }` | `core/zalo.js` |
| `zalo:undo` | `{ api, data }` | `core/zalo.js` |
| `guardian:violation` | `{ type, displayName, groupId, content, ts }` | `modules/guardian/index.js` |
| `guardian:db:changed` | — | DB/API |

## API Web UI (REST)

- `GET /api/status/` — Zalo connected, ownId, flags  
- `GET /api/violations/` — danh sách vi phạm (giới hạn số bản ghi)  
- `GET /api/features/` — feature flags  
- `POST /api/features/` — `{ key, enabled }`  
- `GET /api/groups/` — watch groups + rule toggle  
- `PATCH /api/groups/:id/rules` — bật/tắt từng loại vi phạm  
- `GET /api/spam-rules/` — whitelist/blacklist + thống kê đồng bộ  
- `POST /api/spam-rules/` — thêm rule  
- `POST /api/spam-rules/sync` — đồng bộ config ↔ DB  

Khi bật Basic Auth, mọi request cần header `Authorization: Basic ...`.

## `detectSpam` (runtime)

Trả về `null` hoặc `{ type, detail, content }` — không còn kiểu `{ spam: boolean, reasons: [] }`.

Rules spam đọc từ `getEffectiveSpamConfig()` (ghép `config.json` + bảng `spam_list`).
