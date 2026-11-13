// Neutraler Symbolkasten. Welcher Motivator welches Symbol bekommt, steht NICHT hier,
// sondern im Feld "icon" der Motivatoren (Einrichtungslink bzw. DEFAULT_MOTIVES).

const PATHS = {
  key:    '<circle cx="8" cy="8" r="4.5"/><path d="M11.3 11.3 20.5 20.5M16.5 16.5l2.5-2.5M19 19l2-2"/>',
  blocks: '<rect x="3" y="14" width="8" height="7" rx="1.2"/><rect x="13" y="14" width="8" height="7" rx="1.2"/><rect x="8" y="5" width="8" height="8" rx="1.2"/>',
  heart:  '<path d="M12 20.5s-7.5-4.6-7.5-10.1A4.3 4.3 0 0 1 12 7.7a4.3 4.3 0 0 1 7.5 2.7c0 5.5-7.5 10.1-7.5 10.1z"/>',
  star:   '<path d="m12 3.2 2.6 5.5 6 .8-4.4 4.2 1.1 5.9L12 16.7l-5.3 2.9 1.1-5.9-4.4-4.2 6-.8z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.3"/><circle cx="12" cy="12" r="1.6"/>',
  bird:   '<path d="M2.5 9.5c3.2-2.3 6.5-1.8 9.5 3 3-4.8 6.3-5.3 9.5-3"/><path d="M6 16c2-1.2 4-1 6 1.5 2-2.5 4-2.7 6-1.5"/>',
  sprout: '<path d="M12 21v-8.5"/><path d="M12 12.5C12 8.3 9 6 4.5 6c0 4.2 3 6.5 7.5 6.5z"/><path d="M12 10.5c0-3.5 2.6-5.5 6.5-5.5 0 3.6-2.6 5.5-6.5 5.5z"/>',
};

export const ICON_NAMES = Object.keys(PATHS);

export function icon(name) {
  const p = PATHS[name];
  if (!p) return "";
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
}
