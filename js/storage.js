// Datenhaltung: alles liegt im Browser-Speicher (localStorage) auf dem Handy.
// Datenmodell: { "2026-W46": { week, ratings: {id: 1..5}, comments: {id: text}, average, updatedAt }, ... }

const KEY = "kompass:checks";

export function loadAll() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
  catch { return {}; }
}

export function loadWeek(weekKey) {
  return loadAll()[weekKey] || null;
}

export function saveWeek(check) {
  const all = loadAll();
  all[check.week] = check;
  localStorage.setItem(KEY, JSON.stringify(all));
}

// Entwurf der laufenden Bewertung, damit nichts verloren geht, wenn die App zwischendurch geschlossen wird
const DRAFT = "kompass:draft";
export function loadDraft(weekKey) {
  try { const d = JSON.parse(localStorage.getItem(DRAFT)); return d && d.week === weekKey ? d : null; }
  catch { return null; }
}
export function saveDraft(draft) {
  try { localStorage.setItem(DRAFT, JSON.stringify(draft)); } catch {}
}
export function clearDraft() {
  try { localStorage.removeItem(DRAFT); } catch {}
}

// Bittet den Browser, die Daten nicht automatisch zu löschen, wenn der Speicher knapp wird
export async function requestPersistence() {
  try { if (navigator.storage?.persist) return await navigator.storage.persist(); } catch {}
  return false;
}

// Sicherung als JSON-Datei
export function exportFile() {
  const blob = new Blob([JSON.stringify(loadAll(), null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "motivations-kompass-" + new Date().toISOString().slice(0, 10) + ".json";
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// Persönliche Motivatoren: liegen nur auf dem Handy
const MOTIVES_KEY = "kompass:motives";
export function loadMotives() {
  try {
    const m = JSON.parse(localStorage.getItem(MOTIVES_KEY));
    return Array.isArray(m) && m.length ? m : null;
  } catch { return null; }
}
export function saveMotives(list) {
  localStorage.setItem(MOTIVES_KEY, JSON.stringify(list));
}

// Einrichtungslink: ...#setup=<base64url-JSON>. Der Teil nach # wird nie an den Server geschickt.
export function applySetupFromHash() {
  const m = location.hash.match(/^#setup=([A-Za-z0-9_-]+)$/);
  if (!m) return false;
  try {
    const b64 = m[1].replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const list = JSON.parse(new TextDecoder().decode(bytes));
    if (Array.isArray(list) && list.every((x) => x.id && x.name)) saveMotives(list);
  } catch {}
  history.replaceState(null, "", location.pathname + location.search);
  return true;
}
