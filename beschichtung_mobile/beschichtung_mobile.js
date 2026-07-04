let selectedType = null;
let isEilt = false;

const beistell   = document.getElementById("beistellInput");
const kundenname = document.getElementById("kundeInput");
const numKb      = document.getElementById("numKeyboard");
const alphaKb    = document.getElementById("alphaKeyboard");
const druckenBtn = document.getElementById("druckenBtn");
const eiltBtn    = document.getElementById("eiltBtn");
const backBtn    = document.getElementById("backBtn");
const kundenButtons = Array.from(document.querySelectorAll(".kunde-btn"));

let activeInput = null;

const BUILD = "besc7";

const ua  = navigator.userAgent.toLowerCase();
const sw  = Math.min(window.screen.width, window.screen.height);
const sh  = Math.max(window.screen.width, window.screen.height);
const dpr = window.devicePixelRatio;

const isMobile = /android|iphone|ipad|ipod/i.test(ua);
const isZebraTC21 = ua.includes("android") && (ua.includes("tc21") || (sw === 360 && sh === 640));
const isZebraTC22 = ua.includes("android") && (ua.includes("tc22") || (sw === 360 && sh === 720 && dpr === 3));
const isZebra = isZebraTC21 || isZebraTC22 || ua.includes("zebra");
const isPC = !isZebra && !isMobile;

function showKb(el) {
    if (el) el.classList.remove("hidden");
}

function hideKb(el) {
    if (el) el.classList.add("hidden");
}

function hideAllKb() {
    hideKb(numKb);
    hideKb(alphaKb);
}

function clearInputHighlight() {
    beistell.classList.remove("mobile-focus");
    kundenname.classList.remove("mobile-focus");
    beistell.blur();
    kundenname.blur();
}

function highlightInput(input) {
    clearInputHighlight();
    if (input) input.classList.add("mobile-focus");
}

function closeKeyboard() {
    hideAllKb();
    activeInput = null;
    clearInputHighlight();
}

function setCornerInfo() {
    const deviceInfo = document.getElementById("deviceInfo");
    const buildInfo  = document.getElementById("buildInfo");

    if (deviceInfo) {
        let label = "Gerät: PC";
        if (isZebraTC22) label = "Gerät: Zebra TC22";
        else if (isZebraTC21) label = "Gerät: Zebra TC21";
        else if (isZebra) label = "Gerät: Zebra";
        else if (isMobile) label = "Gerät: Mobil";
        deviceInfo.textContent = label + " · " + BUILD;
    }

    if (buildInfo) {
        const d = new Date(document.lastModified);
        const stamp =
            d.getFullYear() +
            String(d.getMonth() + 1).padStart(2, "0") +
            String(d.getDate()).padStart(2, "0") + "." +
            String(d.getHours()).padStart(2, "0") +
            String(d.getMinutes()).padStart(2, "0");
        buildInfo.textContent = "Beschichtung · Build " + stamp + " · " + BUILD;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.title = "Beschichtung";

    if (isMobile || isZebra) document.body.classList.add("phone-layout");
    if (isPC) document.body.classList.add("pc-device");

    if (isZebraTC21) document.body.classList.add("zebra-tc21");
    if (isZebraTC22) document.body.classList.add("zebra-tc22");
    if (isZebra) document.body.classList.add("zebra-device");

    setCornerInfo();
});

if (isMobile || isZebra) {
    beistell.readOnly = true;
    kundenname.readOnly = true;

    beistell.addEventListener("click", () => {
        activeInput = beistell;
        highlightInput(beistell);
        showKb(numKb);
        hideKb(alphaKb);
    });

    kundenname.addEventListener("click", () => {
        activeInput = kundenname;
        highlightInput(kundenname);
        hideKb(numKb);
        showKb(alphaKb);
    });

    document.querySelectorAll("#numKeyboard .kbm-key").forEach(key => {
        key.addEventListener("click", () => {
            if (!activeInput) return;

            if (key.id === "numDel") {
                activeInput.value = activeInput.value.slice(0, -1);
                return;
            }

            if (key.id === "numOk") {
                hideKb(numKb);
                activeInput = kundenname;
                highlightInput(kundenname);
                showKb(alphaKb);
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
                closeKeyboard();
                return;
            }

            activeInput.value += key.textContent;
        });
    });
} else {
    hideAllKb();
    beistell.readOnly = false;
    kundenname.readOnly = false;
}

eiltBtn.onclick = () => {
    closeKeyboard();
    isEilt = !isEilt;
    if (isEilt) {
        eiltBtn.textContent = "Eilt sehr: An";
        eiltBtn.classList.add("on");
    } else {
        eiltBtn.textContent = "Eilt sehr: Aus";
        eiltBtn.classList.remove("on");
    }
};

kundenButtons.forEach(btn => {
    btn.onclick = () => {
        closeKeyboard();

        kundenButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedType = btn.dataset.type;
    };
});

druckenBtn.onclick = () => {
    if (isEilt) {
        switch (selectedType) {
            case "LP":       selectedType = "LPEILT"; break;
            case "SCHUETTE": selectedType = "SCHUETTEEILT"; break;
            case "KLEY":     selectedType = "KLEYEILT"; break;
            case "KALEY":    selectedType = "KALEYEILT"; break;
            case "WOB":      selectedType = "WOBEILT"; break;
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

if (backBtn) {
    backBtn.onclick = () => {
        const base = location.pathname.split("/").slice(0, -2).join("/");
        window.location.href = base + "/index.html";
    };
}
