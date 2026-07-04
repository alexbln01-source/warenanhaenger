// ============================================================
//  BEARBEITUNG – kanten_mobile.js
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

function buildStamp() {
  const d = new Date(document.lastModified);
  const y  = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}${mo}${da}.${hh}${mm}`;
}

const deviceInfo   = document.getElementById("deviceInfo");
const buildInfo    = document.getElementById("buildInfo");
const kundenArea   = document.getElementById("kundenArea");
const kundenHint   = document.getElementById("kundenHint");
const kundenReady  = document.getElementById("kundenReady");

const btnEiltSehr   = document.getElementById("btnEiltSehr");
const btnKanten     = document.getElementById("btnKanten");
const btnSchweissen = document.getElementById("btnSchweissen");
const btnBohrwerk   = document.getElementById("btnBohrwerk");
const btnBack       = document.getElementById("btnBack");
const btnDrucken    = document.getElementById("btnDrucken");

let selectedCustomer = "";
let selectedArt = "";

function setCornerInfo() {
  const deviceLabel =
    isTC22 ? "Zebra TC22" :
    isTC21 ? "Zebra TC21" :
    isZebra ? "Zebra" :
    isMobile ? "Mobil" : "PC";

  if (deviceInfo) deviceInfo.textContent = "Gerät: " + deviceLabel;
  if (buildInfo) buildInfo.textContent = buildStamp();
}

function updatePrintButton() {
  if (!btnDrucken) return;
  const ready = selectedArt === "eilt_sehr" || (selectedArt && selectedCustomer);
  btnDrucken.disabled = !ready;
}

function updateKundenPanel() {
  if (!kundenHint || !kundenArea || !kundenReady) return;

  kundenHint.classList.add("hidden");
  kundenArea.classList.add("hidden");
  kundenReady.classList.add("hidden");

  if (!selectedArt) {
    kundenHint.classList.remove("hidden");
    return;
  }

  if (selectedArt === "eilt_sehr") {
    kundenReady.classList.remove("hidden");
    return;
  }

  kundenArea.classList.remove("hidden");
}

function updateUI() {
  updateKundenPanel();
  updatePrintButton();
}

function clearArtSelection() {
  document.querySelectorAll(".artBtn").forEach(b => b.classList.remove("active"));
}

function clearCustomerSelection() {
  document.querySelectorAll(".kundeBtn").forEach(b => b.classList.remove("active"));
}

document.addEventListener("DOMContentLoaded", () => {
  document.title = "Bearbeitung";

  if (isMobile || isZebra) document.body.classList.add("phone-layout");
  if (isPC) document.body.classList.add("pc-device");

  setCornerInfo();
  updateUI();
});

btnEiltSehr.onclick = () => {
  selectedArt = "eilt_sehr";
  selectedCustomer = "EILT_SEHR";
  clearArtSelection();
  btnEiltSehr.classList.add("active");
  clearCustomerSelection();
  updateUI();
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
  updateUI();
}

document.querySelectorAll(".kundeBtn").forEach(btn => {
  btn.onclick = () => {
    clearCustomerSelection();
    btn.classList.add("active");
    selectedCustomer = btn.dataset.kunde;
    updateUI();
  };
});

btnDrucken.onclick = () => {
  if (selectedArt === "eilt_sehr") {
    location.href = "druck_kanten.html?kunde=EILT_SEHR";
    return;
  }
  if (!selectedArt) return alert("Bitte eine Tätigkeit auswählen.");
  if (!selectedCustomer) return alert("Bitte einen Kunden auswählen.");

  location.href =
    "druck_kanten.html?kunde=" + encodeURIComponent(selectedCustomer) +
    "&art=" + encodeURIComponent(selectedArt);
};

btnBack.onclick = () => {
  const base = location.pathname.split("/").slice(0, -2).join("/");
  window.location.href = base + "/index.html";
};
