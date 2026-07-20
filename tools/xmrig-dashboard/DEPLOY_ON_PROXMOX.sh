#!/bin/bash
set -e
URL="${1:-https://raw.githubusercontent.com/alexbln01-source/warenanhaenger/cursor/xmrig-dashboard-tiles-0620/tools/xmrig-dashboard/mini_dashboard.py}"
EXPECT_MD5="1fd5785d514419cc89910ef79d3dac4a"
echo "Downloading: $URL"
if command -v curl >/dev/null; then
  curl -fsSL "$URL" -o /tmp/d.py
elif command -v wget >/dev/null; then
  wget -qO /tmp/d.py "$URL"
else
  python3 -c "import urllib.request; urllib.request.urlretrieve('$URL','/tmp/d.py')"
fi
ACT=$(md5sum /tmp/d.py | awk '{print $1}')
echo "MD5=$ACT"
[ "$ACT" = "$EXPECT_MD5" ] || { echo "MD5 mismatch — Abort"; exit 1; }
pct push 107 /tmp/d.py /opt/xmrig-dashboard/mini_dashboard.py
pct exec 107 -- bash -lc 'systemctl restart xmrig-dashboard; sleep 1'
pct exec 107 -- python3 -c "import urllib.request; h=urllib.request.urlopen('http://127.0.0.1:8090/').read().decode(); print('tileSol' in h, 'viewHome' in h)"
echo "DONE → http://192.168.178.115:8090/"
