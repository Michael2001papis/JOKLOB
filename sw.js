const CACHE = "joklob-static-v2";
const ASSETS = [
  "/",
  "/index.html",
  "/CSSS/main.css",
  "/CSSS/icon.svg",
  "/JJS/i18n.js",
  "/JJS/storage.js",
  "/JJS/certainty.js",
  "/JJS/math-lab.js",
  "/JJS/numbers-lab.js",
  "/JJS/physics-lab.js",
  "/JJS/axioms-lab.js",
  "/JJS/between-lab.js",
  "/JJS/ui.js",
  "/JJS/pages.js",
  "/JJS/app.js",
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
