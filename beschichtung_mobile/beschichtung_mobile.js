let selectedType = null;
let isEilt = false;

/* ============================================================
   GRUNDREFERENZEN
============================================================ */
const beistell   = document.getElementById("beistellInput");
const kundenname = document.getElementById("kundeInput");
const numKb      = document.getElementById("numKeyboard");
const alphaKb    = document.getElementById("alphaKeyboard");


const druckenBtn = document.getElementById("druckenBtn");
const eiltBtn    = document.getElementById("eiltBtn");

const kundenButtons = Array.from(document.querySelectorAll(".kunde-btn"));

let activeInput       = null;
let lastCustomerIndex = 0;

/* ============================================================
   GERÄTEERKENNUNG
============================================================ */
const ua  = navigator.userAgent.toLowerCase();
const sw  = window.screen.width;
const sh  = window.screen.height;
const dpr = window.devicePixelRatio;

const isMobile = /android|iphone|ipad|ipod/i.test(ua);
const isZebraTC21 = ua.includes("android") && sw === 360 && sh === 640;
const isZebraTC22 = ua.includes("android") && sw === 360 && sh === 720 && dpr === 3;

if (isZebraTC21) document.body.classList.add("zebra-tc21");
if (isZebraTC22) document.body.classList.add("zebra-tc22");

if (!isMobile && !isZebraTC21 && !isZebraTC22) {
    document.body.classList.add("pc-device");
}

/* Debug-Ausgabe */
const deviceInfo = document.getElementById("deviceInfo");
if (deviceInfo) {
    if (isZebraTC22) deviceInfo.textContent = "Gerät: Zebra TC22";
    else if (isZebraTC21) deviceInfo.textContent = "Gerät: Zebra TC21";
    else if (isMobile) deviceInfo.textContent = "Gerät: Android / iOS";
    else deviceInfo.textContent = "Gerät: PC";
}

/* ============================================================
   MOBIL: POPUP-TASTATUREN
============================================================ */
if (isMobile) {

    beistell.readOnly   = true;
    kundenname.readOnly = true;

    beistell.addEventListener("click", () => {
        activeInput = beistell;
        beistell.classList.add("mobile-focus");
        kundenname.classList.remove("mobile-focus");
        numKb.style.display = "block";
        alphaKb.style.display = "none";
    });

    kundenname.addEventListener("click", () => {
        activeInput = kundenname;
        kundenname.classList.add("mobile-focus");
        beistell.classList.remove("mobile-focus");
        numKb.style.display = "none";
        alphaKb.style.display = "block";
    });

    document.querySelectorAll("#numKeyboard .kbm-key").forEach(key => {
        key.addEventListener("click", () => {
            if (!activeInput) return;

            if (key.id === "numDel") {
                activeInput.value = activeInput.value.slice(0, -1);
                return;
            }

            if (key.id === "numOk") {
                numKb.style.display = "none";
                activeInput = kundenname;
                kundenname.classList.add("mobile-focus");
                alphaKb.style.display = "block";
                return;
            }

            activeInput.value += key.textContent;
        });
    });

    document.querySelectorAll("#alphaKeyboard .kbm-key").forEach(key => {
        key.addEventListener("click", () => {

            if (!activeInput) return;

            if (key.id === "alphaDel") {
                activeInput.value = activeInput.value.slice(0, -1);
                return;
            }

            if (key.id === "alphaSpace") {
                activeInput.value += " ";
                return;
            }

            if (key.id === "alphaOk") {
                alphaKb.style.display = "none";
                activeInput = null;
                return;
            }

            activeInput.value += key.textContent;
        });
    });

} else {

    /* ============================================================
       PC MODUS
============================================================ */
    numKb.style.display   = "none";
    alphaKb.style.display = "none";

    beistell.readOnly   = false;
    kundenname.readOnly = false;
}

/* ============================================================
   EILT BUTTON
============================================================ */
eiltBtn.onclick = () => {
    isEilt = !isEilt;
    if (isEilt) {
        eiltBtn.textContent = "EILT SEHR: AN";
        eiltBtn.classList.add("on");
    } else {
        eiltBtn.textContent = "EILT SEHR: AUS";
        eiltBtn.classList.remove("on");
    }
};

/* ============================================================
   KUNDENBUTTON AUSWAHL + Tastatur schließen
============================================================ */
kundenButtons.forEach((btn, index) => {

    const selectCustomer = () => {
        kundenButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedType = btn.dataset.type;
        eiltBtn.focus();
    };

    btn.onclick = () => {

        beistell.blur();
        kundenname.blur();
        activeInput = null;

        numKb.style.display = "none";
        alphaKb.style.display = "none";

        beistell.classList.remove("mobile-focus");
        kundenname.classList.remove("mobile-focus");

        selectCustomer();
    };
});

/* ============================================================
   PRINT — EILT-Logik (MINIMAL ERWEITERT)
============================================================ */
druckenBtn.onclick = () => {

    if (isEilt) {
        switch (selectedType) {
            case "LP":       selectedType = "LPEILT"; break;
            case "SCHUETTE": selectedType = "SCHUETTEEILT"; break;
            case "KLEY":     selectedType = "KLEYEILT"; break;
            case "KALEY":    selectedType = "KALEYEILT"; break;
            case "WOB":      selectedType = "WOBEILT"; break;

            /* ✅ NUR DAS IST NEU */
            case "EKODEKOR": selectedType = "EKODEKOREILT"; break;
        }
    }

    const data = {
        beistell: beistell.value.trim(),
        selectedType: selectedType,
        kundename: kundenname.value.trim()
    };

    window.location.href =
        "druck.html?data=" + encodeURIComponent(JSON.stringify(data));
};

/* ============================================================
   BUILD INFO
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
    const lastMod = new Date(document.lastModified);
    const build =
        lastMod.getFullYear().toString() +
        String(lastMod.getMonth() + 1).padStart(2, "0") +
        String(lastMod.getDate()).padStart(2, "0") + "." +
        String(lastMod.getHours()).padStart(2, "0") +
        String(lastMod.getMinutes()).padStart(2, "0");

    const el = document.getElementById("buildInfo");
    if (el) el.textContent = "Build " + build;
});


