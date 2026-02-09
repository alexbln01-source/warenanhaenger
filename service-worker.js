const SW_VERSION = "paus-test-002";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", async () => {
  const allClients = await self.clients.matchAll({ type: "window" });
  allClients.forEach(client => {
    client.postMessage("UPDATE_AVAILABLE");
  });
  self.clients.claim();
});