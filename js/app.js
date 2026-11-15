import { DEFAULT_MOTIVES, SCALE, ADVANCE_MS } from "./config.js";
import * as store from "./storage.js";
import { face } from "./faces.js";
import { icon } from "./icons.js";
import { IS_BETA, CACHE_PATTERN } from "./env.js";
import { isoWeek } from "./week.js";
import { renderOverview, renderDetail } from "./history.js";

// Datenbank vorbereiten: einmalig alte Daten übernehmen, ggf. Einrichtungslink anwenden
let dbError = null;
await store.migrateFromLocalStorage().catch((e) => { dbError = e; });
await store.applySetupFromHash().catch(() => {});
const MOTIVES = (await store.loadMotives().catch(() => null)) || DEFAULT_MOTIVES;

const $ = (id) => document.getElementById(id);

// Tippen sofort auswerten. Chrome auf Android verschluckt sonst manchmal den ersten
// Tipp direkt nach einer Bewegung. Maus und Tastatur nutzen weiter „click“.
function onTap(el, fn) {
  let x = 0, y = 0, ok = false;
  el.addEventListener("touchstart", (e) => {
    ok = e.touches.length === 1; x = e.touches[0].clientX; y = e.touches[0].clientY;
  }, { passive: true });
  el.addEventListener("touchend", (e) => {
    const t = e.changedTouches[0];
    if (!ok || !t || Math.hypot(t.clientX - x, t.clientY - y) > 12) return;
    e.preventDefault(); // verhindert den zusätzlichen „click“, sonst zählt es doppelt
    fn(e);
  });
  el.addEventListener("click", fn);
}

// ---- Kalenderwoche (ISO) ----
const WEEK = isoWeek(new Date());

// ---- Zustand ----
// "entries" spiegelt die Datensätze der aktuellen Woche aus der Datenbank: { motive: { rating, comment } }
let entries = await store.loadWeek(WEEK.key).catch((e) => { dbError = e; return {}; });
const ratingOf = (id) => entries[id]?.rating || 0;
const commentOf = (id) => entries[id]?.comment || "";
let step = 0;
let fromSummary = false; // Korrektur aus der Zusammenfassung: danach dorthin zurück

const average = () => {
  const v = MOTIVES.map((m) => ratingOf(m.id)).filter(Boolean);
  return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null;
};
const firstOpen = () => Math.max(0, MOTIVES.findIndex((m) => !ratingOf(m.id)));

// ---- Navigation ----
const SCREENS = ["home", "step", "summary", "history", "detail"];
function show(id) {
  for (const s of SCREENS) $(s).hidden = s !== id;
  if (id !== "home") leaveHome();
  window.scrollTo(0, 0);
}

function goTo(i, dir) {
  cancelAdvance();
  step = i; renderStep(dir); window.scrollTo(0, 0);
}
function goNext() {
  cancelAdvance();
  if (!fromSummary && step < MOTIVES.length - 1) { goTo(step + 1, 1); return; }
  // letzter Motivator oder Korrektur: zum Ergebnis, sofern alles bewertet ist
  const open = MOTIVES.findIndex((m) => !ratingOf(m.id));
  if (open >= 0) { goTo(open, 1); return; }
  finish();
}
function goBack() { if (step > 0) goTo(step - 1, -1); else goHome(); }

// ---- Weiter nach dem Antippen, mit kurzer Pause ----
// In der Pause sieht man die Wahl und kann ins Kommentarfeld tippen, dann bleibt die App stehen.
let timer = 0;
function scheduleAdvance() {
  cancelAdvance();
  const r = ratingOf(MOTIVES[step].id);
  $("scale").style.setProperty("--ms", `${ADVANCE_MS}ms`);
  $("scale").style.setProperty("--sel-c", `var(--s${r})`);
  $("scale").classList.remove("going"); void $("scale").offsetWidth;
  $("scale").classList.add("going");
  timer = setTimeout(goNext, ADVANCE_MS);
}
function cancelAdvance() {
  clearTimeout(timer); timer = 0;
  $("scale").classList.remove("going");
}

// ---- Schritt ----
MOTIVES.forEach((m, i) => {
  const seg = document.createElement("button");
  seg.type = "button"; seg.setAttribute("aria-label", m.name);
  onTap(seg, () => goTo(i, i > step ? 1 : i < step ? -1 : 0));
  $("progress").append(seg);
});
$("progress").style.gridTemplateColumns = `repeat(${MOTIVES.length}, 1fr)`;

