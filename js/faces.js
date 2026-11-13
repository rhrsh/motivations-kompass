// Die fünf Gesichter der Skala als SVG. Eigene Zeichnung, keine Emojis,
// damit sie auf jedem Gerät gleich aussehen. Die Mimik trägt die Bedeutung,
// die Farbe unterstützt sie (auch lesbar bei Rot-Grün-Schwäche).

const FEATURES = {
  // Stufe 1: traurig – Brauen innen hoch, Mundwinkel stark nach unten
  1: `<path d="M17 20 L26 16.5 M38 16.5 L47 20"/><circle cx="23" cy="27" r="3" class="f"/><circle cx="41" cy="27" r="3" class="f"/><path d="M21 47 Q32 36 43 47"/>`,
  // Stufe 2: unzufrieden – leicht nach unten
  2: `<circle cx="23" cy="26" r="3" class="f"/><circle cx="41" cy="26" r="3" class="f"/><path d="M23 44 Q32 39 41 44"/>`,
  // Stufe 3: neutral – gerader Mund
  3: `<circle cx="23" cy="26" r="3" class="f"/><circle cx="41" cy="26" r="3" class="f"/><path d="M23 42 L41 42"/>`,
  // Stufe 4: zufrieden – Lächeln
  4: `<circle cx="23" cy="26" r="3" class="f"/><circle cx="41" cy="26" r="3" class="f"/><path d="M22 38 Q32 47 42 38"/>`,
  // Stufe 5: begeistert – lachende Augen, offener Mund
  5: `<path d="M18 27 Q23 21 28 27 M36 27 Q41 21 46 27"/><path d="M19 36 Q32 55 45 36 Z" class="f"/>`,
};

export function face(v, label = "") {
  const role = label ? `role="img" aria-label="${label}"` : `aria-hidden="true"`;
  return `<svg class="face" viewBox="0 0 64 64" ${role} style="--fc:var(--s${v});--fi:var(--s${v}-ink)">` +
    `<circle cx="32" cy="32" r="30" class="bg"/>` +
    `<path d="M8 40a25 25 0 0 0 48 0a26 22 0 0 1-48 0z" class="shade"/>` +
    `<ellipse cx="23" cy="13" rx="10" ry="4.5" class="shine"/>` +
    `<g class="ft">${FEATURES[v]}</g></svg>`;
}
