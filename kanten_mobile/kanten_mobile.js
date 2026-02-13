// ============================================================
// KANTEN – STABILE VERSION
// ============================================================

// ============================================================
// DEVICE DETECTION
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
// DOM
// ============================================================
const deviceInfo = document.getElementById("deviceInfo");
const buildInfo  = document.getElementById("buildInfo");

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

let selectedCustomer = "";
let selectedArt = "";
let sonstigeName = "";

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", () => {

    // Gerät anzeigen (kein Layout ändern!)
    const label =
        isTC22 ? "Zebra TC22" :
        isTC21 ? "Zebra TC21" :
        isZebra ? "Zebra" :
        isMobile ? "Mobil" : "PC";

    if (deviceInfo) deviceInfo.textContent = "Gerät: " + label;
    if (buildInfo)  buildInfo.textContent  = "Build " + buildStamp();

    if (popup) popup.style.display = "none";
    if (kundenArea) kundenArea.classList.add("disabled");
});

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
// ART BUTTONS
// ============================================================
function clearArtSelection() {
    document.querySelectorAll(".artBtn")
        .forEach(b => b.classList.remove("active"));
}

function clearCustomerSelection() {
    document.querySelectorAll(".kundeBtn")
        .forEach(b => b.classList.remove("active"));
}

btnEiltSehr.onclick = () => {

    selectedArt = "eilt_sehr";
    selectedCustomer = "EILT_SEHR";

    clearArtSelection();
    btnEiltSehr.classList.add("active");

    clearCustomerSelection();
    resetSonstigeButton();

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
// KUNDEN
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

            selectedCustomer = "SONSTIGE";

            if (isPC) {

                const name = prompt("Kundenname eingeben:");
                if (!name || !name.trim()) return;

                setSonstigeName(name.trim());

            } else {

                popup.style.display = "flex";
                renderKeyboard();
                setTimeout(() => keyboardInput.focus(), 50);
            }

        } else {

            selectedCustomer = kunde;
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
// MOBILE TASTATUR (DEIN ORIGINAL LAYOUT BLEIBT!)
// ============================================================
function renderKeyboard() {

    keyboardGrid.innerHTML = "";

    const rows = [
        ["Q","W","E","R","T","Z","U","I","O","P"],
        ["A","S","D","F","G","H","J","K","L"],
        ["Y","X","C","V","B","N","M"]
    ];

    rows.forEach(letters => {

        const row = document.createElement("div");
        row.className = "kbm-row";

        letters.forEach(letter => {

            const btn = document.createElement("button");
            btn.className = "kbm-key";
            btn.textContent = letter;

            btn.onclick = () => {
                keyboardInput.value += letter;
            };

            row.appendChild(btn);
        });

        keyboardGrid.appendChild(row);
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
