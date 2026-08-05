// Solar-Miner: Nexus S1 — Steckdose (aggressiv)
// Batterie maximal nutzen, Netzbezug minimieren
//
// FIX: AUS immer wenn Steckdose physisch AN ist — nicht nur wenn
//      userdata.running=true (sonst bleibt die Dose ewig an).
//
// AUS (Überlast):
//   - Bezug > 100 W für 2 Minuten
//   - ab 18:00 und SOC < 25 %
//
// AN (bei Sonne oder hohem SOC):
//   - Bezug ≤ 100 W für 1 Minute
//   - Morgen (bis 10): nur PV ≥ 400 W
//   - Tag (10–18): PV ≥ 400 W ODER SOC ≥ 10 %
//   - Abend (ab 18): zusätzlich SOC ≥ 25 %

const ID_PLUG     = "fritzdect.0.DECT_087610373499.state";
const ID_PLUG_PWR = "fritzdect.0.DECT_087610373499.power";

const SITE = "ankersolix2.0.a278fac0-df28-4f92-846d-76e77de23b26";
const ID_SOC    = SITE + ".solarbank_info.total_battery_power";
const ID_PV     = SITE + ".solarbank_info.total_photovoltaic_power";
const ID_IMPORT = SITE + ".grid_info.grid_to_home_power";

const ID_EN  = "0_userdata.0.solar_miners.enabled";
const ID_RUN = "0_userdata.0.solar_miners.running";
const ID_LAST= "0_userdata.0.solar_miners.last_action";
const ID_REAS= "0_userdata.0.solar_miners.reason";

const PV_ON          = 400;
const SOC_OR_ON      = 10;
const SOC_EVENING    = 25;
const MORNING_END    = 10;
const EVENING_HOUR   = 18;
const IMPORT_LIMIT   = 100;
const IMPORT_HOLD    = 2 * 60 * 1000;
const IMPORT_CLEAR   = 1 * 60 * 1000;

let importHighSince = null;
let importLowSince  = null;
let lastPhase       = null;
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

function phase() {
    const h = new Date().getHours();
    if (h < MORNING_END) return "morgen";
    if (h >= EVENING_HOUR) return "abend";
    return "tag";
}

