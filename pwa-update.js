if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js").then(reg => {

    // Wenn ein neuer SW wartet → Update verfügbar
    if (reg.waiting) {
      showUpdateBanner(reg);
    }

    // Wenn später ein Update kommt
    reg.addEventListener("updatefound", () => {
      const newWorker = reg.installing;
      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          showUpdateBanner(reg);
        }
      });
    });
  });
}

function showUpdateBanner(reg) {
  const banner = document.getElementById("updateBanner");
  const reloadBtn = document.getElementById("reloadBtn");

  if (!banner || !reloadBtn) return;

  banner.style.display = "block";

  reloadBtn.onclick = () => {
    reg.waiting.postMessage({ type: "SKIP_WAITING" });
  };
}

// Service Worker reagiert darauf
navigator.serviceWorker.addEventListener("message", event => {
  if (event.data === "RELOAD_PAGE") {
    window.location.reload();
  }
});
