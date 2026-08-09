# PVE Hang Watch

Leichtes Monitoring auf dem **Proxmox-Host**, um Freezes einzugrenzen.

## Nach Hard-Reset (jetzt)

Auf dem Host (`pve`):

```bash
# 1) Forensik vom letzten Crash (previous boot)
curl -fsSL "https://raw.githubusercontent.com/alexbln01-source/warenanhaenger/0326a1d/tools/pve-hang-watch/pve-hang-forensics.sh" -o /tmp/pve-hang-forensics.sh
chmod +x /tmp/pve-hang-forensics.sh
bash /tmp/pve-hang-forensics.sh
```

Oder ganzes Paket installieren (Forensik + 60s-Watch):

```bash
cd /tmp
rm -rf pve-hang-watch
mkdir pve-hang-watch && cd pve-hang-watch
BASE="https://raw.githubusercontent.com/alexbln01-source/warenanhaenger/0326a1d/tools/pve-hang-watch"
curl -fsSL "$BASE/pve-hang-watch.sh" -o pve-hang-watch.sh
curl -fsSL "$BASE/pve-hang-forensics.sh" -o pve-hang-forensics.sh
curl -fsSL "$BASE/install-on-pve.sh" -o install-on-pve.sh
chmod +x *.sh
bash install-on-pve.sh
```

## Was wir suchen

| Spur | Bedeutung |
|---|---|
| `Out of memory` / `Killed process` | RAM-Mangel / OOM |
| `blocked for more than` / `hung_task` | IO-Hang (Disk/ZFS/NVMe) |
| hohe `iowait` vor dem Crash | Disk/ZFS überlastet (oft bitcoind) |
| `nvme` reset / I/O error | NVMe/Firmware/Kabel |
| `mining-auto` wieder aktiv | alter Timer (früher Freeze-Kandidat) |
| Load explodiert, CPU `kvm`/`lxc` | eine VM/CT reißt den Host mit |

## Logs

- `/var/log/pve-hang-watch.log` — jede Minute
- `/var/log/pve-hang-watch.log.alert` — nur High-Load / High-IO
- Forensik-Ausgabe unter `/root/pve-hang-forensics-*.txt`

**Wichtig:** Der Watch macht **kein** `pct exec` (das war beim alten mining-auto problematisch).
