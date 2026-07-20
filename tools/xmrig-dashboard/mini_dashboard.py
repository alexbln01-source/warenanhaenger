#!/usr/bin/env python3
"""Miner-Dashboard :8090 — XMRig + Nexus S1 + Anker Solix"""
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
from pathlib import Path
import json, time, subprocess, os

XMRIG = "http://127.0.0.1:8080/2/summary"
NEXUS = "http://192.168.178.116"
PORT = 8090
SERVICE = "xmrig"
PAUSE = Path("/opt/xmrig-dashboard/PAUSE")
IOB_FILE = Path("/opt/xmrig-dashboard/iobroker.url")
SITE = "ankersolix2.0.a278fac0-df28-4f92-846d-76e77de23b26"
W = "47A5TsFqALUKVpJDJzsA277ZgqxkQhra9NVmh3H1Y5zUJcvJPDki45gCX7pb26XxBzKggKZGTknaQS33rdYp3byj48EZbTm"
POOL = f"https://supportxmr.com/api/miner/{W}/stats"
THR, ATOM = 0.1, 1_000_000_000_000
cache = {"t": 0.0, "d": None}


def iobroker_base():
    if IOB_FILE.exists():
        u = IOB_FILE.read_text().strip()
        if u:
            return u.rstrip("/")
    return os.environ.get("IOBROKER", "http://192.168.178.101:8082").rstrip("/")


def temp():
    best = None
    p = Path("/sys/class/thermal")
    if p.is_dir():
        for z in sorted(p.glob("thermal_zone*")):
            try:
                typ = (z / "type").read_text().strip()
                raw = int((z / "temp").read_text().strip())
                c = raw / 1000 if raw > 1000 else float(raw)
                if best is None or "pkg" in typ.lower() or typ in ("x86_pkg_temp", "TCPU"):
                    best = {"celsius": round(c, 1), "source": typ}
            except (OSError, ValueError):
                pass
    return best


def pool():
    now = time.time()
    if cache["d"] and now - cache["t"] < 30:
        return cache["d"]
    req = Request(POOL, headers={"User-Agent": "xmrig-dash/solix"})
    with urlopen(req, timeout=8) as r:
        raw = json.loads(r.read().decode())
    due = float(raw.get("amtDue") or 0) / ATOM
    paid = float(raw.get("amtPaid") or 0) / ATOM
    hs = raw.get("hash") or 0
    daily = (hs / 5.6e9) * 720 * 0.6 if hs else None
    eta = ((THR - due) / daily) if daily and daily > 0 else None
    d = {
        "pending_xmr": due, "paid_xmr": paid,
        "pool_hashrate": hs, "threshold_xmr": THR,
        "progress_pct": round(min(100.0, due / THR * 100), 4),
        "eta_days": eta,
    }
    cache["t"], cache["d"] = now, d
    return d


def mining_status():
    try:
        r = subprocess.run(
            ["systemctl", "is-active", SERVICE],
            capture_output=True, text=True, timeout=5,
        )
        state = r.stdout.strip()
        return {"active": state == "active", "state": state or "unknown", "paused": PAUSE.exists()}
    except (subprocess.TimeoutExpired, OSError) as ex:
        return {"active": False, "state": "error", "paused": PAUSE.exists(), "error": str(ex)}


def mining_control(action):
    if action not in ("start", "stop"):
        return False, "Ungültige Aktion"
    try:
        if action == "stop":
            PAUSE.parent.mkdir(parents=True, exist_ok=True)
            PAUSE.write_text("1\n")
        else:
            if PAUSE.exists():
                PAUSE.unlink()
        r = subprocess.run(
            ["systemctl", action, SERVICE],
            capture_output=True, text=True, timeout=30,
        )
        msg = (r.stderr or r.stdout or "").strip()
        return r.returncode == 0, msg or ("ok" if r.returncode == 0 else "fehlgeschlagen")
    except (subprocess.TimeoutExpired, OSError) as ex:
        return False, str(ex)


def nexus_info():
    req = Request(NEXUS + "/api/system/info", headers={"User-Agent": "xmrig-dash/solix"})
    with urlopen(req, timeout=5) as r:
        return json.loads(r.read().decode())


