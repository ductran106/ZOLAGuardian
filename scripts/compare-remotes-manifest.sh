#!/usr/bin/env bash
# In repo root: outputs sorted "sha256  path" for all git-tracked files
set -euo pipefail
ROOT="${1:?usage: compare-remotes-manifest.sh /path/to/repo}"
cd "$ROOT"
git ls-files -z | xargs -0 sha256sum 2>/dev/null | sort -k2
