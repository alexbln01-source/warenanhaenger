// ============================================================
//  KANTEN – kanten_mobile.js
// ============================================================

// ============================================================
//  DEVICE DETECTION (wie PAUS)
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
const deviceInfo   = document.getElementById("deviceInfo");
const buildInfo    = document.getElementById("buildInfo");

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

let sonstigeBtn = null;

// ============================================================
//  STATE
// ============================================================
let selectedCustomer = "";
let selectedArt = "";

// ============================================================
//  DEVICE INFO
// ============================================================
function setCornerInfo() {

  const deviceLabel =
    isTC22 ? "Zebra TC22" :
    isTC21 ? "Zebra TC21" :
    isZebra ? "Zebra" :
    isMobile ? "Mobil" : "PC";

  if (deviceInfo) {
    deviceInfo.textContent = "Gerät: " + deviceLabel;
    deviceInfo.style.position = "fixed";
    deviceInfo.style.top = "8px";
    deviceInfo.style.left = "12px";
    deviceInfo.style.zIndex = "9999";
  }

  if (buildInfo) {
    buildInfo.textContent = "Build " + buildStamp();
    buildInfo.style.position = "fixed";
    buildInfo.style.bottom = "8px";
    buildInfo.style.right = "12px";
    buildInfo.style.zIndex = "9999";
  }
}

function buildStamp() {
  const d = new Date(document.lastModified);
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  const hh = String(d.getHours()).padStart(2,"0");
  const mm = String(d.getMinutes()).padStart(2,"0");
  return `${y}${m}${day}.${hh}${mm}`;
}

// ============================================================
//  PC INPUT POPUP
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
  pcInputWrapper.style.background = "#fff";
  pcInputWrapper.style.padding = "20px";
  pcInputWrapper.style.borderRadius = "12px";
  pcInputWrapper.style.boxShadow = "0 10px 30px rgba(0,0,0,0.25)";
  pcInputWrapper.style.zIndex = "10000";

  pcInputWrapper.innerHTML = `
    <div style="font-weight:800; margin-bottom:10px;">Kundenname eingeben</div>
    <input id="pcCustomerInput" type="text"
      style="width:300px; padding:12px; font-size:18px; text-align:center;">
    <div style="margin-top:10px;">
      <button id="pcCustomerOk">OK</button>
      <button id="pcCustomerCancel">Abbrechen</button>
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

    selectedCustomer = name;

    if (sonstigeBtn) {
      sonstigeBtn.textContent = name;
    }

    pcInputWrapper.style.display = "none";
  };
}

function openPcInput() {
  if (!pcInputWrapper) return;
  pcInputWrapper.style.display = "block";
  setTimeout(()=>pcCustomerInput.focus(),20);
}

function hidePcInput() {
  if (!pcInputWrapper) return;
  pcInputWrapper.style.display = "none";
}

// ============================================================
//  INIT
// ============================================================
document.addEventListener("DOMContentLoaded", () => {

  setCornerInfo();
  createPcInput();

  sonstigeBtn = document.querySelector('[data-kunde="SONSTIGE"]');

  popup.style.display = "none";
  kundenArea.classList.add("disabled");
});

// ============================================================
//  HILFSFUNKTIONEN
// ============================================================
function clearArtSelection() {
  document.querySelectorAll(".artBtn")
    .forEach(b => b.classList.remove("active"));
}

function clearCustomerSelection() {
  document.querySelectorAll(".kundeBtn")
    .forEach(b => b.classList.remove("active"));
}

// Reset Sonstige Button
function resetSonstigeButton() {
  if (sonstigeBtn) {
    sonstigeBtn.textContent = "Sonstige Kunden";
  }
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

  kundenArea.classList.remove("disabled");
}

// ============================================================
//  KUNDEN
// ============================================================
document.querySelectorAll(".kundeBtn").forEach(btn => {

  btn.onclick = () => {

    if (kundenArea.classList.contains("disabled"))
      return alert("Bitte zuerst eine Art auswählen.");

    clearCustomerSelection();
    btn.classList.add("active");

    const kunde = btn.dataset.kunde;

    if (kunde === "SONSTIGE") {

      selectedCustomer = "SONSTIGE";

      if (isPC) {
        openPcInput();
      } else {
        popup.style.display = "flex";
        renderKeyboard();
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

  if (!selectedArt)
    return alert("Bitte eine Art auswählen.");

  if (!selectedCustomer)
    return alert("Bitte einen Kunden auswählen.");

  let kundeName = selectedCustomer;

  location.href =
    "druck_kanten.html?kunde=" + encodeURIComponent(kundeName) +
    "&art=" + encodeURIComponent(selectedArt);
};

// ============================================================
//  ZURÜCK
// ============================================================
btnBack.onclick = () => {
  window.location.replace("../index.html");
};

// ============================================================
//  ZEBRA TASTATUR
// ============================================================
function renderKeyboard() {

  keyboardGrid.innerHTML = "";

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  letters.forEach(letter => {
    const btn = document.createElement("button");
    btn.textContent = letter;
    btn.onclick = () => keyboardInput.value += letter;
    keyboardGrid.appendChild(btn);
  });

  const ok = document.createElement("button");
  ok.textContent = "OK";

  ok.onclick = () => {

    const name = keyboardInput.value.trim();
    if (!name) return alert("Bitte Kundennamen eingeben.");

    selectedCustomer = name;

    if (sonstigeBtn) {
      sonstigeBtn.textContent = name;
    }

    popup.style.display = "none";
  };

  keyboardGrid.appendChild(ok);
}
