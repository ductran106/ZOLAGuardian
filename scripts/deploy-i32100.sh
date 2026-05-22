#!/usr/bin/env bash
# scripts/deploy-i32100.sh — Phase 2 staging deploy for Zalo Guardian on i32100.
#
# Scope: i32100 staging only.
#   target  : /home/duc/zalo-guardian-clean
#   service : zalo-guardian-clean.service (user systemd)
#   port    : 3457
#
# ProBook production deploy is intentionally NOT implemented in Phase 2.
# See docs/DEPLOY.md for the gating rationale.
#
# Usage:
#   bash scripts/deploy-i32100.sh --confirm
#   bash scripts/deploy-i32100.sh --dry-run
#   bash scripts/deploy-i32100.sh --source /path/to/canonical/clone --confirm
#
# Behavior:
#   1. Refuses to run as root.
#   2. Requires --confirm for any mutation. --dry-run plans without touching disk.
#   3. Verifies source and target look like a Zalo Guardian repo.
#   4. Refuses if source path == target path.
#   5. Creates a timestamped backup of code-managed files in the target.
#   6. rsyncs canonical source -> target, preserving config.json, .env, data/,
#      credentials, logs, node_modules, backups/.
#   7. Writes build-info.json into target (commit/branch/deployedAt/host/byUser).
#   8. Restarts user systemd unit zalo-guardian-clean.service.
#   9. Polls /api/health/full until ok && db.ok or times out.
#  10. Writes a deploy receipt JSON under ~/zalo-guardian-deploys/i32100/.

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
deploy-i32100.sh — Phase 2 staging deploy

Usage:
  bash scripts/deploy-i32100.sh [--source <path>] [--confirm | --dry-run]

Flags:
  --source <path>   Canonical source directory to deploy from.
                    Required when running this script inside the target tree.
  --confirm         Required for any mutating action.
  --dry-run         Plan only — no mutation. Mutually safe with --confirm.
  -h, --help        Show this help.

Target (hardcoded):
  /home/duc/zalo-guardian-clean  (service: zalo-guardian-clean.service, port 3457)

Preserved on target (never overwritten or deleted):
  config.json, .env, .env.*, data/, backups/, node_modules/, *.log, run.log*,
  guardian.out, build-info.json (regenerated after sync).
EOF
}

main() {
  SHOW_HELP=0
  parse_common_args "$@"

  if [[ "${SHOW_HELP:-0}" -eq 1 ]]; then
    show_help
    exit 0
  fi

  require_not_root

  # Resolve source.
  if [[ -n "$ARG_SOURCE" ]]; then
    DEPLOY_SOURCE="$(abs_path "$ARG_SOURCE")"
  else
    DEPLOY_SOURCE="$(discover_repo_root "$SCRIPT_PATH")"
  fi

  log "label   : $DEPLOY_LABEL"
  log "source  : $DEPLOY_SOURCE"
  log "target  : $DEPLOY_TARGET"
  log "service : $DEPLOY_SERVICE"
  log "port    : $DEPLOY_PORT"
  log "dryRun  : ${DRYRUN}"
  log "confirm : ${CONFIRM}"

  # Sanity checks (read-only).
  assert_looks_like_repo "$DEPLOY_SOURCE" "source"
  assert_looks_like_repo "$DEPLOY_TARGET" "target"

  local src_abs dst_abs
  src_abs="$(abs_path "$DEPLOY_SOURCE")"
  dst_abs="$(abs_path "$DEPLOY_TARGET")"
  if [[ "$src_abs" == "$dst_abs" ]]; then
    die "source and target resolve to the same path; refusing in-place rsync: $src_abs. Run from a separate clone or pass --source /path/to/canonical/clone."
  fi

  # Show source commit so the operator can sanity-check before --confirm.
  if [[ -d "$DEPLOY_SOURCE/.git" ]] && command -v git >/dev/null 2>&1; then
    local src_commit src_branch src_dirty
    src_commit="$(git -C "$DEPLOY_SOURCE" rev-parse HEAD 2>/dev/null || echo unknown)"
    src_branch="$(git -C "$DEPLOY_SOURCE" rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
    src_dirty="$(git -C "$DEPLOY_SOURCE" status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
    log "source git: branch=$src_branch commit=$src_commit dirty_files=$src_dirty"
    if [[ "$src_dirty" != "0" ]]; then
      warn "source has $src_dirty uncommitted file(s); deploy will still include them"
    fi
  fi

  # If --dry-run is on, still proceed through the plan; --confirm not required.
  if [[ "${DRYRUN:-0}" -ne 1 ]]; then
    require_confirm
  fi

  make_backup
  sync_canonical
  write_build_info
  restart_service

  local health_status="ok"
  if ! wait_for_health; then
    health_status="fail"
    warn "health probe failed; service may still be starting. Check journalctl --user -u $DEPLOY_SERVICE"
  fi

  write_receipt "deploy" "$health_status" "${BACKUP_DIR:-}"

  if [[ "$health_status" == "ok" ]]; then
    log "deploy SUCCESS"
    log "receipt: ${RECEIPT_PATH:-}"
    log "backup : ${BACKUP_DIR:-}"
    exit 0
  else
    warn "deploy FINISHED WITH HEALTH FAILURE"
    warn "consider: bash $SCRIPT_DIR/rollback-i32100.sh --confirm"
    exit 2
  fi
}

main "$@"
