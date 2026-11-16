# 006 – Daten sichern und laden

**Status:** Umgesetzt (v21) · **Issue:** #17 (Spec nachgezogen)

## Problem

Die Daten liegen nur im Browser des Handys. Werden Browserdaten gelöscht oder wechselt das Handy, wären alle Wochen
verloren. Es braucht eine Sicherung, die der Nutzer selbst in der Hand hat, ohne Konto und ohne Server.

## User Story

**Als** Nutzer
**möchte ich** meine Daten als Datei sichern und wieder laden,
**damit** ich nichts verliere und auf ein neues Gerät umziehen kann.

## Akzeptanzkriterien

**Sichern**
- **AK-1** „Daten sichern“ lädt eine Datei `motivation-tracker-JJJJ-MM-TT.json` herunter, Datum nach Ortszeit.
- **AK-2** Die Datei enthält alle Wochen mit Bewertung, Kommentar und Zeitpunkt sowie die eingerichteten Motivatoren.

**Laden**
- **AK-3** „Sicherung laden“ öffnet die Dateiauswahl. Die Datei wird mit den Daten auf dem Gerät zusammengeführt, nichts wird pauschal ersetzt.
- **AK-4** Gibt es denselben Eintrag (Woche und Motivator) doppelt, gewinnt der neuere. Eine ältere Sicherung überschreibt nie neuere Eingaben.
- **AK-5** Motivatoren aus der Datei werden nur übernommen, wenn auf dem Gerät noch keine eingerichtet sind.
- **AK-6** Auch eine Sicherung ohne Bewertungen, aber mit Motivatoren, lässt sich laden.
- **AK-7** Sicherungen aus der Zeit vor Version 7 (altes Format) lassen sich ebenfalls laden.
- **AK-8** Danach meldet der Start, was passiert ist, z. B. „Sicherung geladen: 6 Einträge aus 1 Woche übernommen.“ oder „Alles war schon auf dem Gerät.“
- **AK-9** Eine ungültige Datei ändert nichts und führt zu „Diese Datei konnte nicht geladen werden. Ist es eine Sicherung des Motivation Trackers?“

**Schutz**
- **AK-10** Die App bittet den Browser, ihre Daten nicht automatisch zu löschen, wenn der Speicher knapp wird.
- **AK-11** Mit echten Daten in der Beta testen geht so: in Production sichern, in der Beta laden. Production wird dabei nie verändert.

## Nicht-Ziele

- Kein Cloud-Speicher, kein Konto, keine automatische Sicherung auf einen Server.
- Kein Ersetzen-Modus („alles überschreiben“).
- Keine Erinnerung ans Sichern. Das Sichern liegt in der Verantwortung des Nutzers (entschieden vom Product Owner bei der Spec-Prüfung).

## Entscheidungen

- Zusammenführen statt Ersetzen: Beim Laden kann nichts verloren gehen.
- Das Dateiformat behält die Kennung `motivations-kompass/2`, auch nach der Umbenennung der App, damit alte Sicherungen gültig bleiben.

## Testabdeckung

Tests nennen das Kriterium im Titel, z. B. `[004 AK-2]`.

| Kriterium | Abgedeckt durch |
|---|---|
| AK-1 bis AK-10 | `tests/sicherung.spec.js` |
| AK-11 | Trennung der Daten über `[001 AK-2, AK-4]` |
