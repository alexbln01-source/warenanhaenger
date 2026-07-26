#!/bin/bash
# Auf dem Proxmox-Host per SSH ausführen (nicht in die Web-Konsole pasten).
set -e
SHA="${1:-}"
if [ -z "$SHA" ]; then
  echo "Usage: $0 <git-sha>"
  echo "Example: $0 $(git rev-parse HEAD 2>/dev/null || echo HEAD)"
  exit 1
fi
URL="https://raw.githubusercontent.com/alexbln01-source/warenanhaenger/${SHA}/tools/xmrig-dashboard/mini_dashboard.py"
echo "Downloading: $URL"
curl -fsSL "$URL" -o /tmp/d.py
md5sum /tmp/d.py
pct push 107 /tmp/d.py /opt/xmrig-dashboard/dashboard.py

# RPC-Secrets nur lokal auf CT 107 (nicht im Git)
pct exec 107 -- bash -lc '
if [ ! -f /opt/xmrig-dashboard/bitcoin.rpc ]; then
  cat > /opt/xmrig-dashboard/bitcoin.rpc <<EOF
url=http://192.168.178.111:8332
user=bitcoinrpc
password=CHANGE_ME
EOF
  chmod 600 /opt/xmrig-dashboard/bitcoin.rpc
  echo "CREATED /opt/xmrig-dashboard/bitcoin.rpc — Passwort setzen!"
else
  echo "bitcoin.rpc vorhanden"
fi
'

pct exec 107 -- systemctl restart xmrig-dashboard
sleep 2
pct exec 107 -- python3 - <<'PY'
import urllib.request, json
base="http://127.0.0.1:8090"
h=urllib.request.urlopen(base+"/").read().decode()
print("tileNode", "tileNode" in h, "viewNode", "viewNode" in h)
for path in ["/api/nexus","/api/bitcoin","/api/solix"]:
    try:
        with urllib.request.urlopen(base+path, timeout=10) as r:
            d=json.loads(r.read().decode())
        if path.endswith("nexus"):
            print("nexus hashRate", d.get("hashRate"), "pool", d.get("stratumURL"), "err", d.get("error"))
        elif path.endswith("bitcoin"):
            print("bitcoin progress", d.get("progress"), "synced", d.get("synced"), "blocks", d.get("blocks"), "err", d.get("error"))
        else:
            print("solix soc", d.get("soc"), "err", d.get("error"))
    except Exception as e:
        print(path, "FAIL", e)
PY
echo "DONE → http://192.168.178.115:8090/"
