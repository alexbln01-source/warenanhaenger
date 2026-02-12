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
const keyboardGrid = document.getElementById("keyboardGrid");

function renderKeyboard() {

    keyboardGrid.innerHTML = "";

    const letters = [
        "A","B","C","D","E","F","G",
        "H","I","J","K","L","M","N",
        "O","P","Q","R","S","T","U",
        "V","W","X","Y","Z"
    ];

    letters.forEach(letter => {
        const btn = document.createElement("button");
        btn.textContent = letter;
        btn.className = "keyboard-btn";
        btn.onclick = () => {
            keyboardInput.value += letter;
        };
        keyboardGrid.appendChild(btn);
    });

    // Leerzeichen
    const space = document.createElement("button");
    space.textContent = "SPACE";
    space.className = "keyboard-btn";
    space.onclick = () => keyboardInput.value += " ";
    keyboardGrid.appendChild(space);

    // Löschen
    const del = document.createElement("button");
    del.textContent = "⌫";
    del.className = "keyboard-btn";
    del.onclick = () =>
        keyboardInput.value =
            keyboardInput.value.slice(0,-1);
    keyboardGrid.appendChild(del);

    // OK Button
    const ok = document.createElement("button");
    ok.textContent = "OK";
    ok.className = "keyboard-btn ok";
    ok.onclick = () => {

        if (!keyboardInput.value.trim()) {
            alert("Bitte Kundennamen eingeben.");
            return;
        }

        selectedCustomer = "SONSTIGE";
        popup.style.display = "none";
    };

    keyboardGrid.appendChild(ok);
}
