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

    const rows = [
        ["Q","W","E","R","T","Z","U","I","O","P"],
        ["A","S","D","F","G","H","J","K","L"],
        ["Y","X","C","V","B","N","M"]
    ];

    rows.forEach((letters, index) => {

        const row = document.createElement("div");
        row.className = "keyboard-row";

        if (letters.length === 10) row.classList.add("row-10");
        if (letters.length === 9)  row.classList.add("row-9");
        if (letters.length === 7)  row.classList.add("row-8");

        letters.forEach(letter => {

            const btn = document.createElement("button");
            btn.textContent = letter;
            btn.className = "keyboard-btn";

            btn.onclick = () => {
                keyboardInput.value += letter;
            };

            row.appendChild(btn);
        });

        keyboardGrid.appendChild(row);
    });

    // Letzte Reihe (DEL + OK)
    const bottomRow = document.createElement("div");
    bottomRow.className = "keyboard-row row-8";

    const del = document.createElement("button");
    del.textContent = "⌫";
    del.className = "keyboard-btn";
    del.onclick = () =>
        keyboardInput.value =
            keyboardInput.value.slice(0,-1);

    const ok = document.createElement("button");
    ok.textContent = "OK";
    ok.className = "keyboard-btn ok";
    ok.onclick = () => {

        if (!keyboardInput.value.trim()) {
            alert("Bitte Kundennamen eingeben.");
            return;
        }

        popup.style.display = "none";
    };

    bottomRow.appendChild(del);

    for (let i = 0; i < 5; i++) {
        const spacer = document.createElement("div");
        bottomRow.appendChild(spacer);
    }

    bottomRow.appendChild(ok);

    keyboardGrid.appendChild(bottomRow);
}