def nexus_control(action):
    if action not in ("shutdown", "restart"):
        return False, "Ungültige Aktion"
    path = "/api/system/shutdown" if action == "shutdown" else "/api/system/restart"
    req = Request(NEXUS + path, data=b"", method="POST", headers={"User-Agent": "xmrig-dash/solix"})
    try:
        with urlopen(req, timeout=15) as r:
            return True, r.read().decode() or "ok"
    except HTTPError as ex:
        return False, f"HTTP {ex.code}"
    except URLError as ex:
        return False, str(ex.reason)


def iob_val(state_id):
    base = iobroker_base()
    # prefer plain value (simple), fallback JSON get
    try:
        req = Request(f"{base}/getPlainValue/{state_id}", headers={"User-Agent": "xmrig-dash/solix"})
        with urlopen(req, timeout=4) as r:
            raw = r.read().decode().strip().strip('"')
            if raw == "" or raw.lower() == "null":
                return None
            if raw.lower() in ("true", "false"):
                return raw.lower() == "true"
            try:
                if "." in raw:
                    return float(raw)
                return int(raw)
            except ValueError:
                return raw
    except Exception:
        pass
    req = Request(f"{base}/get/{state_id}", headers={"User-Agent": "xmrig-dash/solix"})
    with urlopen(req, timeout=4) as r:
        obj = json.loads(r.read().decode())
    return obj.get("val")


def solix_info():
    ids = {
        "soc": f"{SITE}.solarbank_info.total_battery_power",
        "pv": f"{SITE}.solarbank_info.total_photovoltaic_power",
        "import_w": f"{SITE}.grid_info.grid_to_home_power",
        "export_w": f"{SITE}.grid_info.photovoltaic_to_grid_power",
        "load_w": f"{SITE}.home_load_power",
        "charge_w": f"{SITE}.solarbank_info.total_charging_power",
        "output_w": f"{SITE}.solarbank_info.total_output_power",
        "miners_enabled": "0_userdata.0.solar_miners.enabled",
        "miners_running": "0_userdata.0.solar_miners.running",
        "miners_last": "0_userdata.0.solar_miners.last_action",
        "miners_reason": "0_userdata.0.solar_miners.reason",
    }
    out = {"iobroker": iobroker_base(), "site": "Kraftwerk"}
    for k, sid in ids.items():
        try:
            out[k] = iob_val(sid)
        except Exception as ex:
            out[k] = None
            out.setdefault("errors", {})[k] = str(ex)
    return out


