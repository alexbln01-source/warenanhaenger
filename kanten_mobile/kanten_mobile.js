// ============================================================
//  KANTEN – kanten_mobile.js (STABIL)
//  - Anzeige: oben links Gerät, unten rechts Build
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
//  DOM ELEMENTE
// ============================================================
const deviceInfo = document.getElementById("deviceInfo");
const buildInfo  = document.getElementById("buildInfo");
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
//  CORNER INFO
// ============================================================
function setCornerInfo() {
  const deviceLabel =
    isTC22 ? "TC22" :
    isTC21 ? "TC21" :
    isZebra ? "Zebra" :
    isMobile ? "Mobil" : "PC";

  if (deviceInfo) {
    deviceInfo.textContent = deviceLabel;
  }

  if (buildInfo) {
    buildInfo.textContent = "Build " + buildStamp();
  }
}


// ============================================================
//  INIT
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  if (kundenArea) kundenArea.classList.add("disabled");

  if (isMobile || isZebra) {
    document.body.classList.add("phone-layout");
  }
  if (isPC) {
    document.body.classList.add("pc-device");
  }

  setCornerInfo();
  updatePrintButton();
});


// ============================================================
//  HILFSFUNKTIONEN
// ============================================================
function updatePrintButton() {
  if (!btnDrucken) return;
  const ready = selectedArt === "eilt_sehr" || (selectedArt && selectedCustomer);
  btnDrucken.disabled = !ready;
}

function clearArtSelection() {
  document.querySelectorAll(".artBtn").forEach(b => b.classList.remove("active"));
  updatePrintButton();
}

function clearCustomerSelection() {
  document.querySelectorAll(".kundeBtn").forEach(b => b.classList.remove("active"));
  updatePrintButton();
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

  if (kundenArea) kundenArea.classList.add("disabled");
  updatePrintButton();
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

  if (kundenArea) kundenArea.classList.remove("disabled");
  updatePrintButton();
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
    selectedCustomer = btn.dataset.kunde;
    updatePrintButton();
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

  location.href =
    "druck_kanten.html?kunde=" + encodeURIComponent(selectedCustomer) +
    "&art=" + encodeURIComponent(selectedArt);
};


// ============================================================
//  ZURÜCK (wie PAUS)
// ============================================================
btnBack.onclick = () => {
  const base = location.pathname.split("/").slice(0, -2).join("/");
  window.location.href = base + "/index.html";
};
