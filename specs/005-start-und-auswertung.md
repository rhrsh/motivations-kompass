# 005 – Start und Auswertung der Woche

**Status:** Umgesetzt (v21) · **Issue:** #17 (Spec nachgezogen)

## Problem

Beim Öffnen soll sofort klar sein, wo man in dieser Woche steht und was als Nächstes zu tun ist. Nach dem Bewerten
braucht es einen kompakten Überblick über die Woche, ohne Scrollen und ohne Urteil der App.

## User Story

**Als** Nutzer
**möchte ich** beim Öffnen den Stand der Woche sehen und nach dem Bewerten alle Motivatoren auf einen Blick,
**damit** ich ohne Umwege weitermache oder das Ergebnis der Woche erfasse.

## Akzeptanzkriterien

**Start**
- **AK-1** Die App öffnet immer mit dem Start, auch nach Neuladen. Oben Kalenderwoche und Datum, darunter ein Gesicht im Ring.
- **AK-2** Der Ring füllt sich mit dem Schnitt der Woche von Rot nach Grün; das Gesicht entspricht dem gerundeten Schnitt.
- **AK-3** Text und Hauptknopf folgen dem Stand: nichts bewertet → „Diese Woche noch nicht bewertet. Dauert etwa zwei Minuten.“ und „Woche bewerten“; teilweise → „n von N Motivatoren bewertet.“ und „Weiter bei <Motivator>“; alles → „Diese Woche erledigt. Im Schnitt <Stufe>.“ und „Ergebnis ansehen“.
- **AK-4** Darunter der Knopf „Verlauf“ (siehe 002), unten „Daten sichern“, „Sicherung laden“ (siehe 006) und die Versionsnummer.
- **AK-5** Ist Speichern auf dem Gerät nicht möglich, sagt der Start das: „Speichern auf diesem Gerät ist gerade nicht möglich.“

**Auswertung**
- **AK-6** Oben das Gesicht im Ring mit dem Schnitt in Worten („Im Schnitt … erfüllt“), Kalenderwoche und Datum.
- **AK-7** Eine Zeile je Motivator mit Gesicht und Symbol. Gibt es einen Kommentar, öffnet eine Sprechblase ihn; erneutes Antippen schließt ihn.
- **AK-8** Zeile antippen führt zu diesem Motivator zum Ändern und danach zurück zur Auswertung.
- **AK-9** „Neu ausfüllen“ löscht nach einem zweiten Tipp („Wirklich löschen?“, 3 Sekunden Zeit) alle Bewertungen und Kommentare dieser Woche und beginnt beim ersten Motivator.
- **AK-10** „Fertig“ führt zum Start. Ein Link „Verlauf ansehen“ führt zum Verlauf.
- **AK-11** Die Auswertung passt ohne Scrollen auf ein Pixel-Handy (412 × 870), hell und dunkel.

**Navigation**
- **AK-12** Die Android-Zurück-Geste geht einen Schritt zurück: im Bewerten zum vorigen Motivator bzw. zum Start, aus der Auswertung zum Start; auf dem Start verlässt sie die App.

## Nicht-Ziele

- Keine Bewertung oder Empfehlung durch die App, keine Ampel „gut/schlecht“ über die Gesichter hinaus.
- Kein Vergleich mit Vorwochen in der Auswertung (dafür gibt es den Verlauf).

## Entscheidungen

- Der Schnitt wird nicht gespeichert, sondern beim Anzeigen berechnet. So kann er nie veralten.
- Zweistufiges Löschen statt Bestätigungsdialog: schnell, aber nicht aus Versehen.
- „Neu ausfüllen“ beginnt die Woche ganz neu, auch ohne Kommentare (entschieden vom Product Owner bei der Spec-Prüfung).

## Testabdeckung

Tests nennen das Kriterium im Titel, z. B. `[004 AK-2]`.

| Kriterium | Abgedeckt durch |
|---|---|
| AK-1 bis AK-4, AK-6 bis AK-10, AK-12 | `tests/auswertung.spec.js` |
| AK-3, AK-11 | `tests/app.spec.js` (ganze Woche), AK-10 und AK-11 auch `[002 AK-14, AK-15]` |
| AK-5 | noch ohne Test (Speicherfehler lässt sich im Test schwer erzeugen) |
