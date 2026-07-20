#!/bin/bash
set -e
SHA="ea2d229e7a9f75301c8a09d1765bb5154c40e1fc"
EXPECT_MD5="e48f37ba31b307dad40dd09e41cce590"
URL="https://raw.githubusercontent.com/alexbln01-source/warenanhaenger/${SHA}/tools/xmrig-dashboard/mini_dashboard.py"
echo "Downloading: $URL"
curl -fsSL "$URL" -o /tmp/d.py
ACT=$(md5sum /tmp/d.py | awk '{print $1}')
echo "MD5=$ACT"
[ "$ACT" = "$EXPECT_MD5" ] || { echo "MD5 mismatch"; exit 1; }
pct push 107 /tmp/d.py /opt/xmrig-dashboard/dashboard.py
pct exec 107 -- systemctl restart xmrig-dashboard
sleep 2
pct exec 107 -- python3 - <<'PY'
import urllib.request, json
base="http://127.0.0.1:8090"
h=urllib.request.urlopen(base+"/").read().decode()
print("homeTick", "homeTick" in h)
for path in ["/api/nexus","/api/solix"]:
    try:
        with urllib.request.urlopen(base+path, timeout=10) as r:
            d=json.loads(r.read().decode())
        if path.endswith("nexus"):
            print("nexus hashRate", d.get("hashRate"), "power", d.get("power"), "err", d.get("error"))
        else:
            print("solix soc", d.get("soc"), "err", d.get("error"), "iob", d.get("iobroker"))
    except Exception as e:
        print(path, "FAIL", e)
PY
echo "DONE → http://192.168.178.115:8090/"
