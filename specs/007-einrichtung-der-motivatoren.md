# 007 – Einrichtung der Motivatoren

**Status:** Umgesetzt (v21) · **Issue:** #17 (Spec nachgezogen)

## Problem

Die Motivatoren sind persönlich. Sie dürfen nicht im öffentlichen Code stehen, müssen aber ohne Bearbeitungsoberfläche
einmalig aufs Handy kommen.

## User Story

**Als** Nutzer
**möchte ich** meine eigenen Motivatoren mit einem Link auf das Handy laden,
**damit** sie privat bleiben und ich trotzdem nichts von Hand eintippen muss.

## Akzeptanzkriterien

- **AK-1** Ein Einrichtungslink `…/motivations-kompass/app/#setup=<Daten>` legt die Liste der Motivatoren auf dem Gerät ab. Je Motivator: `id`, Name, Leitfrage, Symbol.
- **AK-2** Nach dem Öffnen entfernt die App den Teil nach `#` aus der Adresse. Er wird nie an einen Server geschickt.
- **AK-3** Ist die App schon geöffnet, wird ein neuer Einrichtungslink trotzdem angewendet.
- **AK-4** Ohne eingerichtete Motivatoren zeigt die App neutrale Standard-Motivatoren.
- **AK-5** Bewertungen hängen an der `id`. Ändern sich Name, Leitfrage oder Symbol bei gleicher `id`, bleiben alle bisherigen Bewertungen zugeordnet.
- **AK-6** Das Symbol stammt aus einem festen, neutralen Symbolkasten (key, blocks, heart, star, target, bird, sprout).
- **AK-7** Der Link funktioniert auch über die frühere Adresse ohne `app/` (siehe 001, AK-11).
- **AK-8** Production und Beta haben getrennte Motivatoren.

## Nicht-Ziele

- Keine Oberfläche zum Bearbeiten der Motivatoren in der App.
- Persönliche Motivatoren stehen nie im Code, in Specs, Issues oder Pull Requests.

## Entscheidungen

- Link statt Formular: Hält die App schlicht. Die seltene Änderung erledigt Claude, indem ein neuer Link im Chat entsteht.
- Der Teil nach `#` bleibt im Browser. So erreichen die persönlichen Motivatoren nie den Server.

## Testabdeckung

Tests nennen das Kriterium im Titel, z. B. `[004 AK-2]`.

| Kriterium | Abgedeckt durch |
|---|---|
| AK-1 bis AK-6, AK-8 | `tests/einrichtung.spec.js` |
| AK-7 | `[001 AK-11]` in `tests/umgebungen.spec.js` |

## Offen (vorgemerkt in #19, Lösung folgt)

- Ein fehlerhafter Link wird stillschweigend ignoriert, ein erfolgreicher nicht bestätigt. Man merkt erst beim Bewerten, ob er gewirkt hat.
- Ein neuer Link ersetzt die vorhandenen Motivatoren ohne Rückfrage.
- Ein unbekannter Symbolname führt zu einem Motivator ohne Symbol, ohne Hinweis.
