#!/bin/bash
# Leichtes Dauer-Log auf dem Proxmox-HOST.
# Ziel: vor dem nächsten Hang eine Spur hinterlassen (Load, iowait, ZFS, Top-Procs).
# Log: /var/log/pve-hang-watch.log  (rotiert bei ~5 MB)
set -u
LOG="${PVE_HANG_LOG:-/var/log/pve-hang-watch.log}"
STATE="${PVE_HANG_STATE:-/run/pve-hang-watch.state}"
MAX_BYTES="${PVE_HANG_MAX:-5000000}"

ts="$(date '+%Y-%m-%d %H:%M:%S %Z')"
load="$(cat /proc/loadavg 2>/dev/null || echo '?')"
mem="$(free -m | awk '/^Mem:/{printf "mem_used=%sMB avail=%sMB total=%sMB",$3,$7,$2}')"
swap="$(free -m | awk '/^Swap:/{printf "swap=%s/%sMB",$3,$2}')"

# delta iowait % since last sample
cpu_line="$(awk '/^cpu /{print $2,$3,$4,$5,$6,$7,$8}' /proc/stat)"
set -- $cpu_line
u=$1; n=$2; s=$3; idle=$4; iow=$5; irq=$6; sirq=$7
total=$((u + n + s + idle + iow + irq + sirq))
iow_pct="?"
if [ -f "$STATE" ]; then
  read -r p_idle p_iow p_total <"$STATE" || true
  dt=$((total - ${p_total:-0}))
  di=$((iow - ${p_iow:-0}))
  if [ "$dt" -gt 0 ] 2>/dev/null; then
    iow_pct="$(awk -v di="$di" -v dt="$dt" 'BEGIN{printf "%.1f", 100*di/dt}')"
  fi
fi
echo "$idle $iow $total" >"$STATE"

zfs=""
if command -v zpool >/dev/null 2>&1; then
  zfs="$(zpool list -H -o name,health,alloc,free,cap 2>/dev/null | tr '\t' ' ' | tr '\n' ';' | sed 's/;$//')"
fi

nvme_t=""
for d in /sys/class/nvme/nvme*; do
  [ -d "$d" ] || continue
  tfile="$(find "$d" -name 'temp*_input' 2>/dev/null | head -1)"
  if [ -n "$tfile" ] && [ -r "$tfile" ]; then
    raw="$(cat "$tfile" 2>/dev/null || echo 0)"
    nvme_t="${nvme_t}$(basename "$d")=$((raw / 1000))C "
  fi
done

topc="$(ps -eo pcpu,pmem,comm --sort=-pcpu 2>/dev/null | awk 'NR>1 && NR<=4 {printf "%s(%s%%/%s%%) ",$3,$1,$2}')"

ct108=""
if command -v pct >/dev/null 2>&1; then
  st108="$(pct status 108 2>/dev/null | awk '{print $2}')"
  ct108="ct108=${st108:-absent}"
fi

if systemctl is-active --quiet mining-auto.timer 2>/dev/null || systemctl is-active --quiet mining-auto.service 2>/dev/null; then
  mining="WARN_mining-auto=ACTIVE"
else
  mining="mining-auto=off"
fi

line="$ts | load=$load | $mem | $swap | iowait=${iow_pct}% | zfs=[$zfs] | ${nvme_t}| $ct108 | $mining | top=[$topc]"
echo "$line" >>"$LOG" 2>/dev/null || true

load1="$(echo "$load" | awk '{print $1}')"
if awk -v l="$load1" -v i="${iow_pct:-0}" 'BEGIN{exit !((l+0)>=16 || (i+0)>=35)}'; then
  echo "$ts | ALERT | load1=$load1 iowait=${iow_pct}% | $line" >>"${LOG}.alert" 2>/dev/null || true
fi

if [ -f "$LOG" ]; then
  sz="$(wc -c <"$LOG" 2>/dev/null || echo 0)"
  if [ "$sz" -gt "$MAX_BYTES" ]; then
    mv -f "$LOG" "${LOG}.1" 2>/dev/null || true
  fi
fi
