// Beispieldaten für die Preview (beta). Wird in Production nie geladen.
// Erzeugt zurückliegende Wochen (ohne die aktuelle), damit man z. B. den Verlauf ausprobieren kann.
// Die Werte sind ausgedacht, aber nicht zufällig: Jeder Motivator bekommt eine erkennbare Entwicklung
// (steigt, sinkt, stabil hoch, stabil niedrig, schwankt), und eine Woche fehlt wie nach einem Urlaub.
import { isoWeek } from "./week.js";

const PATTERNS = [
  (i) => 2 + i * 0.22,                    // steigt
  (i) => 4.2 - i * 0.2,                   // sinkt
  () => 4.4,                              // stabil hoch
  () => 2.1,                              // stabil niedrig
  (i) => 3 + (i % 3 === 0 ? 1.2 : -0.6),  // schwankt
  (i) => 3.4 + i * 0.05,                  // fast stabil
  (i) => 3 + Math.sin(i / 2) * 1.1,       // Welle
];
const COMMENTS = [
  "Viel Abstimmung, wenig eigene Entscheidungen.", "Gutes Gespräch, hat Klarheit gebracht.",
  "Neues Thema übernommen.", "Woche war von Terminen bestimmt.", "Konnte etwas Eigenes voranbringen.",
  "Rückmeldung kam spät.", "Viel gelernt, aber anstrengend.",
];

export function sampleEntries(motives, weeks = 12, today = new Date()) {
  const rows = [];
  for (let back = weeks; back >= 1; back--) {
    if (back === 5) continue; // ausgelassene Woche
    const d = new Date(today); d.setDate(d.getDate() - back * 7);
    const week = isoWeek(d).key, i = weeks - back;
    motives.forEach((m, k) => {
      const noise = ((i * 7 + k * 13) % 5 - 2) * 0.2;
      const rating = Math.min(5, Math.max(1, Math.round(PATTERNS[k % PATTERNS.length](i) + noise)));
      const comment = (i + k) % 4 === 0 ? COMMENTS[(i + k) % COMMENTS.length] : "";
      rows.push({ week, motive: m.id, rating, comment, updatedAt: d.toISOString() });
    });
  }
  return rows;
}
