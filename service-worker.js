// service-worker.js

const CACHE_NAME = "warenanhaenger-v1";

// Optional: später für Caching
self.addEventListener("install", event => {
  // NICHT skipWaiting → wichtig für PWA-Install
  console.log("[SW] Installiert");
});

self.addEventListener("activate", event => {
  console.log("[SW] Aktiviert");
  event.waitUntil(self.clients.claim());
});

/*
  Update-Info:
  Der Service Worker selbst meldet KEIN Update.
  Das macht die Seite (JS) über reg.waiting
*/
