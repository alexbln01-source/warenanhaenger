#!/bin/bash
set -e
URL="${1:-https://raw.githubusercontent.com/alexbln01-source/warenanhaenger/cursor/xmrig-dashboard-tiles-0620/tools/xmrig-dashboard/mini_dashboard.py}"
echo "Downloading: $URL"
if command -v curl >/dev/null; then
  curl -fsSL "$URL" -o /tmp/d.py
elif command -v wget >/dev/null; then
  wget -qO /tmp/d.py "$URL"
else
  python3 -c "import urllib.request; urllib.request.urlretrieve('$URL','/tmp/d.py')"
fi
echo "MD5=$(md5sum /tmp/d.py | awk '{print $1}')"
# Service uses dashboard.py (not mini_dashboard.py)
pct push 107 /tmp/d.py /opt/xmrig-dashboard/dashboard.py
pct exec 107 -- systemctl restart xmrig-dashboard
sleep 2
pct exec 107 -- python3 - <<'PY'
import urllib.request, json
base="http://127.0.0.1:8090"
h=urllib.request.urlopen(base+"/").read().decode()
print("tileSol", "tileSol" in h, "homeTick", "homeTick" in h)
for path in ["/api/mining","/api/nexus","/api/solix","/api/temp"]:
    try:
        with urllib.request.urlopen(base+path, timeout=8) as r:
            raw=r.read().decode()
        print(path, "OK", raw[:120].replace("\n"," "))
    except Exception as e:
        print(path, "FAIL", e)
PY
echo "DONE → http://192.168.178.115:8090/"
