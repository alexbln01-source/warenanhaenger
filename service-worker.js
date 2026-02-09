// service-worker.js

self.addEventListener("install", event => {
  console.log("[SW] Installiert");
  self.skipWaiting(); // WICHTIG für Updates
});

self.addEventListener("activate", event => {
  console.log("[SW] Aktiviert");
  event.waitUntil(self.clients.claim());
});
