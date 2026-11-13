// Inhalte der App: Standard-Motivatoren und Skala.

// Neutrale Standardwerte. Die persönlichen Motivatoren stehen NICHT im Code,
// sondern werden einmalig per Einrichtungslink auf das Handy geladen (siehe README).
export const DEFAULT_MOTIVES = [
  { id: "verantwortung", name: "Verantwortung", q: "Wie viel Verantwortung und Entscheidungsspielraum habe ich?" },
  { id: "gestaltung",    name: "Gestaltung",    q: "Kann ich Dinge gestalten und aufbauen?" },
  { id: "sinn",          name: "Sinn",          q: "Identifiziere ich mich mit dem, was ich tue?" },
  { id: "anerkennung",   name: "Anerkennung",   q: "Wird meine Arbeit gesehen und wertgeschätzt?" },
  { id: "wirkung",       name: "Wirkung",       q: "Bewirke ich etwas Relevantes?" },
  { id: "freiheit",      name: "Freiheit",      q: "Kann ich meine Arbeit frei gestalten?" },
  { id: "entwicklung",   name: "Entwicklung",   q: "Lerne und wachse ich?" },
];

export const SCALE = [
  { v: 1, label: "Gar nicht",       color: "var(--s1)", say: "Gar nicht erfüllt" },
  { v: 2, label: "Kaum",            color: "var(--s2)", say: "Kaum erfüllt" },
  { v: 3, label: "Teils",           color: "var(--s3)", say: "Teilweise erfüllt" },
  { v: 4, label: "Weit­gehend", color: "var(--s4)", say: "Weitgehend erfüllt" },
  { v: 5, label: "Voll",            color: "var(--s5)", say: "Voll erfüllt" },
];
