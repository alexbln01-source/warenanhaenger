// service-worker.js

self.addEventListener("install", event => {
  console.log("[SW] installiert");
});

self.addEventListener("activate", event => {
  console.log("[SW] aktiviert");
  event.waitUntil(self.clients.claim());
});

// WICHTIG: fetch NICHT abfangen
// → Browser kümmert sich selbst um Netzwerk
