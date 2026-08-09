#!/bin/bash
# Pool + Anker/S1 Monitor — alle 5 Min nach /var/log/pool-monitor.log
# WarpPool: 192.168.178.111:18334
# Dashboard (Solix/S1): 192.168.178.115:8090

POOL_API="http://192.168.178.111:18334/api/workers"
SOLIX_API="http://192.168.178.115:8090/api/solix"
NEXUS_API="http://192.168.178.115:8090/api/nexus"
LOG="/var/log/pool-monitor.log"
INTERVAL=300

# JSON-Feld lesen (python3, sonst leer)
jget() {
  local json="$1" key="$2"
  python3 -c '
import json,sys
try:
    d=json.loads(sys.argv[1] or "{}")
except Exception:
    print(""); sys.exit(0)
keys=sys.argv[2].split(".")
cur=d
for k in keys:
    if isinstance(cur, dict) and k in cur:
        cur=cur[k]
    elif isinstance(cur, list) and k.isdigit() and int(k)<len(cur):
        cur=cur[int(k)]
    else:
        print(""); sys.exit(0)
if cur is None:
    print("")
elif isinstance(cur, bool):
    print("true" if cur else "false")
elif isinstance(cur, float):
    print(("%g" % cur) if abs(cur)>=0.01 else ("%.4f" % cur))
else:
    print(cur)
' "$json" "$key" 2>/dev/null
}

fmt_th() {
  python3 -c '
import sys
try:
    v=float(sys.argv[1])
    print("%.2f TH/s" % (v/1e12))
except Exception:
    print("?")
' "${1:-}" 2>/dev/null
}

fmt_w() {
  local v="$1"
  if [ -z "$v" ] || [ "$v" = "" ]; then echo "?"; else
    python3 -c 'print("%dW" % round(float("'"$v"'")))' 2>/dev/null || echo "${v}W"
  fi
}

fmt_pct() {
  local v="$1"
  if [ -z "$v" ]; then echo "?"; else
    python3 -c 'print("%d%%" % round(float("'"$v"'")))' 2>/dev/null || echo "${v}%"
  fi
}

touch "$LOG" 2>/dev/null || true

while true; do
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

  WORKERS=$(curl -sS --max-time 8 "$POOL_API" 2>/dev/null || echo "{}")
  SOLIX=$(curl -sS --max-time 10 "$SOLIX_API" 2>/dev/null || echo "{}")
  NEXUS=$(curl -sS --max-time 8 "$NEXUS_API" 2>/dev/null || echo "{}")

  # --- WarpPool Worker (erstes Element / Top-Level) ---
  DIFF=$(jget "$WORKERS" "0.current_diff")
  [ -z "$DIFF" ] && DIFF=$(jget "$WORKERS" "current_diff")
  HASH_RAW=$(jget "$WORKERS" "0.current_hashrate_hps")
  [ -z "$HASH_RAW" ] && HASH_RAW=$(jget "$WORKERS" "current_hashrate_hps")
  HASH=$(fmt_th "$HASH_RAW")
  SHARES=$(jget "$WORKERS" "0.current_shares_per_min")
  [ -z "$SHARES" ] && SHARES=$(jget "$WORKERS" "current_shares_per_min")
  ACCEPTED=$(jget "$WORKERS" "0.shares_accepted")
  [ -z "$ACCEPTED" ] && ACCEPTED=$(jget "$WORKERS" "shares_accepted")
  REJECTED=$(jget "$WORKERS" "0.shares_rejected")
  [ -z "$REJECTED" ] && REJECTED=$(jget "$WORKERS" "shares_rejected")

  # --- Anker Solix (Dashboard) ---
  PV=$(jget "$SOLIX" "pv")
  SOC=$(jget "$SOLIX" "soc")
  HAUS=$(jget "$SOLIX" "load_w")
  BEZUG=$(jget "$SOLIX" "import_w")
  LADEN=$(jget "$SOLIX" "charge_w")
  UEBER=$(jget "$SOLIX" "surplus_w")
  SOLL=$(jget "$SOLIX" "miners_running")
  case "$SOLL" in
    true|1) SOLL_TXT="AN" ;;
    false|0) SOLL_TXT="AUS" ;;
    *) SOLL_TXT="${SOLL:-?}" ;;
  esac

  # --- Nexus S1 (Dashboard proxied /api/system/info) ---
  S1_W=$(jget "$NEXUS" "power")
  [ -z "$S1_W" ] && S1_W=$(jget "$NEXUS" "power_consumption")
  S1_T=$(jget "$NEXUS" "temp")
  [ -z "$S1_T" ] && S1_T=$(jget "$NEXUS" "temperature")
  S1_HR=$(jget "$NEXUS" "hashRate")
  [ -z "$S1_HR" ] && S1_HR=$(jget "$NEXUS" "hashrate")
  S1_STATE=$(jget "$SOLIX" "s1_power.state")
  [ -z "$S1_STATE" ] && S1_STATE=$(jget "$NEXUS" "s1_power.state")
  if [ -n "$S1_HR" ]; then
    S1_HR_TXT=$(python3 -c 'print("%.1fTH" % (float("'"$S1_HR"'")/1e12))' 2>/dev/null || echo "")
  else
    S1_HR_TXT=""
  fi

  {
    echo -n "$TIMESTAMP | Diff: ${DIFF:-?} | Hash: ${HASH:-?} | Shares/min: ${SHARES:-?} | Acc: ${ACCEPTED:-?} | Rej: ${REJECTED:-?}"
    echo -n " | S1: ${S1_STATE:-?} ${S1_HR_TXT:-?} ${S1_W:-?}W ${S1_T:-?}°C Soll:$SOLL_TXT"
    echo -n " | PV: $(fmt_w "$PV") | SOC: $(fmt_pct "$SOC") | Haus: $(fmt_w "$HAUS")"
    echo -n " | Bezug: $(fmt_w "$BEZUG") | Laden: $(fmt_w "$LADEN") | Über: $(fmt_w "$UEBER")"
    echo
  } >> "$LOG"

  sleep "$INTERVAL"
done
