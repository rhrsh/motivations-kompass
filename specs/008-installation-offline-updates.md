# 008 – Installation, Offline-Betrieb und Updates

**Status:** Umgesetzt (v21) · **Issue:** #17 (Spec nachgezogen)

## Problem

Die App soll sich wie eine normale App anfühlen: vom Startbildschirm, ohne Netz, und mit neuen Versionen,
ohne dass man sich darum kümmern muss oder Daten verliert.

## User Story

**Als** Nutzer
**möchte ich** die App installieren, auch offline nutzen und Updates automatisch bekommen,
**damit** der Wochencheck so einfach ist wie jede andere App auf dem Handy.

## Akzeptanzkriterien

- **AK-1** Die App lässt sich auf Android über Chrome installieren und startet im Vollbild mit eigenem Icon und dem Namen „Motivation“.
- **AK-2** Nach dem ersten Öffnen startet sie auch ohne Netz.
- **AK-3** Mit Netz lädt sie immer den neuesten Stand; nur ohne Netz kommt die gespeicherte Kopie.
- **AK-4** Gibt es eine neue Version, übernimmt die App sie beim Öffnen oder Hervorholen und lädt sich einmal selbst neu. Eingaben gehen dabei nicht verloren.
- **AK-5** Die laufende Version steht unten auf dem Start („Version vNN“, in der Beta „· Beta“).
- **AK-6** Startbildschirm beim Öffnen in der hellen Hintergrundfarbe der App.
- **AK-7** Daten aus sehr alten Versionen (bis v6, damals im localStorage) werden beim ersten Start einmalig übernommen.

## Nicht-Ziele

- Kein Hinweis „Neue Version verfügbar, jetzt laden?“: Das Update kommt still.
- Keine Benachrichtigungen.

## Entscheidungen

- Erst Netz, dann gespeicherte Kopie: Änderungen kommen sofort an, offline geht trotzdem.
- Stilles Update mit Neuladen: Weil jede Eingabe sofort gespeichert ist (004 AK-7), ist das gefahrlos.

## Testabdeckung

Tests nennen das Kriterium im Titel, z. B. `[004 AK-2]`.

| Kriterium | Abgedeckt durch |
|---|---|
| AK-1, AK-6 | Manifest in `tests/updates.spec.js`; das Installieren selbst nur von Hand auf dem Gerät |
| AK-2, AK-5, AK-7 | `tests/updates.spec.js` |
| AK-3, AK-4 | noch ohne Test (Netz und Versionswechsel im Test aufwendig nachzustellen) |

## Offen

- Beim allerersten Öffnen steht unten noch keine Versionsnummer, erst ab dem zweiten Öffnen (der Offline-Speicher wird erst angelegt). Gefunden beim Schreiben der Tests.