// Fünf Gesichter in einer Reihe: links „gar nicht“, rechts „voll erfüllt“
SCALE.forEach((sc) => {
  const b = document.createElement("button");
  b.type = "button"; b.className = "opt"; b.setAttribute("role", "radio"); b.dataset.v = sc.v;
  b.setAttribute("aria-label", sc.say);
  b.innerHTML = face(sc.v);
  onTap(b, () => choose(sc.v));
  // Fokus nicht vom Kommentarfeld wegnehmen (Tastatur bleibt offen)
  b.addEventListener("mousedown", (e) => e.preventDefault());
  $("scale").append(b);
});

function renderStep(dir = 0) {
  const m = MOTIVES[step];
  const r = ratingOf(m.id);
  $("stepCount").textContent = `${step + 1} / ${MOTIVES.length}`;
  [...$("progress").children].forEach((el, i) => {
    el.className = i === step ? "now" : ratingOf(MOTIVES[i].id) ? "done" : "";
  });
  // Ganzer Block gleitet herein, damit der Wechsel sichtbar ist
  const box = $("stage");
  box.classList.remove("fade", "in-next", "in-prev"); void box.offsetWidth;
  box.classList.add(dir > 0 ? "in-next" : dir < 0 ? "in-prev" : "fade");
  $("qIcon").innerHTML = icon(m.icon);
  $("qName").textContent = m.name;
  $("qText").textContent = m.q;
  for (const b of $("scale").children) {
    const on = Number(b.dataset.v) === r;
    b.classList.toggle("sel", on); b.setAttribute("aria-checked", String(on));
  }
  $("scale").classList.toggle("has-sel", !!r);
  $("comment").value = commentOf(m.id);
  updateCommentNext();
}

// ---- Speichern: jede Eingabe sofort als Datensatz ----
function persist(id) {
  const e = entries[id];
  store.saveEntry(WEEK.key, id, { rating: e.rating ?? null, comment: e.comment ?? "" })
    .then(() => { e.updatedAt = new Date().toISOString(); flashSaved(true); })
    .catch(() => flashSaved(false));
}
let flashTimer = 0;
function flashSaved(ok) {
  const el = $("saveState");
  el.textContent = ok ? "✓ Gespeichert" : "Speichern fehlgeschlagen";
  el.classList.toggle("err", !ok); el.classList.add("on");
  clearTimeout(flashTimer);
  if (ok) flashTimer = setTimeout(() => el.classList.remove("on"), 1200);
}

function choose(v) {
  const id = MOTIVES[step].id;
  entries[id] = { ...entries[id], rating: v };
  persist(id);
  navigator.vibrate?.(8);
  renderStep();
  // Wird gerade ein Kommentar geschrieben, nicht weiterspringen: Enter geht weiter
  if (document.activeElement === $("comment")) return;
  scheduleAdvance();
}

// ---- Kommentar ----
$("comment").addEventListener("focus", cancelAdvance);
$("comment").addEventListener("input", (e) => {
  cancelAdvance();
  const id = MOTIVES[step].id;
  entries[id] = { ...entries[id], comment: e.target.value.trim() ? e.target.value : "" };
  persist(id);
});
// „Weiter →“ erscheint, sobald man im Kommentar ist oder etwas geschrieben hat (und bewertet hat)
function updateCommentNext() {
  const typing = document.activeElement === $("comment") || !!$("comment").value.trim();
  $("commentNext").hidden = !(typing && ratingOf(MOTIVES[step].id));
}
$("comment").addEventListener("focus", updateCommentNext);
$("comment").addEventListener("blur", () => setTimeout(updateCommentNext, 0));
$("comment").addEventListener("input", updateCommentNext);
// Fokus beim Antippen nicht verlieren, sonst springt das Layout, bevor der Tipp zählt
$("commentNext").addEventListener("mousedown", (e) => e.preventDefault());
onTap($("commentNext"), () => {
  if (!ratingOf(MOTIVES[step].id)) return;
  $("comment").blur();
  goNext();
});

// Enter auf der Tastatur = weiter (sofern bewertet)
$("comment").addEventListener("keydown", (e) => {
  if (e.key !== "Enter" || e.shiftKey || e.isComposing) return;
  e.preventDefault();
  if (!ratingOf(MOTIVES[step].id)) return;
  $("comment").blur();
  goNext();
});

onTap($("backBtn"), goBack);

