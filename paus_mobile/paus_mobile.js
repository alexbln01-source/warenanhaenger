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
//  Format: [ARTIKEL]*[KOMMISSION]*[DATUM]  (Artikel wird ignoriert)
//  Datum im Scan: TT.MM.JJJJ möglich – Anzeige/Etikett nur TT.MM
// ============================================================
let scanParseTimer = null;
let scanRawBuffer = "";
let scanLastCharAt = 0;

function cleanScanText(raw) {
    return String(raw).replace(/[\r\n\u0000-\u001F]+/g, "").trim();
}

function normalizeScanText(raw) {
    return cleanScanText(raw).replace(/[＊∗✱⁎·•]/g, "*");
}

function scanDigits(text) {
    return normalizeScanText(text).replace(/\D/g, "");
}

function hasScanDelimiter(text) {
    const t = normalizeScanText(text);
    return t.includes("*") || /--/.test(t) || /K[0-9]+D\d{4}$/i.test(t);
}

function starCount(text) {
    return (normalizeScanText(text).match(/\*/g) || []).length;
}

function formatLieferdatum(raw) {
    const text = cleanScanText(raw);
    const digits = text.replace(/\D/g, "");

    if (text.includes(".")) {
        const parts = text.split(".").map(p => p.replace(/\D/g, "")).filter(Boolean);
        if (parts.length >= 3) {
            const d = parts[0].padStart(2, "0");
            const m = parts[1].padStart(2, "0");
            let y = parts[2];
            if (y.length === 2) y = "20" + y;
            if (y.length === 4 && isPlausibleDateDigits(d + m) && isPlausibleYear(y)) {
                return `${d}.${m}.${y}`;
            }
        }
        if (parts.length === 2) {
            const d = parts[0].padStart(2, "0");
            const m = parts[1].padStart(2, "0");
            if (isPlausibleDateDigits(d + m)) return `${d}.${m}`;
        }
    }

    if (digits.length >= 8) {
        const d = digits.slice(0, 2);
        const m = digits.slice(2, 4);
        const y = digits.slice(4, 8);
        if (isPlausibleDateDigits(d + m) && isPlausibleYear(y)) {
            return `${d}.${m}.${y}`;
        }
    }

    if (digits.length === 6) {
        const d = digits.slice(0, 2);
        const m = digits.slice(2, 4);
        const y = "20" + digits.slice(4, 6);
        if (isPlausibleDateDigits(d + m) && isPlausibleYear(y)) {
            return `${d}.${m}.${y}`;
        }
    }

    if (digits.length >= 4) {
        const d = digits.slice(0, 2);
        const m = digits.slice(2, 4);
        if (isPlausibleDateDigits(d + m)) return `${d}.${m}`;
    }

    return text;
}

function lieferdatumAnzeige(formatted) {
    if (!formatted) return "";
    const parts = formatted.split(".").map(p => p.replace(/\D/g, "")).filter(Boolean);
    if (parts.length < 2) return formatted;
    return `${parts[0].padStart(2, "0")}.${parts[1].padStart(2, "0")}`;
}

function isPlausibleYear(y) {
    const year = parseInt(y, 10);
    return year >= 2000 && year <= 2099;
}

function isPlausibleLieferdatum(formatted) {
    if (!formatted) return false;
    const parts = formatted.split(".");
    if (parts.length < 2) return false;
    const d = parts[0].padStart(2, "0");
    const m = parts[1].padStart(2, "0");
    if (!isPlausibleDateDigits(d + m)) return false;
    if (parts.length >= 3) return isPlausibleYear(parts[2]);
    return true;
}

function isPlausibleDateDigits(d4) {
    if (d4.length !== 4) return false;
    const day = parseInt(d4.slice(0, 2), 10);
    const month = parseInt(d4.slice(2, 4), 10);
    return day >= 1 && day <= 31 && month >= 1 && month <= 12;
}

function parseStarScan(text) {
    const t = normalizeScanText(text);
    if (!t.includes("*")) return null;

    const parts = t.split(/\*+/).map(p => p.trim()).filter(Boolean);
    if (parts.length < 3) return null;

    const komPart = parts[parts.length - 2];
    const datePart = parts[parts.length - 1];
    const lieferdatum = formatLieferdatum(datePart);
    if (!isPlausibleLieferdatum(lieferdatum)) return null;

    return {
        kommission: scanDigits(komPart) || komPart,
        lieferdatum
    };
}

function parseKDScan(text) {
    const t = normalizeScanText(text);
    const match = t.match(/^(.+?)K([0-9]+)D([\d.]+)$/i);
    if (!match) return null;

    const lieferdatum = formatLieferdatum(match[3]);
    if (!isPlausibleLieferdatum(lieferdatum)) return null;

    return {
        kommission: match[2],
        lieferdatum
    };
}

