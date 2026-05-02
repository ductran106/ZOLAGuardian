# Báo cáo snapshot toàn bộ dự án zalo-guardian

**Nguồn:** Cursor agent — lệnh tương đương `find` (Windows PowerShell), SSH ProBook (`duc@100.124.121.122`), `git`.  
**Ghi chú:** Giá trị nhạy cảm trong `.env` (token Telegram, mật khẩu Web UI) được thay bằng `[REDACTED]` trong bản lưu file này.

---

## PHẦN A: Cấu trúc file hiện tại

Lệnh tương đương:

`Get-ChildItem -Recurse -File` trên `C:\Users\ANTRACH_DOUBLE\zalo-guardian`, loại trừ `node_modules`, `.git`, `data`; đường dẫn tương đối, sắp xếp.

```
.env.example
.gitignore
_zca_study/package.json
config.example.json
config.json
core/db.js
core/eventBus.js
core/featureFlags.js
core/groupDiscovery.js
core/loadConfig.js
core/spamRules.js
core/violationRuleMigration.js
core/zalo.js
dbg.docx
dbg.zip
dbg_u/[Content_Types].xml
dbg_u/_rels/.rels
dbg_u/docProps/app.xml
dbg_u/docProps/core.xml
dbg_u/docProps/custom.xml
dbg_u/word/_rels/comments.xml.rels
dbg_u/word/_rels/document.xml.rels
dbg_u/word/_rels/endnotes.xml.rels
dbg_u/word/_rels/fontTable.xml.rels
dbg_u/word/_rels/footnotes.xml.rels
dbg_u/word/comments.xml
dbg_u/word/document.xml
dbg_u/word/endnotes.xml
dbg_u/word/fontTable.xml
dbg_u/word/footnotes.xml
dbg_u/word/numbering.xml
dbg_u/word/settings.xml
dbg_u/word/styles.xml
dbg_unzip/[Content_Types].xml
dbg_unzip/_rels/.rels
dbg_unzip/docProps/app.xml
dbg_unzip/docProps/core.xml
dbg_unzip/docProps/custom.xml
dbg_unzip/word/_rels/comments.xml.rels
dbg_unzip/word/_rels/document.xml.rels
dbg_unzip/word/_rels/endnotes.xml.rels
dbg_unzip/word/_rels/fontTable.xml.rels
dbg_unzip/word/_rels/footnotes.xml.rels
dbg_unzip/word/comments.xml
dbg_unzip/word/document.xml
dbg_unzip/word/endnotes.xml
dbg_unzip/word/fontTable.xml
dbg_unzip/word/footnotes.xml
dbg_unzip/word/numbering.xml
dbg_unzip/word/settings.xml
dbg_unzip/word/styles.xml
dbg2.docx
dbg2.zip
dbg2_u/[Content_Types].xml
dbg2_u/_rels/.rels
dbg2_u/docProps/app.xml
dbg2_u/docProps/core.xml
dbg2_u/docProps/custom.xml
dbg2_u/word/_rels/comments.xml.rels
dbg2_u/word/_rels/document.xml.rels
dbg2_u/word/_rels/endnotes.xml.rels
dbg2_u/word/_rels/fontTable.xml.rels
dbg2_u/word/_rels/footnotes.xml.rels
dbg2_u/word/comments.xml
dbg2_u/word/document.xml
dbg2_u/word/endnotes.xml
dbg2_u/word/fontTable.xml
dbg2_u/word/footnotes.xml
dbg2_u/word/numbering.xml
dbg2_u/word/settings.xml
dbg2_u/word/styles.xml
deploy.bat
docs/_tmp_jobs_q.sql
docs/baocaozca-cursor.md
docs/Blueprint.md
docs/Contract.md
docs/HANDOFF.md
docs/OPERATIONS.md
docs/PHASE2_CURSOR_baocao.md
docs/PHASE2_CURSOR_PROMPT.md
docs/PHASE2_WEBUI_baocao.md
docs/PHASE2_WEBUI_PROMPT.md
docs/prompt-openclaw-get-admin-id.txt
docs/REPO_LAYOUT.md
docs/SECURITY.md
h.docx
hg.docx
hg.zip
hg_u/[Content_Types].xml
hg_u/_rels/.rels
hg_u/docProps/app.xml
hg_u/docProps/core.xml
hg_u/docProps/custom.xml
hg_u/word/_rels/comments.xml.rels
hg_u/word/_rels/document.xml.rels
hg_u/word/_rels/endnotes.xml.rels
hg_u/word/_rels/fontTable.xml.rels
hg_u/word/_rels/footnotes.xml.rels
hg_u/word/comments.xml
hg_u/word/document.xml
hg_u/word/endnotes.xml
hg_u/word/fontTable.xml
hg_u/word/footnotes.xml
hg_u/word/numbering.xml
hg_u/word/settings.xml
hg_u/word/styles.xml
hz.zip
hz_u/[Content_Types].xml
hz_u/_rels/.rels
hz_u/docProps/app.xml
hz_u/docProps/core.xml
hz_u/docProps/custom.xml
hz_u/word/_rels/comments.xml.rels
hz_u/word/_rels/document.xml.rels
hz_u/word/_rels/endnotes.xml.rels
hz_u/word/_rels/fontTable.xml.rels
hz_u/word/_rels/footnotes.xml.rels
hz_u/word/comments.xml
hz_u/word/document.xml
hz_u/word/endnotes.xml
hz_u/word/fontTable.xml
hz_u/word/footnotes.xml
hz_u/word/numbering.xml
hz_u/word/settings.xml
hz_u/word/styles.xml
index.js
modules/guardian/index.js
modules/guardian/notifier.js
modules/guardian/spam.js
modules/guardian/telegramNotify.js
modules/guardian/undo.js
modules/guardian/violationScreenshot.js
modules/scheduler/index.js
modules/scheduler/parser.js
modules/scheduler/scorer.js
package.json
package-lock.json
README.md
tr.docx
tr.zip
tr_u/[Content_Types].xml
tr_u/_rels/.rels
tr_u/docProps/app.xml
tr_u/docProps/core.xml
tr_u/docProps/custom.xml
tr_u/word/_rels/comments.xml.rels
tr_u/word/_rels/document.xml.rels
tr_u/word/_rels/endnotes.xml.rels
tr_u/word/_rels/fontTable.xml.rels
tr_u/word/_rels/footnotes.xml.rels
tr_u/word/comments.xml
tr_u/word/document.xml
tr_u/word/endnotes.xml
tr_u/word/fontTable.xml
tr_u/word/footnotes.xml
tr_u/word/numbering.xml
tr_u/word/settings.xml
tr_u/word/styles.xml
webui/api/export.js
webui/api/features.js
webui/api/jobs.js
webui/api/scores.js
webui/api/spamRoutes.js
webui/api/status.js
webui/api/violations.js
webui/basicAuth.js
webui/lib/quoteDocxBuild.js
webui/public/app.js
webui/public/index.html
webui/public/style.css
webui/server.js
```

