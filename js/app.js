import { DEFAULT_MOTIVES, SCALE } from "./config.js";
import * as store from "./storage.js";

store.applySetupFromHash();
const MOTIVES = store.loadMotives() || DEFAULT_MOTIVES;

const $ = (id) => document.getElementById(id);

// Tippen sofort auswerten. Chrome auf Android verschluckt sonst den ersten Tipp
// bis etwa 1 Sekunde nach einem Wischen. Maus und Tastatur nutzen weiter „click“.
function onTap(el, fn) {
  let x = 0, y = 0, ok = false;
  el.addEventListener("touchstart", (e) => {
    ok = e.touches.length === 1; x = e.touches[0].clientX; y = e.touches[0].clientY;
  }, { passive: true });
  el.addEventListener("touchend", (e) => {
    const t = e.changedTouches[0];
    if (!ok || !t || Math.hypot(t.clientX - x, t.clientY - y) > 12) return;
    e.preventDefault(); // verhindert den zusätzlichen „click“, sonst zählt es doppelt
    fn();
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

// ---- Schritt ----
MOTIVES.forEach(() => $("progress").append(document.createElement("span")));
$("progress").style.gridTemplateColumns = `repeat(${MOTIVES.length}, 1fr)`;
SCALE.forEach((s) => {
  const b = document.createElement("button");
  b.type = "button"; b.className = "opt"; b.setAttribute("role", "radio"); b.dataset.v = s.v;
  b.style.setProperty("--c", s.color);
  const num = document.createElement("b"); num.textContent = s.v;
  const lab = document.createElement("small"); lab.textContent = s.label;
  b.append(num, lab);
  onTap(b, () => choose(s.v));
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
  const box = $("qBox"); box.style.transform = ""; box.style.opacity = "";
  box.classList.remove("fade", "in-next", "in-prev"); void box.offsetWidth;
  box.classList.add(dir > 0 ? "in-next" : dir < 0 ? "in-prev" : "fade");
  $("qName").textContent = m.name;
  $("qText").textContent = m.q;
  [...$("scale").children].forEach((b) => {
    const on = Number(b.dataset.v) === r;
    b.classList.toggle("sel", on); b.setAttribute("aria-checked", String(on));
  });
  $("verdict").textContent = r ? SCALE[r - 1].say : "Tippe eine Zahl an";
  $("swipeHint").hidden = !r;
  const c = check.comments[m.id] || "";
  $("comment").value = c;
  $("comment").hidden = !c;
  $("commentToggle").hidden = !!c;
  $("nextBtn").disabled = !r;
  $("nextBtn").textContent = step === MOTIVES.length - 1 ? "Ergebnis zeigen" : "Weiter";
}

function choose(v) {
  check.ratings[MOTIVES[step].id] = v;
  store.saveDraft(check);
  navigator.vibrate?.(8);
  renderStep();
}

$("comment").addEventListener("input", (e) => {
  const id = MOTIVES[step].id;
  if (e.target.value.trim()) check.comments[id] = e.target.value; else delete check.comments[id];
  store.saveDraft(check);
});
onTap($("commentToggle"), () => {
  $("comment").hidden = false; $("commentToggle").hidden = true; $("comment").focus();
});

// Schutz gegen Doppeltipps auf „Weiter“
let lockedUntil = 0;
const lock = () => { lockedUntil = Date.now() + 300; };

function goNext() {
  if (Date.now() < lockedUntil) return;
  if (!check.ratings[MOTIVES[step].id]) { nudge(); return; }
  lock();
  if (step < MOTIVES.length - 1) { step += 1; renderStep(1); window.scrollTo(0, 0); return; }
  finish();
}
function goBack() {
  if (Date.now() < lockedUntil || step === 0) return;
  lock(); step -= 1; renderStep(-1);
}
// Noch keine Zahl gewählt: Skala kurz wackeln lassen statt weiterzugehen
function nudge() {
  const sc = $("scale"); sc.classList.remove("shake"); void sc.offsetWidth; sc.classList.add("shake");
  $("verdict").textContent = "Erst eine Zahl antippen";
  navigator.vibrate?.([10, 40, 10]);
}

onTap($("nextBtn"), goNext);
onTap($("backBtn"), goBack);

// ---- Wischen: nach links = weiter, nach rechts = zurück ----
// Nur waagerechte Bewegungen zählen, damit Scrollen und Tippen normal funktionieren.
let sx = 0, sy = 0, swiping = false, horizontal = null;
const stepEl = $("step");
stepEl.addEventListener("touchstart", (e) => {
  if (e.touches.length !== 1 || e.target.closest("textarea")) { swiping = false; return; }
  sx = e.touches[0].clientX; sy = e.touches[0].clientY; swiping = true; horizontal = null;
}, { passive: true });
stepEl.addEventListener("touchmove", (e) => {
  if (!swiping) return;
  const dx = e.touches[0].clientX - sx, dy = e.touches[0].clientY - sy;
  if (horizontal === null && Math.hypot(dx, dy) > 10) horizontal = Math.abs(dx) > Math.abs(dy) * 1.2;
  if (!horizontal) return;
  // Karte folgt dem Finger ein Stück, damit man sieht, dass etwas passiert
  const box = $("qBox");
  box.classList.remove("fade", "in-next", "in-prev");
  box.style.transition = "none";
  box.style.transform = `translateX(${dx * 0.5}px)`;
  box.style.opacity = String(1 - Math.min(Math.abs(dx) / 400, 0.5));
}, { passive: true });
const endSwipe = (e) => {
  if (!swiping) return;
  swiping = false;
  const t = e.changedTouches[0];
  const dx = t ? t.clientX - sx : 0;
  const box = $("qBox"); box.style.transition = ""; box.style.transform = ""; box.style.opacity = "";
  if (!horizontal || Math.abs(dx) < 60) return;
  if (dx < 0) goNext(); else goBack();
};
stepEl.addEventListener("touchend", endSwipe);
stepEl.addEventListener("touchcancel", endSwipe);

// ---- Android: Zurück-Geste und Zurück-Taste ----
// Ohne das würde die Zurück-Geste (Wischen vom Bildschirmrand) die App schließen.
// So geht sie wie das Wischen nach rechts einen Motivator zurück.
history.pushState({ kompass: 1 }, "");
window.addEventListener("popstate", () => {
  if (!$("step").hidden && step > 0) {
    step -= 1; renderStep(-1);
    history.pushState({ kompass: 1 }, "");
  } else {
    history.back(); // erster Motivator oder Zusammenfassung: App normal verlassen
  }
});

// Tastatur am Rechner: Pfeiltasten und 1–5
document.addEventListener("keydown", (e) => {
  if ($("step").hidden || e.target.closest?.("textarea")) return;
  if (e.key === "ArrowRight") goNext();
  else if (e.key === "ArrowLeft") goBack();
  else if (/^[1-5]$/.test(e.key)) choose(Number(e.key));
});

function finish() {
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
function renderSummary() {
  $("sumWeek").textContent = `KW ${WEEK.w} · ${new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}`;
  const avg = average(check);
  $("avg").textContent = avg == null ? "–" : String(avg).replace(".", ",");
  const box = $("items"); box.replaceChildren();
  for (const m of MOTIVES) {
    const r = check.ratings[m.id] || 0;
    const it = document.createElement("div"); it.className = "item";
    const h = document.createElement("div"); h.className = "h";
    const st = document.createElement("strong"); st.textContent = m.name;
    const sp = document.createElement("span"); sp.textContent = r ? `${r} / 5` : "–";
    h.append(st, sp);
    const bar = document.createElement("div"); bar.className = "bar";
    const fill = document.createElement("i");
    fill.style.width = `${r * 20}%`; fill.style.setProperty("--c", SCALE[(r || 1) - 1].color);
    bar.append(fill);
    it.append(h, bar);
    const c = (check.comments[m.id] || "").trim();
    if (c) { const p = document.createElement("p"); p.textContent = c; it.append(p); }
    box.append(it);
  }
}

$("editBtn").addEventListener("click", () => {
  check = emptyCheck(); step = 0; renderStep(); show("step");
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

// Version unten in der Zusammenfassung anzeigen, damit man sieht, was läuft
window.caches?.keys().then((keys) => {
  const k = keys.find((x) => x.startsWith("kompass-"));
  if (k) $("version").textContent = `Version ${k.replace("kompass-", "")}`;
}).catch(() => {});
