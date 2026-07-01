// ============================================================
//  GLOBALE VARIABLEN
// ============================================================
let activeInput = null;
let vorgezogenAktiv = false;

// ============================================================
//  DEVICE DETECTION
// ============================================================
const ua  = navigator.userAgent.toLowerCase();
const sw  = window.screen.width;
const sh  = window.screen.height;
const dpr = window.devicePixelRatio;

const isTC22  = ua.includes("android") && sw === 360 && sh === 720 && dpr === 3;
const isTC21  = ua.includes("android") && sw === 360 && sh === 640;
const isZebra = isTC22 || isTC21 || ua.includes("zebra");
const isMobile = /android|iphone|ipad|ipod/.test(ua);
const isPC     = !isZebra && !isMobile;

// ============================================================
//  DOM ELEMENTE
// ============================================================
const kommission     = document.getElementById("kommission");
const lieferdatum    = document.getElementById("lieferdatum");

const openKeyboardBtn = document.getElementById("openKeyboardBtn");
const keyboardPopup   = document.getElementById("keyboardPopup");
const keyboardInput   = document.getElementById("keyboardInput");
const keyboardKeys    = document.getElementById("keyboardKeys");
const keyboardOK      = document.getElementById("keyboardOK");
const keyboardDelete  = document.getElementById("keyboardDelete");
const keyboardClose   = document.getElementById("keyboardClose");

const druckenBtn = document.getElementById("druckenBtn");
const backBtn    = document.getElementById("backBtn");
const deviceInfo = document.getElementById("deviceInfo");
const buildInfo  = document.getElementById("buildInfo");

const btnVorgezogen = document.getElementById("btnVorgezogen");

// ============================================================
//  DEVICE INFO
// ============================================================
deviceInfo.textContent =
    isTC22 ? "Gerät: Zebra TC22" :
    isTC21 ? "Gerät: Zebra TC21" :
    isZebra ? "Gerät: Zebra" :
    isMobile ? "Gerät: Mobil" : "Gerät: PC";

if (isPC) document.body.classList.add("pc-device");

// ============================================================
//  START
// ============================================================
window.onload = () => {

    kommission.value  = "";
    lieferdatum.value = "";

    buildNumber();

    // Android Tastatur blockieren
    if (!isPC) {
        [kommission, lieferdatum, keyboardInput].forEach(inp => {
            inp.setAttribute("inputmode", "none");
            inp.setAttribute("autocomplete", "off");
            inp.setAttribute("autocorrect", "off");
            inp.setAttribute("autocapitalize", "off");
            inp.setAttribute("spellcheck", "false");
        });
    }

    if (isZebra) kommission.focus();

    setupScanHandlers();

backBtn.onclick = () => {
    const base = location.pathname.split("/").slice(0, -2).join("/");
    window.location.href = base + "/index.html";
};

    // VORGEZOGEN BUTTON
    btnVorgezogen.onclick = () => {
        vorgezogenAktiv = !vorgezogenAktiv;
        btnVorgezogen.classList.toggle("active");
    };

    // DRUCKEN BUTTON
    druckenBtn.onclick = () => {
        sessionStorage.setItem("cameFrom", "paus");

        if (!kommission.value.trim()) return alert("Bitte Kommissionsnummer eingeben!");
        if (!lieferdatum.value.trim()) return alert("Bitte Lieferdatum eingeben!");

        const colorBtn = document.querySelector(".color-btn.active");
        const farbe    = colorBtn ? colorBtn.dataset.color : null;

        const data = {
            kommission : kommission.value.trim(),
            lieferdatum: lieferdatum.value.trim(),
            vorgezogen : vorgezogenAktiv,
            farbe
        };

        const json = JSON.stringify(data);

        if (window.Android && typeof Android.printPaus === "function")
            Android.printPaus(json);
        else
            location.href = "paus_druck.html?data=" + encodeURIComponent(json);
    };
};

// ============================================================
//  SCAN (Strichcode + Return / Zebra)
//  Format: 31-027-1940-502;KOMMISSION;DATUM
//  Trennzeichen ; oder | – Kommission beliebig lang
// ============================================================
let scanParseTimer = null;

const SCAN_PREFIX_RE = /^31[\s\-]*027[\s\-]*1940[\s\-]*502$/i;
const SCAN_DELIMITER_RE = /[;|]/;

function cleanScanText(raw) {
    return String(raw).replace(/[\r\n\u0000-\u001F]+/g, "").trim();
}

function getScanParts(text) {
    return cleanScanText(text)
        .split(SCAN_DELIMITER_RE)
        .map(p => p.trim())
        .filter(Boolean);
}

function isPrefixPart(part) {
    return SCAN_PREFIX_RE.test(part.trim());
}

function formatLieferdatum(raw) {
    let val = String(raw).replace(/\D/g, "");
    if (!val) return "";
    if (val.length === 3) val = "0" + val;
    if (val.length >= 4) return val.slice(0, 2) + "." + val.slice(2, 4);
    return cleanScanText(raw);
}

function dateLooksComplete(raw) {
    const val = String(raw).replace(/\D/g, "");
    return val.length >= 3;
}

function parseDelimitedScan(text) {
    if (!SCAN_DELIMITER_RE.test(text)) return null;

    const parts = getScanParts(text);
    if (parts.length < 2) return null;

    if (parts.length >= 3 && isPrefixPart(parts[0])) {
        if (!dateLooksComplete(parts[2])) return null;
        return {
            kommission: parts[1],
            lieferdatum: formatLieferdatum(parts[2])
        };
    }

    if (!isPrefixPart(parts[0])) {
        if (!dateLooksComplete(parts[1])) return null;
        return {
            kommission: parts[0],
            lieferdatum: formatLieferdatum(parts[1])
        };
    }

    // Prefix + nur Kommission (zweiter Scan folgt)
    if (parts.length === 2 && isPrefixPart(parts[0])) {
        return { kommission: parts[1], lieferdatum: null };
    }

    return null;
}

