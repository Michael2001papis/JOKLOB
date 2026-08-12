const CACHE = "joklob-static-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/css/main.css",
  "/js/i18n.js",
  "/js/storage.js",
  "/js/certainty.js",
  "/js/math-lab.js",
  "/js/numbers-lab.js",
  "/js/physics-lab.js",
  "/js/axioms-lab.js",
  "/js/between-lab.js",
  "/js/ui.js",
  "/js/pages.js",
  "/js/app.js",
  "/assets/icon.svg",
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
    caches.match(e.request).then((cached) => cached || fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => cached))
  );
});
