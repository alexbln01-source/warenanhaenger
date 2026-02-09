// service-worker.js

self.addEventListener("install", event => {
  console.log("[SW] installiert");
  // KEIN skipWaiting!
});

self.addEventListener("activate", event => {
  console.log("[SW] aktiviert");
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", event => {
  // aktuell kein Cache – absichtlich leer
});