// ---- Android: Zurück-Geste und Zurück-Taste ----
// Der Start ist die Wurzel. Verlässt man ihn, gibt es einen Eintrag im Verlauf,
// damit die Zurück-Geste in der App bleibt statt sie zu schließen.
let pushed = false, ignorePop = false;
function leaveHome() { if (!pushed) { history.pushState({ kompass: 1 }, ""); pushed = true; } }
function goHome() {
  cancelAdvance(); fromSummary = false;
  renderHome(); for (const s of SCREENS) $(s).hidden = s !== "home";
  window.scrollTo(0, 0);
  if (pushed) { ignorePop = true; history.back(); }
}
window.addEventListener("popstate", () => {
  // Einrichtungslink bei schon geöffneter App: neu laden, dann wird er angewendet
  if (location.hash.startsWith("#setup=")) { location.reload(); return; }
  if (ignorePop) { ignorePop = false; pushed = false; return; }
  pushed = false;
  if (!$("step").hidden && step > 0 && !fromSummary) { goTo(step - 1, -1); leaveHome(); }
  else if (!$("step").hidden && fromSummary) { fromSummary = false; renderSummary(); show("summary"); }
  else if (!$("detail").hidden) { show("history"); leaveHome(); }
  else if (!$("history").hidden && historyFrom === "summary") { renderSummary(); show("summary"); leaveHome(); }
  else if (!$("home").hidden) { history.back(); } // Start: App normal verlassen
  else { renderHome(); show("home"); }
});

// Tastatur am Rechner: Pfeiltasten und 1–5 (5 = voll erfüllt)
document.addEventListener("keydown", (e) => {
  if ($("step").hidden || e.target.closest?.("textarea")) return;
  if (e.key === "ArrowRight" && ratingOf(MOTIVES[step].id)) goNext();
  else if (e.key === "ArrowLeft") goBack();
  else if (/^[1-5]$/.test(e.key)) choose(Number(e.key));
});

// App geht in den Hintergrund: nicht unbemerkt weiterspringen
document.addEventListener("visibilitychange", () => { if (document.hidden) cancelAdvance(); });

// Alles ist schon gespeichert – hier wird nur die Zusammenfassung gezeigt
function finish() {
  fromSummary = false;
  renderSummary(); show("summary");
}

// ---- Zusammenfassung ----
const sayFor = (avg) => SCALE[Math.min(SCALE.length, Math.max(1, Math.round(avg))) - 1].say;

// Version unten in der Zusammenfassung anzeigen, damit man sieht, was läuft
function showVersion() {
  window.caches?.keys().then((keys) => {
    const m = keys.map((x) => x.match(CACHE_PATTERN)).find(Boolean);
    $("version").textContent = m ? `Version ${m[1]}${IS_BETA ? " · Beta" : ""}` : "";
  }).catch(() => {});
}

const BUBBLE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>';

function renderSummary() {
  resetRedo();
  $("sumWeek").textContent = `KW ${WEEK.w} · ${dateLabel()}`;
  const avg = average();
  $("avg").textContent = avg == null ? "–" : sayFor(avg).toLowerCase();
  $("avgFace").innerHTML = avg == null ? "" : face(Math.round(avg));
  setGauge($("avgGauge"), avg);
  const box = $("items"); box.replaceChildren();
  MOTIVES.forEach((m, i) => {
    const r = ratingOf(m.id);
    const row = document.createElement("div"); row.className = "row";
    const main = document.createElement("div"); main.className = "row-main";
    const it = document.createElement("button"); it.type = "button"; it.className = "item";
    const mini = document.createElement("span");
    if (r) { mini.className = "mini"; mini.innerHTML = face(r, SCALE[r - 1].say); } else mini.className = "mini empty";
    const st = document.createElement("strong"); st.textContent = m.name;
    const ic = document.createElement("span"); ic.className = "ic"; ic.innerHTML = icon(m.icon);
    it.append(mini, ic, st);
    onTap(it, () => { fromSummary = true; step = i; renderStep(); show("step"); });
    main.append(it);
    const c = commentOf(m.id).trim();
    if (c) {
      const cb = document.createElement("button"); cb.type = "button"; cb.className = "cbtn";
      cb.setAttribute("aria-label", "Kommentar zeigen"); cb.setAttribute("aria-expanded", "false");
      cb.innerHTML = BUBBLE;
      const p = document.createElement("p"); p.className = "ctext"; p.textContent = c; p.hidden = true;
      onTap(cb, () => { p.hidden = !p.hidden; cb.setAttribute("aria-expanded", String(!p.hidden)); });
      main.append(cb); row.append(main, p);
    } else row.append(main);
    box.append(row);
  });
}

