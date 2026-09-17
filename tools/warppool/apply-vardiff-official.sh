#!/bin/bash
# Offizielle WarpPool-VarDiff auf Bitcoin-CT setzen (als root).
set -euo pipefail
CFG="${1:-/root/.warppool/config/config.toml}"
test -f "$CFG" || { echo "fehlt: $CFG"; exit 1; }

cp -a "$CFG" "${CFG}.bak-official-$(date +%Y%m%d-%H%M%S)"

# Kern-Defaults laut WarpPool-Doku (30→15, 16→8, 8→4, 0.30→0.20)
sed -i \
  -e 's/^target_seconds_per_share *=.*/target_seconds_per_share = 15.0/' \
  -e 's/^window *=.*/window = 8/' \
  -e 's/^retarget_after_n_shares *=.*/retarget_after_n_shares = 4/' \
  -e 's/^hysteresis *=.*/hysteresis = 0.2/' \
  "$CFG"

echo "=== [vardiff] ==="
grep -A 20 '^\[vardiff\]' "$CFG"

if docker ps --format '{{.Names}}' | grep -qx warppool; then
  docker restart warppool
  sleep 8
  docker ps | grep warppool
else
  echo "Container 'warppool' nicht gefunden — manuell neu starten."
fi

echo "Fertig. Nach ~1 Min current_diff / Shares prüfen:"
echo "  curl -s http://127.0.0.1:18334/api/workers | tr ',' '\\n' | grep -E 'current_diff|shares_per_min|hashrate'"
