// Verlauf über mehrere Wochen: Berechnung und Darstellung.
// Die App zeigt die Entwicklung, sie urteilt nicht. Keine Gewichtung, kein Gesamtschnitt.
import { SCALE } from "./config.js";
import { face } from "./faces.js";
import { icon } from "./icons.js";
import { isoWeek } from "./week.js";

export const WINDOW = 8;      // Wochen in der Übersicht
const MIN_FOR_TREND = 6;      // so viele bewertete Wochen braucht eine Aussage über die Richtung
const COMPARE = 4;            // letzte 4 bewertete Wochen gegen die 4 davor
const THRESHOLD = 0.5;        // ab diesem Unterschied „steigt“ bzw. „sinkt“, sonst „stabil“

// Alle Kalenderwochen von der ersten mit Daten bis heute, älteste zuerst
export function weekList(rows, today = new Date()) {
  const first = rows.reduce((m, r) => (r.rating && (!m || r.week < m) ? r.week : m), null);
  const keys = [];
  const d = new Date(today);
  for (let i = 0; i < 520; i++) { // höchstens 10 Jahre
    const w = isoWeek(d);
    keys.unshift(w);
    if (!first || w.key <= first) break;
    d.setDate(d.getDate() - 7);
  }
  return keys;
}

// Bewertungen je Motivator und Woche: { motive: { week: rating } }
export function ratingsByMotive(rows) {
  const out = {};
  for (const r of rows) if (r.rating) (out[r.motive] ??= {})[r.week] = r.rating;
  return out;
}

const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const levelWord = (avg) => SCALE[Math.min(5, Math.max(1, Math.round(avg))) - 1].label.replace(/­/g, "").toLowerCase();
const fmt = (n) => n.toFixed(1).replace(".", ",");

// Richtung und Höhe aus den bewerteten Wochen (älteste zuerst)
export function trend(values) {
  const n = values.length;
  if (!n) return { kind: "none", text: "noch keine Bewertung" };
  const recent = values.slice(-COMPARE), before = values.slice(-COMPARE * 2, -COMPARE);
  const now = mean(recent);
  if (n < MIN_FOR_TREND) {
    const missing = MIN_FOR_TREND - n;
    return { kind: "wait", now, text: `${levelWord(now)} · Richtung ab ${missing} ${missing === 1 ? "weiteren Woche" : "weiteren Wochen"}` };
  }
  const prev = mean(before), diff = now - prev;
  const kind = diff >= THRESHOLD ? "steigt" : diff <= -THRESHOLD ? "sinkt" : "stabil";
  return { kind, now, prev, text: kind === "stabil" ? `stabil · ${levelWord(now)}` : `${kind} · jetzt ${levelWord(now)}` };
}

// ---- Übersicht ----
export function renderOverview(el, { motives, rows, page, onOpen }) {
  const weeks = weekList(rows), by = ratingsByMotive(rows);
  const pages = Math.max(1, Math.ceil(weeks.length / WINDOW));
  const end = weeks.length - page * WINDOW;
  const shown = weeks.slice(Math.max(0, end - WINDOW), end);
  while (shown.length < WINDOW) shown.unshift(null); // links auffüllen, wenn es noch wenige Wochen gibt
  const lastKey = shown[shown.length - 1].key;

  el.querySelector(".h-range").textContent = shown[0] ? `KW ${shown[0].w}–${shown[WINDOW - 1].w}` : `bis KW ${shown[WINDOW - 1].w}`;
  el.querySelector(".h-older").disabled = page >= pages - 1;
  el.querySelector(".h-newer").disabled = page === 0;
  el.querySelector(".kw").innerHTML = shown.map((w) => `<span>${w ? w.w : ""}</span>`).join("");

  const box = el.querySelector(".h-rows"); box.replaceChildren();
  for (const m of motives) {
    const r = by[m.id] || {};
    const values = weeks.filter((w) => w.key <= lastKey && r[w.key]).map((w) => r[w.key]);
    const t = trend(values);
    if (page > 0) t.text = t.text.replace("jetzt", "zuletzt");
    const row = document.createElement("button"); row.type = "button"; row.className = "h-row";
    const label = shown.map((w) => (w && r[w.key] ? `KW ${w.w}: ${SCALE[r[w.key] - 1].say}` : "")).filter(Boolean).join(", ");
    row.setAttribute("aria-label", `${m.name}, ${t.text}. ${label}`);
    row.innerHTML = `<span class="h-name"><strong></strong><small class="t-${t.kind}"></small></span>` +
      `<span class="bars" aria-hidden="true">${shown.map((w) => {
        const v = w && r[w.key];
        return v ? `<i style="height:${v * 20}%;background:var(--s${v})"></i>` : `<i class="gap"></i>`;
      }).join("")}</span>`;
    row.querySelector("strong").textContent = m.name;
    row.querySelector("small").textContent = t.text;
    row.addEventListener("click", () => onOpen(m));
    box.append(row);
  }
  return pages;
}

