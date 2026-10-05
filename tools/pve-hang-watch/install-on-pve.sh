#!/bin/bash
# Auf dem Proxmox-HOST als root ausführen.
# Installiert Forensik-Hilfe + 60s Hang-Watch (systemd timer).
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
BIN=/usr/local/sbin
UNIT=/etc/systemd/system

install -m 755 "$DIR/pve-hang-watch.sh" "$BIN/pve-hang-watch.sh"
install -m 755 "$DIR/pve-hang-forensics.sh" "$BIN/pve-hang-forensics.sh"

cat >"$UNIT/pve-hang-watch.service" <<'EOF'
[Unit]
Description=PVE hang watch sample (load/iowait/zfs)
After=network-online.target

[Service]
Type=oneshot
Nice=10
IOSchedulingClass=best-effort
IOSchedulingPriority=7
ExecStart=/usr/local/sbin/pve-hang-watch.sh
EOF

cat >"$UNIT/pve-hang-watch.timer" <<'EOF'
[Unit]
Description=Run PVE hang watch every 60s

[Timer]
OnBootSec=45s
OnUnitActiveSec=60s
AccuracySec=15s
Persistent=true
Unit=pve-hang-watch.service

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now pve-hang-watch.timer

# Sofort einmal Forensik nach Hard-Reset
echo "=== running forensics now ==="
/usr/local/sbin/pve-hang-forensics.sh || true

echo
echo "OK"
echo "  watch log : /var/log/pve-hang-watch.log"
echo "  alerts    : /var/log/pve-hang-watch.log.alert"
echo "  forensics : /usr/local/sbin/pve-hang-forensics.sh"
systemctl list-timers 'pve-hang-watch.timer' --no-pager