// ---- Start ----
const dateLabel = () => new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long" });
// Ring um das Gesicht: füllt sich mit dem Durchschnitt (1 = kaum, 5 = voll)
function setGauge(el, avg) {
  el.style.setProperty("--p", avg ? `${Math.round((avg / 5) * 100)}%` : "0%");
}

function renderHome() {
  showVersion();
  $("homeWeek").textContent = `KW ${WEEK.w} · ${dateLabel()}`;
  const n = MOTIVES.filter((m) => ratingOf(m.id)).length;
  const avg = average();
  const fc = $("homeFace");
  if (n === MOTIVES.length) {
    fc.className = "gauge-face"; fc.innerHTML = face(Math.round(avg));
    $("homeText").innerHTML = "";
    $("homeText").append("Diese Woche erledigt. Im Schnitt ", Object.assign(document.createElement("b"), { textContent: sayFor(avg).toLowerCase() }), ".");
    $("homeBtn").textContent = "Ergebnis ansehen";
  } else if (n > 0) {
    fc.className = "gauge-face"; fc.innerHTML = face(Math.round(avg));
    $("homeText").textContent = `${n} von ${MOTIVES.length} Motivatoren bewertet.`;
    $("homeBtn").textContent = `Weiter bei ${MOTIVES[firstOpen()].name}`;
  } else {
    fc.className = "gauge-face empty"; fc.innerHTML = face(3);
    $("homeText").textContent = "Diese Woche noch nicht bewertet. Dauert etwa zwei Minuten.";
    $("homeBtn").textContent = "Woche bewerten";
  }
  setGauge($("homeGauge"), n ? avg : null);
  if (dbError) $("homeText").textContent = "Speichern auf diesem Gerät ist gerade nicht möglich.";
  // Einmalige Meldung nach dem Laden einer Sicherung
  let notice = null;
  try { notice = sessionStorage.getItem("kompass:notice"); sessionStorage.removeItem("kompass:notice"); } catch {}
  if (notice) $("homeText").textContent = notice;
}
onTap($("homeBtn"), () => {
  if (MOTIVES.every((m) => ratingOf(m.id))) { renderSummary(); show("summary"); }
  else { fromSummary = false; step = firstOpen(); renderStep(); show("step"); }
});
// „Neu ausfüllen“: löscht die Bewertungen dieser Woche. Zweistufig, damit nichts aus Versehen verschwindet.
let redoTimer = 0;
function resetRedo() { clearTimeout(redoTimer); $("redoBtn").classList.remove("confirm"); $("redoBtn").textContent = "Neu ausfüllen"; }
onTap($("redoBtn"), async () => {
  if (!$("redoBtn").classList.contains("confirm")) {
    $("redoBtn").classList.add("confirm"); $("redoBtn").textContent = "Wirklich löschen?";
    redoTimer = setTimeout(resetRedo, 3000);
    return;
  }
  resetRedo();
  try { await store.clearWeek(WEEK.key); } catch { flashSaved(false); return; }
  entries = {};
  fromSummary = false; step = 0; renderStep(); show("step");
});
onTap($("doneBtn"), goHome);
$("exportBtn").addEventListener("click", () => store.exportFile());
// „Sicherung laden“: Datei wählen, zusammenführen, dann neu laden (Motivatoren können sich ändern)
$("importBtn").addEventListener("click", () => $("importFile").click());
$("importFile").addEventListener("change", async (e) => {
  const file = e.target.files[0]; e.target.value = "";
  if (!file) return;
  let msg;
  try {
    const r = await store.importFile(file);
    msg = r.added
      ? `Sicherung geladen: ${r.added} Einträge aus ${r.weeks} ${r.weeks === 1 ? "Woche" : "Wochen"} übernommen.`
      : "Sicherung geladen. Alles war schon auf dem Gerät.";
    if (r.motivesTaken) msg += " Motivatoren übernommen.";
  } catch {
    msg = "Diese Datei konnte nicht geladen werden. Ist es eine Sicherung des Motivation Trackers?";
  }
  try { sessionStorage.setItem("kompass:notice", msg); } catch {}
  location.reload();
});

