# Báo cáo kỹ thuật: So sánh 3 nguồn Zalo Guardian

**Ngày:** 2026-05-31 | **Phạm vi:** Chỉ dựa trên manifest, không kiểm tra file thực tế.

---

## 1. Tổng quan

| Tiêu chí | i32100 | probook | github |
|-----------|--------|---------|--------|
| Số file | 107 | 87 | 85 |
| Dung lượng | 841 KB | 803 KB | 662 KB |
| Dependencies | Giống nhau cả 3 | — | — |
| `core/zalo.js` | 14 KB | **20 KB** | 11 KB |
| `index.js` | 3.5 KB | **4.7 KB** | 3.5 KB |
| `watchdogStateMachine.js` | MISSING | **CÓ (7.3 KB)** | MISSING |
| `runtimeBuildInfo.js` | CÓ | MISSING | CÓ |
| `docs/DEPLOY.md` | CÓ | MISSING | CÓ |
| Deploy/rollback scripts | CÓ (đầy đủ) | Không có | CÓ |
| Hardening docs | Không | **CÓ** | Không |
| Check scripts (FSM, fail-closed) | Không | **CÓ** | Không |

---

## 2. Điểm mạnh từng nguồn

### probook (production hardened)

- **Watchdog FSM** (`core/watchdogStateMachine.js`): Pure state machine tách logic quyết định khỏi side-effect, có test script `check-watchdog-fsm.mjs`. Đây là cải tiến kiến trúc quan trọng nhất.
- **Fail-closed startup**: `index.js` có `scheduleStartupZaloRecovery()` — nếu Zalo login thất bại, process exit thay vì chạy "zombie" (Web UI sống nhưng listener chết). Có `check-startup-fail-closed.mjs` verify.
- **`core/zalo.js` mở rộng** (20 KB): Thêm listener instance tracking, persist OK/fail telemetry, quick-restart logic, FSM integration. Bỏ `child_process.spawn` restart (dùng exit cho systemd thay vì tự spawn).
- **SIGTERM/SIGINT handling** trong `index.js`.
- **Hardening documentation** (`docs/hardening_probook.md`).
- **WebUI server nhẹ hơn** (2.9 KB): Bỏ `settingsWatchdog`, `health`, `runtimeBuild` routes — có thể là do chưa port hoặc cố ý giữ lean.

### i32100 (staging, feature-complete)

- **Deploy infrastructure đầy đủ**: `deploy-i32100.sh`, `rollback-i32100.sh`, `build-info.json`, `runtimeBuildInfo.js`.
- **WebUI routes đầy đủ**: `/api/settings/watchdog-quiet`, `/api/health/full`, `/api/runtime/build`.
- **Docs phong phú nhất** (107 files): Bao gồm soak monitor log, planva evidence, hướng dẫn sử dụng chi tiết.
- **SHA1 trùng github** trên hầu hết core files → i32100 là bản deploy từ github + thêm docs/scripts vận hành.

### github (canonical source of truth)

- **Sạch nhất**: 85 files, 662 KB. Không có docs vận hành riêng từng máy.
- **Có `.env.example`** (738 bytes) — i32100 cũng có nhưng probook thiếu.
- **SHA1 khớp i32100** trên core logic → xác nhận đây là upstream đúng.
- **Không có hardening code** từ probook.

---

## 3. Khác biệt rủi ro cao

### 3.1 `index.js` — Startup behavior (CRITICAL)

| Hành vi | github / i32100 | probook |
|---------|-----------------|---------|
| Zalo login fail | **Tiếp tục chạy**, log warning | **Exit process** (fail-closed) |
| Credentials missing | Skip, Web UI vẫn sống | **Exit** nếu configured nhưng missing |
| SIGTERM handling | Không có | Có (`process.exit(0)`) |

**Rủi ro:** Nếu merge probook fail-closed vào github mà không cập nhật docs/README (hiện ghi "Web UI vẫn chạy nếu Zalo lỗi"), sẽ gây nhầm lẫn vận hành.

### 3.2 `core/zalo.js` — Watchdog architecture (HIGH)

- **github** (11 KB): Watchdog đơn giản, dùng `spawn` để restart process.
- **i32100** (14 KB): Thêm `FATAL_LISTENER_ERROR_PATTERNS`, `exitForFatalListenerState()`, `listenerRestartPendingConfirmation`. Vẫn dùng `spawn`.
- **probook** (20 KB): FSM-driven, bỏ `spawn`, thêm instance tracking + persist telemetry. Import `watchdogStateMachine.js`.

**Rủi ro:** Merge probook `zalo.js` yêu cầu kèm `watchdogStateMachine.js`. Nếu thiếu → crash runtime.

### 3.3 `webui/server.js` — API surface (MEDIUM)

- **github / i32100**: Có `settingsWatchdog`, `health`, `runtimeBuild` routers.
- **probook**: Thiếu 3 routers này. Dùng `/api/health` alias cho `statusRouter`.

