// Solar-Miner: Nexus S1 — Steckdose
// AN früh: sobald Akku aus Solar geladen wird und SOC ≥ 7 %
// AUS: Netzbezug / Abend-Reserve
//
// AUS:
//   - Bezug > 100 W für 2 Minuten
//   - ab 18:00 und SOC < 25 %
//
// AN:
//   - Bezug ≤ 100 W für 1 Minute
//   - Laden (Solar→Akku) ≥ 50 W
//   - SOC ≥ 7 %
//   → kein Warten auf PV ≥ 400 / Morgen-Phase bis 10 Uhr

const ID_PLUG     = "fritzdect.0.DECT_087610373499.state";
const ID_PLUG_PWR = "fritzdect.0.DECT_087610373499.power";

const SITE = "ankersolix2.0.a278fac0-df28-4f92-846d-76e77de23b26";
const ID_SOC    = SITE + ".solarbank_info.total_battery_power";
const ID_PV     = SITE + ".solarbank_info.total_photovoltaic_power";
const ID_IMPORT = SITE + ".grid_info.grid_to_home_power";
const ID_CHARGE = SITE + ".solarbank_info.total_charging_power";

const ID_EN  = "0_userdata.0.solar_miners.enabled";
const ID_RUN = "0_userdata.0.solar_miners.running";
const ID_LAST= "0_userdata.0.solar_miners.last_action";
const ID_REAS= "0_userdata.0.solar_miners.reason";

const SOC_MIN_ON     = 7;    // mindestens noch 7 % Akku
const CHARGE_ON      = 50;   // Solar lädt Akku (Rauschen ausfiltern)
const SOC_EVENING    = 25;   // abends Reserve — darunter AUS
const EVENING_HOUR   = 18;
const IMPORT_LIMIT   = 100;
const IMPORT_HOLD    = 2 * 60 * 1000;
const IMPORT_CLEAR   = 1 * 60 * 1000;

let importHighSince = null;
let importLowSince  = null;
let busy = false;
let lastLogReason = "";

function num(id) {
    try {
        const s = getState(id);
        if (!s || s.val === null || s.val === undefined || s.val === "") return null;
        const n = Number(s.val);
        return isNaN(n) ? null : n;
    } catch (e) {
        log("solar_miners: ⚠️ Fehler beim Lesen " + id + ": " + e.message);
        return null;
    }
}

function bool(id) {
    try {
        const s = getState(id);
        return !!(s && s.val);
    } catch (e) {
        return false;
    }
}

function isEvening() {
    return new Date().getHours() >= EVENING_HOUR;
}

function setMeta(running, reason) {
    try {
        setState(ID_RUN, !!running, true);
        setState(ID_LAST, new Date().toLocaleString("de-DE"), true);
        setState(ID_REAS, reason || "", true);
        log("solar_miners: " + (running ? "✅ AN" : "⛔ AUS") + " — " + reason);
        lastLogReason = reason || "";
    } catch (e) {
        log("solar_miners: ⚠️ Fehler beim Setzen Meta: " + e.message);
    }
}

function logStatus(msg) {
    try {
        setState(ID_REAS, msg, true);
        if (msg !== lastLogReason) {
            log("solar_miners: " + msg);
            lastLogReason = msg;
        }
    } catch (e) {
        log("solar_miners: ⚠️ Fehler beim Status-Log: " + e.message);
    }
}

function plug(on) {
    try {
        log("solar_miners: Steckdose " + (on ? "AN" : "AUS") + " Befehl gesendet");
        setState(ID_PLUG, !!on, false);
        return true;
    } catch (e) {
        log("solar_miners: ⚠️ Fehler beim Schalten: " + e.message);
        return false;
    }
}

function isOn() {
    const meta = bool(ID_RUN);
    const dose = bool(ID_PLUG);
    const pwr = num(ID_PLUG_PWR);
    const drawing = pwr !== null && pwr > 5;
    return meta || dose || drawing;
}

function energieOk(charge, soc) {
    return charge >= CHARGE_ON && soc >= SOC_MIN_ON;
}

