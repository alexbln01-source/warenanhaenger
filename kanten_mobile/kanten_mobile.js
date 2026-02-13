// ============================================================
//  KANTEN – kanten_mobile.js (STABIL)
//  - Zebra/Mobile: Popup-Tastatur (QWERTZ) bleibt
//  - PC: Bei "Sonstige Kunden" -> zentriertes Eingabe-Overlay
//  - Anzeige: oben links Gerät, unten rechts Build
//  - Wenn Sonstige Name gesetzt -> Button Text wird Name
//  - Zurück: wie in PAUS (base path)
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
//  BUILD STAMP (wie du es willst: 20260213.1338)
// ============================================================
function buildStamp() {
  const d = new Date(document.lastModified);
  const y  = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}${mo}${da}.${hh}${mm}`;
}


// ============================================================
//  DOM ELEMENTE (deine IDs)
// ============================================================
const deviceInfo   = document.getElementById("deviceInfo");   // oben links
const buildInfo    = document.getElementById("buildInfo");    // unten rechts

const popup         = document.getElementById("keyboardPopup");
const keyboardInput = document.getElementById("keyboardInput");
const keyboardGrid  = document.getElementById("keyboardGrid");
const kundenArea    = document.getElementById("kundenArea");

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

// Sonstige Namen speichern
let sonstigeName = "";

// Referenz auf Sonstige Button
let sonstigeBtn = null;


// ============================================================
//  CORNER INFO (OHNE CSS ÄNDERN, nur inline Styles setzen)
// ============================================================
function setCornerInfo() {
  const deviceLabel =
    isTC22 ? "Zebra TC22" :
    isTC21 ? "Zebra TC21" :
    isZebra ? "Zebra" :
    isMobile ? "Mobil" : "PC";

  if (deviceInfo) {
    deviceInfo.textContent = "Gerät: " + deviceLabel;

    // erzwinge oben links (egal was CSS macht)
    deviceInfo.style.position  = "fixed";
    deviceInfo.style.top       = "8px";
    deviceInfo.style.left      = "12px";
    deviceInfo.style.right     = "auto";
    deviceInfo.style.bottom    = "auto";
    deviceInfo.style.transform = "none";
    deviceInfo.style.margin    = "0";
    deviceInfo.style.zIndex    = "9999";
    deviceInfo.style.width     = "auto";
  }

  if (buildInfo) {
    buildInfo.textContent = "Build " + buildStamp();

    // erzwinge unten rechts
    buildInfo.style.position  = "fixed";
    buildInfo.style.bottom    = "8px";
    buildInfo.style.right     = "12px";
    buildInfo.style.left      = "auto";
    buildInfo.style.top       = "auto";
    buildInfo.style.transform = "none";
    buildInfo.style.margin    = "0";
    buildInfo.style.zIndex    = "9999";
    buildInfo.style.width     = "auto";
  }
}


// ============================================================
//  SONSTIGE: Button Text ändern
// ============================================================
function setSonstigeName(name) {
  sonstigeName = name.trim();
  selectedCustomer = "SONSTIGE";

  if (sonstigeBtn) {
    sonstigeBtn.textContent = sonstigeName || "Sonstige Kunden";
  }
}

function resetSonstigeButton() {
  sonstigeName = "";
  if (sonstigeBtn) {
    sonstigeBtn.textContent = "Sonstige Kunden";
  }
}


// ============================================================
//  PC INPUT OVERLAY (zentriert, NICHT unten!)
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
  pcInputWrapper.style.zIndex = "100000";
  pcInputWrapper.style.minWidth = "360px";
  pcInputWrapper.style.textAlign = "center";

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
    const name = (pcCustomerInput.value || "").trim();
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
  if (!isPC || !pcInputWrapper || !pcCustomerInput) return;
  pcCustomerInput.value = sonstigeName || "";
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
document.addEventListener("DOMContentLoaded", () => {

  // Popup aus
  if (popup) popup.style.display = "none";

  // Kunden disabled
  if (kundenArea) kundenArea.classList.add("disabled");

  // Sonstige Button merken
  sonstigeBtn = document.querySelector('.kundeBtn[data-kunde="SONSTIGE"]');

  // Corner Info
  setCornerInfo();

  // PC Overlay bauen
  createPcInput();

  // Zebra/Mobile: Android Softkeyboard blocken (wie PAUS)
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

  if (kundenArea) kundenArea.classList.add("disabled");
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

  if (kundenArea) kundenArea.classList.remove("disabled");
}


// ============================================================
//  KUNDEN BUTTONS
// ============================================================
document.querySelectorAll(".kundeBtn").forEach(btn => {
  btn.onclick = () => {

    if (kundenArea && kundenArea.classList.contains("disabled")) {
      alert("Bitte zuerst eine Art auswählen.");
      return;
    }

    clearCustomerSelection();
    btn.classList.add("active");

    const kunde = btn.dataset.kunde;

    if (kunde === "SONSTIGE") {
      selectedCustomer = "SONSTIGE";

      if (isPC) {
        // PC: zentriertes Overlay (kein Feld unten!)
        if (popup) popup.style.display = "none";
        openPcInput();
      } else {
        // Zebra/Mobile: Popup + QWERTZ Keyboard
        hidePcInput();
        if (keyboardInput) keyboardInput.value = sonstigeName || "";
        if (popup) popup.style.display = "flex";
        renderKeyboard();
        setTimeout(() => keyboardInput && keyboardInput.focus(), 50);
      }

    } else {
      selectedCustomer = kunde;

      if (popup) popup.style.display = "none";
      if (keyboardInput) keyboardInput.value = "";
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

  if (selectedCustomer === "SONSTIGE") {
    if (!sonstigeName.trim()) return alert("Bitte Kundennamen eingeben.");
    kundeName = sonstigeName.trim();
  }

  location.href =
    "druck_kanten.html?kunde=" + encodeURIComponent(kundeName) +
    "&art=" + encodeURIComponent(selectedArt);
};


// ============================================================
//  ZURÜCK (wie PAUS)
// ============================================================
btnBack.onclick = () => {
  const base = location.pathname.split("/").slice(0, -2).join("/");
  window.location.href = base + "/index.html";
};


// ============================================================
//  TASTATUR (Zebra/Mobile) – DEIN QWERTZ Layout (⌫ ␣ OK)
// ============================================================
function renderKeyboard() {
  if (!keyboardGrid || !keyboardInput) return;

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
      const b = document.createElement("button");
      b.className = "kbm-key";
      b.textContent = letter;
      b.onclick = () => { keyboardInput.value += letter; };
      row.appendChild(b);
    });

    keyboardGrid.appendChild(row);
  });

  const bottomRow = document.createElement("div");
  bottomRow.className = "kbm-row bottom-row";

  const del = document.createElement("button");
  del.className = "kbm-key";
  del.textContent = "⌫";
  del.onclick = () => {
    keyboardInput.value = keyboardInput.value.slice(0, -1);
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
    const name = keyboardInput.value.trim();
    if (!name) return alert("Bitte Kundennamen eingeben.");

    setSonstigeName(name);     // Button wird zum Namen
    popup.style.display = "none";
  };

  bottomRow.appendChild(del);
  bottomRow.appendChild(space);
  bottomRow.appendChild(ok);

  keyboardGrid.appendChild(bottomRow);
}
