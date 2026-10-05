#!/bin/bash
# Auf dem Proxmox-HOST nach einem Hang/Hard-Reset ausführen.
# Sammelt Spuren: OOM, IO, ZFS, NVMe, Timer, Top-Prozesse, letzte Kernel-Meldungen.
set -u
OUT="${1:-/root/pve-hang-forensics-$(date +%Y%m%d-%H%M%S).txt}"
exec > >(tee "$OUT") 2>&1

echo "===== PVE HANG FORENSICS $(date -Is) ====="
echo "hostname: $(hostname)"
echo "uptime: $(uptime)"
echo "kernel: $(uname -a)"
echo

echo "===== LOAD / MEM / SWAP ====="
cat /proc/loadavg
free -h
swapon --show || true
echo

echo "===== DISK / ZFS ====="
df -hT | grep -vE 'tmpfs|udev|efivarfs' || true
echo
zpool status -v 2>/dev/null || echo "no zpool"
echo
zpool iostat -v 1 3 2>/dev/null || true
echo
zfs list -o name,used,avail,refer,compressratio,mountpoint 2>/dev/null | head -40 || true
echo

echo "===== NVMe SMART (kurz) ====="
for d in /dev/nvme*n1; do
  [ -e "$d" ] || continue
  echo "--- $d ---"
  smartctl -a "$d" 2>/dev/null | egrep -i 'Model|Serial|Temperature|Available Spare|Percentage|Data Units|Unsafe|Error|Critical|Warning|Power On' || true
done
echo

echo "===== TOP CPU ====="
ps aux --sort=-%cpu | head -25
echo

echo "===== TOP MEM ====="
ps aux --sort=-%mem | head -25
echo

echo "===== IO wait / vmstat ====="
vmstat 1 5 || true
echo

echo "===== CT / VM ====="
pct list 2>/dev/null || true
echo
qm list 2>/dev/null || true
echo

echo "===== mining-auto / xmrig remnants ====="
systemctl list-timers --all 2>/dev/null | grep -iE 'mining|xmrig|watch' || echo "(no matching timers)"
ls -la /etc/systemd/system/mining-auto* /usr/local/sbin/mining-auto.sh 2>/dev/null || echo "(no mining-auto files)"
systemctl is-enabled mining-auto.timer mining-auto.service 2>/dev/null || true
systemctl is-active mining-auto.timer mining-auto.service 2>/dev/null || true
echo
pct exec 107 -- systemctl is-active xmrig 2>/dev/null || echo "CT107 xmrig: n/a"
pct exec 107 -- pgrep -a xmrig 2>/dev/null || echo "CT107: no xmrig process"
echo

echo "===== Bitcoin CT 108 disk/mem ====="
pct exec 108 -- bash -lc 'df -h /; free -h; ps aux --sort=-%mem | head -8' 2>/dev/null || echo "CT108 n/a"
echo

echo "===== OOM / blocked tasks (journal this boot + previous) ====="
journalctl -b -k --no-pager 2>/dev/null | egrep -i 'oom|killed process|blocked for more|hung_task|soft lockup|hard LOCKUP|I/O error|EXT4-fs error|XFS|zfs|nvme|reset controller|Out of memory' | tail -80
echo "--- previous boot ---"
journalctl -b -1 -k --no-pager 2>/dev/null | egrep -i 'oom|killed process|blocked for more|hung_task|soft lockup|hard LOCKUP|I/O error|zfs|nvme|reset controller|Out of memory' | tail -80
echo

echo "===== last kernel lines previous boot ====="
journalctl -b -1 -k --no-pager 2>/dev/null | tail -100
echo

echo "===== dmesg tail ====="
dmesg -T 2>/dev/null | tail -80
echo

echo "===== DONE → $OUT ====="
ls -la "$OUT"
