if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("message", event => {
    if (event.data?.type === "UPDATE_AVAILABLE") {
      const banner = document.getElementById("updateBanner");
      if (banner) {
        banner.style.display = "block";
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const reloadBtn = document.getElementById("reloadBtn");
  if (reloadBtn) {
    reloadBtn.onclick = () => {
      // harter Reload → neue Version sicher
      window.location.reload(true);
    };
  }
});