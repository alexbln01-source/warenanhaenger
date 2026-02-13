// ============================================================
//  KANTEN – kanten_mobile.js
//  - Zebra/Mobile: Popup-Tastatur bleibt
//  - PC: Bei "Sonstige Kunden" öffnet sich ein Eingabefeld (PC-Tastatur)
//  - Anzeige: oben links Gerätemodell, unten rechts Build
//  - Wenn Sonstige Name gesetzt -> Button Text wird Name
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
//  BUILD (fix oder automatisch)
// ============================================================
// Wenn du FIX willst: const BUILD_FIXED = "20260213.1338";
const BUILD_FIXED = null; // <- auf "20260213.1338" setzen, wenn du fix willst

function buildStamp() {
  if (BUILD_FIXED) return BUILD_FIXED;

  const d = new Date(document.lastModified);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}${m}${day}.${hh}${mm}`;
}

// ============================================================
//  DOM ELEMENTE (deine bestehenden IDs)
// ============================================================
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

// Sonstige Name extra speichern (wichtig!)
let sonstigeName = "";

// Referenz auf Sonstige Button
let sonstigeBtn = null;

// ============================================================
//  FIXED OVERLAY: Gerät oben links / Build unten rechts
//  (ohne CSS anzufassen, immer korrekt)
// ============================================================
let cornerDeviceEl = null;
let cornerBuildEl = null;

function ensureCornerOverlays() {
  if (!cornerDeviceEl) {
    cornerDeviceEl = document.createElement("div");
    cornerDeviceEl.id = "cornerDeviceInfo";
    document.body.appendChild(cornerDeviceEl);
  }
  if (!cornerBuildEl) {
    cornerBuildEl = document.createElement("div");
    cornerBuildEl.id = "cornerBuildInfo";
    document.body.appendChild(cornerBuildEl);
  }

  // Style komplett inline -> egal was CSS macht
  Object.assign(cornerDeviceEl.style, {
    position: "fixed",
    top: "8px",
    left: "12px",
    right: "auto",
    bottom: "auto",
    transform: "none",
    margin: "0",
    padding: "0",
    zIndex: "999999",
    fontSize: "13px",
    fontWeight: "800",
    color: "#444",
    whiteSpace: "nowrap",
    pointerEvents: "none"
  });

  Object.assign(cornerBuildEl.style, {
    position: "fixed",
    bottom: "8px",
    right: "12px",
    left: "auto",
    top: "auto",
    transform: "none",
    margin: "0",
    padding: "0",
    zIndex: "999999",
    fontSize: "11px",
    fontWeight: "600",
    color: "#444",
    opacity: "0.6",
    whiteSpace: "nowrap",
    pointerEvents: "none"
  });
}

function setCornerInfo() {
  ensureCornerOverlays();

  const deviceLabel =
    isTC22 ? "Zebra TC22" :
    isTC21 ? "Zebra TC21" :
    isZebra ? "Zebra" :
    isMobile ? "Mobil" : "PC";

  cornerDeviceEl.textContent = "Gerät: " + deviceLabel;
  cornerBuildEl.textContent = "Build " + buildStamp();
}

// ============================================================
//  PC INPUT POPUP (nur PC, nur Sonstige)
// ============================================================
let pcInputWrapper = null;
let pcCustomerInput = null;

function createPcInput() {
  if (!isPC) return;

  pcInputWrapper = document.createElement("div");
  Object.assign(pcInputWrapper.style, {
    display: "none",
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    background: "#fff",
    padding: "22px",
    borderRadius: "14px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    zIndex: "1000000",
    minWidth: "360px",
    textAlign: "center"
  });

  pcInputWrapper.innerHTML = `
    <div style="font-weight:900; margin-bottom:10px; color:#003a73;">
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
                font-weight:900;
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
    const name = pcCustomerInput.value.trim();
    if (!name) return alert("Bitte Kundennamen eingeben.");

    setSonstigeName(name);
    pcInputWrapper.style.display = "none";
  };

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
  if (!pcInputWrapper || !pcCustomerInput) return;
  pcInputWrapper.style.display = "block";
  setTimeout(() => pcCustomerInput.focus(), 20);
}

