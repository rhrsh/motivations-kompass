// Umgebung (Environment): In welcher Kopie der App laufen wir?
//
//   production  …/motivations-kompass/        die echte App mit echten Daten
//   beta        …/motivations-kompass/beta/   Preview eines Pull Requests zum Ausprobieren
//
// Beide liegen unter derselben Adresse (Origin) und teilen sich deshalb den Speicher des Browsers.
// Damit die Preview nie echte Daten berührt, bekommt jede Umgebung eigene Namen für
// Datenbank und Offline-Speicher. sw.js wiederholt diese Regel, weil er dieses Modul nicht laden kann.

export const ENV = /\/beta\//.test(location.pathname) ? "beta" : "production";
export const IS_BETA = ENV === "beta";

// Name der IndexedDB-Datenbank je Umgebung
export const DB_NAME = IS_BETA ? "kompass-beta" : "kompass";

// Offline-Speicher des Service Workers je Umgebung, z. B. "kompass-v17" bzw. "kompass-beta-v17"
export const CACHE_PATTERN = IS_BETA ? /^kompass-beta-(v\d+)$/ : /^kompass-(v\d+)$/;
