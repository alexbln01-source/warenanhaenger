// ============================================================
//  KANTEN – kanten_mobile.js
//  - Zebra/Mobile: Popup-Tastatur bleibt
//  - PC: Bei "Sonstige Kunden" öffnet sich ein Eingabefeld (PC-Tastatur)
//  - Anzeige: oben links Gerätemodell, unten rechts Build 20260213.1338
// ============================================================

// ============================================================
//  DEVICE DETECTION (wie in PAUS)
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
//  DOM ELEMENTE
// ============================================================
const deviceInfo   = document.getElementById("deviceInfo");   // oben links
const buildInfo    = document.getElementById("buildInfo");    // unten rechts

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
//  STATE
// ============================================================
let selectedCustomer = "";
let selectedArt = "";

// ============================================================
//  BODY KLASSEN (CSS passt sich an)
// ============================================================
if (isPC) document.body.classList.add("pc-device");
if (isTC21) document.body.classList.add("zebra-tc21");
if (isTC22) document.body.classList.add("zebra-tc22");

if (isTC22) document.body.classList.add("zebra-tc22");

// ============================================================
//  DEVICE INFO (oben links) + BUILD (unten rechts)
// ============================================================
function setCornerInfo() {

  const deviceLabel =
    isTC22 ? "Zebra TC22" :
    isTC21 ? "Zebra TC21" :
    isZebra ? "Zebra" :
    isMobile ? "Mobil" : "PC";

  // ---- OBEN LINKS ----
  if (deviceInfo) {
    deviceInfo.textContent = "Gerät: " + deviceLabel;

    deviceInfo.style.position = "fixed";
    deviceInfo.style.top = "8px";
    deviceInfo.style.left = "12px";
    deviceInfo.style.right = "auto";
    deviceInfo.style.bottom = "auto";
    deviceInfo.style.transform = "none";
    deviceInfo.style.zIndex = "9999";
  }

  // ---- UNTEN RECHTS ----
  if (buildInfo) {
    buildInfo.textContent = "Build " + buildStamp();

    buildInfo.style.position = "fixed";
    buildInfo.style.bottom = "8px";
    buildInfo.style.right = "12px";
    buildInfo.style.left = "auto";
    buildInfo.style.top = "auto";
    buildInfo.style.transform = "none";
    buildInfo.style.zIndex = "9999";
  }
}

// Format: 20260213.1338
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
//  PC INPUT POPUP (nur PC, nur "Sonstige Kunden")
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
  pcInputWrapper.style.background = "#ffffff";
  pcInputWrapper.style.padding = "22px";
  pcInputWrapper.style.borderRadius = "14px";
  pcInputWrapper.style.boxShadow = "0 10px 30px rgba(0,0,0,0.25)";
  pcInputWrapper.style.zIndex = "10000";
  pcInputWrapper.style.minWidth = "360px";
  pcInputWrapper.style.textAlign = "center";

  pcInputWrapper.innerHTML = `
    <div style="font-weight:800; margin-bottom:10px; color:#003a73;">
      Kundenname eingeben
    </div>

    <input id="pcCustomerInput"
           type="text"
           placeholder="Kundenname"
           style="
             width:320px;
             max-width:80vw;
             padding:14px;
             font-size:20px;
             border-radius:10px;
             border:2px solid #1976d2;
             outline:none;
             text-align:center;
           ">

    <div style="display:flex; gap:10px; justify-content:center; margin-top:14px;">
      <button id="pcCustomerCancel"
              style="
                padding:10px 18px;
                border-radius:10px;
                border:2px solid #c7cdd6;
                background:#f1f3f6;
                font-weight:800;
              ">Abbrechen</button>

      <button id="pcCustomerOk"
              style="
                padding:10px 18px;
                border-radius:10px;
                border:none;
                background:#007bff;
                color:white;
                font-weight:900;
              ">OK</button>
    </div>
  `;

  document.body.appendChild(pcInputWrapper);

  pcCustomerInput = pcInputWrapper.querySelector("#pcCustomerInput");

  pcInputWrapper.querySelector("#pcCustomerCancel").onclick = () => {
    pcInputWrapper.style.display = "none";
  };

  pcInputWrapper.querySelector("#pcCustomerOk").onclick = () => {
    if (!pcCustomerInput.value.trim()) {
      alert("Bitte Kundennamen eingeben.");
      return;
    }
    pcInputWrapper.style.display = "none";
  };

  // ENTER bestätigt
  pcCustomerInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      pcInputWrapper.querySelector("#pcCustomerOk").click();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      pcInputWrapper.querySelector("#pcCustomerCancel").click();
    }
  });
}

