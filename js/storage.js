// Datenhaltung: IndexedDB, die eingebaute Datenbank des Browsers. Alles bleibt auf dem Gerät.
//
// Datenbank "kompass" mit zwei Tabellen (Object Stores):
//
//   entries   ein Datensatz je Kalenderwoche und Motivator
//             Schlüssel: [week, motive], z. B. ["2026-W46", "verantwortung"]
//             { week: "2026-W46", motive: "verantwortung", rating: 1..5 | null,
//               comment: "…", updatedAt: "2026-11-13T09:59:54.160Z" }
//             Index "byWeek" auf week: alle Einträge einer Woche auf einmal lesen
//
//   settings  Einstellungen als Schlüssel/Wert
//             { key: "motives", value: [ { id, name, q }, … ] }   persönliche Motivatoren
//
// Jede Eingabe schreibt sofort genau einen Datensatz. Es gibt keinen Entwurf und keinen Speichermoment.

const DB_NAME = "kompass";
const DB_VERSION = 1;

let dbPromise = null;
function db() {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const d = req.result;
      if (!d.objectStoreNames.contains("entries")) {
        const s = d.createObjectStore("entries", { keyPath: ["week", "motive"] });
        s.createIndex("byWeek", "week");
      }
      if (!d.objectStoreNames.contains("settings")) d.createObjectStore("settings", { keyPath: "key" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error("Datenbank ist blockiert"));
  });
  return dbPromise;
}

// Kleine Hilfe: IndexedDB-Anfragen als Promise
const done = (req) => new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });
const committed = (tx) => new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = tx.onabort = () => rej(tx.error); });

// ---- Einträge ----

// Alle Einträge einer Woche als { motive: { rating, comment, updatedAt } }
export async function loadWeek(week) {
  const tx = (await db()).transaction("entries");
  const rows = await done(tx.objectStore("entries").index("byWeek").getAll(week));
  return Object.fromEntries(rows.map((r) => [r.motive, r]));
}

// Einen Eintrag schreiben (überschreibt den bisherigen Stand dieses Motivators in dieser Woche)
export async function saveEntry(week, motive, { rating = null, comment = "" }) {
  const tx = (await db()).transaction("entries", "readwrite");
  tx.objectStore("entries").put({ week, motive, rating, comment, updatedAt: new Date().toISOString() });
  await committed(tx);
}

// ---- Einstellungen ----

export async function loadMotives() {
  const tx = (await db()).transaction("settings");
  const row = await done(tx.objectStore("settings").get("motives"));
  return Array.isArray(row?.value) && row.value.length ? row.value : null;
}
export async function saveMotives(list) {
  const tx = (await db()).transaction("settings", "readwrite");
  tx.objectStore("settings").put({ key: "motives", value: list });
  await committed(tx);
}

// ---- Umzug aus dem alten localStorage (einmalig) ----
// Übernimmt gespeicherte Wochen, einen offenen Entwurf und die Motivatoren.
// Erst nach erfolgreichem Schreiben werden die alten Schlüssel entfernt.
const OLD = { checks: "kompass:checks", draft: "kompass:draft", motives: "kompass:motives" };
export async function migrateFromLocalStorage() {
  let checks, draft, motives;
  try {
    checks = JSON.parse(localStorage.getItem(OLD.checks) || "null");
    draft = JSON.parse(localStorage.getItem(OLD.draft) || "null");
    motives = JSON.parse(localStorage.getItem(OLD.motives) || "null");
  } catch { return; }
  if (!checks && !draft && !motives) return;

  const weeks = { ...(checks || {}) };
  if (draft?.week) { // Entwurf ist neuer als die gespeicherte Woche
    const w = weeks[draft.week] || { ratings: {}, comments: {} };
    weeks[draft.week] = {
      ...w, updatedAt: new Date().toISOString(),
      ratings: { ...w.ratings, ...draft.ratings }, comments: { ...w.comments, ...draft.comments },
    };
  }

  const tx = (await db()).transaction(["entries", "settings"], "readwrite");
  const entries = tx.objectStore("entries");
  for (const [week, c] of Object.entries(weeks)) {
    const ids = new Set([...Object.keys(c.ratings || {}), ...Object.keys(c.comments || {})]);
    for (const motive of ids) {
      entries.put({
        week, motive, rating: c.ratings?.[motive] ?? null, comment: c.comments?.[motive] ?? "",
        updatedAt: c.updatedAt || new Date().toISOString(),
      });
    }
  }
  if (Array.isArray(motives) && motives.length) tx.objectStore("settings").put({ key: "motives", value: motives });
  await committed(tx);
  for (const k of Object.values(OLD)) localStorage.removeItem(k);
}

// ---- Sonstiges ----

// Bittet den Browser, die Daten nicht automatisch zu löschen, wenn der Speicher knapp wird
export async function requestPersistence() {
  try { if (navigator.storage?.persist) return await navigator.storage.persist(); } catch {}
  return false;
}

// Sicherung als JSON-Datei: alle Wochen und die Motivatoren
export async function exportFile() {
  const tx = (await db()).transaction(["entries", "settings"]);
  const [rows, motives] = await Promise.all([
    done(tx.objectStore("entries").getAll()),
    done(tx.objectStore("settings").get("motives")),
  ]);
  const weeks = {};
  for (const r of rows) (weeks[r.week] ??= {})[r.motive] = { rating: r.rating, comment: r.comment, updatedAt: r.updatedAt };
  const data = { format: "motivations-kompass/2", exportedAt: new Date().toISOString(), motives: motives?.value ?? null, weeks };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "motivations-kompass-" + new Date().toISOString().slice(0, 10) + ".json";
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// Einrichtungslink: ...#setup=<base64url-JSON>. Der Teil nach # wird nie an den Server geschickt.
export async function applySetupFromHash() {
  const m = location.hash.match(/^#setup=([A-Za-z0-9_-]+)$/);
  if (!m) return false;
  history.replaceState(null, "", location.pathname + location.search);
  try {
    const b64 = m[1].replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const list = JSON.parse(new TextDecoder().decode(bytes));
    if (Array.isArray(list) && list.every((x) => x.id && x.name)) await saveMotives(list);
  } catch {}
  return true;
}