---

## PHẦN B: Trạng thái ProBook

### B1 — Service status

```
activating
---
May 02 19:13:47 duc-ProBook node[2362492]:   port: 3456
May 02 19:13:47 duc-ProBook node[2362492]: }
May 02 19:13:47 duc-ProBook node[2362492]: Node.js v22.22.2
May 02 19:13:47 duc-ProBook systemd[1457]: zalo-guardian.service: Main process exited, code=exited, status=1/FAILURE
May 02 19:13:47 duc-ProBook systemd[1457]: zalo-guardian.service: Failed with result 'exit-code'.
```

Lệnh:

- `systemctl --user is-active zalo-guardian.service`
- `journalctl --user -u zalo-guardian -n 5 --no-pager`

### B2 — Cấu trúc file trên ProBook

`find /home/duc/zalo-guardian -type f -not -path '*/node_modules/*' -not -path '*/data/*' | sort`

```
/home/duc/zalo-guardian/config.json
/home/duc/zalo-guardian/core/db.js
/home/duc/zalo-guardian/core/eventBus.js
/home/duc/zalo-guardian/core/featureFlags.js
/home/duc/zalo-guardian/core/groupDiscovery.js
/home/duc/zalo-guardian/core/loadConfig.js
/home/duc/zalo-guardian/core/spamRules.js
/home/duc/zalo-guardian/core/violationRuleMigration.js
/home/duc/zalo-guardian/core/zalo.js
/home/duc/zalo-guardian/docs/baocaohoanchinh.md
/home/duc/zalo-guardian/docs/baocaozca-cursor.md
/home/duc/zalo-guardian/docs/Blueprint.md
/home/duc/zalo-guardian/docs/Contract.md
/home/duc/zalo-guardian/docs/HANDOFF.md
/home/duc/zalo-guardian/docs/HANDOFF_PHASE2.md
/home/duc/zalo-guardian/docs/OPERATIONS.md
/home/duc/zalo-guardian/docs/PHASE2_CURSOR_baocao.md
/home/duc/zalo-guardian/docs/PHASE2_CURSOR_PROMPT.md
/home/duc/zalo-guardian/docs/PHASE2_WEBUI_baocao.md
/home/duc/zalo-guardian/docs/PHASE2_WEBUI_PROMPT.md
/home/duc/zalo-guardian/docs/prompt-openclaw-get-admin-id.txt
/home/duc/zalo-guardian/docs/REPO_LAYOUT.md
/home/duc/zalo-guardian/docs/SECURITY.md
/home/duc/zalo-guardian/docs/_tmp_jobs_q.sql
/home/duc/zalo-guardian/.env
/home/duc/zalo-guardian/guardian.out
/home/duc/zalo-guardian/guardian.service.log
/home/duc/zalo-guardian/index.js
/home/duc/zalo-guardian/modules/guardian/index.js
/home/duc/zalo-guardian/modules/guardian/notifier.js
/home/duc/zalo-guardian/modules/guardian/spam.js
/home/duc/zalo-guardian/modules/guardian/telegramNotify.js
/home/duc/zalo-guardian/modules/guardian/undo.js
/home/duc/zalo-guardian/modules/guardian/violationScreenshot.js
/home/duc/zalo-guardian/modules/scheduler/index.js
/home/duc/zalo-guardian/modules/scheduler/parser.js
/home/duc/zalo-guardian/modules/scheduler/scorer.js
/home/duc/zalo-guardian/package.json
/home/duc/zalo-guardian/package-lock.json
/home/duc/zalo-guardian/run.log
/home/duc/zalo-guardian/webui/api/export.js
/home/duc/zalo-guardian/webui/api/features.js
/home/duc/zalo-guardian/webui/api/jobs.js
/home/duc/zalo-guardian/webui/api/scores.js
/home/duc/zalo-guardian/webui/api/spamRoutes.js
/home/duc/zalo-guardian/webui/api/status.js
/home/duc/zalo-guardian/webui/api/violations.js
/home/duc/zalo-guardian/webui/basicAuth.js
/home/duc/zalo-guardian/webui/lib/quoteDocxBuild.js
/home/duc/zalo-guardian/webui/public/app.js
/home/duc/zalo-guardian/webui/public/index.html
/home/duc/zalo-guardian/webui/public/style.css
/home/duc/zalo-guardian/webui/server.js
```

