# 003 – Eigene Entscheidungsfrage im Verlauf

**Status:** Freigegeben · **Issue:** #11

## Problem

Der Verlauf zeigt, wie sich die Motivatoren entwickeln. Wofür der Nutzer das wissen will, steht nirgends. Ohne
diesen Bezug liest man die Balken als Stimmungsbild statt als Grundlage für eine Entscheidung, und die Frage selbst
verschwimmt über die Wochen.

## User Story

**Als** Nutzer, der den Verlauf für eine Entscheidung über seine Situation nutzt,
**möchte ich** meine eigene Frage oben im Verlauf festhalten,
**damit** ich die Entwicklung der Motivatoren immer im Licht dieser Frage lese.

## Akzeptanzkriterien

**Anzeigen**
- **AK-1** Ist eine Frage festgehalten, steht sie oben in der Übersicht „Entwicklung“, über den Motivatoren.
- **AK-2** Ist keine Frage festgehalten, steht dort ein dezenter Hinweis „Eigene Frage festhalten“. Er drängt sich nicht auf.
- **AK-3** Die Übersicht passt weiter ohne Scrollen auf ein Pixel-Handy (412 × 870), hell und dunkel, auch mit der längsten erlaubten Frage.

**Bearbeiten**
- **AK-4** Antippen der Frage oder des Hinweises öffnet ein Eingabefeld mit der bisherigen Frage, „Speichern“ und „Abbrechen“.
- **AK-5** Die Frage ist höchstens 140 Zeichen lang. Das Feld zeigt, wie viele Zeichen noch frei sind.
- **AK-6** Leer speichern entfernt die Frage. Danach erscheint wieder der Hinweis aus AK-2.
- **AK-7** „Abbrechen“ und die Zurück-Geste verwerfen die Eingabe, die bisherige Frage bleibt.

**Speichern und Sicherung**
- **AK-8** Die Frage bleibt nach Schließen und Neustart der App erhalten. Sie wird nur auf dem Gerät gespeichert.
- **AK-9** Die Frage ist Teil von „Daten sichern“. „Sicherung laden“ übernimmt sie nur, wenn auf dem Gerät noch keine Frage festgehalten ist.
- **AK-10** Production und Beta haben jeweils ihre eigene Frage. Die Beispieldaten der Beta enthalten keine Frage.

## Nicht-Ziele

- **Keine Antwort auf die Frage,** keine Abstimmung je Woche, kein Ja/Nein-Zähler. Die App zeigt die Entwicklung, der Mensch beantwortet die Frage.
- **Keine Frage im Einrichtungslink:** Sie ist persönlich und wird nur auf dem Gerät eingegeben.
- **Nur eine Frage,** kein Verlauf früherer Fragen.
- **Keine Anzeige auf Start, Bewerten oder Auswertung.** Der Wochencheck bleibt unbeeinflusst und schnell.
- **Kein Datum** („seit wann gilt die Frage“) und keine Erinnerung.

## Entscheidungen

- Gespeichert als Einstellung (`settings` → `decisionQuestion`). Das Datenmodell bekommt keine neue Tabelle, eine Migration ist nicht nötig.
- Nur im Verlauf sichtbar: Dort wird die Entscheidung vorbereitet. Beim Bewerten soll sie das Urteil über die einzelne Woche nicht färben.
- 140 Zeichen: genug für eine klare Frage, kurz genug für zwei Zeilen über der Übersicht.

## Offen / später

- Soll die Frage zusätzlich in der Detailansicht eines Motivators stehen?
- Ein Datum, seit wann die Frage gilt, könnte den Verlauf ab diesem Zeitpunkt hervorheben.