function setMeta(running, reason) {
    try {
        setState(ID_RUN, !!running, true);
        setState(ID_LAST, new Date().toLocaleString("de-DE"), true);
        setState(ID_REAS, reason || "", true);
        const action = running ? "✅ AN" : "⛔ AUS";
        log("solar_miners: " + action + " — " + reason);
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

/** Physisch an = Meta ODER Fritz-State (Meta kann desync sein). */
function isOn() {
    const meta = bool(ID_RUN);
    const dose = bool(ID_PLUG);
    const pwr = num(ID_PLUG_PWR);
    // Leistung > 5 W = sicher an (falls state falsch)
    const drawing = pwr !== null && pwr > 5;
    return meta || dose || drawing;
}

function energieOk(ph, pv, soc) {
    if (ph === "morgen") return pv >= PV_ON;
    if (ph === "abend") return (pv >= PV_ON || soc >= SOC_OR_ON) && soc >= SOC_EVENING;
    return (pv >= PV_ON) || (soc >= SOC_OR_ON);
}

function resetTimersIfPhaseChanged(newPhase) {
    if (lastPhase && lastPhase !== newPhase) {
        log("solar_miners: Phasenwechsel " + lastPhase + " → " + newPhase + " — Timer zurückgesetzt");
        importHighSince = null;
        importLowSince = null;
    }
    lastPhase = newPhase;
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

        const soc = num(ID_SOC);
        const pv  = num(ID_PV);
        const imp = num(ID_IMPORT);

        if (soc === null || pv === null || imp === null) {
            logStatus("⚠️ Solix-Werte fehlen (SOC/PV/Bezug) SOC=" + soc + " PV=" + pv + " Imp=" + imp);
            return;
        }

        const on = isOn();
        // Meta an Steckdose angleichen (verhindert ewiges Nicht-Ausschalten)
        if (on && !bool(ID_RUN)) {
            setState(ID_RUN, true, true);
            log("solar_miners: Meta running=true synchronisiert (Steckdose war an)");
        } else if (!on && bool(ID_RUN)) {
            setState(ID_RUN, false, true);
            log("solar_miners: Meta running=false synchronisiert (Steckdose war aus)");
        }

        const now = Date.now();
        const ph = phase();
        const plugW = num(ID_PLUG_PWR);
        resetTimersIfPhaseChanged(ph);

        log(
            "solar_miners: tick [" + ph + "] on=" + on +
            " plug=" + bool(ID_PLUG) + " plugW=" + (plugW !== null ? Math.round(plugW) : "?") +
            " PV=" + Math.round(pv) + "W SOC=" + Math.round(soc) + "%" +
            " Bezug=" + Math.round(imp) + "W"
        );

        if (imp > IMPORT_LIMIT) {
            importLowSince = null;
            if (!importHighSince) {
                importHighSince = now;
                log("solar_miners: Bezug > " + IMPORT_LIMIT + " W — AUS-Timer gestartet (2 min)");
            }
        } else {
            importHighSince = null;
            if (!importLowSince) {
                importLowSince = now;
                log("solar_miners: Bezug ≤ " + IMPORT_LIMIT + " W — AN-Timer gestartet (1 min)");
            }
        }

        let wantOff = false;
        let offReason = "";

        if (ph === "abend" && soc < SOC_EVENING) {
            wantOff = true;
            offReason = "Abend: SOC < " + SOC_EVENING + "% (" + Math.round(soc) + "%)";
        } else if (importHighSince && (now - importHighSince >= IMPORT_HOLD)) {
            wantOff = true;
            offReason = "Netzbezug > " + IMPORT_LIMIT + " W über 2 Min (" + Math.round(imp) + "W)";
        } else if (imp > IMPORT_LIMIT && on) {
            const left = Math.ceil((IMPORT_HOLD - (now - importHighSince)) / 1000);
            logStatus("[" + ph + "] ⚠️ Bezug " + Math.round(imp) + "W — AUS in ~" + left + "s");
        }

        // WICHTIG: nicht nur Meta — auch physische Steckdose
        if (wantOff && on) {
            if (plug(false)) setMeta(false, offReason);
            return;
        }

        if (!on) {
            const bezugKlar = importLowSince && (now - importLowSince >= IMPORT_CLEAR);
            const okEnergie = energieOk(ph, pv, soc);

            if (bezugKlar && okEnergie) {
                const reason =
                    "AN [" + ph + "]: PV " + Math.round(pv) + "W, SOC " +
                    Math.round(soc) + "%, Bezug " + Math.round(imp) + "W";
                if (plug(true)) setMeta(true, reason);
            } else {
                let why = "⏳ Warte [" + ph + "] —";
                if (!bezugKlar) {
                    if (imp > IMPORT_LIMIT) {
                        why += " Bezug noch " + Math.round(imp) + "W";
                    } else {
                        const left = importLowSince
                            ? Math.ceil((IMPORT_CLEAR - (now - importLowSince)) / 1000)
                            : 60;
                        why += " Bezug ok, noch ~" + left + "s";
                    }
                } else if (ph === "morgen") {
                    why += " Morgen: braucht PV ≥ " + PV_ON + "W (ist " + Math.round(pv) + "W)";
                } else if (ph === "abend") {
                    why += " Abend: braucht (PV≥" + PV_ON + " oder SOC≥" + SOC_OR_ON + "%) und SOC≥" + SOC_EVENING + "%";
                } else {
                    why += " Tag: braucht PV≥" + PV_ON + "W oder SOC≥" + SOC_OR_ON + "%";
                }
                logStatus(why);
            }
        } else if (!wantOff) {
            logStatus(
                "✓ Läuft [" + ph + "]: PV " + Math.round(pv) + "W, SOC " +
                Math.round(soc) + "%, Bezug " + Math.round(imp) + "W"
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

    log("solar_miners: ✅ Gestartet (aggressiv + Steckdose-Sync)");
    log("  Morgen: nur PV ≥ " + PV_ON + "W");
    log("  Tag: PV ≥ " + PV_ON + "W ODER SOC ≥ " + SOC_OR_ON + "%");
    log("  Abend: (PV ≥ " + PV_ON + "W ODER SOC ≥ " + SOC_OR_ON + "%) UND SOC ≥ " + SOC_EVENING + "%");
    log("  Überlast: > " + IMPORT_LIMIT + "W → AUS nach 2 Min (auch wenn Meta.running falsch)");

    on({ id: [ID_SOC, ID_PV, ID_IMPORT], change: "ne" }, tick);
    schedule("*/1 * * * *", tick);
    tick();
} catch (e) {
    log("solar_miners: ❌ Init-Fehler: " + e.message);
}
