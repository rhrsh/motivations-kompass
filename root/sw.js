// Früher lag die App direkt unter /motivations-kompass/ und hatte hier ihren Service Worker.
// Seit sie unter app/ liegt, ersetzt diese Datei den alten Service Worker und meldet ihn ab.
// Den alten Offline-Speicher räumt der neue Service Worker unter app/ beim Start auf.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(self.registration.unregister());
});
