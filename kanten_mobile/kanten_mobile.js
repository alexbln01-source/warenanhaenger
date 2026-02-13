// ============================================================
//  KANTEN – kanten_mobile.js (STABIL VERSION)
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
//  STATE
// ============================================================
let selectedCustomer = "";
let selectedArt = "";
let sonstigeName = "";
let sonstigeBtn = null;

// ============================================================
//  BUILD
// ============================================================
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
//  INIT
// ============================================================
document.addEventListener("DOMContentLoaded", () => {

  // DOM Elemente jetzt holen (WICHTIG!)
  const deviceInfo   = document.getElementById("deviceInfo");
  const buildInfo    = document.getElementById("buildInfo");

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

  sonstigeBtn = document.querySelector('.kundeBtn[data-kunde="SONSTIGE"]');

  // ----------------------------------------------------------
  // DEVICE INFO
  // ----------------------------------------------------------
  const deviceLabel =
    isTC22 ? "Zebra TC22" :
    isTC21 ? "Zebra TC21" :
    isZebra ? "Zebra" :
    isMobile ? "Mobil" : "PC";

  if (deviceInfo) deviceInfo.textContent = "Gerät: " + deviceLabel;
  if (buildInfo) buildInfo.textContent = "Build " + buildStamp();

  // ----------------------------------------------------------
  // ANDROID KEYBOARD BLOCKEN
  // ----------------------------------------------------------
  if (!isPC && keyboardInput) {
    keyboardInput.setAttribute("inputmode","none");
    keyboardInput.setAttribute("autocomplete","off");
    keyboardInput.setAttribute("autocorrect","off");
    keyboardInput.setAttribute("autocapitalize","off");
    keyboardInput.setAttribute("spellcheck","false");
  }

  // ----------------------------------------------------------
  // HILFSFUNKTIONEN
  // ----------------------------------------------------------
  function clearArtSelection() {
    document.querySelectorAll(".artBtn").forEach(b=>b.classList.remove("active"));
  }
  function clearCustomerSelection() {
    document.querySelectorAll(".kundeBtn").forEach(b=>b.classList.remove("active"));
  }

  function setSonstigeName(name) {
    sonstigeName = name;
    selectedCustomer = "SONSTIGE";
    if (sonstigeBtn) sonstigeBtn.textContent = name;
  }

  function resetSonstige() {
    sonstigeName = "";
    if (sonstigeBtn) sonstigeBtn.textContent = "Sonstige Kunden";
  }

  // ----------------------------------------------------------
  // ART BUTTONS
  // ----------------------------------------------------------
  btnEiltSehr.onclick = () => {
    selectedArt = "eilt_sehr";
    selectedCustomer = "EILT_SEHR";

    clearArtSelection();
    btnEiltSehr.classList.add("active");
    clearCustomerSelection();
    resetSonstige();

    if (popup) popup.style.display = "none";
    if (kundenArea) kundenArea.classList.add("disabled");
  };

  function setNormalArt(art, btn) {
    selectedArt = art;
    clearArtSelection();
    btn.classList.add("active");

    selectedCustomer = "";
    clearCustomerSelection();
    resetSonstige();

    if (kundenArea) kundenArea.classList.remove("disabled");
  }

  btnKanten.onclick     = () => setNormalArt("kanten", btnKanten);
  btnSchweissen.onclick = () => setNormalArt("schweissen", btnSchweissen);
  btnBohrwerk.onclick   = () => setNormalArt("bohrwerk", btnBohrwerk);

  // ----------------------------------------------------------
  // KUNDEN BUTTONS
  // ----------------------------------------------------------
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

        if (isPC) {
          const name = prompt("Kundenname eingeben:");
          if (!name) return;
          setSonstigeName(name.trim());
        } else {
          popup.style.display = "flex";
          renderKeyboard();
          keyboardInput.value = sonstigeName || "";
        }

      } else {
        selectedCustomer = kunde;
      }
    };
  });

  // ----------------------------------------------------------
  // DRUCK
  // ----------------------------------------------------------
  btnDrucken.onclick = () => {

    if (selectedArt === "eilt_sehr") {
      location.href = "druck_kanten.html?kunde=EILT_SEHR";
      return;
    }

    if (!selectedArt) return alert("Bitte eine Art auswählen.");
    if (!selectedCustomer) return alert("Bitte einen Kunden auswählen.");

    let kundeName = selectedCustomer;

    if (selectedCustomer === "SONSTIGE") {
      if (!sonstigeName) return alert("Bitte Kundennamen eingeben.");
      kundeName = sonstigeName;
    }

    location.href =
      "druck_kanten.html?kunde=" + encodeURIComponent(kundeName) +
      "&art=" + encodeURIComponent(selectedArt);
  };

  // ----------------------------------------------------------
  // ZURÜCK (wie PAUS – stabil)
  // ----------------------------------------------------------
  btnBack.onclick = () => {
    const base = location.pathname.split("/").slice(0, -2).join("/");
    window.location.href = base + "/index.html";
  };

  // ----------------------------------------------------------
  // TASTATUR (Mobile)
  // ----------------------------------------------------------
  function renderKeyboard() {

    keyboardGrid.innerHTML = "";

    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

    letters.forEach(l => {
      const b = document.createElement("button");
      b.textContent = l;
      b.className = "kbm-key";
      b.onclick = () => keyboardInput.value += l;
      keyboardGrid.appendChild(b);
    });

    const ok = document.createElement("button");
    ok.textContent = "OK";
    ok.className = "kbm-key ok";
    ok.onclick = () => {
      const name = keyboardInput.value.trim();
      if (!name) return alert("Bitte Kundennamen eingeben.");
      setSonstigeName(name);
      popup.style.display = "none";
    };

    keyboardGrid.appendChild(ok);
  }

});
