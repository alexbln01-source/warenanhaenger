// pwa-update.js
// Zeigt "Update verfügbar", wenn ein neuer Service Worker aktiv wird

(function () {
  if (!("serviceWorker" in navigator)) return;

  let refreshing = false;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;

    const banner = document.getElementById("updateBanner");
    if (banner) {
      banner.style.display = "block";
    }
  });

  navigator.serviceWorker.register("/service-worker.js")
    .then(reg => {
      console.log("[PWA] Service Worker registriert");

      // Falls beim Laden bereits ein neuer SW wartet
      if (reg.waiting) {
        const banner = document.getElementById("updateBanner");
        if (banner) banner.style.display = "block";
      }

      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            const banner = document.getElementById("updateBanner");
            if (banner) banner.style.display = "block";
          }
        });
      });
    })
    .catch(err => {
      console.error("[PWA] Service Worker Fehler:", err);
    });

  // Reload-Button
  document.addEventListener("DOMContentLoaded", () => {
    const reloadBtn = document.getElementById("reloadBtn");
    if (reloadBtn) {
      reloadBtn.addEventListener("click", () => {
        window.location.reload();
      });
    }
  });
})();
