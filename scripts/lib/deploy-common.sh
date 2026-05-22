#!/usr/bin/env bash
# scripts/lib/deploy-common.sh — shared helpers for Zalo Guardian deploy/rollback scripts.
# Phase 2 scope: i32100 staging only. ProBook is intentionally gated out — do NOT add
# a probook deploy/rollback that sources this file until i32100 has been validated.
#
# Source from a host-specific wrapper, e.g. deploy-i32100.sh / rollback-i32100.sh.
# Each wrapper must set:
#   DEPLOY_LABEL          (e.g. "i32100")
#   DEPLOY_TARGET         (absolute path to runtime, e.g. /home/duc/zalo-guardian-clean)
#   DEPLOY_SERVICE        (user systemd unit, e.g. zalo-guardian-clean.service)
#   DEPLOY_PORT           (Web UI port, e.g. 3457)
# Optional:
#   DEPLOY_SOURCE         (path containing canonical repo files; default = repo root of script)
#   DEPLOY_BACKUP_ROOT    (default ~/zalo-guardian-backups)
#   DEPLOY_RECEIPT_ROOT   (default ~/zalo-guardian-deploys)
#   DEPLOY_HEALTH_TIMEOUT (seconds, default 60)
#   NODE_BIN              (path to node; auto-detected if unset)

set -euo pipefail

# ---------- logging ----------

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

warn() {
  printf '[%s] WARN: %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >&2
}

die() {
  printf '[%s] ERROR: %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >&2
  exit 1
}

# ---------- safety guards ----------

require_not_root() {
  if [[ "$(id -u)" -eq 0 ]]; then
    die "Refusing to run as root. Run as the service owner user (e.g. duc)."
  fi
}

# Args parser:
#   --confirm        required for any mutating action (sync/restore/restart)
#   --dry-run        plan only, no mutation
#   --source <path>  override DEPLOY_SOURCE (deploy only)
#   --to <name>      rollback target backup name (rollback only)
#   --yes-i-mean-it  alias for --confirm (no extra effect)
# Sets globals: CONFIRM=0|1  DRYRUN=0|1  ARG_SOURCE  ARG_TO
parse_common_args() {
  CONFIRM=0
  DRYRUN=0
  ARG_SOURCE=""
  ARG_TO=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --confirm|--yes-i-mean-it)
        CONFIRM=1
        shift
        ;;
      --dry-run)
        DRYRUN=1
        shift
        ;;
      --source)
        [[ $# -ge 2 ]] || die "--source requires a path"
        ARG_SOURCE="$2"
        shift 2
        ;;
      --to)
        [[ $# -ge 2 ]] || die "--to requires a backup name"
        ARG_TO="$2"
        shift 2
        ;;
      -h|--help)
        SHOW_HELP=1
        shift
        ;;
      *)
        die "Unknown arg: $1"
        ;;
    esac
  done
}

require_confirm() {
  if [[ "${CONFIRM:-0}" -ne 1 ]]; then
    die "Refusing to mutate without --confirm. Re-run with --confirm to proceed."
  fi
}

# ---------- tool detection ----------

resolve_node_bin() {
  if [[ -n "${NODE_BIN:-}" && -x "${NODE_BIN}" ]]; then
    return 0
  fi
  if command -v node >/dev/null 2>&1; then
    NODE_BIN="$(command -v node)"
    return 0
  fi
  if [[ -x "$HOME/bin/node" ]]; then
    NODE_BIN="$HOME/bin/node"
    return 0
  fi
  NODE_BIN=""
  return 1
}

# ---------- paths ----------

# Resolve absolute path without requiring `realpath` (fallback to bash builtin).
abs_path() {
  local p="$1"
  if command -v realpath >/dev/null 2>&1; then
    realpath -m "$p"
  else
    # Fallback: cd-based
    if [[ -d "$p" ]]; then
      (cd "$p" && pwd)
    else
      local dir base
      dir="$(dirname -- "$p")"
      base="$(basename -- "$p")"
      if [[ -d "$dir" ]]; then
        printf '%s/%s\n' "$(cd "$dir" && pwd)" "$base"
      else
        printf '%s\n' "$p"
      fi
    fi
  fi
}