### B3 — DB tables và row counts

```
=== B3 tables ===
daily_scores
features
group_names
group_violation_rules
jobs
messages
spam_list
sqlite_sequence
violations
watch_groups
=== B3 row counts ===
messages|24222
jobs|1708
daily_scores|273
violations|359
watch_groups|119
features|2
```

### B4 — Schema đầy đủ (`sqlite3 … ".schema"`)

```
CREATE TABLE messages (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    msg_id       TEXT UNIQUE,
    group_id     TEXT,
    user_id      TEXT,
    display_name TEXT,
    content      TEXT,
    msg_type     TEXT DEFAULT 'text',
    ts           INTEGER,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  , quote_msg_id TEXT, quote_owner_id TEXT);
CREATE TABLE sqlite_sequence(name,seq);
CREATE TABLE violations (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      TEXT,
    display_name TEXT,
    group_id     TEXT,
    type         TEXT,
    detail       TEXT,
    ts           DATETIME DEFAULT CURRENT_TIMESTAMP
  );
CREATE TABLE features (
    key     TEXT PRIMARY KEY,
    enabled INTEGER DEFAULT 1,
    config  TEXT
  );
CREATE TABLE watch_groups (
    group_id       TEXT PRIMARY KEY,
    name           TEXT,
    enabled        INTEGER DEFAULT 1,
    admin_ids      TEXT,
    alert_group_id TEXT,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
  );
CREATE TABLE group_names (
    group_id   TEXT PRIMARY KEY,
    name       TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
CREATE TABLE spam_list (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    list_type   TEXT    NOT NULL CHECK (list_type IN ('allow', 'block')),
    pattern     TEXT    NOT NULL,
    kind        TEXT    NOT NULL DEFAULT 'substring' CHECK (kind IN ('host', 'substring', 'regex')),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (list_type, pattern)
  );
CREATE TABLE group_violation_rules (
    group_id   TEXT NOT NULL,
    type       TEXT NOT NULL,
    enabled    INTEGER NOT NULL DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, type)
  );
CREATE TABLE jobs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    msg_id          TEXT UNIQUE,
    group_id        TEXT,
    poster_id       TEXT,
    poster_name     TEXT,
    taker_id        TEXT,
    taker_name      TEXT,
    taker_msg_id    TEXT,
    confirm_msg_id  TEXT,
    cancel_msg_id   TEXT,
    raw_content     TEXT,
    price           INTEGER,
    trip_type       TEXT,
    base_points     REAL,
    status          TEXT DEFAULT 'OPEN',
    job_date        TEXT,
    ts              INTEGER,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
  , points_source TEXT DEFAULT 'BAREM', override_points REAL, override_by TEXT, override_note TEXT);
CREATE TABLE daily_scores (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         TEXT,
    display_name    TEXT,
    group_id        TEXT,
    date            TEXT,
    jobs_posted     INTEGER DEFAULT 0,
    jobs_taken      INTEGER DEFAULT 0,
    points_earned   REAL DEFAULT 0,
    points_deducted REAL DEFAULT 0,
    net_points      REAL DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, group_id, date)
  );
```

