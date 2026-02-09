// service-worker.js
self.addEventListener("install", () => {
  console.log("[SW] installiert");
});

self.addEventListener("activate", event => {
  console.log("[SW] aktiviert");
  event.waitUntil(self.clients.claim());
});
