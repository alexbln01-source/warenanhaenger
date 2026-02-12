let selectedCustomer = "";
let selectedArt = "";

const popup         = document.getElementById("keyboardPopup");
const keyboardInput = document.getElementById("keyboardInput");
const kundenArea    = document.getElementById("kundenArea");

popup.style.display = "none";
kundenArea.classList.add("disabled");

/* ================= HILFSFUNKTIONEN ================= */

function clearArtSelection() {
    document.querySelectorAll(".artBtn")
        .forEach(b => b.classList.remove("active"));
}

function clearCustomerSelection() {
    document.querySelectorAll(".kundeBtn")
        .forEach(b => b.classList.remove("active"));
}

/* ================= ART BUTTONS ================= */

const btnEiltSehr   = document.getElementById("btnEiltSehr");
const btnKanten     = document.getElementById("btnKanten");
const btnSchweissen = document.getElementById("btnSchweissen");
const btnBohrwerk   = document.getElementById("btnBohrwerk");

btnEiltSehr.onclick = () => {

    selectedArt = "eilt_sehr";
    selectedCustomer = "EILT_SEHR";

    clearArtSelection();
    btnEiltSehr.classList.add("active");

    clearCustomerSelection();

    popup.style.display = "none";
    keyboardInput.value = "";

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

    kundenArea.classList.remove("disabled");
}

/* ================= KUNDEN ================= */

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

            popup.style.display = "flex";
            keyboardInput.value = "";

            if (typeof renderKeyboard === "function") {
                renderKeyboard();
            }

            setTimeout(() => {
                keyboardInput.focus();
            }, 50);

        } else {

            selectedCustomer = kunde;
            popup.style.display = "none";
        }
    };
});

/* ================= DRUCK ================= */

document.getElementById("btnDrucken").onclick = () => {

    if (selectedArt === "eilt_sehr") {
        location.href = "druck_kanten.html?kunde=EILT_SEHR";
        return;
    }

    if (!selectedArt) {
        alert("Bitte eine Art auswählen.");
        return;
    }

    if (!selectedCustomer) {
        alert("Bitte einen Kunden auswählen.");
        return;
    }

    let kundeName = selectedCustomer;

    if (kundeName === "SONSTIGE") {
        kundeName = keyboardInput.value.trim();
        if (!kundeName) {
            alert("Bitte Kundennamen eingeben.");
            return;
        }
    }

    location.href =
        "druck_kanten.html?kunde=" + encodeURIComponent(kundeName) +
        "&art=" + encodeURIComponent(selectedArt);
};

/* ================= ZURÜCK ================= */

document.getElementById("btnBack").onclick = () => {
    window.location.replace("../index.html?reload=" + Date.now());
};
/* ================= TASTATUR ================= */

const keyboardKeys = document.getElementById("keyboardKeys");
const kbOK         = document.getElementById("kbOK");
const kbClose      = document.getElementById("kbClose");

function renderKeyboard() {

    keyboardKeys.innerHTML = "";

    const keys = [
        "A","B","C","D","E","F","G",
        "H","I","J","K","L","M","N",
        "O","P","Q","R","S","T","U",
        "V","W","X","Y","Z",
        " "
    ];

    keys.forEach(key => {
        const btn = document.createElement("button");
        btn.textContent = key;
        btn.className = "kbKey";
        btn.onclick = () => {
            keyboardInput.value += key;
        };
        keyboardKeys.appendChild(btn);
    });
}

/* OK Button */
kbOK.onclick = () => {

    if (!keyboardInput.value.trim()) {
        alert("Bitte Kundennamen eingeben.");
        return;
    }

    selectedCustomer = "SONSTIGE";
    popup.style.display = "none";
};

/* Schließen Button */
kbClose.onclick = () => {
    popup.style.display = "none";
};
