// ============================================================
// KANTEN – kanten_mobile.js (STABILE VERSION)
// ============================================================

// ============================================================
// DEVICE DETECTION (wie PAUS)
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
// BUILD
// ============================================================
function buildStamp() {
    const d = new Date(document.lastModified);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${y}${m}${day}.${hh}${mm}`;
}

// ============================================================
// DOM ELEMENTE
// ============================================================
const deviceInfo   = document.getElementById("deviceInfo");
const buildInfo    = document.getElementById("buildInfo");

const popup         = document.getElementById("keyboardPopup");
const keyboardInput = document.getElementById("keyboardInput");
const keyboardGrid  = document.getElementById("keyboardGrid");

const kundenArea = document.getElementById("kundenArea");

const btnEiltSehr   = document.getElementById("btnEiltSehr");
const btnKanten     = document.getElementById("btnKanten");
const btnSchweissen = document.getElementById("btnSchweissen");
const btnBohrwerk   = document.getElementById("btnBohrwerk");

const btnBack    = document.getElementById("btnBack");
const btnDrucken = document.getElementById("btnDrucken");

// ============================================================
// STATE
// ============================================================
let selectedCustomer = "";
let selectedArt = "";
let sonstigeName = "";

// ============================================================
// DEVICE INFO + BUILD (ohne Layout zu zerstören)
// ============================================================
function setCornerInfo() {

    const deviceLabel =
        isTC22 ? "Zebra TC22" :
        isTC21 ? "Zebra TC21" :
        isZebra ? "Zebra" :
        isMobile ? "Mobil" : "PC";

    if (deviceInfo) {
        deviceInfo.textContent = "Gerät: " + deviceLabel;
    }

    if (buildInfo) {
        buildInfo.textContent = "Build " + buildStamp();
    }
}

// ============================================================
// PC INPUT POPUP
// ============================================================
let pcInputWrapper = null;
let pcCustomerInput = null;

function createPcInput() {
    if (!isPC) return;

    pcInputWrapper = document.createElement("div");
    pcInputWrapper.style.display = "none";
    pcInputWrapper.style.position = "fixed";
    pcInputWrapper.style.top = "50%";
    pcInputWrapper.style.left = "50%";
    pcInputWrapper.style.transform = "translate(-50%, -50%)";
    pcInputWrapper.style.background = "#fff";
    pcInputWrapper.style.padding = "22px";
    pcInputWrapper.style.borderRadius = "14px";
    pcInputWrapper.style.boxShadow = "0 10px 30px rgba(0,0,0,0.25)";
    pcInputWrapper.style.zIndex = "9999";
    pcInputWrapper.style.textAlign = "center";

    pcInputWrapper.innerHTML = `
        <div style="font-weight:800;margin-bottom:10px;color:#003a73;">
            Kundenname eingeben
        </div>
        <input id="pcCustomerInput"
               type="text"
               placeholder="Kundenname"
               style="
                 width:300px;
                 padding:14px;
                 font-size:20px;
                 border-radius:10px;
                 border:2px solid #1976d2;
                 text-align:center;
               ">
        <div style="margin-top:12px;">
            <button id="pcCustomerOk"
                style="padding:8px 18px;font-weight:800;">
                OK
            </button>
        </div>
    `;

    document.body.appendChild(pcInputWrapper);
    pcCustomerInput = pcInputWrapper.querySelector("#pcCustomerInput");

    pcInputWrapper.querySelector("#pcCustomerOk").onclick = () => {

        const name = pcCustomerInput.value.trim();
        if (!name) return alert("Bitte Kundennamen eingeben.");

        setSonstigeName(name);
        pcInputWrapper.style.display = "none";
    };
}

function openPcInput() {
    if (!pcInputWrapper) return;
    pcInputWrapper.style.display = "block";
    setTimeout(() => pcCustomerInput.focus(), 50);
}

function hidePcInput() {
    if (pcInputWrapper) pcInputWrapper.style.display = "none";
}

// ============================================================
// SONSTIGE BUTTON TEXT ÄNDERN
// ============================================================
function setSonstigeName(name) {
    sonstigeName = name;
    selectedCustomer = "SONSTIGE";

    const btn = document.querySelector('.kundeBtn[data-kunde="SONSTIGE"]');
    if (btn) btn.textContent = name;
}

function resetSonstigeButton() {
    sonstigeName = "";
    const btn = document.querySelector('.kundeBtn[data-kunde="SONSTIGE"]');
    if (btn) btn.textContent = "Sonstige Kunden";
}

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", () => {

    setCornerInfo();
    createPcInput();

    if (popup) popup.style.display = "none";
    if (kundenArea) kundenArea.classList.add("disabled");

    if (!isPC && keyboardInput) {
        keyboardInput.setAttribute("inputmode", "none");
    }
});

// ============================================================
// HILFSFUNKTIONEN
// ============================================================
function clearArtSelection() {
    document.querySelectorAll(".artBtn")
        .forEach(b => b.classList.remove("active"));
}

function clearCustomerSelection() {
    document.querySelectorAll(".kundeBtn")
        .forEach(b => b.classList.remove("active"));
}

// ============================================================
// ART BUTTONS
// ============================================================
btnEiltSehr.onclick = () => {

    selectedArt = "eilt_sehr";
    selectedCustomer = "EILT_SEHR";

    clearArtSelection();
    btnEiltSehr.classList.add("active");

    clearCustomerSelection();
    resetSonstigeButton();

    if (popup) popup.style.display = "none";
    hidePcInput();

    kundenArea.classList.add("disabled");
};

btnKanten.onclick     = () => setNormalArt("kanten", btnKanten);
btnSchweissen.onclick = () => setNormalArt("schweissen", btnSchweissen);
btnBohrwerk.onclick   = () => setNormalArt("bohrwerk", btnBohrwerk);

function setNormalArt(art, btn) {

    selectedArt = art;

    clearArtSelection();
    btn.classList.add("active");

    selectedCustomer = "";
    clearCustomerSelection();
    resetSonstigeButton();

    kundenArea.classList.remove("disabled");
}

// ============================================================
// KUNDEN BUTTONS
// ============================================================
document.querySelectorAll(".kundeBtn").forEach(btn => {

    btn.onclick = () => {

        if (kundenArea.classList.contains("disabled")) {
            alert("Bitte zuerst eine Art auswählen.");
            return;
        }

        clearCustomerSelection();
        btn.classList.add("active");

        const kunde = btn.dataset.kunde;

        if (kunde === "SONSTIGE") {

            if (isPC) {
                openPcInput();
            } else {
                popup.style.display = "flex";
                renderKeyboard();
                setTimeout(() => keyboardInput.focus(), 50);
            }

        } else {
            selectedCustomer = kunde;
            hidePcInput();
            if (popup) popup.style.display = "none";
        }
    };
});

// ============================================================
// DRUCK
// ============================================================
btnDrucken.onclick = () => {

    if (selectedArt === "eilt_sehr") {
        location.href = "druck_kanten.html?kunde=EILT_SEHR";
        return;
    }

    if (!selectedArt) return alert("Bitte eine Art auswählen.");
    if (!selectedCustomer && !sonstigeName)
        return alert("Bitte einen Kunden auswählen.");

    let kundeName = selectedCustomer;

    if (selectedCustomer === "SONSTIGE") {
        if (!sonstigeName) return alert("Bitte Kundennamen eingeben.");
        kundeName = sonstigeName;
    }

    location.href =
        "druck_kanten.html?kunde=" + encodeURIComponent(kundeName) +
        "&art=" + encodeURIComponent(selectedArt);
};

// ============================================================
// ZURÜCK
// ============================================================
btnBack.onclick = () => {
    window.location.href = "../index.html";
};

// ============================================================
// MOBILE TASTATUR
// ============================================================
function renderKeyboard() {

    keyboardGrid.innerHTML = "";

    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

    letters.forEach(letter => {

        const btn = document.createElement("button");
        btn.className = "kbm-key";
        btn.textContent = letter;

        btn.onclick = () => {
            keyboardInput.value += letter;
        };

        keyboardGrid.appendChild(btn);
    });

    const ok = document.createElement("button");
    ok.className = "kbm-key ok";
    ok.textContent = "OK";

    ok.onclick = () => {

        const name = keyboardInput.value.trim();
        if (!name) return alert("Bitte Kundennamen eingeben.");

        setSonstigeName(name);
        popup.style.display = "none";
    };

    keyboardGrid.appendChild(ok);
}