### B5 — Jobs hôm nay (`job_date = date('now')`)

```
CANCELLED|10
CONFIRMED|178
MATCHED|22
OPEN|1498
```

### B6 — Daily scores hôm nay (top 10)

```
display_name                 points_earned  points_deducted  net_points
---------------------------  -------------  ---------------  ----------
Nhật Tiến Airport            4.0            0.0              4.0       
Chinh Sân Bay                3.5            0.0              3.5       
Nguyễn Tanh                  3.5            0.0              3.5       
Vận Tải Pro                  4.5            1.0              3.5       
Quyết Thắng Nguyễn           3.0            0.0              3.0       
Kentnguyen                   3.0            0.0              3.0       
Taxi Nội Bài Và Đi Các Tỉnh  3.0            0.0              3.0       
Nguyễn Trần Tuấn             3.0            0.0              3.0       
Linglingfat                  3.0            0.0              3.0       
Hoàng Thanh                  2.5            0.0              2.5       
```

---

## PHẦN C: Config hiện tại (ProBook)

### `cat /home/duc/zalo-guardian/config.json`

```
{
  "credentialsPath": "/home/duc/.openclaw/credentials/zalouser/credentials.json",
  "zcaPath": "/home/duc/.npm-global/lib/node_modules/openclaw/node_modules/zca-js/dist/index.js",
  "botUserId": "2287316777534438968",
  "dmAdminId": "3590927100252748627",
  "telegramBotToken": "",
  "telegramChatId": "",
  "watchGroups": [
    {
      "groupId": "1558116646214505753",
      "name": "Tiền Điểm Tiền Xe",
      "adminIds": [],
      "alertGroupId": "1558116646214505753"
    }
  ],
  "spam": {
    "linkAllowHosts": [
      "binhminhsapa.com",
      "hanauda.online"
    ],
    "linkPatterns": [
      "bit\\.ly",
      "tinyurl\\.com",
      "t\\.me",
      "https?:\\/\\/\\S+",
      "www\\.[^\\s]+",
      "\\bg\\.com\\b",
      "zalo\\.me"
    ],
    "repeatThreshold": 5,
    "repeatWindowSeconds": 20,
    "repeatConsecutiveThreshold": 4,
    "blockEmojiOnly": true,
    "emojiMode": "strict",
    "blockSticker": true,
    "allowTextSubstrings": [],
    "urlPatterns": [
      "bit\\.ly",
      "tinyurl\\.com",
      "t\\.me",
      "https?:\\/\\/\\S+",
      "www\\.[^\\s]+",
      "\\bg\\.com\\b",
      "zalo\\.me"
    ],
    "keywordPatterns": []
  },
  "webuiPort": 3456
}
```