# Discover repo root from a script path, i.e. the parent of `scripts/`.
discover_repo_root() {
  local script_path="$1"
  local script_dir
  script_dir="$(cd "$(dirname -- "$script_path")" && pwd)"
  # script lives at scripts/<file>.sh, so repo root is parent of scripts/
  if [[ "$(basename "$script_dir")" == "scripts" ]]; then
    dirname "$script_dir"
  else
    echo "$script_dir"
  fi
}

# Validate that a directory looks like a Zalo Guardian repo
assert_looks_like_repo() {
  local p="$1"
  local label="$2"
  [[ -d "$p" ]] || die "$label directory does not exist: $p"
  [[ -f "$p/index.js" ]] || die "$label path missing index.js: $p"
  [[ -f "$p/package.json" ]] || die "$label path missing package.json: $p"
  [[ -d "$p/core" ]] || die "$label path missing core/: $p"
  [[ -d "$p/webui" ]] || die "$label path missing webui/: $p"
}

# ---------- backup ----------

# Create $DEPLOY_BACKUP_ROOT/$DEPLOY_LABEL/<timestamp> and back up code files.
# Exports BACKUP_DIR.
make_backup() {
  local ts
  ts="$(date '+%Y%m%d-%H%M%S')"
  local root="${DEPLOY_BACKUP_ROOT:-$HOME/zalo-guardian-backups}"
  BACKUP_DIR="${root}/${DEPLOY_LABEL}/${ts}"
  if [[ "${DRYRUN:-0}" -eq 1 ]]; then
    log "(dry-run) would create backup dir: $BACKUP_DIR"
    return 0
  fi
  mkdir -p "$BACKUP_DIR"
  log "backup dir: $BACKUP_DIR"

  # tar code-managed paths only. Runtime artifacts (config.json, .env, data/,
  # credentials, logs, node_modules, backups/) are NOT backed up here; they
  # are preserved in place and never overwritten.
  local includes=(
    index.js
    core
    webui
    modules
    scripts
    package.json
    package-lock.json
    config.example.json
    README.md
  )
  local existing=()
  local item
  for item in "${includes[@]}"; do
    if [[ -e "$DEPLOY_TARGET/$item" ]]; then
      existing+=("$item")
    fi
  done

  if [[ ${#existing[@]} -eq 0 ]]; then
    warn "no code-managed paths present in $DEPLOY_TARGET — empty backup"
    touch "$BACKUP_DIR/code.empty"
    return 0
  fi

  log "creating code.tgz from ${#existing[@]} paths under $DEPLOY_TARGET"
  tar -czf "$BACKUP_DIR/code.tgz" -C "$DEPLOY_TARGET" "${existing[@]}"

  # Record metadata about the prior state so rollback can identify it.
  {
    printf 'label=%s\n' "$DEPLOY_LABEL"
    printf 'target=%s\n' "$DEPLOY_TARGET"
    printf 'created_at=%s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
    if [[ -f "$DEPLOY_TARGET/build-info.json" ]]; then
      printf 'prior_build_info=%s\n' "$(tr -d '\n' < "$DEPLOY_TARGET/build-info.json")"
    fi
    if [[ -d "$DEPLOY_TARGET/.git" ]]; then
      local prior_commit
      prior_commit="$(GIT_DIR="$DEPLOY_TARGET/.git" git rev-parse HEAD 2>/dev/null || true)"
      [[ -n "$prior_commit" ]] && printf 'prior_commit=%s\n' "$prior_commit"
    fi
  } > "$BACKUP_DIR/manifest.env"

  log "backup written: $BACKUP_DIR/code.tgz"
}

# List backups for current DEPLOY_LABEL, newest first (basename only).
list_backups() {
  local root="${DEPLOY_BACKUP_ROOT:-$HOME/zalo-guardian-backups}"
  local dir="${root}/${DEPLOY_LABEL}"
  if [[ ! -d "$dir" ]]; then
    return 0
  fi
  # Print backup directory names only. Ignore helper files like "latest".
  ( cd "$dir" && find . -maxdepth 1 -mindepth 1 -type d -printf '%f\n' 2>/dev/null | sort -r )
}

# ---------- sync ----------

# rsync $DEPLOY_SOURCE/ → $DEPLOY_TARGET/ preserving runtime artifacts.
# Notes:
#   - Anchored exclude patterns (leading /) so we don't accidentally exclude
#     nested files of the same name.
#   - We do NOT use --delete here. Files removed upstream remain in target
#     until pruned manually. This is intentional for safety in Phase 2.
sync_canonical() {
  local src="$DEPLOY_SOURCE"
  local dst="$DEPLOY_TARGET"

  command -v rsync >/dev/null 2>&1 || die "rsync not found in PATH"
  [[ -d "$src" ]] || die "source dir missing: $src"
  [[ -d "$dst" ]] || die "target dir missing: $dst"

  local rsync_args=(
    -a
    --human-readable
    --info=stats1
    # Code paths to NEVER sync (preserved on target):
    --exclude=/.git/
    --exclude=/node_modules/
    --exclude=/data/
    --exclude=/backups/
    --exclude=/zalo-guardian-backups/
    --exclude=/.env
    --exclude=/.env.*
    --exclude=/config.json
    --exclude=/build-info.json
    --exclude=/run.log
    --exclude=/run.log.*
    --exclude=/guardian.out
    --exclude=*.log
    --exclude=/_zca_study/
    --exclude=/_tmp_crawlbot_portable/
    --exclude=/_tmp_*
    # The deploy receipt/log dir if someone keeps it inside the tree.
    --exclude=/zalo-guardian-deploys/
  )

  if [[ "${DRYRUN:-0}" -eq 1 ]]; then
    rsync_args+=(--dry-run)
    log "(dry-run) rsync plan:"
  fi

  log "syncing $src/ -> $dst/"
  rsync "${rsync_args[@]}" "${src%/}/" "${dst%/}/"
}

# ---------- build-info ----------

# Write build-info.json into $DEPLOY_TARGET capturing source git state + deploy meta.
write_build_info() {
  if [[ "${DRYRUN:-0}" -eq 1 ]]; then
    log "(dry-run) would write build-info.json"
    return 0
  fi
  local src="$DEPLOY_SOURCE"
  local name version commit branch
  name="zalo-guardian"
  version="unknown"
  if [[ -f "$src/package.json" ]]; then
    if resolve_node_bin; then
      name="$("$NODE_BIN" -e 'try{console.log(require(process.argv[1]).name||"")}catch{}' "$src/package.json" 2>/dev/null || echo "$name")"
      version="$("$NODE_BIN" -e 'try{console.log(require(process.argv[1]).version||"")}catch{}' "$src/package.json" 2>/dev/null || echo "$version")"
    fi
  fi
  commit="unknown"
  branch="unknown"
  if [[ -d "$src/.git" ]] && command -v git >/dev/null 2>&1; then
    commit="$(git -C "$src" rev-parse HEAD 2>/dev/null || echo unknown)"
    branch="$(git -C "$src" rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
  fi
  local deployed_at host by_user
  deployed_at="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  host="$DEPLOY_LABEL"
  by_user="$(id -un)"

  local out="$DEPLOY_TARGET/build-info.json"
  local tmp="${out}.tmp.$$"
  cat > "$tmp" <<EOF
{
  "name": "$name",
  "version": "$version",
  "commit": "$commit",
  "branch": "$branch",
  "deployedAt": "$deployed_at",
  "host": "$host",
  "byUser": "$by_user",
  "sourcePath": "$src"
}
EOF
  mv "$tmp" "$out"
  log "wrote $out"
}

# ---------- systemd ----------

restart_service() {
  if [[ "${DRYRUN:-0}" -eq 1 ]]; then
    log "(dry-run) would: systemctl --user restart $DEPLOY_SERVICE"
    return 0
  fi
  command -v systemctl >/dev/null 2>&1 || die "systemctl not found"
  log "restarting user service: $DEPLOY_SERVICE"
  systemctl --user daemon-reload 2>/dev/null || true
  systemctl --user restart "$DEPLOY_SERVICE"
  # Give the unit a brief moment to settle before is-active probe.
  sleep 2
  local state
  state="$(systemctl --user is-active "$DEPLOY_SERVICE" 2>/dev/null || true)"
  log "service is-active: $state"
  if [[ "$state" != "active" ]]; then
    warn "service is not active immediately after restart; health probe will still run"
  fi
}

# ---------- health probe ----------

# Probe http://127.0.0.1:$DEPLOY_PORT/api/health/full until ok && db.ok, or timeout.
# Sets HEALTH_BODY on success.
wait_for_health() {
  local timeout="${DEPLOY_HEALTH_TIMEOUT:-60}"
  local port="$DEPLOY_PORT"
  local url="http://127.0.0.1:${port}/api/health/full"
  command -v curl >/dev/null 2>&1 || die "curl not found"

  if [[ "${DRYRUN:-0}" -eq 1 ]]; then
    log "(dry-run) would probe $url (timeout ${timeout}s)"
    HEALTH_BODY='{"ok":true,"dryRun":true}'
    return 0
  fi

  resolve_node_bin || warn "node not found; health JSON parse will be limited"

  local deadline=$(( $(date +%s) + timeout ))
  local attempts=0
  while [[ $(date +%s) -lt $deadline ]]; do
    attempts=$((attempts + 1))
    local body
    body="$(curl -fsS --max-time 5 "$url" 2>/dev/null || true)"
    if [[ -n "$body" ]]; then
      if [[ -n "$NODE_BIN" ]]; then
        local verdict
        verdict="$(printf '%s' "$body" | "$NODE_BIN" -e '
          let buf = "";
          process.stdin.on("data", c => buf += c);
          process.stdin.on("end", () => {
            try {
              const j = JSON.parse(buf);
              const ok = j && j.ok === true;
              const dbOk = j && j.db && j.db.ok === true;
              process.stdout.write(ok && dbOk ? "ready" : "not-ready");
            } catch { process.stdout.write("parse-error"); }
          });
        ' 2>/dev/null || true)"
        if [[ "$verdict" == "ready" ]]; then
          HEALTH_BODY="$body"
          log "health OK after ${attempts} attempt(s)"
          return 0
        fi
      else
        # No node available — accept HTTP 200 + presence of "\"ok\":true"
        if grep -q '"ok"[[:space:]]*:[[:space:]]*true' <<<"$body"; then
          HEALTH_BODY="$body"
          log "health 200 + ok=true after ${attempts} attempt(s) (no node parser)"
          return 0
        fi
      fi
    fi
    sleep 2
  done

  warn "health probe timed out after ${timeout}s, ${attempts} attempt(s)"
  HEALTH_BODY="${body:-}"
  return 1
}

# Render compact health summary line for receipt/log.
summarize_health() {
  if [[ -z "${HEALTH_BODY:-}" ]]; then
    echo "{}"
    return 0
  fi
  if ! resolve_node_bin; then
    printf '%s\n' "$HEALTH_BODY"
    return 0
  fi
  printf '%s' "$HEALTH_BODY" | "$NODE_BIN" -e '
    let buf = "";
    process.stdin.on("data", c => buf += c);
    process.stdin.on("end", () => {
      try {
        const j = JSON.parse(buf);
        const out = {
          ok: j && j.ok === true,
          dbOk: !!(j && j.db && j.db.ok === true),
          connected: !!(j && j.zalo && j.zalo.connected === true),
          watchdogActive: !!(j && j.zalo && j.zalo.watchdog && j.zalo.watchdog.watchdogActive === true),
          listenerLikelyDown: !!(j && j.zalo && j.zalo.watchdog && j.zalo.watchdog.listenerLikelyDown === true),
          lastWatchedMessageAt: (j && j.zalo && j.zalo.watchdog && j.zalo.watchdog.lastWatchedMessageAt) || null,
          port: (j && j.config && j.config.webuiPort) || null
        };
        process.stdout.write(JSON.stringify(out));
      } catch (e) {
        process.stdout.write(JSON.stringify({ ok: false, error: String(e.message || e) }));
      }
    });
  ' 2>/dev/null || printf '%s' "$HEALTH_BODY"
}

# ---------- deploy receipt ----------

# Write JSON receipt to $DEPLOY_RECEIPT_ROOT/$DEPLOY_LABEL/<timestamp>-<action>.json.
# Args: $1 = action (deploy|rollback), $2 = status (ok|fail), $3 = backup_dir
write_receipt() {
  local action="$1"
  local status="$2"
  local backup_dir="${3:-}"
  if [[ "${DRYRUN:-0}" -eq 1 ]]; then
    log "(dry-run) would write ${action} receipt with status=${status}, backup=${backup_dir}"
    RECEIPT_PATH=""
    return 0
  fi
  local root="${DEPLOY_RECEIPT_ROOT:-$HOME/zalo-guardian-deploys}"
  local ts
  ts="$(date '+%Y%m%d-%H%M%S')"
  local out_dir="$root/$DEPLOY_LABEL"
  mkdir -p "$out_dir"
  local out="$out_dir/${ts}-${action}.json"
  local health_summary
  health_summary="$(summarize_health)"
  local source_commit="unknown"
  local source_branch="unknown"
  if [[ -d "${DEPLOY_SOURCE:-}/.git" ]] && command -v git >/dev/null 2>&1; then
    source_commit="$(git -C "$DEPLOY_SOURCE" rev-parse HEAD 2>/dev/null || echo unknown)"
    source_branch="$(git -C "$DEPLOY_SOURCE" rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
  fi
  local tmp="${out}.tmp.$$"
  cat > "$tmp" <<EOF
{
  "action": "$action",
  "status": "$status",
  "label": "$DEPLOY_LABEL",
  "target": "$DEPLOY_TARGET",
  "service": "$DEPLOY_SERVICE",
  "port": $DEPLOY_PORT,
  "sourcePath": "${DEPLOY_SOURCE:-}",
  "sourceCommit": "$source_commit",
  "sourceBranch": "$source_branch",
  "backupDir": "$backup_dir",
  "deployedAt": "$(date -u '+%Y-%m-%dT%H:%M:%SZ')",
  "byUser": "$(id -un)",
  "host": "$(hostname 2>/dev/null || echo unknown)",
  "dryRun": ${DRYRUN:-0},
  "health": $health_summary
}
EOF
  mv "$tmp" "$out"
  log "receipt: $out"
  RECEIPT_PATH="$out"
}

# ---------- rollback ----------

# Restore $1 (backup name under $DEPLOY_BACKUP_ROOT/$DEPLOY_LABEL/) into $DEPLOY_TARGET.
restore_backup() {
  local name="$1"
  local root="${DEPLOY_BACKUP_ROOT:-$HOME/zalo-guardian-backups}"
  local dir="${root}/${DEPLOY_LABEL}/${name}"
  [[ -d "$dir" ]] || die "backup not found: $dir"
  local archive="$dir/code.tgz"
  if [[ ! -f "$archive" ]]; then
    if [[ -f "$dir/code.empty" ]]; then
      warn "selected backup is empty marker — nothing to restore"
      return 0
    fi
    die "backup archive missing: $archive"
  fi
  if [[ "${DRYRUN:-0}" -eq 1 ]]; then
    log "(dry-run) would extract $archive into $DEPLOY_TARGET (preserving runtime artifacts)"
    tar -tzf "$archive" | head -20 | sed 's/^/  /'
    return 0
  fi
  log "extracting $archive into $DEPLOY_TARGET"
  # Extract over target. tar will overwrite code paths only since the backup
  # was scoped to code-managed paths in make_backup().
  tar -xzf "$archive" -C "$DEPLOY_TARGET"
  log "restore done from $name"
}
