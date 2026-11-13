// Service Worker: speichert die App-Dateien, damit sie offline startet.
// Bei jeder Änderung an der App VERSION erhöhen, sonst sieht das Handy die alte Version.
const VERSION = "v2";
const CACHE = `kompass-${VERSION}`;
const FILES = [
  "./", "./index.html", "./css/app.css",
  "./js/app.js", "./js/config.js", "./js/storage.js",
  "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Erst Netz (damit Änderungen sofort ankommen), bei Funkloch aus dem Speicher
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return res; })
      .catch(() => caches.match(e.request))
  );
});
