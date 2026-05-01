# Contract — zalo-guardian

## `config.json` (không commit)

| Trường | Ý nghĩa |
|--------|---------|
| `credentialsPath` | File JSON imei/cookie/userAgent |
| `zcaPath` | Đường dẫn tuyệt đối tới bundle `zca-js` |
| `botUserId` | ID bot (tham chiếu vận hành) |
| `dmAdminId` | Admin nhận DM (placeholder Phase 1) |
| `watchGroups` | Danh sách nhóm + `adminIds` + `alertGroupId` |
| `spam` | `linkPatterns`, repeat thresholds, emoji/sticker flags |
| `webuiPort` | Cổng HTTP |

## Events (`eventBus`)

| Event | Payload | Nguồn |
|-------|---------|--------|
| `zalo:connect` | `{ userId }` | `zalo.js` |
| `zalo:message` | `{ api, msg }` | `zalo.js` |
| `zalo:undo` | `{ api, data }` | `zalo.js` |
| `guardian:violation` | `{ api, msg, groupId, displayName, type, detail }` | `guardian` |
| `guardian:db:changed` | — | `guardian`, `features` API |

## API Web UI

- `GET /api/status/` — Zalo connected, ownId, flags.
- `GET /api/violations/` — 200 bản ghi mới nhất.
- `GET /api/features/` — flags.
- `POST /api/features/` — body `{ key, enabled }`.

## `detectSpam` trả về

```js
{ spam: boolean, reasons: string[] }
```

Rules chỉ đọc từ `config.spam`, không hard-code pattern trong logic (chỉ định nghĩa cấu trúc field trong code).
