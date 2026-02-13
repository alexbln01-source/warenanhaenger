// ============================================================
//  KANTEN – kanten_mobile.js
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
//  STATE
// ============================================================
let selectedCustomer = "";
let selectedArt = "";


// ============================================================
//  DOM VARIABLEN (werden erst nach DOM geladen gesetzt!)
// ============================================================
let deviceInfo;
let buildInfo;

let popup;
let keyboardInput;
let keyboardGrid;
let kundenArea;

let btnEiltSehr;
let btnKanten;
let btnSchweissen;
let btnBohrwerk;

let btnBack;
let btnDrucken;


// ============================================================
//  BODY KLASSEN
// ============================================================
if (isPC) document.body.classList.add("pc-device");
if (isTC21) document.body.classList.add("zebra-tc21");
if (isTC22) document.body.classList.add("zebra-tc22");


// ============================================================
//  BUILD FORMAT
// ============================================================
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
//  DEVICE INFO + BUILD
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
  pcInputWrapper.style.background = "#ffffff";
  pcInputWrapper.style.padding = "22px";
  pcInputWrapper.style.borderRadius = "14px";
  pcInputWrapper.style.boxShadow = "0 10px 30px rgba(0,0,0,0.25)";
  pcInputWrapper.style.zIndex = "10000";
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
             padding:14px;
             font-size:20px;
             border-radius:10px;
             border:2px solid #1976d2;
             outline:none;
             text-align:center;
           ">

    <div style="display:flex; gap:10px; justify-content:center; margin-top:14px;">
      <button id="pcCustomerCancel">Abbrechen</button>
      <button id="pcCustomerOk">OK</button>
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

  pcCustomerInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      pcInputWrapper.querySelector("#pcCustomerOk").click();
    }
  });
}

function openPcInput() {
  if (!pcInputWrapper) return;
  pcInputWrapper.style.display = "block";
  setTimeout(() => pcCustomerInput.focus(), 20);
}

function hidePcInput() {
  if (!pcInputWrapper) return;
  pcInputWrapper.style.display = "none";
}


// ============================================================
//  INIT (JETZT ALLES RICHTIG)
// ============================================================
document.addEventListener("DOMContentLoaded", () => {

  // DOM holen
  deviceInfo   = document.getElementById("deviceInfo");
  buildInfo    = document.getElementById("buildInfo");

  popup         = document.getElementById("keyboardPopup");
  keyboardInput = document.getElementById("keyboardInput");
  keyboardGrid  = document.getElementById("keyboardGrid");
  kundenArea    = document.getElementById("kundenArea");

  btnEiltSehr   = document.getElementById("btnEiltSehr");
  btnKanten     = document.getElementById("btnKanten");
  btnSchweissen = document.getElementById("btnSchweissen");
  btnBohrwerk   = document.getElementById("btnBohrwerk");

  btnBack    = document.getElementById("btnBack");
  btnDrucken = document.getElementById("btnDrucken");

  popup.style.display = "none";
  kundenArea.classList.add("disabled");

  setCornerInfo();
  createPcInput();

});
