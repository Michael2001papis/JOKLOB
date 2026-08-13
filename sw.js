/*!
 * JOKLOB Research Engine — מנוע המחקר של מיכאל
 * Copyright (c) 2026 JOKLOB / מיכאל. All rights reserved.
 * כל הזכויות שמורות. אין להעתיק, לשכפל, להפיץ או להשתמש בקוד זה ללא רשות מפורשת בכתב.
 */

const CACHE = "joklob-research-v4";
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
  "/JSS/world.js",
  "/JSS/hybrid.js",
  "/JSS/backtest.js",
  "/JSS/generator.js",
  "/JSS/storage.js",
  "/JSS/pdf.js",
  "/JSS/nav.js",
  "/JSS/charts.js",
  "/JSS/ui.js",
  "/JSS/pages.js",
  "/JSS/app.js",
  "/manifest.webmanifest",
  "/COPYRIGHT.txt",
  "/humans.txt",
  "/robots.txt",
  "/file/Lotto.csv",
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