function hidePcInput() {
  if (!pcInputWrapper) return;
  pcInputWrapper.style.display = "none";
}

// ============================================================
//  Sonstige: Name setzen + Button Text ändern
// ============================================================
function setSonstigeName(name) {
  sonstigeName = name;
  selectedCustomer = "SONSTIGE";

  if (sonstigeBtn) {
    sonstigeBtn.textContent = name; // <-- Button wird zum Namen
  }
}

function resetSonstigeButton() {
  sonstigeName = "";
  if (sonstigeBtn) {
    sonstigeBtn.textContent = "Sonstige Kunden";
  }
}

// ============================================================
//  INIT
// ============================================================
document.addEventListener("DOMContentLoaded", () => {

  // Fix: Popup initial
  if (popup) popup.style.display = "none";
  if (kundenArea) kundenArea.classList.add("disabled");

  // Sonstige Button finden
  sonstigeBtn = document.querySelector('.kundeBtn[data-kunde="SONSTIGE"]');

  // Corner Info setzen
  setCornerInfo();

  // PC Popup erstellen
  createPcInput();

  // Android Softkeyboard unterdrücken (nur Zebra/Mobile)
  if (!isPC && keyboardInput) {
    keyboardInput.setAttribute("inputmode", "none");
    keyboardInput.setAttribute("autocomplete", "off");
    keyboardInput.setAttribute("autocorrect", "off");
    keyboardInput.setAttribute("autocapitalize", "off");
    keyboardInput.setAttribute("spellcheck", "false");
  }
});

// ============================================================
//  HILFSFUNKTIONEN
// ============================================================
function clearArtSelection() {
  document.querySelectorAll(".artBtn").forEach(b => b.classList.remove("active"));
}
function clearCustomerSelection() {
  document.querySelectorAll(".kundeBtn").forEach(b => b.classList.remove("active"));
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
  resetSonstigeButton();

  if (popup) popup.style.display = "none";
  if (keyboardInput) keyboardInput.value = "";
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
  resetSonstigeButton();

  if (popup) popup.style.display = "none";
  if (keyboardInput) keyboardInput.value = "";
  hidePcInput();

  kundenArea.classList.remove("disabled");
}

// ============================================================
//  KUNDEN BUTTONS
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

      // wenn schon ein Name gesetzt ist -> Button bleibt Name, aber du kannst neu tippen
      if (isPC) {
        if (pcCustomerInput) pcCustomerInput.value = sonstigeName || "";
        openPcInput();
      } else {
        if (keyboardInput) keyboardInput.value = sonstigeName || "";
        popup.style.display = "flex";
        renderKeyboard();
        setTimeout(() => keyboardInput.focus(), 20);
      }

    } else {
      selectedCustomer = kunde;

      if (popup) popup.style.display = "none";
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

  if (!selectedArt) return alert("Bitte eine Art auswählen.");
  if (!selectedCustomer) return alert("Bitte einen Kunden auswählen.");

  let kundeName = selectedCustomer;

  // Sonstige -> echten Namen nehmen
  if (selectedCustomer === "SONSTIGE") {

    if (isPC) {
      // PC: wenn noch nichts gesetzt, aus Input nehmen
      const val = (pcCustomerInput ? pcCustomerInput.value : "").trim();
      if (val) setSonstigeName(val);
    } else {
      // Mobile: wenn noch nichts gesetzt, aus KeyboardInput nehmen
      const val = (keyboardInput ? keyboardInput.value : "").trim();
      if (val) setSonstigeName(val);
    }

    if (!sonstigeName.trim()) return alert("Bitte Kundennamen eingeben.");
    kundeName = sonstigeName.trim();
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
//  TASTATUR (Zebra/Mobile) – wie dein Layout
// ============================================================
function renderKeyboard() {
  if (!keyboardGrid) return;

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
    const name = keyboardInput.value.trim();
    if (!name) return alert("Bitte Kundennamen eingeben.");

    setSonstigeName(name);        // <-- Button wird zum Namen
    popup.style.display = "none";
  };

  bottomRow.appendChild(del);
  bottomRow.appendChild(space);
  bottomRow.appendChild(ok);

  keyboardGrid.appendChild(bottomRow);
}
