# 002 – Verlauf über mehrere Wochen

**Status:** Umgesetzt (v18) · **Issue:** #1

## Problem

Eine einzelne Woche ist eine Momentaufnahme, oft geprägt von der Stimmung. Für eine ehrliche Einschätzung über die Zeit
fehlt die Spur: Wächst ein Motivator, sinkt er, oder bleibt er auf einer bestimmten Höhe?

## User Story

**Als** Nutzer, der jede Woche seine Motivatoren bewertet,
**möchte ich** sehen, wie sich jeder Motivator über mehrere Wochen entwickelt,
**damit ich** eine ehrliche Einschätzung über die Zeit habe statt eines Urteils aus einer einzelnen Woche.

## Akzeptanzkriterien

**Übersicht „Entwicklung“**
- **AK-1** Eine Zeile je Motivator, immer in derselben Reihenfolge wie beim Bewerten.
- **AK-2** Je Woche ein schmaler Balken: Höhe = Bewertung (1–5), die Farbe der Stufe unterstützt. 8 Wochen pro Ansicht.
- **AK-3** Ausgelassene Wochen erscheinen als kleiner grauer Strich und zählen in keiner Berechnung.
- **AK-4** Die Kalenderwochen stehen klein über den Balken, der Zeitraum oben in der Karte.
- **AK-5** Unter dem Namen stehen Richtung und Höhe, z. B. „steigt · jetzt weitgehend“ oder „stabil · teils“.
- **AK-6** Richtung = Schnitt der letzten 4 bewerteten Wochen gegen die 4 davor. Ab 0,5 Unterschied „steigt“ bzw. „sinkt“, sonst „stabil“.
- **AK-7** Die Richtung erscheint erst ab 6 bewerteten Wochen. Vorher steht dort die Höhe und „Richtung ab N weiteren Wochen“.
- **AK-8** Ältere Wochen per Pfeil oder Wischen (nach rechts = älter). Dann bezieht sich der Text auf das Ende des gezeigten Zeitraums („zuletzt“ statt „jetzt“).
- **AK-9** Die Übersicht passt ohne Scrollen auf ein Pixel-Handy (412 × 870), hell und dunkel.
- **AK-10** Ohne Bewertungen steht „noch keine Bewertung“.

**Detail je Motivator** (Zeile antippen)
- **AK-11** Symbol, Name, Leitfrage und eine Linie über alle Wochen mit den Gesichtern als Skala. Lücken sind gestrichelt überbrückt.
- **AK-12** Vergleich in Zahlen: „Letzte 4 Wochen x · davor y“, ebenfalls erst ab 6 bewerteten Wochen.
- **AK-13** Alle Kommentare dieses Motivators, neueste Woche zuerst.

**Einstieg**
- **AK-14** Knopf „Verlauf“ auf dem Start und Link „Verlauf ansehen“ in der Auswertung. Die Auswertung passt weiter ohne Scrollen.
- **AK-15** Zurück (Knopf und Geste) führt dorthin, woher man kam.

## Nicht-Ziele

- Kein Gesamtschnitt: Der Fokus liegt auf der Entwicklung einzelner Motivatoren.
- Keine Gewichtung der Motivatoren.
- Keine automatische Bewertung oder Empfehlung. Die App zeigt, der Mensch entscheidet.
- Keine automatische Sortierung (z. B. nach Handlungsbedarf): Feste Positionen erleichtern das Wiederfinden.

## Entscheidungen

- Balken statt Linien oder Gesichtern in der Übersicht: zeigen Höhe und Verlauf zugleich, auch bei stabilen Motivatoren,
  ohne durch Runden zu verfälschen.
- Text in neutralem Grau: Die Farbe tragen die Balken, der Text soll nicht urteilen.
- Die laufende Woche erscheint als Lücke, bis sie bewertet ist.

## Offen / später

- Eine eigene Entscheidungsfrage oben im Verlauf festhalten.
