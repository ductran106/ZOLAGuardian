# HANDOFF — zalo-guardian

## Môi trường triển khai (duc-ProBook)

- **Node**: v22.x (theo spec dự án)
- **Project path**: `~/zalo-guardian/`
- **Credentials**: `~/.openclaw/credentials/zalouser/credentials.json`
- **zca-js**: qua `zcaPath` trong `config.json` (openclaw global install)
- **Group ID**: `1558116646214505753` (nhóm được watch)
- **Web UI**: port `3456`

## Workflow PC-Boss → Ubuntu

1. Đồng bộ mã nguồn (rsync/scp/git — tùy team).
2. Trên Ubuntu: `cd ~/zalo-guardian && npm install && npm start`
3. Điền `dmAdminId` trong `config.json` (placeholder `ADMIN_USER_ID_HERE`).
4. `config.json` nằm trong `.gitignore`; mỗi máy giữ bản local.

## Phase 1 đã có

- SQLite (`data/guardian.db`): messages / violations / features / watch_groups schema.
- `core/zalo.js`: login zca-js, emit `zalo:message`, `zalo:undo`.
- `modules/guardian`: spam detect (config-driven), ghi `violations`, event `guardian:violation`.
- Web UI: status, violations list, feature toggles (`bot`, `guardian`).

## Việc nối tiếp (Phase 2+)

- Hành động trên Zalo sau vi phạm (xóa tin, kick, cảnh báo nhóm).
- Đồng bộ `watch_groups` từ `config.json` vào DB.
- Auth Web UI (hiện chưa có).
