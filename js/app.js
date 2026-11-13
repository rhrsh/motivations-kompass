import { DEFAULT_MOTIVES, SCALE, ADVANCE_MS } from "./config.js";
import * as store from "./storage.js";

store.applySetupFromHash();
const MOTIVES = store.loadMotives() || DEFAULT_MOTIVES;

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
function isoWeek(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear();
  const w = Math.ceil(((t - Date.UTC(y, 0, 1)) / 86400000 + 1) / 7);
  return { w, key: `${y}-W${String(w).padStart(2, "0")}` };
}
const WEEK = isoWeek(new Date());

// ---- Zustand ----
const emptyCheck = () => ({ week: WEEK.key, ratings: {}, comments: {} });
let check = store.loadDraft(WEEK.key) || emptyCheck();
let step = 0;
let fromSummary = false; // Korrektur aus der Zusammenfassung: danach dorthin zurück

const average = (c) => {
  const v = MOTIVES.map((m) => c.ratings[m.id]).filter(Boolean);
  return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null;
};
const firstOpen = () => Math.max(0, MOTIVES.findIndex((m) => !check.ratings[m.id]));

// ---- Navigation ----
function show(id) {
  for (const s of ["step", "summary"]) $(s).hidden = s !== id;
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
  const open = MOTIVES.findIndex((m) => !check.ratings[m.id]);
  if (open >= 0) { goTo(open, 1); return; }
  finish();
}
function goBack() { if (step > 0) goTo(step - 1, -1); }

// ---- Weiter nach dem Antippen, mit kurzer Pause ----
// In der Pause sieht man die Wahl und kann ins Kommentarfeld tippen, dann bleibt die App stehen.
let timer = 0;
function scheduleAdvance() {
  cancelAdvance();
  const sel = $("scale").querySelector(".sel");
  sel?.style.setProperty("--ms", `${ADVANCE_MS}ms`);
  sel?.classList.add("going");
  timer = setTimeout(goNext, ADVANCE_MS);
}
function cancelAdvance() {
  clearTimeout(timer); timer = 0;
  for (const b of $("scale").children) b.classList.remove("going");
}

// ---- Schritt ----
MOTIVES.forEach((m, i) => {
  const seg = document.createElement("button");
  seg.type = "button"; seg.setAttribute("aria-label", m.name);
  onTap(seg, () => goTo(i, i > step ? 1 : i < step ? -1 : 0));
  $("progress").append(seg);
});
$("progress").style.gridTemplateColumns = `repeat(${MOTIVES.length}, 1fr)`;

// Höchste Stufe oben, damit es sich wie eine Füllstandsanzeige liest
[...SCALE].reverse().forEach((s) => {
  const b = document.createElement("button");
  b.type = "button"; b.className = "opt"; b.setAttribute("role", "radio"); b.dataset.v = s.v;
  b.style.setProperty("--c", s.color);
  const meter = document.createElement("span"); meter.className = "meter";
  for (let i = 1; i <= SCALE.length; i++) {
    const bar = document.createElement("i");
    bar.style.height = `${6 + i * 3}px`; // ansteigend wie eine Füllstandsanzeige
    if (i <= s.v) bar.className = "on";
    meter.append(bar);
  }
  const lab = document.createElement("span"); lab.className = "lab"; lab.textContent = s.say;
  b.append(meter, lab);
  onTap(b, () => choose(s.v));
  // Fokus nicht vom Kommentarfeld wegnehmen (Tastatur bleibt offen)
  b.addEventListener("mousedown", (e) => e.preventDefault());
  $("scale").append(b);
});

function renderStep(dir = 0) {
  const m = MOTIVES[step];
  const r = check.ratings[m.id] || 0;
  $("backBtn").style.visibility = step === 0 ? "hidden" : "visible";
  $("stepCount").textContent = `${step + 1} / ${MOTIVES.length}`;
  [...$("progress").children].forEach((el, i) => {
    el.className = i === step ? "now" : check.ratings[MOTIVES[i].id] ? "done" : "";
  });
  const box = $("qBox");
  box.classList.remove("fade", "in-next", "in-prev"); void box.offsetWidth;
  box.classList.add(dir > 0 ? "in-next" : dir < 0 ? "in-prev" : "fade");
  $("qName").textContent = m.name;
  $("qText").textContent = m.q;
  for (const b of $("scale").children) {
    const on = Number(b.dataset.v) === r;
    b.classList.toggle("sel", on); b.setAttribute("aria-checked", String(on));
  }
  $("comment").value = check.comments[m.id] || "";
}

function choose(v) {
  check.ratings[MOTIVES[step].id] = v;
  store.saveDraft(check);
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
  if (e.target.value.trim()) check.comments[id] = e.target.value; else delete check.comments[id];
  store.saveDraft(check);
});
// Enter auf der Tastatur = weiter (sofern bewertet)
$("comment").addEventListener("keydown", (e) => {
  if (e.key !== "Enter" || e.shiftKey || e.isComposing) return;
  e.preventDefault();
  if (!check.ratings[MOTIVES[step].id]) return;
  $("comment").blur();
  goNext();
});