function parseDoubleDashScan(text) {
    const t = normalizeScanText(text);
    if (!t.includes("--")) return null;

    const parts = t.split("--").map(p => p.trim()).filter(Boolean);
    if (parts.length !== 3) return null;

    const lieferdatum = formatLieferdatum(parts[2]);
    if (!isPlausibleLieferdatum(lieferdatum)) return null;

    return {
        kommission: scanDigits(parts[1]) || parts[1],
        lieferdatum
    };
}

function parseKommissionUndDatum(digits) {
    if (digits.length < 5) return null;

    if (digits.length >= 9 && digits.length <= 18) {
        const date8 = digits.slice(-8);
        const kom = digits.slice(0, -8);
        const lieferdatum = formatLieferdatum(date8);
        if (kom && isPlausibleLieferdatum(lieferdatum) && lieferdatum.split(".").length >= 3) {
            return { kommission: kom, lieferdatum };
        }
    }

    if (digits.length >= 7 && digits.length <= 16) {
        const date6 = digits.slice(-6);
        const kom = digits.slice(0, -6);
        const lieferdatum = formatLieferdatum(date6);
        if (kom && isPlausibleLieferdatum(lieferdatum) && lieferdatum.split(".").length >= 3) {
            return { kommission: kom, lieferdatum };
        }
    }

    if (digits.length >= 5 && digits.length <= 12) {
        const date4 = digits.slice(-4);
        const kom = digits.slice(0, -4);
        if (kom && isPlausibleDateDigits(date4)) {
            return { kommission: kom, lieferdatum: formatLieferdatum(date4) };
        }
    }

    return null;
}

function parseScanValue(raw) {
    const text = normalizeScanText(raw);
    if (!text) return null;

    const star = parseStarScan(text);
    if (star) return star;

    const kd = parseKDScan(text);
    if (kd) return kd;

    const dashed = parseDoubleDashScan(text);
    if (dashed) return dashed;

    // Nur ohne Trennzeichen: kurzer 2-teiliger Scan (Kommission + Datum, ohne Artikel)
    if (!hasScanDelimiter(text)) {
        const digits = scanDigits(text);
        const combo = parseKommissionUndDatum(digits);
        if (combo) return combo;

        if (digits.length >= 1 && digits.length <= 10) {
            return { kommission: digits, lieferdatum: null };
        }

        if (digits.length > 0 && digits.length <= 4) {
            return { kommission: null, lieferdatum: formatLieferdatum(digits) };
        }
    }

    return null;
}

function applyParsedScan(parsed) {
    if (!parsed) return false;

    if (parsed.kommission) kommission.value = parsed.kommission;
    if (parsed.lieferdatum) lieferdatum.value = lieferdatumAnzeige(parsed.lieferdatum);

    if (parsed.kommission && parsed.lieferdatum) {
        setTimeout(() => lieferdatum.focus(), 0);
        return true;
    }

    if (parsed.kommission) lieferdatum.focus();
    if (parsed.lieferdatum) druckenBtn.focus();
    return true;
}

function resetScanBuffer() {
    scanRawBuffer = "";
    scanLastCharAt = 0;
}

function appendScanChunk(chunk) {
    const text = String(chunk || "");
    if (!text) return;

    const now = Date.now();
    if (scanLastCharAt && now - scanLastCharAt > 250) {
        scanRawBuffer = "";
    }
    scanLastCharAt = now;
    scanRawBuffer += text;
}

function bestScanRaw(fallbackValue) {
    const fromField = normalizeScanText(fallbackValue || "");
    const fromBuffer = normalizeScanText(scanRawBuffer);

    if (starCount(fromBuffer) >= starCount(fromField)) return fromBuffer || fromField;
    return fromField || fromBuffer;
}

function tryParseScanSource(raw) {
    const text = bestScanRaw(raw);
    if (!text) return false;

    const parsed = parseScanValue(text);
    if (parsed && parsed.kommission && parsed.lieferdatum) {
        applyParsedScan(parsed);
        resetScanBuffer();
        return true;
    }
    return false;
}

function finishScan(input) {
    const el = input || document.activeElement;
    const ok = tryParseScanSource(el && el.value);
    if (!ok) resetScanBuffer();
    return ok;
}

function isScanTerminator(e) {
    return (
        e.key === "Enter" || e.key === "Tab" ||
        e.keyCode === 13 || e.keyCode === 9 ||
        e.which === 13 || e.which === 9
    );
}