### `cat /home/duc/zalo-guardian/.env` (bản lưu file — đã che bí mật)

```
TELEGRAM_BOT_TOKEN=[REDACTED]
TELEGRAM_CHAT_ID=2079315704

# Web UI Basic Auth (Zalo Guardian)
WEBUI_BASIC_USER=duc
WEBUI_BASIC_PASSWORD=[REDACTED]
```

*(Trên server, giá trị đầy đủ vẫn nằm trong `/home/duc/zalo-guardian/.env`.)*

---

## PHẦN D: Các thay đổi chưa commit (git)

### `git status`

```
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   core/db.js
	modified:   core/zalo.js
	modified:   index.js
	modified:   modules/guardian/index.js
	modified:   modules/guardian/notifier.js
	modified:   modules/guardian/spam.js
	modified:   modules/guardian/telegramNotify.js
	modified:   package-lock.json
	modified:   package.json
	modified:   webui/public/app.js
	modified:   webui/public/index.html
	modified:   webui/public/style.css
	modified:   webui/server.js

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	_zca_study/
	dbg.docx
	dbg.zip
	dbg2.docx
	dbg2.zip
	dbg2_u/
	dbg_u/
	dbg_unzip/
	docs/PHASE2_CURSOR_PROMPT.md
	docs/PHASE2_CURSOR_baocao.md
	docs/PHASE2_WEBUI_PROMPT.md
	docs/PHASE2_WEBUI_baocao.md
	docs/_tmp_jobs_q.sql
	docs/baocaozca-cursor.md
	h.docx
	hg.docx
	hg.zip
	hg_u/
	hz.zip
	hz_u/
	modules/scheduler/
	tr.docx
	tr.zip
	tr_u/
	webui/api/export.js
	webui/api/jobs.js
	webui/api/scores.js
	webui/lib/

no changes added to commit (use "git add" and/or "git commit -a")
```

### `git log --oneline -10`

```
37794e6 feat: Web UI Basic Auth, violation types/migration, spam rules UX
b67b261 Upgrade Guardian moderation controls and notification flow.
c433fc6 Initial import: Zalo Guardian bot, web UI, spam rules, group sync
```

---

*Kết thúc báo cáo.*
