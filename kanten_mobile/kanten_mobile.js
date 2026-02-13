<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">

<title>Warenanhänger</title>
<link rel="stylesheet" href="kanten_mobile.css">
</head>
<body>

<div id="card">

    <div class="grid-label spacer-top">WARENANHÄNGER AUSWÄHLEN</div>

    <div class="art-btn-row">
        <button id="btnKanten" class="artBtn">Kanten</button>
        <button id="btnSchweissen" class="artBtn">Schweißen</button>
        <button id="btnBohrwerk" class="artBtn">Bohrwerk</button>
        <button id="btnEiltSehr" class="artBtn eilt-art">
            <span class="art-title">Anhänger</span>
            <span class="art-sub">Eilt Sehr</span>
        </button>
    </div>

    <div class="grid-label">KUNDE AUSWÄHLEN</div>

    <!-- PC Eingabefeld -->
    <div id="pcInputWrapper" style="display:none; margin:10px 0;">
        <input id="pcKeyboardInput"
               type="text"
               placeholder="Kundennamen eingeben"
               style="width:100%; padding:10px; font-size:18px;">
    </div>

    <div class="section">
        <div id="kundenArea" class="disabled">
            <button class="kundeBtn" data-kunde="Backhus">Backhus</button>
            <button class="kundeBtn" data-kunde="Bergmann M-H">Bergmann M-H</button>
            <button class="kundeBtn" data-kunde="Bücker">Bücker</button>
            <button class="kundeBtn" data-kunde="FVG">FVG</button>
            <button class="kundeBtn" data-kunde="Grimme">Grimme</button>
            <button class="kundeBtn" data-kunde="Janzen">Janzen</button>
            <button class="kundeBtn" data-kunde="Krone Spelle">Krone Spelle</button>
            <button class="kundeBtn" data-kunde="L.Bergmann">L.Bergmann</button>
            <button class="kundeBtn" data-kunde="PAUS">PAUS</button>
            <button class="kundeBtn" data-kunde="TOS">TOS</button>
            <button class="kundeBtn" data-kunde="SONSTIGE">
                Sonstige Kunden
            </button>
        </div>
    </div>

    <div id="actionButtons">
        <button id="btnBack">◀ Zurück</button>
        <button id="btnDrucken">🖨️ Drucken</button>
    </div>

</div>

<!-- ================= TASTATUR POPUP ================= -->

<div id="keyboardPopup" class="keyboard-popup">
    <div class="keyboard-box">

        <div class="keyboard-title">
            Kundenname eingeben
        </div>

        <input id="keyboardInput" type="text" readonly>

        <div id="keyboardGrid" class="keyboard-grid"></div>

    </div>
</div>

<script>

/* ================= GERÄTEERKENNUNG ================= */
const isTouchDevice = window.matchMedia("(pointer:coarse)").matches;

let selectedCustomer = "";
let selectedArt = "";

const popup            = document.getElementById("keyboardPopup");
const keyboardInput    = document.getElementById("keyboardInput");
const keyboardGrid     = document.getElementById("keyboardGrid");
const kundenArea       = document.getElementById("kundenArea");

const pcInputWrapper   = document.getElementById("pcInputWrapper");
const pcKeyboardInput  = document.getElementById("pcKeyboardInput");

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

document.getElementById("btnEiltSehr").onclick = () => {

    selectedArt = "eilt_sehr";
    selectedCustomer = "EILT_SEHR";

    clearArtSelection();
    document.getElementById("btnEiltSehr").classList.add("active");

    clearCustomerSelection();

    popup.style.display = "none";
    pcInputWrapper.style.display = "none";
    kundenArea.classList.add("disabled");
};

document.getElementById("btnKanten").onclick =
    () => setNormalArt("kanten", "btnKanten");

document.getElementById("btnSchweissen").onclick =
    () => setNormalArt("schweissen", "btnSchweissen");

document.getElementById("btnBohrwerk").onclick =
    () => setNormalArt("bohrwerk", "btnBohrwerk");

function setNormalArt(art, btnId) {

    selectedArt = art;

    clearArtSelection();
    document.getElementById(btnId).classList.add("active");

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
            keyboardInput.value = "";
            pcKeyboardInput.value = "";

            if (isTouchDevice) {

                popup.style.display = "flex";
                pcInputWrapper.style.display = "none";

                renderKeyboard();

                setTimeout(() => {
                    keyboardInput.focus();
                }, 150);

            } else {

                popup.style.display = "none";
                pcInputWrapper.style.display = "block";

                setTimeout(() => {
                    pcKeyboardInput.focus();
                }, 50);
            }

        } else {

            selectedCustomer = kunde;
            popup.style.display = "none";
            pcInputWrapper.style.display = "none";
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

        if (isTouchDevice) {
            kundeName = keyboardInput.value.trim();
        } else {
            kundeName = pcKeyboardInput.value.trim();
        }

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

/* ================= MINI KEYBOARD ================= */

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

    const bottomRow = document.createElement("div");
    bottomRow.className = "kbm-row bottom-row";

    const del = document.createElement("button");
    del.className = "kbm-key";
    del.textContent = "⌫";
    del.onclick = () => {
        keyboardInput.value =
            keyboardInput.value.slice(0, -1);
    };

    const space = document.createElement("button");
    space.className = "kbm-key space";
    space.textContent = "␣";
    space.onclick = () => {
        keyboardInput.value += " ";
    };

    const ok = document.createElement("button");
    ok.className = "kbm-key ok";
    ok.textContent = "OK";
    ok.onclick = () => {
        popup.style.display = "none";
    };

    bottomRow.appendChild(del);
    bottomRow.appendChild(space);
    bottomRow.appendChild(ok);

    keyboardGrid.appendChild(bottomRow);
}

</script>

</body>
</html>