function isScanField(el) {
    return el === kommission || el === lieferdatum;
}

function isScanFieldFocused() {
    return isScanField(document.activeElement);
}

function scheduleScanParse(input) {
    clearTimeout(scanParseTimer);
    scanParseTimer = setTimeout(() => finishScan(input), 100);
}

function handleScanInput(input) {
    const val = normalizeScanText(input.value);
    if (val.length >= scanRawBuffer.length || starCount(val) > starCount(scanRawBuffer)) {
        scanRawBuffer = val;
    }

    if (starCount(val) >= 2) {
        if (tryParseScanSource(val)) return;
    }

    scheduleScanParse(input);
}

function bindScanField(input) {
    input.addEventListener("beforeinput", (e) => {
        if (e.inputType === "insertText" && e.data) {
            appendScanChunk(e.data);
        }
        if (e.inputType === "insertLineBreak" || e.inputType === "insertParagraph") {
            e.preventDefault();
            setTimeout(() => finishScan(input), 0);
        }
    });

    input.addEventListener("input", () => handleScanInput(input));
    input.addEventListener("change", () => finishScan(input));

    ["keydown", "keyup"].forEach(type => {
        input.addEventListener(type, (e) => {
            if (!isScanTerminator(e)) return;
            e.preventDefault();
            setTimeout(() => finishScan(input), 0);
        }, true);
    });
}

function setupScanHandlers() {
    [kommission, lieferdatum].forEach(bindScanField);

    // Zebra Keyboard-Wedge: Zeichen + Enter auf Document-Ebene (Fallback)
    document.addEventListener("keydown", (e) => {
        if (!isScanFieldFocused()) return;

        if (isScanTerminator(e)) {
            e.preventDefault();
            setTimeout(() => finishScan(document.activeElement), 0);
            return;
        }

        if (e.key && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            appendScanChunk(e.key);
        }
    }, true);

    document.addEventListener("keyup", (e) => {
        if (!isScanFieldFocused() || !isScanTerminator(e)) return;
        e.preventDefault();
        setTimeout(() => finishScan(document.activeElement), 0);
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
//  POPUP TASTATUR (groß für Zebra)
//  Alte Version: paus_keyboard_legacy.css + NUM_KEYS 5-Spalten-Grid
// ============================================================
const NUM_LAYOUT = [
    "1", "2", "3",
    "4", "5", "6",
    "7", "8", "9",
    "",  "0", ""
];

function appendKeyboardDigit(digit) {
    keyboardInput.value += digit;
}

function createKeyButton(label) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "kb-key";
    btn.textContent = label;
    btn.onclick = () => appendKeyboardDigit(label);
    return btn;
}

function renderKeyboard() {
    keyboardKeys.innerHTML = "";

    NUM_LAYOUT.forEach(label => {
        if (!label) {
            const spacer = document.createElement("div");
            spacer.className = "kb-spacer";
            spacer.setAttribute("aria-hidden", "true");
            keyboardKeys.appendChild(spacer);
            return;
        }
        keyboardKeys.appendChild(createKeyButton(label));
    });
}

renderKeyboard();

openKeyboardBtn.onclick = () => openKeyboard("kommission");

function openKeyboard(id) {

    activeInput = document.getElementById(id);
    keyboardInput.value = activeInput.value;

    if (id === "kommission") {
        document.getElementById("keyboardTitle").textContent = "Kommissionsnummer";
    }
    else if (id === "lieferdatum") {
        document.getElementById("keyboardTitle").textContent = "Lieferdatum (TT.MM)";
    }

    keyboardPopup.style.display = "flex";
    document.body.classList.add("keyboard-open");

    setTimeout(() => keyboardInput.focus(), 20);
}

function closeKeyboard() {
    keyboardPopup.style.display = "none";
    document.body.classList.remove("keyboard-open");
}

keyboardOK.onclick = () => {
    if (!activeInput) return;

    let val = keyboardInput.value;

    if (activeInput.id === "lieferdatum") {
        val = val.replace(/[^\d.]/g, "");
        if (!val.includes(".")) {
            const digits = val.replace(/\D/g, "");
            if (digits.length === 3) val = "0" + digits;
            else if (digits.length >= 4) val = digits.slice(0, 2) + "." + digits.slice(2, 4);
        }
        val = lieferdatumAnzeige(formatLieferdatum(val));
        closeKeyboard();
    } else {
        activeInput.value = val;
        openKeyboard("lieferdatum");
        return;
    }

    activeInput.value = val;
};

keyboardDelete.onclick = () =>
    keyboardInput.value = keyboardInput.value.slice(0, -1);

keyboardClose.onclick = () => closeKeyboard();