function openPcInput() {
  if (!isPC || !pcInputWrapper || !pcCustomerInput) return;
  pcInputWrapper.style.display = "block";
  setTimeout(() => pcCustomerInput.focus(), 20);
}

function hidePcInput() {
  if (!pcInputWrapper) return;
  pcInputWrapper.style.display = "none";
}

// ============================================================
//  INIT
// ============================================================
popup.style.display = "none";
kundenArea.classList.add("disabled");

document.addEventListener("DOMContentLoaded", () => {
  setCornerInfo();
  createPcInput();

  // Android Softkeyboard unterdrücken (nur Zebra/Mobile)
  if (!isPC) {
    [keyboardInput].forEach(inp => {
      inp.setAttribute("inputmode", "none");
      inp.setAttribute("autocomplete", "off");
      inp.setAttribute("autocorrect", "off");
      inp.setAttribute("autocapitalize", "off");
      inp.setAttribute("spellcheck", "false");
    });
  }
});

// ============================================================
//  HILFSFUNKTIONEN (Active-Styles bleiben – CSS macht Blau)
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
//  ART BUTTONS
// ============================================================
btnEiltSehr.onclick = () => {
  selectedArt = "eilt_sehr";
  selectedCustomer = "EILT_SEHR";

  clearArtSelection();
  btnEiltSehr.classList.add("active");

  clearCustomerSelection();

  popup.style.display = "none";
  keyboardInput.value = "";
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

  popup.style.display = "none";
  keyboardInput.value = "";
  hidePcInput();

  kundenArea.classList.remove("disabled");
}

// ============================================================
//  KUNDEN
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
      keyboardInput.value = "";

      if (isPC) {
        // 💻 PC → echtes Eingabefeld (Popup mittig)
        popup.style.display = "none";
        openPcInput();
      } else {
        // 📱 Zebra/Mobile → Popup-Tastatur
        hidePcInput();
        popup.style.display = "flex";
        renderKeyboard();
        setTimeout(() => keyboardInput.focus(), 20);
      }

    } else {
      selectedCustomer = kunde;
      popup.style.display = "none";
      hidePcInput();
    }
  };
});

// ============================================================
//  DRUCK
// ============================================================
btnDrucken.onclick = () => {

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
    if (isPC) {
      if (!pcCustomerInput) {
        alert("PC Eingabefeld fehlt.");
        return;
      }
      kundeName = pcCustomerInput.value.trim();
    } else {
      kundeName = keyboardInput.value.trim();
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

// ============================================================
//  ZURÜCK
// ============================================================
btnBack.onclick = () => {
  window.location.replace("../index.html?reload=" + Date.now());
};

// ============================================================
//  TASTATUR (Zebra/Mobile)
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
      btn.onclick = () => { keyboardInput.value += letter; };
      row.appendChild(btn);
    });

    keyboardGrid.appendChild(row);
  });

  const bottomRow = document.createElement("div");
  bottomRow.className = "kbm-row bottom-row";

  const del = document.createElement("button");
  del.className = "kbm-key";
  del.textContent = "⌫";
  del.onclick = () => { keyboardInput.value = keyboardInput.value.slice(0, -1); };

  const space = document.createElement("button");
  space.className = "kbm-key space";
  space.textContent = "␣";
  space.onclick = () => { keyboardInput.value += " "; };

  const ok = document.createElement("button");
  ok.className = "kbm-key ok";
  ok.textContent = "OK";
  ok.onclick = () => {
    if (!keyboardInput.value.trim()) {
      alert("Bitte Kundennamen eingeben.");
      return;
    }
    popup.style.display = "none";
  };

  bottomRow.appendChild(del);
  bottomRow.appendChild(space);
  bottomRow.appendChild(ok);

  keyboardGrid.appendChild(bottomRow);
}
