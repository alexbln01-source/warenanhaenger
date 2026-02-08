let selectedCustomer = "";
let selectedArt = "";

const popup = document.getElementById("keyboardPopup");
const keyboardInput = document.getElementById("keyboardInput");
const sonstigeBtn = document.getElementById("sonstigeBtn");
const kundenArea = document.getElementById("kundenArea");

popup.style.display = "none";
kundenArea.classList.add("disabled");

/* ================= HILFSFUNKTIONEN ================= */
function clearArtSelection() {
    document.querySelectorAll(".artBtn").forEach(b => b.classList.remove("active"));
}

function clearCustomerSelection() {
    document.querySelectorAll(".kundeBtn").forEach(b => b.classList.remove("active"));
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
    if (keyboardInput) keyboardInput.value = "";

    kundenArea.classList.add("disabled");
};

btnKanten.onclick     = () => setNormalArt("kanten", btnKanten);
btnSchweissen.onclick = () => setNormalArt("schweissen", btnSchweissen);
btnBohrwerk.onclick   = () => setNormalArt("bohrwerk", btnBohrwerk);

function setNormalArt(art, btn) {
    selectedArt = art;

    clearArtSelection();
    btn.classList.add("active");

    // Kunden wieder erforderlich
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
        } else {
            selectedCustomer = kunde;
            popup.style.display = "none";
        }
    };
});

/* ================= DRUCK ================= */
document.getElementById("btnDrucken").onclick = () => {

    // Eigene Art: Anhänger Eilt Sehr
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
    window.location.href = "index.html?reload=" + Date.now();
};
