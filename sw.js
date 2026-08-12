const CACHE = "joklob-research-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/HTML/",
  "/HTML/index.html",
  "/CSSS/main.css",
  "/CSSS/icon.svg",
  "/JSS/rng.js",
  "/JSS/snapshot.js",
  "/JSS/data.js",
  "/JSS/analyze.js",
  "/JSS/hybrid.js",
  "/JSS/backtest.js",
  "/JSS/generator.js",
  "/JSS/storage.js",
  "/JSS/pdf.js",
  "/JSS/ui.js",
  "/JSS/pages.js",
  "/JSS/app.js",
  "/manifest.webmanifest",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((cached) =>
      cached ||
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
          return res;
        })
        .catch(() => cached)
    )
  );
});
