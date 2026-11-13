// Service Worker: speichert die App-Dateien, damit sie offline startet.
// Bei jeder Änderung an der App VERSION erhöhen, sonst sieht das Handy die alte Version.
const VERSION = "v9";
const CACHE = `kompass-${VERSION}`;
const FILES = [
  "./", "./index.html", "./css/app.css",
  "./js/app.js", "./js/config.js", "./js/storage.js", "./js/faces.js",
  "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

// Neue Version übernimmt sofort und löscht alte Kopien.
// Die geöffnete App merkt die Übernahme und lädt sich selbst neu (siehe app.js).
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("kompass-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Erst Netz (damit Änderungen sofort ankommen), bei Funkloch aus dem Speicher.
// "no-cache" heißt: immer beim Server nachfragen, ob es etwas Neues gibt,
// statt bis zu 10 Minuten eine zwischengespeicherte Kopie zu nehmen.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request.url, { cache: "no-cache" })
      .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return res; })
      .catch(() => caches.match(e.request))
  );
});
