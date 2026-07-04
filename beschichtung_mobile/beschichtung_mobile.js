let selectedType = null;
let isEilt = false;

const beistell   = document.getElementById("beistellInput");
const kundenname = document.getElementById("kundeInput");
const keyboardPopup    = document.getElementById("keyboardPopup");
const keyboardTitle    = document.getElementById("keyboardTitle");
const keyboardInput    = document.getElementById("keyboardInput");
const keyboardKeysNum    = document.getElementById("keyboardKeysNum");
const keyboardKeysAlpha  = document.getElementById("keyboardKeysAlpha");
const keyboardClose      = document.getElementById("keyboardClose");
const keyboardDelete     = document.getElementById("keyboardDelete");
const keyboardOK         = document.getElementById("keyboardOK");
const keyboardDeleteAlpha = document.getElementById("keyboardDeleteAlpha");
const keyboardOKAlpha    = document.getElementById("keyboardOKAlpha");
const druckenBtn = document.getElementById("druckenBtn");
const eiltBtn    = document.getElementById("eiltBtn");
const backBtn    = document.getElementById("backBtn");
const kundenButtons = Array.from(document.querySelectorAll(".kunde-btn"));

let activeInput = null;
let keyboardMode = "num";

const BUILD = "besc22";

const ua  = navigator.userAgent.toLowerCase();
const sw  = Math.min(window.screen.width, window.screen.height);
const sh  = Math.max(window.screen.width, window.screen.height);
const dpr = window.devicePixelRatio;

const isMobile = /android|iphone|ipad|ipod/i.test(ua);
const isZebraTC21 = ua.includes("android") && (ua.includes("tc21") || (sw === 360 && sh === 640));
const isZebraTC22 = ua.includes("android") && (ua.includes("tc22") || (sw === 360 && sh === 720 && dpr === 3));
const isZebra = isZebraTC21 || isZebraTC22 || ua.includes("zebra");
const isPC = !isZebra && !isMobile;

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

function showKeyboardPanel(mode) {
    keyboardMode = mode;
    if (keyboardKeysNum) keyboardKeysNum.classList.toggle("hidden", mode !== "num");
    if (keyboardKeysAlpha) keyboardKeysAlpha.classList.toggle("hidden", mode !== "alpha");
    if (keyboardPopup) {
        keyboardPopup.classList.toggle("mode-num", mode === "num");
        keyboardPopup.classList.toggle("mode-alpha", mode === "alpha");
    }
}

function openKeyboard(input, mode) {
    if (!keyboardPopup || !keyboardInput) return;

    activeInput = input;
    highlightInput(input);
    showKeyboardPanel(mode);

    if (keyboardTitle) {
        keyboardTitle.textContent = mode === "num"
            ? "Beistellnummer"
            : "Kundenname";
    }

    keyboardInput.value = input.value;
    keyboardPopup.classList.add("is-open");
    document.body.classList.add("keyboard-open");
}

function closeKeyboard() {
    if (keyboardPopup) keyboardPopup.classList.remove("is-open");
    document.body.classList.remove("keyboard-open");
    activeInput = null;
    clearInputHighlight();
}

function syncKeyboardToField() {
    if (activeInput && keyboardInput) {
        activeInput.value = keyboardInput.value;
    }
}

function handleKeyPress(key) {
    if (!keyboardInput) return;
    keyboardInput.value += key;
    syncKeyboardToField();
}

function handleDelete() {
    if (!keyboardInput) return;
    keyboardInput.value = keyboardInput.value.slice(0, -1);
    syncKeyboardToField();
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
        deviceInfo.textContent = label;
    }

    if (buildInfo) {
        const d = new Date(document.lastModified);
        const stamp =
            d.getFullYear() +
            String(d.getMonth() + 1).padStart(2, "0") +
            String(d.getDate()).padStart(2, "0") + "." +
            String(d.getHours()).padStart(2, "0") +
            String(d.getMinutes()).padStart(2, "0");
        buildInfo.textContent = "Build " + stamp;
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

    beistell.addEventListener("click", () => openKeyboard(beistell, "num"));
    kundenname.addEventListener("click", () => openKeyboard(kundenname, "alpha"));

    if (keyboardPopup) {
        keyboardPopup.addEventListener("click", (e) => {
            const btn = e.target.closest(".kb-key");
            if (!btn) return;

            if (btn.id === "keyboardDelete" || btn.id === "keyboardDeleteAlpha") {
                handleDelete();
                return;
            }

            if (btn.id === "keyboardOK") {
                syncKeyboardToField();
                openKeyboard(kundenname, "alpha");
                return;
            }

            if (btn.id === "keyboardOKAlpha") {
                syncKeyboardToField();
                closeKeyboard();
                return;
            }

            if (btn.dataset.key) {
                handleKeyPress(btn.dataset.key);
            }
        });
    }

    if (keyboardClose) {
        keyboardClose.onclick = () => {
            syncKeyboardToField();
            closeKeyboard();
        };
    }
} else {
    if (keyboardPopup) keyboardPopup.classList.remove("is-open");
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