// ---- Verlauf ----
// Übersicht mit 8 Wochen je Seite (Seite 0 = die neuesten), Detail je Motivator
let historyRows = [], historyPage = 0, historyPages = 1, historyFrom = "home";
async function openHistory(from) {
  historyFrom = from; historyPage = 0;
  try { historyRows = await store.loadAllEntries(); } catch { historyRows = []; flashSaved(false); }
  renderHistory(); show("history");
}
function renderHistory() {
  historyPages = renderOverview($("history"), {
    motives: MOTIVES, rows: historyRows, page: historyPage,
    onOpen: (m) => { renderDetail($("detail"), { motive: m, rows: historyRows }); show("detail"); },
  });
}
function pageHistory(delta) {
  const p = Math.min(historyPages - 1, Math.max(0, historyPage + delta));
  if (p === historyPage) return;
  historyPage = p; renderHistory();
  const rows = $("history").querySelector(".h-rows");
  rows.classList.remove("in-next", "in-prev"); void rows.offsetWidth;
  rows.classList.add(delta > 0 ? "in-prev" : "in-next");
}
function closeHistory() {
  if (historyFrom === "summary") { renderSummary(); show("summary"); } else goHome();
}
onTap($("historyBtn"), () => openHistory("home"));
onTap($("sumHistoryBtn"), () => openHistory("summary"));
onTap($("historyBack"), closeHistory);
onTap($("detailBack"), () => show("history"));
onTap($("history").querySelector(".h-older"), () => pageHistory(1));
onTap($("history").querySelector(".h-newer"), () => pageHistory(-1));
// Wischen: nach rechts = ältere Wochen, nach links = neuere
{
  let sx = 0, sy = 0;
  const card = $("history").querySelector(".h-card");
  card.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  card.addEventListener("touchend", (e) => {
    const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) > 60 && Math.abs(dy) < 40) pageHistory(dx > 0 ? 1 : -1);
  });
}

// ---- Beta: Kennzeichnung und Werkzeuge zum Ausprobieren ----
if (IS_BETA) {
  document.documentElement.classList.add("beta");
  document.title += " Beta";
  $("betaTools").hidden = false;
  // Beim allerersten Öffnen mit leerer Datenbank: Beispieldaten automatisch laden.
  // Danach nie wieder von selbst, damit eigene Testeingaben und „Daten zurücksetzen“ erhalten bleiben.
  const SEEDED = "kompass-beta:seeded";
  let seeded = true;
  try { seeded = localStorage.getItem(SEEDED) === "1"; } catch {}
  if (!seeded) {
    try {
      if (!(await store.loadAllEntries()).length) {
        const { sampleEntries } = await import("./sample.js");
        await store.writeEntries(sampleEntries(MOTIVES));
        try { sessionStorage.setItem("kompass:notice", "Beta mit Beispieldaten der letzten Wochen gestartet."); } catch {}
      }
      localStorage.setItem(SEEDED, "1");
    } catch {}
  }
  onTap($("sampleBtn"), async () => {
    const { sampleEntries } = await import("./sample.js");
    try { await store.writeEntries(sampleEntries(MOTIVES)); } catch { flashSaved(false); return; }
    try { sessionStorage.setItem("kompass:notice", "Beispieldaten für die letzten Wochen geladen."); } catch {}
    location.reload();
  });
  onTap($("resetBtn"), async () => {
    if (!confirm("Alle Daten dieser Beta löschen? Die echte App ist davon nicht betroffen.")) return;
    try { await store.resetAll(); } catch { flashSaved(false); return; }
    try { sessionStorage.setItem("kompass:notice", "Beta-Daten gelöscht."); } catch {}
    location.reload();
  });
}

// ---- Beim Öffnen und nach jedem Neuladen: Start ----
if (dbError) flashSaved(false);
renderHome();

// Neue Kalenderwoche, während die App offen war: neu starten, damit der neue Datensatz gilt
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && isoWeek(new Date()).key !== WEEK.key) location.reload();
});

store.requestPersistence();

// ---- Offline-Fähigkeit und Updates ----
// Neue Version wird erkannt, sobald sich sw.js geändert hat (VERSION erhöht).
// Übernimmt eine neue Version, lädt die App sich einmal selbst neu. Jede Eingabe
// liegt schon in der Datenbank (auch Kommentare, bei jedem Tastendruck), es geht nichts verloren.
if ("serviceWorker" in navigator) {
  // Nur ein Wechsel des EIGENEN Service Workers ist ein Update. Beim ersten Besuch der Beta ist kurz
  // noch der von Production zuständig (/beta/ liegt darunter); dessen Ablösung ist kein Grund zum Neuladen.
  const own = new URL("./sw.js", location.href).href;
  const hadController = navigator.serviceWorker.controller?.scriptURL === own;
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || reloading) return;
    reloading = true; location.reload();
  });
  navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" }).then((reg) => {
    // Beim Zurückholen aus dem Hintergrund nach einer neuen Version fragen
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") reg.update().catch(() => {});
    });
  }).catch(() => {});
}