// ---- Detail eines Motivators ----
export function renderDetail(el, { motive, rows }) {
  const weeks = weekList(rows), r = ratingsByMotive(rows)[motive.id] || {};
  const values = weeks.filter((w) => r[w.key]).map((w) => r[w.key]);
  const t = trend(values);

  el.querySelector(".d-icon").innerHTML = icon(motive.icon);
  el.querySelector(".d-name").textContent = motive.name;
  el.querySelector(".d-q").textContent = motive.q || "";
  el.querySelector(".d-chart").innerHTML = values.length ? chart(weeks, r) : `<p class="note">Noch keine Bewertung.</p>`;
  el.querySelector(".d-cmp").innerHTML = t.prev != null
    ? `Letzte 4 Wochen <b>${fmt(t.now)}</b> · davor <b>${fmt(t.prev)}</b> · <b>${t.kind}</b>`
    : values.length ? `Vergleich ab ${MIN_FOR_TREND} bewerteten Wochen` : "";

  const list = el.querySelector(".d-comments"); list.replaceChildren();
  const comments = rows.filter((x) => x.motive === motive.id && x.comment?.trim()).sort((a, b) => (a.week < b.week ? 1 : -1));
  for (const c of comments) {
    const item = document.createElement("div"); item.className = "cl";
    item.innerHTML = `<span class="mini">${c.rating ? face(c.rating, SCALE[c.rating - 1].say) : ""}</span><div><small></small><p></p></div>`;
    item.querySelector("small").textContent = `KW ${Number(c.week.slice(-2))}`;
    item.querySelector("p").textContent = c.comment;
    list.append(item);
  }
  if (!comments.length) list.innerHTML = `<p class="note">Noch keine Kommentare zu diesem Motivator.</p>`;
}

// Linie über alle Wochen, Gesichter als Skala, Lücken gestrichelt überbrückt
function chart(weeks, r) {
  const W = 340, H = 180, x0 = 30, x1 = W - 8, top = 10, bottom = H - 22;
  const n = weeks.length, x = (i) => (n === 1 ? (x0 + x1) / 2 : x0 + (i * (x1 - x0)) / (n - 1));
  const y = (v) => bottom - ((v - 1) * (bottom - top)) / 4;
  const pts = weeks.map((w, i) => (r[w.key] ? { x: x(i), y: y(r[w.key]), v: r[w.key] } : null));
  let solid = "", dashed = "", last = null;
  pts.forEach((p, i) => {
    if (!p) return;
    if (last) { const seg = `M${last.p.x} ${last.p.y}L${p.x} ${p.y}`; if (last.i === i - 1) solid += seg; else dashed += seg; }
    last = { p, i };
  });
  const step = Math.ceil(n / 8); // höchstens etwa 8 Beschriftungen
  const grid = [1, 2, 3, 4, 5].map((v) =>
    `<line x1="${x0}" x2="${x1}" y1="${y(v)}" y2="${y(v)}" class="c-grid"/>` +
    face(v).replace('<svg class="face"', `<svg class="face" x="0" y="${y(v) - 10}" width="20" height="20"`)).join("");
  const labels = weeks.map((w, i) => ((n - 1 - i) % step === 0 ? `<text x="${x(i)}" y="${H - 4}" class="c-kw">${w.w}</text>` : "")).join("");
  const dots = pts.map((p) => (p ? `<circle cx="${p.x}" cy="${p.y}" r="5" fill="var(--s${p.v})" class="c-dot"/>` : "")).join("");
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Verlauf der Bewertungen">${grid}` +
    `<path d="${dashed}" class="c-gap"/><path d="${solid}" class="c-line"/>${dots}${labels}</svg>`;
}
