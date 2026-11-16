// Service Worker: speichert die App-Dateien, damit sie offline startet.
// Bei jeder Änderung an der App VERSION erhöhen, sonst sieht das Handy die alte Version.
const VERSION = "v22";
// Umgebung wie in js/env.js: Production unter /, Preview (beta) unter /beta/.
// Beide teilen sich den Speicher des Browsers, daher eigene Namen und eigenes Aufräumen.
const IS_BETA = /\/beta\//.test(self.location.pathname);
const CACHE = IS_BETA ? `kompass-beta-${VERSION}` : `kompass-${VERSION}`;
const MINE = IS_BETA ? /^kompass-beta-v\d+$/ : /^kompass-v\d+$/;
const FILES = [
  "./", "./index.html", "./css/app.css",
  "./js/app.js", "./js/config.js", "./js/storage.js", "./js/faces.js", "./js/icons.js",
  "./js/env.js", "./js/week.js", "./js/sample.js", "./js/history.js",
  "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png",
  "./icons/icon-maskable-512.png", "./icons/apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

// Neue Version übernimmt sofort und löscht alte Kopien, aber nur die eigene Umgebung.
// Die geöffnete App merkt die Übernahme und lädt sich selbst neu (siehe app.js).
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => MINE.test(k) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Erst Netz (damit Änderungen sofort ankommen), bei Funkloch aus dem Speicher.
// "no-cache" heißt: immer beim Server nachfragen, ob es etwas Neues gibt,
// statt bis zu 10 Minuten eine zwischengespeicherte Kopie zu nehmen.
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  // Production ist auch für /beta/ zuständig (liegt darunter), soll die Preview aber nie speichern oder ausliefern
  if (!IS_BETA && /\/beta\//.test(url.pathname)) return;
  e.respondWith(
    fetch(e.request.url, { cache: "no-cache" })
      .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return res; })
      .catch(() => caches.match(e.request))
  );
});
