import { DEFAULT_MOTIVES, SCALE } from "./config.js";
import * as store from "./storage.js";

store.applySetupFromHash();
const MOTIVES = store.loadMotives() || DEFAULT_MOTIVES;

const $ = (id) => document.getElementById(id);

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
  b.addEventListener("click", () => choose(s.v));
  $("scale").append(b);
});

function renderStep() {
  const m = MOTIVES[step];
  const r = check.ratings[m.id] || 0;
  $("backBtn").style.visibility = step === 0 ? "hidden" : "visible";
  $("stepCount").textContent = `${step + 1} / ${MOTIVES.length}`;
  [...$("progress").children].forEach((el, i) => {
    el.className = i === step ? "now" : check.ratings[MOTIVES[i].id] ? "done" : "";
  });
  const box = $("qBox"); box.classList.remove("fade"); void box.offsetWidth; box.classList.add("fade");
  $("qName").textContent = m.name;
  $("qText").textContent = m.q;
  [...$("scale").children].forEach((b) => {
    const on = Number(b.dataset.v) === r;
    b.classList.toggle("sel", on); b.setAttribute("aria-checked", String(on));
  });
  $("verdict").textContent = r ? SCALE[r - 1].say : "Tippe eine Zahl an";
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
$("commentToggle").addEventListener("click", () => {
  $("comment").hidden = false; $("commentToggle").hidden = true; $("comment").focus();
});

// Schutz gegen Doppeltipps auf „Weiter“
let lockedUntil = 0;
const lock = () => { lockedUntil = Date.now() + 300; };

$("nextBtn").addEventListener("click", () => {
  if (Date.now() < lockedUntil || !check.ratings[MOTIVES[step].id]) return;
  lock();
  if (step < MOTIVES.length - 1) { step += 1; renderStep(); window.scrollTo(0, 0); return; }
  finish();
});
$("backBtn").addEventListener("click", () => { if (step > 0) { lock(); step -= 1; renderStep(); } });

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

// ---- Offline-Fähigkeit ----
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