HTML = r"""<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0a0f0c">
<title>Miner</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700;800&family=Sora:wght@500;600;700&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#0a0f0c; --bg2:#101815; --ink:#e7f2ea; --mute:#7f9688; --line:#1e2c24;
  --xmr:#3dff9a; --xmr-dim:rgba(61,255,154,.14);
  --btc:#f0c24b; --btc-dim:rgba(240,194,75,.12);
  --sol:#5ec8ff; --sol-dim:rgba(94,200,255,.12);
  --stop:#ff5a5a; --warn:#f0c24b;
}
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
html,body{height:100%;overflow:hidden;background:var(--bg);color:var(--ink);
  font:600 13px/1.25 Sora,system-ui,sans-serif}
body{
  background:
    radial-gradient(80% 50% at 50% -8%,rgba(61,255,154,.08),transparent 55%),
    linear-gradient(180deg,#0d1611 0%,var(--bg) 45%,#070b09 100%);
}
.app{
  width:min(430px,100%);
  height:100dvh;
  margin:0 auto;
  display:grid;
  grid-template-rows:auto 1fr auto;
  padding:0 0 env(safe-area-inset-bottom);
}
.top{
  display:flex;align-items:center;gap:10px;
  padding:calc(10px + env(safe-area-inset-top)) 14px 10px;
}
.back{
  display:none;border:1px solid var(--line);background:var(--bg2);color:var(--ink);
  font:700 11px Sora,sans-serif;padding:8px 10px;min-height:36px;cursor:pointer;
}
.brand{font:700 10px/1 JetBrains Mono,monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--mute)}
.brand b{color:var(--ink)}
.main{min-height:0;overflow:auto;-webkit-overflow-scrolling:touch;padding:0 14px 12px}
.view{display:none}.view.show{display:block}
.tiles{display:grid;gap:10px;padding:4px 0 8px}
.tile{
  width:100%;text-align:left;border:1px solid var(--line);background:var(--bg2);
  padding:14px 14px 13px;cursor:pointer;min-height:108px;
  transition:border-color .15s,transform .1s;
}
.tile:active{transform:scale(.985)}
.tile-xmr{border-left:3px solid var(--xmr)}
.tile-btc{border-left:3px solid var(--btc)}
.tile-sol{border-left:3px solid var(--sol)}
.tile-top{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px}
.tile-name{font:700 11px/1 Sora,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--mute)}
.tile-val{
  font:800 clamp(2rem,9vw,2.6rem)/.95 JetBrains Mono,monospace;letter-spacing:-.04em;
}
.tile-val.xmr{color:var(--xmr)}.tile-val.btc{color:var(--btc)}.tile-val.sol{color:var(--sol)}
.tile-val small{font-size:.38em;margin-left:.2rem;color:var(--mute);font-weight:700}
.tile-sub{margin-top:6px;color:var(--mute);font:500 12px JetBrains Mono,monospace}
.hero{margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--line)}
.row{display:flex;justify-content:space-between;align-items:center;gap:.5rem}
.pill{
  font:700 10px/1 JetBrains Mono,monospace;letter-spacing:.1em;text-transform:uppercase;
  padding:.35rem .55rem;border:1px solid var(--line);color:var(--mute);
}
.pill.on{color:var(--xmr);border-color:rgba(61,255,154,.45);background:var(--xmr-dim)}
.pill.off{color:var(--stop);border-color:rgba(255,90,90,.4);background:rgba(255,90,90,.12)}
.pill.btc{color:var(--btc);border-color:rgba(240,194,75,.45);background:var(--btc-dim)}
.pill.sol{color:var(--sol);border-color:rgba(94,200,255,.45);background:var(--sol-dim)}
.hash{
  margin-top:10px;
  font:800 clamp(2.4rem,10vw,3.1rem)/.95 JetBrains Mono,monospace;
  letter-spacing:-.04em;
}
.hash.xmr{color:var(--xmr)}.hash.btc{color:var(--btc)}.hash.sol{color:var(--sol)}
.hash small{font-size:.34em;margin-left:.25rem;color:var(--mute);font-weight:700}
.sub{margin-top:6px;color:var(--mute);font:500 12px JetBrains Mono,monospace}
.grid{
  display:grid;grid-template-columns:repeat(3,1fr);
  border:1px solid var(--line);background:var(--bg2);margin-bottom:12px;
}
.cell{padding:11px 10px;border-right:1px solid var(--line);border-bottom:1px solid var(--line)}
.cell:nth-child(3n){border-right:0}
.k{font:700 9px/1 Sora,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);margin-bottom:5px}
.v{font:700 1.02rem/1.1 JetBrains Mono,monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.v.ok{color:var(--xmr)}.v.warn{color:var(--warn)}.v.bad{color:var(--stop)}.v.sol{color:var(--sol)}
.box{background:var(--bg2);border:1px solid var(--line);padding:12px;margin-bottom:12px}
.nums{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px}
.nums b{display:block;font:700 1.05rem/1.15 JetBrains Mono,monospace;margin-top:4px}
.track{height:10px;background:#152019;border:1px solid var(--line);overflow:hidden;margin-top:10px}
.track i{display:block;height:100%;width:0;background:linear-gradient(90deg,#1fa861,var(--xmr));transition:width .35s}
.track.sol i{background:linear-gradient(90deg,#2a7fad,var(--sol))}
.meta{margin-top:8px;color:var(--mute);font:500 12px JetBrains Mono,monospace;display:flex;justify-content:space-between;gap:8px}
.wallet{display:flex;align-items:center;justify-content:space-between;gap:10px}
.wallet code{font:600 12px JetBrains Mono,monospace}
.copy{
  border:1px solid var(--line);background:#152019;color:var(--ink);
  font:700 11px Sora,sans-serif;padding:8px 10px;min-height:34px;cursor:pointer;
}
.reason{margin-top:8px;font:500 12px/1.35 JetBrains Mono,monospace;color:var(--ink);word-break:break-word}
.foot{padding:10px 14px 12px;border-top:1px solid var(--line);background:rgba(0,0,0,.28)}
.actions{display:grid;gap:8px}
.actions.two{grid-template-columns:1fr 1fr}
button.act{width:100%;min-height:48px;border:0;cursor:pointer;font:700 14px/1 Sora,sans-serif}
button.act:disabled{opacity:.4}
button.go-xmr{background:var(--xmr);color:#04140c}
button.stop-xmr{background:var(--stop);color:#190606}
button.go-btc{background:var(--btc);color:#1a1404}
button.stop-btc{background:var(--stop);color:#190606}
#err{color:var(--stop);font-size:11px;min-height:14px;text-align:center;margin-top:6px}
.tick{text-align:center;font:500 10px JetBrains Mono,monospace;color:var(--mute);margin-top:4px}
</style>
</head>
<body>
<div class="app">
  <div class="top">
    <button class="back" id="backBtn" type="button">← Zurück</button>
    <div class="brand" id="brandTitle"><b>MINER</b> · Home</div>
  </div>

  <div class="main">
    <section class="view show" id="viewHome">
      <div class="tiles">
        <button class="tile tile-xmr" id="tileXmr" type="button">
          <div class="tile-top"><span class="tile-name">XMRig</span><span class="pill" id="tXPill">—</span></div>
          <div class="tile-val xmr" id="tXH">—<small>H/s</small></div>
          <div class="tile-sub" id="tXSub">Monero · CT 107</div>
        </button>
        <button class="tile tile-btc" id="tileBtc" type="button">
          <div class="tile-top"><span class="tile-name">Nexus S1</span><span class="pill" id="tNPill">—</span></div>
          <div class="tile-val btc" id="tNH">—<small>TH/s</small></div>
          <div class="tile-sub" id="tNSub">Bitcoin · Braiins</div>
        </button>
        <button class="tile tile-sol" id="tileSol" type="button">
          <div class="tile-top"><span class="tile-name">Solix Solar</span><span class="pill" id="tSPill">—</span></div>
          <div class="tile-val sol" id="tSSoc">—<small>%</small></div>
          <div class="tile-sub" id="tSSub">Kraftwerk · PV — · Bezug —</div>
        </button>
      </div>
    </section>

    <section class="view" id="viewXmr">
      <div class="hero">
        <div class="row">
          <div class="sub" id="xSub">CT 107</div>
          <div class="pill" id="xPill">—</div>
        </div>
        <div class="hash xmr" id="xH">—<small>H/s</small></div>
        <div class="sub" id="xHm">—</div>
      </div>
      <div class="grid">
        <div class="cell"><div class="k">Temp</div><div class="v" id="temp">—</div></div>
        <div class="cell"><div class="k">Accepted</div><div class="v" id="acc">—</div></div>
        <div class="cell"><div class="k">Rejected</div><div class="v" id="rej">—</div></div>
        <div class="cell"><div class="k">Uptime</div><div class="v" id="up">—</div></div>
        <div class="cell"><div class="k">Hashes</div><div class="v" id="hashes">—</div></div>
        <div class="cell"><div class="k">Ping</div><div class="v" id="ping">—</div></div>
      </div>
      <div class="box">
        <div class="k">SupportXMR</div>
        <div class="nums">
          <div><span class="k">Pending</span><b id="pend">—</b></div>
          <div><span class="k">Paid</span><b id="paid">—</b></div>
        </div>
        <div class="track"><i id="bar"></i></div>
        <div class="meta"><span id="prog">—</span><span id="eta">—</span></div>
      </div>
      <div class="box wallet">
        <div><div class="k">Wallet</div><code>47A5Ts…48EZbTm</code></div>
        <button class="copy" id="copyBtn" type="button">Copy</button>
      </div>
    </section>

    <section class="view" id="viewBtc">
      <div class="hero">
        <div class="row">
          <div class="sub" id="nSub">192.168.178.116</div>
          <div class="pill" id="nPill">—</div>
        </div>
        <div class="hash btc" id="nH">—<small>TH/s</small></div>
        <div class="sub" id="nHm">—</div>
      </div>
      <div class="grid">
        <div class="cell"><div class="k">Power</div><div class="v" id="npw">—</div></div>
        <div class="cell"><div class="k">Temp</div><div class="v" id="nt">—</div></div>
        <div class="cell"><div class="k">Fan</div><div class="v" id="nf">—</div></div>
        <div class="cell"><div class="k">Pool</div><div class="v" id="npool">—</div></div>
        <div class="cell"><div class="k">Accepted</div><div class="v" id="nacc">—</div></div>
        <div class="cell"><div class="k">FW</div><div class="v" id="nfw">—</div></div>
      </div>
      <div class="box">
        <div class="k">Braiins</div>
        <div class="sub" id="npoolurl" style="margin-top:8px">—</div>
        <div class="sub" id="nuser" style="margin-top:4px">—</div>
      </div>
    </section>

    <section class="view" id="viewSol">
      <div class="hero">
        <div class="row">
          <div class="sub">Kraftwerk</div>
          <div class="pill" id="sPill">—</div>
        </div>
        <div class="hash sol" id="sSoc">—<small>%</small></div>
        <div class="sub" id="sHm">Akku SOC</div>
      </div>
      <div class="grid">
        <div class="cell"><div class="k">PV</div><div class="v sol" id="sPv">—</div></div>
        <div class="cell"><div class="k">Last</div><div class="v" id="sLoad">—</div></div>
        <div class="cell"><div class="k">Bezug</div><div class="v" id="sImp">—</div></div>
        <div class="cell"><div class="k">Export</div><div class="v" id="sExp">—</div></div>
        <div class="cell"><div class="k">Laden</div><div class="v" id="sChg">—</div></div>
        <div class="cell"><div class="k">Ausgang</div><div class="v" id="sOut">—</div></div>
      </div>
      <div class="box">
        <div class="k">Solar-Miner Steuerung</div>
        <div class="nums">
          <div><span class="k">Soll</span><b id="sRun">—</b></div>
          <div><span class="k">Auto</span><b id="sEn">—</b></div>
        </div>
        <div class="track sol"><i id="sBar"></i></div>
        <div class="meta"><span>SOC / 20 % Schwelle</span><span id="sLast">—</span></div>
        <div class="reason" id="sReason">—</div>
      </div>
    </section>
  </div>

  <footer class="foot" id="foot" style="display:none">
    <div class="actions" id="xActions">
      <button class="act go-xmr" id="xBtn" type="button">…</button>
    </div>
    <div class="actions two" id="nActions" style="display:none">
      <button class="act go-btc" id="nOn" type="button">Neustart</button>
      <button class="act stop-btc" id="nOff" type="button">Shutdown</button>
    </div>
    <div class="actions" id="sActions" style="display:none">
      <div class="tick" style="margin:0;padding:6px 0">Steuerung über ioBroker-Skript</div>
    </div>
    <div id="err"></div>
    <div class="tick" id="tick">—</div>
  </footer>
</div>
<script>
const $=id=>document.getElementById(id);
const W="47A5TsFqALUKVpJDJzsA277ZgqxkQhra9NVmh3H1Y5zUJcvJPDki45gCX7pb26XxBzKggKZGTknaQS33rdYp3byj48EZbTm";
let view="home", miningOn=null, busy=false, nBusy=false, nexusOff=true;
const titles={home:"<b>MINER</b> · Home",xmr:"<b>XMRig</b> · Monero",btc:"<b>Nexus S1</b> · Bitcoin",sol:"<b>Solix</b> · Solar"};

const fh=n=>{if(n==null||isNaN(n))return"—";if(n>=1000)return(n/1000).toFixed(2)+"k";return String(Math.round(n))};
const fx=n=>{if(n==null||isNaN(n))return"—";if(!n)return"0";return n<0.01?n.toFixed(8):n.toFixed(4)};
const fe=d=>{if(d==null||isNaN(d))return"—";if(d<1)return Math.round(d*24)+" Std";if(d<60)return Math.round(d)+" Tage";if(d<365)return(d/30).toFixed(1)+" Mon";return(d/365).toFixed(1)+" J"};
const fu=s=>{if(s==null)return"—";const h=Math.floor(s/3600),m=Math.floor((s%3600)/60);return h?h+"h "+m+"m":m+"m"};
const fn=n=>n==null?"—":Number(n).toLocaleString("de-DE");
const fth=n=>{if(n==null||isNaN(n))return"—";const th=n/1e12;if(th>=10)return th.toFixed(1);if(th>=1)return th.toFixed(2);return th.toFixed(3)};
const fw=n=>{if(n==null||isNaN(n))return"—";return Math.round(Number(n))+" W"};

function openView(name){
  view=name;
  $("viewHome").classList.toggle("show", name==="home");
  $("viewXmr").classList.toggle("show", name==="xmr");
  $("viewBtc").classList.toggle("show", name==="btc");
  $("viewSol").classList.toggle("show", name==="sol");
  $("backBtn").style.display=name==="home"?"none":"inline-block";
  $("foot").style.display=name==="home"?"none":"";
  $("brandTitle").innerHTML=titles[name]||titles.home;
  $("xActions").style.display=name==="xmr"?"":"none";
  $("nActions").style.display=name==="btc"?"grid":"none";
  $("sActions").style.display=name==="sol"?"":"none";
}
$("tileXmr").onclick=()=>openView("xmr");
$("tileBtc").onclick=()=>openView("btc");
$("tileSol").onclick=()=>openView("sol");
$("backBtn").onclick=()=>openView("home");

function setSw(on,boot){
  miningOn=on;
  const pill=$("xPill");
  const tPill=$("tXPill");
  if(boot){pill.textContent="Startet";pill.className="pill on";tPill.textContent="Startet";tPill.className="pill on"}
  else if(on){pill.textContent="Läuft";pill.className="pill on";tPill.textContent="Läuft";tPill.className="pill on"}
  else{pill.textContent="Aus";pill.className="pill off";tPill.textContent="Aus";tPill.className="pill off"}
  const b=$("xBtn");
  b.textContent=on||boot?"XMR stoppen":"XMR starten";
  b.className="act "+(on||boot?"stop-xmr":"go-xmr");
}

function setNexus(d){
  if(!d||d.error){
    nexusOff=true;
    $("nPill").textContent="Offline"; $("nPill").className="pill off";
    $("tNPill").textContent="Offline"; $("tNPill").className="pill off";
    $("nH").innerHTML='—<small>TH/s</small>';
    $("tNH").innerHTML='—<small>TH/s</small>';
    $("nHm").textContent=d&&d.error?String(d.error):"Nicht erreichbar";
    $("tNSub").textContent="Nicht erreichbar";
    $("nOn").disabled=true; $("nOff").disabled=true;
    return;
  }
  nexusOff=!!d.shutdown;
  const hr=d.hashRate||0;
  const pillTxt=nexusOff?"Shutdown":"Mining";
  const pillCls=nexusOff?"pill off":"pill btc";
  $("nPill").textContent=pillTxt; $("nPill").className=pillCls;
  $("tNPill").textContent=pillTxt; $("tNPill").className=pillCls;
  $("nH").innerHTML=fth(hr)+'<small>TH/s</small>';
  $("tNH").innerHTML=fth(hr)+'<small>TH/s</small>';
  const pnum=d.power!=null?Number(d.power):null;
  const pw=pnum!=null?pnum.toFixed(pnum<1?2:0)+" W":"—";
  $("nHm").textContent=pw+" · "+(d.hostname||"nexus");
  $("tNSub").textContent=pw+" · "+(d.hostip||"192.168.178.116");
  $("nSub").textContent=(d.hostip||"192.168.178.116");
  $("npw").textContent=pw;
  $("nt").textContent=d.temp!=null?Number(d.temp).toFixed(0)+"°":"—";
  const rpm=d.fanrpm2||d.fanrpm||0;
  $("nf").textContent=rpm?rpm+" rpm":"0";
  const pools=d.stratum&&d.stratum.pools||[];
  const conn=pools.some(p=>p.connected);
  $("npool").textContent=nexusOff?"—":(conn?"OK":"Down");
  $("npool").className="v "+(nexusOff?"":conn?"ok":"bad");
  $("nacc").textContent=fn(d.sharesAccepted);
  $("nfw").textContent=(d.version||"—").replace(/^nexus\./,"");
  $("npoolurl").textContent=(d.stratumURL||"—")+":"+(d.stratumPort||"");
  $("nuser").textContent=d.stratumUser||"—";
  $("nOn").disabled=nBusy||!nexusOff;
  $("nOff").disabled=nBusy||nexusOff;
}

function setSolix(d){
  if(!d||d.error){
    $("sPill").textContent="Offline"; $("sPill").className="pill off";
    $("tSPill").textContent="Offline"; $("tSPill").className="pill off";
    $("sSoc").innerHTML='—<small>%</small>';
    $("tSSoc").innerHTML='—<small>%</small>';
    $("sHm").textContent=d&&d.error?String(d.error):"ioBroker nicht erreichbar";
    $("tSSub").textContent="ioBroker nicht erreichbar";
    return;
  }
  const soc=d.soc!=null?Number(d.soc):null;
  const run=!!d.miners_running;
  const en=d.miners_enabled!==false;
  const pillTxt=run?"Miner AN":"Miner AUS";
  const pillCls=run?"pill on":"pill off";
  $("sPill").textContent=pillTxt; $("sPill").className=pillCls;
  $("tSPill").textContent=pillTxt; $("tSPill").className=pillCls;
  const socTxt=soc!=null?Math.round(soc):"—";
  $("sSoc").innerHTML=socTxt+'<small>%</small>';
  $("tSSoc").innerHTML=socTxt+'<small>%</small>';
  $("sHm").textContent="Akku · Schwelle 20% · "+(en?"Auto an":"Auto aus");
  $("tSSub").textContent="PV "+fw(d.pv)+" · Bezug "+fw(d.import_w);
  $("sPv").textContent=fw(d.pv);
  $("sLoad").textContent=fw(d.load_w);
  $("sImp").textContent=fw(d.import_w);
  $("sImp").className="v "+(d.import_w>=50?"bad":"ok");
  $("sExp").textContent=fw(d.export_w);
  $("sChg").textContent=fw(d.charge_w);
  $("sOut").textContent=fw(d.output_w);
  $("sRun").textContent=run?"ON":"OFF";
  $("sRun").style.color=run?"var(--xmr)":"var(--stop)";
  $("sEn").textContent=en?"Ja":"Nein";
  const pct=soc!=null?Math.max(0,Math.min(100,soc)):0;
  $("sBar").style.width=pct+"%";
  $("sLast").textContent=d.miners_last||"—";
  $("sReason").textContent=d.miners_reason||"Keine letzte Aktion";
}

$("xBtn").onclick=async()=>{
  if(busy)return; busy=true; $("xBtn").disabled=true; $("err").textContent="";
  const action=miningOn?"stop":"start";
  try{
    const res=await fetch("/api/mining",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action})});
    const j=await res.json();
    if(!res.ok||!j.ok)throw new Error(j.error||j.message||"Fehler");
    setSw(action==="start");
    setTimeout(r,800);
  }catch(e){$("err").textContent=e.message}
  finally{busy=false;$("xBtn").disabled=false}
};

async function nexusAct(action){
  if(nBusy)return; nBusy=true; $("nOn").disabled=true; $("nOff").disabled=true; $("err").textContent="";
  try{
    const res=await fetch("/api/nexus",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action})});
    const j=await res.json();
    if(!res.ok||!j.ok)throw new Error(j.error||j.message||"Nexus-Fehler");
    setTimeout(r,1200);
  }catch(e){$("err").textContent=e.message}
  finally{nBusy=false}
}
$("nOn").onclick=()=>nexusAct("restart");
$("nOff").onclick=()=>nexusAct("shutdown");

$("copyBtn").onclick=async()=>{
  try{await navigator.clipboard.writeText(W);$("copyBtn").textContent="OK";setTimeout(()=>$("copyBtn").textContent="Copy",900)}
  catch(e){$("err").textContent="Copy fehlgeschlagen"}
};

async function r(){
  try{
    const [sr,tr,pr,mr,nr,srx]=await Promise.all([
      fetch("/api/summary",{cache:"no-store"}),
      fetch("/api/temp",{cache:"no-store"}).catch(()=>null),
      fetch("/api/pool",{cache:"no-store"}).catch(()=>null),
      fetch("/api/mining",{cache:"no-store"}).catch(()=>null),
      fetch("/api/nexus",{cache:"no-store"}).catch(()=>null),
      fetch("/api/solix",{cache:"no-store"}).catch(()=>null),
    ]);
    const mj=mr&&mr.ok?await mr.json():{};
    const tj=tr&&tr.ok?await tr.json():{};
    const pj=pr&&pr.ok?await pr.json():{error:1};
    const nj=nr&&nr.ok?await nr.json():{error:"offline"};
    const sj=srx&&srx.ok?await srx.json():{error:"offline"};
    setNexus(nj);
    setSolix(sj);
    $("tick").textContent=new Date().toLocaleTimeString("de-DE");

    if(tj.celsius!=null){
      $("temp").textContent=tj.celsius.toFixed(1)+"°";
      $("temp").className="v "+(tj.celsius>=85?"bad":tj.celsius>=75?"warn":"ok");
    }else{$("temp").textContent="n/a";$("temp").className="v"}

    if(pj&&!pj.error){
      $("pend").textContent=fx(pj.pending_xmr);
      $("paid").textContent=fx(pj.paid_xmr);
      $("eta").textContent=fe(pj.eta_days);
      const pct=Math.max(0,Math.min(100,pj.progress_pct||0));
      $("bar").style.width=(pct>0?Math.max(pct,.8):0)+"%";
      $("prog").textContent=pct.toFixed(2)+"% · "+fx(pj.pending_xmr)+" / 0,1";
    }

    if(!mj.active){
      setSw(false);
      $("xH").innerHTML='0<small>H/s</small>';
      $("tXH").innerHTML='0<small>H/s</small>';
      $("xHm").textContent="Mining aus";
      $("tXSub").textContent="Mining aus · CT 107";
      $("acc").textContent="—"; $("rej").textContent="—";
      $("hashes").textContent="—"; $("up").textContent="—"; $("ping").textContent="—";
      $("err").textContent="";
      return;
    }
    if(!sr.ok){
      setSw(true,true);
      $("xH").innerHTML='…<small>H/s</small>';
      $("tXH").innerHTML='…<small>H/s</small>';
      $("xHm").textContent="Warte auf XMRig…";
      $("tXSub").textContent="Startet…";
      return;
    }
    const d=await sr.json();
    const t=d.hashrate?.total?.[0]??0;
    setSw(true, t<=0);
    const hi=d.hashrate?.highest;
    const a=d.connection?.accepted??0, rj=d.connection?.rejected??0;
    const main=t>=1000?(t/1000).toFixed(2)+"k":String(Math.round(t));
    $("xH").innerHTML=main+'<small>H/s</small>';
    $("tXH").innerHTML=main+'<small>H/s</small>';
    $("xHm").textContent="Max "+fh(hi)+" · "+(d.algo||"rx").toUpperCase();
    $("tXSub").textContent=(tj.celsius!=null?tj.celsius.toFixed(1)+"° · ":"")+(d.algo||"rx").toUpperCase();
    $("acc").textContent=fn(a);
    $("rej").textContent=fn(rj);
    $("hashes").textContent=fn(d.results?.hashes_total);
    $("up").textContent=fu(d.uptime);
    $("ping").textContent=d.connection?.ping!=null?d.connection.ping+" ms":"—";
    $("xSub").textContent="CT 107 · "+(d.algo||"rx").toUpperCase();
    $("err").textContent="";
  }catch(e){
    setSw(false);
    $("err").textContent=e.message;
  }
}
r(); setInterval(r,3000);
</script>
</body>
</html>
"""


