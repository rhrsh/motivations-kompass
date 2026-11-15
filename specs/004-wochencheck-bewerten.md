# 004 – Wochencheck: Motivatoren bewerten

**Status:** Umgesetzt (v21) · **Issue:** #17 (Spec nachgezogen)

## Problem

Wie gut die eigenen Motivatoren erfüllt sind, verschwimmt im Alltag. Ein kurzer, fester Wochencheck macht es greifbar,
aber nur, wenn er schnell geht und ohne Hürden auf dem Handy funktioniert.

## User Story

**Als** Nutzer
**möchte ich** einmal pro Woche jeden Motivator in wenigen Sekunden einordnen und bei Bedarf kurz begründen,
**damit** ich mit wenig Aufwand ein ehrliches Bild der Woche bekomme.

## Akzeptanzkriterien

**Ablauf**
- **AK-1** Pro Schritt ein Motivator: Symbol, Name und Leitfrage, darunter fünf Gesichter von traurig/rot (1 = gar nicht erfüllt) links bis lachend/grün (5 = voll erfüllt) rechts, ohne Text.
- **AK-2** Antippen eines Gesichts markiert es und führt nach einer kurzen Pause (0,8 Sekunden, als durchlaufende Linie sichtbar) zum nächsten Motivator.
- **AK-3** Unbewertete Motivatoren werden nicht übersprungen: Nach dem letzten geht es zum ersten noch offenen, sind alle bewertet, zur Auswertung.
- **AK-4** Unten: runder Zurück-Knopf (auf dem ersten Motivator zum Start), Zähler „n / N“ und ein Fortschrittsbalken; ein Abschnitt des Balkens führt direkt zu diesem Motivator.

**Kommentar**
- **AK-5** Unter den Gesichtern ein Feld „Warum? (optional)“. Wer hineintippt, hält den automatischen Wechsel an.
- **AK-6** Sobald im Feld gearbeitet wird oder Text steht und der Motivator bewertet ist, erscheint „Weiter →“. Enter auf der Tastatur hat dieselbe Wirkung.

**Speichern**
- **AK-7** Jede Eingabe (Bewertung und jeder Tastendruck im Kommentar) wird sofort gespeichert; es gibt keinen Speichern-Knopf. Kurz erscheint „✓ Gespeichert“, bei einem Fehler „Speichern fehlgeschlagen“.
- **AK-8** Bewertungen gehören zur aktuellen Kalenderwoche (ISO). Beginnt eine neue Woche, während die App offen ist, startet sie beim nächsten Hervorholen neu und zeigt die neue Woche.

**Robustheit**
- **AK-9** Geht die App in den Hintergrund, während die Pause läuft, springt sie nicht unbemerkt weiter.
- **AK-10** Am Rechner: Pfeiltasten wechseln den Motivator (vorwärts nur, wenn bewertet), Tasten 1–5 bewerten.
- **AK-11** Die Bewertung lässt sich ändern, indem man ein anderes Gesicht antippt; Korrekturen aus der Auswertung führen danach zurück zur Auswertung (siehe 005).

## Nicht-Ziele

- Keine Pflicht zum Kommentar, keine Zeichenbegrenzung.
- Keine Zwischenstufen (z. B. 3,5) und keine Skala mit Zahlen.
- Keine Bewertung vergangener Wochen nachträglich.

## Entscheidungen

- Gesichter statt Zahlen oder Text: Die Mimik trägt die Bedeutung, die Farbe unterstützt sie (auch bei Rot-Grün-Schwäche lesbar).
- Kein Speichern-Knopf: Nichts geht verloren, auch wenn die App mittendrin geschlossen wird.
- Pause vor dem Wechsel statt sofortigem Sprung: Die Wahl bleibt kurz sichtbar und man kann noch kommentieren.

## Testabdeckung

| Kriterium | Test |
|---|---|
| AK-3, AK-7 (Speichern über Neuladen) | „Bewerten: Auswertung passt ohne Scrollen und bleibt nach Neuladen erhalten“ |
| AK-1, AK-2, AK-4, AK-5, AK-6, AK-8 bis AK-11 | noch ohne eigenen Test |

## Offen

- Nachträgliches Bewerten einer vergessenen Woche ist nicht möglich. Bewusst so lassen?