**Rủi ro:** Deploy script hiện poll `/api/health/full` — nếu dùng probook server.js sẽ 404.

### 3.4 Files chỉ có ở một nguồn

| File | Chỉ có ở | Quan trọng? |
|------|----------|-------------|
| `core/watchdogStateMachine.js` | probook | **CÓ** — core logic |
| `core/runtimeBuildInfo.js` | i32100 + github | CÓ — deploy verification |
| `scripts/check-watchdog-fsm.mjs` | probook | Test script |
| `scripts/check-startup-fail-closed.mjs` | probook | Test script |
| `scripts/deploy-i32100.sh` | i32100 + github | Ops tooling |
| `docs/hardening_probook.md` | probook | Documentation |
| `docs/HUONG_DAN_SU_DUNG.md` | i32100 + github | User guide |

---

## 4. Chiến lược merge (branch-based)

### Nguyên tắc

- **GitHub** = canonical upstream (source of truth cho code).
- **probook** = production hardening chưa được upstream. Cần cherry-pick lên.
- **i32100** = staging mirror của github + ops docs. Không có code mới cần upstream.

### Kế hoạch cụ thể

```
github/main (current baseline)
    │
    ├── branch: feat/watchdog-fsm
    │     • Thêm core/watchdogStateMachine.js (từ probook)
    │     • Thêm scripts/check-watchdog-fsm.mjs (từ probook)
    │     • Cập nhật core/zalo.js (merge probook version, giữ lại
    │       runtimeBuildInfo import + health routes compatibility)
    │
    ├── branch: feat/fail-closed-startup
    │     • Cập nhật index.js (từ probook: fail-closed + SIGTERM)
    │     • Thêm scripts/check-startup-fail-closed.mjs
    │     • Cập nhật README.md (bỏ claim "Web UI vẫn chạy nếu Zalo lỗi")
    │
    ├── branch: feat/webui-unify
    │     • Merge webui/server.js: giữ full routes (github version)
    │       + thêm /api/health alias nếu cần backward compat
    │
    └── branch: docs/hardening
          • Thêm docs/hardening_probook.md
          • Thêm docs/hardening_probook_run_20260528-0531.md
```

### Thứ tự merge

1. `feat/watchdog-fsm` — prerequisite cho fail-closed (FSM phải có trước khi zalo.js import nó)
2. `feat/fail-closed-startup` — depends on #1 (index.js gọi startZalo mà zalo.js đã dùng FSM)
3. `feat/webui-unify` — independent, merge bất kỳ lúc nào
4. `docs/hardening` — independent

### Sau merge → deploy

1. Push github/main
2. Deploy i32100 staging (dùng `deploy-i32100.sh`)
3. Verify `/api/health/full` + chạy `check-watchdog-fsm.mjs` + `check-startup-fail-closed.mjs`
4. Soak 2-3 ngày
5. Mở ProBook production gate

---

## 5. Nguồn canonical đề xuất cho từng module

| Module / File | Canonical source | Lý do |
|---------------|-----------------|-------|
| `core/zalo.js` | **probook** | Hardened nhất, FSM-driven, production-proven |
| `core/watchdogStateMachine.js` | **probook** | Chỉ có ở đây |
| `core/watchdogQuiet.js` | **github** (sha1 trùng i32100) | Stable, không cần thay đổi |
| `index.js` | **probook** | Fail-closed + signal handling |
| `core/db.js` | **github** | Stable baseline, probook chỉ khác sha1 nhỏ |
| `core/runtimeBuildInfo.js` | **github** | probook thiếu file này — cần thêm vào |
| `webui/server.js` | **github/i32100** | Full API surface, deploy scripts depend on it |
| `webui/basicAuth.js` | **github** | Identical logic cả 3 |
| `core/loadConfig.js` | **github** | Stable |
| `scripts/deploy-*.sh`, `rollback-*.sh` | **github/i32100** | Ops tooling |
| `scripts/check-*.mjs` | **probook** | Verification scripts |
| `docs/DEPLOY.md` | **github/i32100** | probook thiếu |
| `docs/hardening_*.md` | **probook** | Chỉ có ở đây |

---

## 6. Rủi ro cần giải quyết trước merge

1. **probook thiếu `runtimeBuildInfo.js`** → Sau merge, cần verify probook production có file này (hoặc thêm vào).
2. **probook `webui/server.js` thiếu health/settings routes** → Deploy script sẽ fail nếu dùng probook server.js nguyên bản. Phải merge routes vào.
3. **README claim conflict** → probook fail-closed mâu thuẫn với README hiện tại. Cập nhật docs đồng thời với code.
4. **`spawn` vs `exit` restart strategy** → github/i32100 dùng `spawn` child process, probook dùng `process.exit` cho systemd. Chiến lược probook đúng hơn cho systemd environment — nhưng cần đảm bảo systemd unit có `Restart=on-failure`.
5. **Test coverage** → probook có 2 check scripts nhưng không có test framework chính thức. Sau merge nên thêm unit test cho FSM.