class H(BaseHTTPRequestHandler):
    def j(self, code, obj):
        b = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(b)

    def do_GET(self):
        if self.path.startswith("/api/summary"):
            try:
                with urlopen(XMRIG, timeout=3) as r:
                    b = r.read()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                self.wfile.write(b)
            except URLError as ex:
                self.j(502, {"error": str(ex.reason)})
            return
        if self.path.startswith("/api/temp"):
            self.j(200, temp() or {"celsius": None})
            return
        if self.path.startswith("/api/pool"):
            try:
                self.j(200, pool())
            except (URLError, HTTPError, TimeoutError, json.JSONDecodeError, ValueError) as ex:
                self.j(502, {"error": str(ex)})
            return
        if self.path.startswith("/api/mining"):
            self.j(200, mining_status())
            return
        if self.path.startswith("/api/nexus"):
            try:
                self.j(200, nexus_info())
            except (URLError, HTTPError, TimeoutError, json.JSONDecodeError, ValueError) as ex:
                err = getattr(ex, "reason", None) or str(ex)
                self.j(502, {"error": str(err)})
            return
        if self.path.startswith("/api/solix"):
            try:
                self.j(200, solix_info())
            except Exception as ex:
                self.j(502, {"error": str(ex)})
            return
        b = HTML.encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def do_POST(self):
        n = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(n) if n else b"{}"
        try:
            data = json.loads(body.decode() or "{}")
        except json.JSONDecodeError:
            self.j(400, {"ok": False, "error": "invalid json"})
            return
        if self.path.startswith("/api/mining"):
            ok, msg = mining_control(data.get("action", ""))
            self.j(200 if ok else 500, {"ok": ok, "message": msg, **mining_status()})
            return
        if self.path.startswith("/api/nexus"):
            ok, msg = nexus_control(data.get("action", ""))
            payload = {"ok": ok, "message": msg}
            try:
                payload.update(nexus_info())
            except Exception:
                pass
            self.j(200 if ok else 500, payload)
            return
        self.j(404, {"error": "not found"})

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    print("http://0.0.0.0:%s/ iobroker=%s" % (PORT, iobroker_base()), flush=True)
    ThreadingHTTPServer(("0.0.0.0", PORT), H).serve_forever()