function parseScanValue(raw) {
    const text = cleanScanText(raw);
    if (!text) return null;

    const delimited = parseDelimitedScan(text);
    if (delimited) return delimited;

    const digits = text.replace(/\D/g, "");

    // Nur Kommission
    if (digits.length >= 1 && digits.length <= 20 && !SCAN_DELIMITER_RE.test(text)) {
        return { kommission: digits, lieferdatum: null };
    }

    // Nur Datum
    if (digits.length > 0 && digits.length <= 4) {
        return { kommission: null, lieferdatum: formatLieferdatum(digits) };
    }

    return null;
}

function isScanTerminator(e) {
    return (
        e.key === "Enter" || e.key === "Tab" ||
        e.keyCode === 13 || e.keyCode === 9 ||
        e.which === 13 || e.which === 9
    );
}

function applyScan(input) {
    const parsed = parseScanValue(input.value);
    if (!parsed) {
        if (input === kommission && kommission.value.trim()) lieferdatum.focus();
        return false;
    }

    if (parsed.kommission) kommission.value = parsed.kommission;
    if (parsed.lieferdatum) lieferdatum.value = parsed.lieferdatum;

    if (parsed.kommission && parsed.lieferdatum) {
        setTimeout(() => lieferdatum.focus(), 0);
        return true;
    }

    if (parsed.kommission) lieferdatum.focus();
    if (parsed.lieferdatum) druckenBtn.focus();
    return true;
}

function shouldAutoParse(text) {
    if (!SCAN_DELIMITER_RE.test(text)) return false;

    const parts = getScanParts(text);
    if (parts.length >= 3 && isPrefixPart(parts[0])) {
        return parts[1].length > 0 && dateLooksComplete(parts[2]);
    }
    if (parts.length >= 2 && !isPrefixPart(parts[0])) {
        return parts[0].length > 0 && dateLooksComplete(parts[1]);
    }
    return false;
}

function scheduleScanParse(input) {
    clearTimeout(scanParseTimer);
    scanParseTimer = setTimeout(() => {
        if (!shouldAutoParse(input.value)) return;
        applyScan(input);
    }, 100);
}

function setupScanHandlers() {
    [kommission, lieferdatum].forEach(input => {
        input.addEventListener("input", () => scheduleScanParse(input));
        input.addEventListener("change", () => applyScan(input));

        ["keydown", "keyup"].forEach(type => {
            input.addEventListener(type, (e) => {
                if (!isScanTerminator(e)) return;
                e.preventDefault();
                setTimeout(() => applyScan(input), 0);
            });
        });
    });

    // Zebra/Android: Enter/Tab manchmal nur auf Document-Ebene
    document.addEventListener("keydown", (e) => {
        if (!isScanTerminator(e)) return;
        const input = document.activeElement;
        if (input !== kommission && input !== lieferdatum) return;
        e.preventDefault();
        setTimeout(() => applyScan(input), 0);
    }, true);
}

// ============================================================
//  BUILD INFO
// ============================================================
function buildNumber() {
    const d = new Date(document.lastModified);
    const stamp =
        d.getFullYear() + "-" +
        String(d.getMonth()+1).padStart(2,"0") + "-" +
        String(d.getDate()).padStart(2,"0") + "." +
        String(d.getHours()).padStart(2,"0") +
        String(d.getMinutes()).padStart(2,"0");

    buildInfo.textContent = "Build " + stamp;
}

// ============================================================
//  FARBWAHL
// ============================================================
document.querySelectorAll(".color-btn").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll(".color-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
    };
});

// ============================================================
//  POPUP TASTATUR
// ============================================================
const NUM_KEYS = ["1","2","3","4","5","6","7","8","9","0"];

function renderKeyboard() {
    keyboardKeys.innerHTML = "";
    NUM_KEYS.forEach(k => {
        const b = document.createElement("button");
        b.textContent = k;
        b.onclick = () => keyboardInput.value += k;
        keyboardKeys.appendChild(b);
    });
}
renderKeyboard();

openKeyboardBtn.onclick = () => openKeyboard("kommission");

function openKeyboard(id) {

    activeInput = document.getElementById(id);
    keyboardInput.value = activeInput.value;

    // Titel je nach Feld setzen
    if (id === "kommission") {
        document.getElementById("keyboardTitle").textContent = "Kommissionsnummer";
    } 
    else if (id === "lieferdatum") {
        document.getElementById("keyboardTitle").textContent = "Lieferdatum";
    }

    keyboardPopup.style.display = "flex";

    setTimeout(() => keyboardInput.focus(), 20);
}

keyboardOK.onclick = () => {
    if (!activeInput) return;

    let val = keyboardInput.value;

    if (activeInput.id === "lieferdatum") {
        val = val.replace(/\D/g, "");
        if (val.length === 3) val = "0" + val;
        if (val.length >= 4) val = val.slice(0,2) + "." + val.slice(2,4);
        keyboardPopup.style.display = "none";
    } else {
        activeInput.value = val;
        openKeyboard("lieferdatum");
        return;
    }

    activeInput.value = val;
};

keyboardDelete.onclick = () =>
    keyboardInput.value = keyboardInput.value.slice(0,-1);

keyboardClose.onclick = () =>
    keyboardPopup.style.display = "none";