onTap($("backBtn"), goBack);

// ---- Android: Zurück-Geste und Zurück-Taste ----
// Ohne das würde die Zurück-Geste die App schließen. So geht sie einen Motivator zurück.
history.pushState({ kompass: 1 }, "");
window.addEventListener("popstate", () => {
  if (!$("step").hidden && step > 0) {
    goBack();
    history.pushState({ kompass: 1 }, "");
  } else if (!$("step").hidden && fromSummary) {
    fromSummary = false; renderSummary(); show("summary");
    history.pushState({ kompass: 1 }, "");
  } else {
    history.back(); // erster Motivator oder Zusammenfassung: App normal verlassen
  }
});

// Tastatur am Rechner: Pfeiltasten und 1–5 (5 = voll erfüllt)
document.addEventListener("keydown", (e) => {
  if ($("step").hidden || e.target.closest?.("textarea")) return;
  if (e.key === "ArrowRight" && check.ratings[MOTIVES[step].id]) goNext();
  else if (e.key === "ArrowLeft") goBack();
  else if (/^[1-5]$/.test(e.key)) choose(Number(e.key));
});

// App geht in den Hintergrund: nicht unbemerkt weiterspringen
document.addEventListener("visibilitychange", () => { if (document.hidden) cancelAdvance(); });

function finish() {
  fromSummary = false;
  const done = { ...check, average: average(check), updatedAt: new Date().toISOString() };
  try {
    store.saveWeek(done);
    store.clearDraft();
    $("savedNote").textContent = "Gespeichert auf diesem Handy.";
  } catch {
    $("savedNote").textContent = "Speichern hat nicht geklappt. Bitte über „Daten sichern“ eine Kopie ziehen.";
  }
  check = done;
  renderSummary(); show("summary");
}

// ---- Zusammenfassung ----
const sayFor = (avg) => SCALE[Math.min(SCALE.length, Math.max(1, Math.round(avg))) - 1].say;

// Version unten in der Zusammenfassung anzeigen, damit man sieht, was läuft
function showVersion() {
  window.caches?.keys().then((keys) => {
    const k = keys.find((x) => x.startsWith("kompass-"));
    $("version").textContent = k ? `Version ${k.replace("kompass-", "")}` : "";
  }).catch(() => {});
}

function renderSummary() {
  showVersion();
  $("sumWeek").textContent = `KW ${WEEK.w} · ${new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}`;
  const avg = average(check);
  $("avg").textContent = avg == null ? "–" : sayFor(avg).toLowerCase();
  const box = $("items"); box.replaceChildren();
  MOTIVES.forEach((m, i) => {
    const r = check.ratings[m.id] || 0;
    const it = document.createElement("button"); it.type = "button"; it.className = "item";
    const h = document.createElement("div"); h.className = "h";
    const st = document.createElement("strong"); st.textContent = m.name;
    const sp = document.createElement("span"); sp.textContent = r ? SCALE[r - 1].say : "–";
    h.append(st, sp);
    const bar = document.createElement("div"); bar.className = "bar";
    const fill = document.createElement("i");
    fill.style.width = `${r * 20}%`; fill.style.setProperty("--c", SCALE[(r || 1) - 1].color);
    bar.append(fill);
    it.append(h, bar);
    const c = (check.comments[m.id] || "").trim();
    if (c) { const p = document.createElement("p"); p.textContent = c; it.append(p); }
    onTap(it, () => { fromSummary = true; step = i; renderStep(); show("step"); });
    box.append(it);
  });
}

$("editBtn").addEventListener("click", () => {
  check = emptyCheck(); fromSummary = false; step = 0; renderStep(); show("step");
});
$("exportBtn").addEventListener("click", () => store.exportFile());

// ---- Start: Woche schon erledigt → Ergebnis, sonst erste offene Frage ----
const saved = store.loadWeek(WEEK.key);
if (saved && !store.loadDraft(WEEK.key)) {
  check = saved;
  $("savedNote").textContent = `Zuletzt gespeichert am ${new Date(saved.updatedAt).toLocaleString("de-DE", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" })} Uhr.`;
  renderSummary(); show("summary");
} else {
  step = firstOpen(); renderStep(); show("step");
}

store.requestPersistence();

// ---- Offline-Fähigkeit und Updates ----
// Neue Version wird erkannt, sobald sich sw.js geändert hat (VERSION erhöht).
// Übernimmt eine neue Version, lädt die App sich einmal selbst neu. Entwürfe
// (auch Kommentare, bei jedem Tastendruck) sind gespeichert, es geht nichts verloren.
if ("serviceWorker" in navigator) {
  const hadController = !!navigator.serviceWorker.controller; // beim allerersten Start: kein Update
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

