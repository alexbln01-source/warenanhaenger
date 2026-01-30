/* =====================================================
   ZUSTAND
===================================================== */
let selectedCustomer = "";
let selectedArt = "";

/* =====================================================
   DOM
===================================================== */
const popup = document.getElementById("keyboardPopup");
const keyboardInput = document.getElementById("keyboardInput");
const sonstigeBtn = document.getElementById("sonstigeBtn");
const kundenArea = document.getElementById("kundenArea");

/* Startzustand */
popup.style.display = "none";
kundenArea.classList.add("disabled");

/* =====================================================
   KUNDEN BUTTONS
===================================================== */
document.querySelectorAll(".kundeBtn").forEach(btn => {
    btn.onclick = () => {

        document.querySelectorAll(".kundeBtn")
            .forEach(b => b.classList.remove("active"));

        btn.classList.add("active");

        const kunde = btn.dataset.kunde;

        if (kunde === "SONSTIGE") {
            selectedCustomer = "SONSTIGE";
            openKeyboard();
        } else {
            selectedCustomer = kunde;
            closeKeyboard();
        }
    };
});

/* =====================================================
   ART BUTTONS
===================================================== */
const btnKanten = document.getElementById("btnKanten");
const btnSchweissen = document.getElementById("btnSchweissen");
const btnBohrwerk = document.getElementById("btnBohrwerk");

btnKanten.onclick     = () => setArt("kanten", btnKanten);
btnSchweissen.onclick = () => setArt("schweissen", btnSchweissen);
btnBohrwerk.onclick   = () => setArt("bohrwerk", btnBohrwerk);

function setArt(art, btn) {
    selectedArt = art;

    document.querySelectorAll(".artBtn")
        .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");
    kundenArea.classList.remove("disabled");
}

/* =====================================================
   DRUCKEN
===================================================== */
document.getElementById("btnDrucken").onclick = () => {

    if (!selectedArt) {
        alert("Bitte Art auswählen!");
        return;
    }

    if (!selectedCustomer) {
        alert("Bitte Kunden auswählen!");
        return;
    }

    let kundeName = selectedCustomer;

    if (selectedCustomer === "SONSTIGE") {
        kundeName = keyboardInput.value.trim();
        if (!kundeName) {
            alert("Bitte Kundennamen eingeben!");
            return;
        }
    }

    location.href =
        "druck_kanten.html?kunde=" + encodeURIComponent(kundeName) +
        "&art=" + encodeURIComponent(selectedArt);
};

/* =====================================================
   ZURÜCK
===================================================== */
document.getElementById("btnBack").onclick = () => history.back();

/* =====================================================
   POPUP TASTATUR
   - PC: normale Tastatureingabe erlaubt
   - Android/Zebra: nur Popup-Tastatur
===================================================== */
function openKeyboard() {
    popup.style.display = "flex";
    keyboardInput.value = "";

    if (document.body.classList.contains("pc-device")) {
        keyboardInput.removeAttribute("readonly");
        keyboardInput.removeAttribute("tabindex");
        keyboardInput.focus();
    } else {
        keyboardInput.setAttribute("readonly", "");
        keyboardInput.setAttribute("tabindex", "-1");
    }
}

function closeKeyboard() {
    popup.style.display = "none";
    keyboardInput.setAttribute("readonly", "");
    keyboardInput.setAttribute("tabindex", "-1");
}

/* Buchstabentasten */
document.querySelectorAll(".kb").forEach(k => {
    k.onclick = () => {
        if (["kbDelete","kbSpace","kbOk"].includes(k.id)) return;
        keyboardInput.value += k.textContent;
    };
});

kbDelete.onclick = () => keyboardInput.value = keyboardInput.value.slice(0, -1);
kbSpace.onclick  = () => keyboardInput.value += " ";

kbOk.onclick = () => {
    const name = keyboardInput.value.trim();
    if (!name) return;

    sonstigeBtn.textContent = name;
    selectedCustomer = name;
    closeKeyboard();
};

kbCancel.onclick = closeKeyboard;

/* Enter-Taste (nur relevant am PC) */
keyboardInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
        e.preventDefault();
        kbOk.click();
    }
});

/* =====================================================
   GERÄTEERKENNUNG
===================================================== */
const ua = navigator.userAgent.toLowerCase();
const sw = screen.width;
const sh = screen.height;
const dpr = devicePixelRatio;

const isMobile = /android|iphone|ipad|ipod/i.test(ua);
const isTC21 = ua.includes("android") && sw === 360 && sh === 640;
const isTC22 = ua.includes("android") && sw === 360 && sh === 720 && dpr === 3;

if (isTC21) document.body.classList.add("zebra-tc21");
if (isTC22) document.body.classList.add("zebra-tc22");
if (!isMobile && !isTC21 && !isTC22) {
    document.body.classList.add("pc-device");
}

document.getElementById("deviceInfo").textContent =
    isTC22 ? "Gerät: Zebra TC22" :
    isTC21 ? "Gerät: Zebra TC21" :
    isMobile ? "Gerät: Mobile" :
    "Gerät: PC";

/* =====================================================
   BUILD
===================================================== */
const lm = new Date(document.lastModified);
document.getElementById("buildInfo").textContent =
    "Build " +
    lm.getFullYear() +
    String(lm.getMonth()+1).padStart(2,"0") +
    String(lm.getDate()).padStart(2,"0") + "." +
    String(lm.getHours()).padStart(2,"0") +
    String(lm.getMinutes()).padStart(2,"0");