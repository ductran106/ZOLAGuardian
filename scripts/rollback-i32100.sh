#!/usr/bin/env bash
# scripts/rollback-i32100.sh — Phase 2 staging rollback for Zalo Guardian on i32100.
#
# Scope: i32100 staging only.
#   target  : /home/duc/zalo-guardian-clean
#   service : zalo-guardian-clean.service (user systemd)
#   port    : 3457
#
# Usage:
#   bash scripts/rollback-i32100.sh --list
#   bash scripts/rollback-i32100.sh --confirm                  # most recent backup
#   bash scripts/rollback-i32100.sh --to 20260523-045509 --confirm
#   bash scripts/rollback-i32100.sh --to 20260523-045509 --dry-run
#
# Behavior:
#   1. Refuses to run as root.
#   2. --list prints available backups and exits.
#   3. Requires --confirm to mutate. --dry-run prints plan only.
#   4. Picks the most recent backup if --to is omitted.
#   5. Extracts code.tgz from the chosen backup directly into the target,
#      overwriting only code-managed files (config.json/.env/data/credentials
#      are not in the archive and remain untouched).
#   6. Restarts user systemd unit, then probes /api/health/full.
#   7. Writes a rollback receipt JSON under ~/zalo-guardian-deploys/i32100/.

set -euo pipefail

SCRIPT_PATH="${BASH_SOURCE[0]}"
SCRIPT_DIR="$(cd "$(dirname -- "$SCRIPT_PATH")" && pwd)"
# shellcheck source=lib/deploy-common.sh
source "$SCRIPT_DIR/lib/deploy-common.sh"

DEPLOY_LABEL="i32100"
DEPLOY_TARGET="/home/duc/zalo-guardian-clean"
DEPLOY_SERVICE="zalo-guardian-clean.service"
DEPLOY_PORT=3457
DEPLOY_HEALTH_TIMEOUT="${DEPLOY_HEALTH_TIMEOUT:-90}"

show_help() {
  cat <<'EOF'
rollback-i32100.sh — Phase 2 staging rollback

Usage:
  bash scripts/rollback-i32100.sh --list
  bash scripts/rollback-i32100.sh [--to <backup>] [--confirm | --dry-run]

Flags:
  --list           Print available backups for i32100 and exit (no mutation).
  --to <backup>    Backup directory name to restore (e.g. 20260523-045509).
                   Default: most recent backup under
                   ~/zalo-guardian-backups/i32100/
  --confirm        Required for any mutating action.
  --dry-run        Plan only — no mutation.
  -h, --help       Show this help.
EOF
}

print_backup_list() {
  log "available backups for $DEPLOY_LABEL (newest first):"
  local count=0
  while IFS= read -r name; do
    [[ -z "$name" ]] && continue
    count=$((count + 1))
    local root="${DEPLOY_BACKUP_ROOT:-$HOME/zalo-guardian-backups}"
    local p="$root/$DEPLOY_LABEL/$name"
    local size="?"
    if [[ -f "$p/code.tgz" ]]; then
      size="$(du -h "$p/code.tgz" 2>/dev/null | awk '{print $1}')"
    elif [[ -f "$p/code.empty" ]]; then
      size="empty"
    fi
    printf '  %s  (%s)\n' "$name" "$size"
  done < <(list_backups)
  if [[ "$count" -eq 0 ]]; then
    log "(no backups found)"
  fi
}

main() {
  SHOW_HELP=0
  # Strip --list before passing to common arg parser (it doesn't know that flag).
  local args=()
  local list_only=0
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --list) list_only=1; shift ;;
      *) args+=("$1"); shift ;;
    esac
  done
  if [[ ${#args[@]} -gt 0 ]]; then
    parse_common_args "${args[@]}"
  else
    parse_common_args
  fi

  if [[ "${SHOW_HELP:-0}" -eq 1 ]]; then
    show_help
    exit 0
  fi

  require_not_root

  if [[ "$list_only" -eq 1 ]]; then
    print_backup_list
    exit 0
  fi

  assert_looks_like_repo "$DEPLOY_TARGET" "target"

  # Pick backup.
  local pick="$ARG_TO"
  if [[ -z "$pick" ]]; then
    pick="$(list_backups | head -1 || true)"
    [[ -n "$pick" ]] || die "no backups available under ${DEPLOY_BACKUP_ROOT:-$HOME/zalo-guardian-backups}/$DEPLOY_LABEL/"
    log "selected most recent backup: $pick"
  else
    log "selected backup: $pick"
  fi

  local root="${DEPLOY_BACKUP_ROOT:-$HOME/zalo-guardian-backups}"
  local chosen_dir="$root/$DEPLOY_LABEL/$pick"
  [[ -d "$chosen_dir" ]] || die "backup not found: $chosen_dir"

  # Show what's in the chosen backup.
  if [[ -f "$chosen_dir/manifest.env" ]]; then
    log "backup manifest:"
    sed 's/^/  /' "$chosen_dir/manifest.env"
  fi

  if [[ "${DRYRUN:-0}" -ne 1 ]]; then
    require_confirm
  fi

  # Safety net: take a "pre-rollback" backup of current target state so we can
  # undo the rollback if it makes things worse.
  log "creating pre-rollback safety backup of current target state"
  make_backup
  local safety_backup="${BACKUP_DIR:-}"

  restore_backup "$pick"
  restart_service

  local health_status="ok"
  if ! wait_for_health; then
    health_status="fail"
    warn "post-rollback health probe failed; check journalctl --user -u $DEPLOY_SERVICE"
  fi

  write_receipt "rollback" "$health_status" "$chosen_dir"

  if [[ "$health_status" == "ok" ]]; then
    log "rollback SUCCESS (restored from $pick)"
    log "safety pre-rollback backup: $safety_backup"
    log "receipt: ${RECEIPT_PATH:-}"
    exit 0
  else
    warn "rollback FINISHED WITH HEALTH FAILURE"
    warn "safety pre-rollback backup is: $safety_backup"
    exit 2
  fi
}

main "$@"
