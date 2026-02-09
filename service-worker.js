// service-worker.js

self.addEventListener("install", event => {
  console.log("[SW] installiert");
});

self.addEventListener("activate", event => {
  console.log("[SW] aktiviert");
  event.waitUntil(self.clients.claim());
});

// 🔑 DAS IST DER SCHLÜSSEL
self.addEventListener("fetch", event => {
  event.respondWith(fetch(event.request));
});