async function tick() {
    if (busy) return;
    busy = true;

    try {
        const en = getState(ID_EN);
        if (en && en.val === false) {
            if (isOn()) {
                if (plug(false)) setMeta(false, "Auto deaktiviert (enabled=false)");
            } else {
                logStatus("Auto aus (enabled=false)");
            }
            return;
        }

        const soc    = num(ID_SOC);
        const pv     = num(ID_PV);
        const imp    = num(ID_IMPORT);
        const charge = num(ID_CHARGE);

        if (soc === null || pv === null || imp === null || charge === null) {
            logStatus(
                "⚠️ Solix-Werte fehlen SOC=" + soc + " PV=" + pv +
                " Imp=" + imp + " Laden=" + charge
            );
            return;
        }

        const on = isOn();
        if (on && !bool(ID_RUN)) {
            setState(ID_RUN, true, true);
            log("solar_miners: Meta running=true synchronisiert (Steckdose war an)");
        } else if (!on && bool(ID_RUN)) {
            setState(ID_RUN, false, true);
            log("solar_miners: Meta running=false synchronisiert (Steckdose war aus)");
        }

        const now = Date.now();
        const evening = isEvening();
        const plugW = num(ID_PLUG_PWR);

        log(
            "solar_miners: tick on=" + on +
            " plug=" + bool(ID_PLUG) + " plugW=" + (plugW !== null ? Math.round(plugW) : "?") +
            " PV=" + Math.round(pv) + "W Laden=" + Math.round(charge) + "W" +
            " SOC=" + Math.round(soc) + "% Bezug=" + Math.round(imp) + "W" +
            (evening ? " [abend]" : "")
        );

        if (imp > IMPORT_LIMIT) {
            importLowSince = null;
            if (!importHighSince) {
                importHighSince = now;
                log("solar_miners: Bezug > " + IMPORT_LIMIT + " W — AUS-Timer (2 min)");
            }
        } else {
            importHighSince = null;
            if (!importLowSince) {
                importLowSince = now;
                log("solar_miners: Bezug ≤ " + IMPORT_LIMIT + " W — AN-Timer (1 min)");
            }
        }

        let wantOff = false;
        let offReason = "";

        if (evening && soc < SOC_EVENING) {
            wantOff = true;
            offReason = "Abend: SOC < " + SOC_EVENING + "% (" + Math.round(soc) + "%)";
        } else if (importHighSince && (now - importHighSince >= IMPORT_HOLD)) {
            wantOff = true;
            offReason = "Netzbezug > " + IMPORT_LIMIT + " W über 2 Min (" + Math.round(imp) + "W)";
        } else if (imp > IMPORT_LIMIT && on) {
            const left = Math.ceil((IMPORT_HOLD - (now - importHighSince)) / 1000);
            logStatus("⚠️ Bezug " + Math.round(imp) + "W — AUS in ~" + left + "s");
        }

        if (wantOff && on) {
            if (plug(false)) setMeta(false, offReason);
            return;
        }

        if (!on) {
            const bezugKlar = importLowSince && (now - importLowSince >= IMPORT_CLEAR);
            const okEnergie = energieOk(charge, soc);

            if (bezugKlar && okEnergie) {
                const reason =
                    "AN: Laden " + Math.round(charge) + "W, SOC " + Math.round(soc) +
                    "%, PV " + Math.round(pv) + "W, Bezug " + Math.round(imp) + "W";
                if (plug(true)) setMeta(true, reason);
            } else {
                let why = "⏳ Warte —";
                if (!bezugKlar) {
                    if (imp > IMPORT_LIMIT) {
                        why += " Bezug noch " + Math.round(imp) + "W";
                    } else {
                        const left = importLowSince
                            ? Math.ceil((IMPORT_CLEAR - (now - importLowSince)) / 1000)
                            : 60;
                        why += " Bezug ok, noch ~" + left + "s";
                    }
                } else if (charge < CHARGE_ON) {
                    why += " kein Solar-Laden (Laden " + Math.round(charge) + "W < " + CHARGE_ON + "W)";
                } else {
                    why += " SOC " + Math.round(soc) + "% < " + SOC_MIN_ON + "%";
                }
                logStatus(why);
            }
        } else if (!wantOff) {
            logStatus(
                "✓ Läuft: Laden " + Math.round(charge) + "W, PV " + Math.round(pv) +
                "W, SOC " + Math.round(soc) + "%, Bezug " + Math.round(imp) + "W"
            );
        }
    } catch (e) {
        log("solar_miners: ❌ Fehler in tick(): " + e.message);
        logStatus("❌ Fehler: " + e.message);
    } finally {
        busy = false;
    }
}

try {
    createState(ID_EN,   true,  { name: "solar_miners.enabled", type: "boolean", role: "switch" }, () => {});
    createState(ID_RUN,  false, { name: "solar_miners.running", type: "boolean", role: "indicator" }, () => {});
    createState(ID_LAST, "",    { name: "solar_miners.last_action", type: "string" }, () => {});
    createState(ID_REAS, "",    { name: "solar_miners.reason", type: "string" }, () => {});

    log("solar_miners: ✅ Gestartet — AN bei Solar-Laden ≥ " + CHARGE_ON + "W und SOC ≥ " + SOC_MIN_ON + "%");
    log("  AUS: Bezug > " + IMPORT_LIMIT + "W / 2 Min, abends SOC < " + SOC_EVENING + "%");

    on({ id: [ID_SOC, ID_PV, ID_IMPORT, ID_CHARGE], change: "ne" }, tick);
    schedule("*/1 * * * *", tick);
    tick();
} catch (e) {
    log("solar_miners: ❌ Init-Fehler: " + e.message);
}
