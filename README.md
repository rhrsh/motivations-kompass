# Motivations-Kompass

Wöchentlicher Check: Wie gut sind meine Motivatoren erfüllt?
Installierbare Web-App (PWA), läuft auf dem Handy, Daten bleiben auf dem Gerät.

## Aufbau

| Datei | Wofür |
|---|---|
| `index.html` | Gerüst der drei Bildschirme (Start, Bewerten, Auswertung) |
| `css/app.css` | Aussehen. Farben oben als Tokens |
| `js/config.js` | **Inhalte:** neutrale Standard-Motivatoren, Skala |
| `js/storage.js` | **Datenhaltung:** IndexedDB, Umzug alter Daten, Sichern und Laden |
| `js/faces.js` | Die fünf Gesichter der Skala (SVG) |
| `js/icons.js` | Neutraler Symbolkasten für die Motivatoren (Zuordnung im Einrichtungslink) |
| `js/app.js` | **Logik:** Ablauf, Navigation, Zusammenfassung |
| `manifest.webmanifest` | Macht die Seite installierbar (Name, Icon, Vollbild) |
| `sw.js` | Service Worker: App startet auch offline |

## Bedienung

- **Start** (beim Öffnen und nach jedem Neuladen): Kalenderwoche, Gesicht im Ring mit dem Stand der Woche, ein Knopf
  („Woche bewerten“ / „Weiter bei …“ / „Ergebnis ansehen“). Unten „Daten sichern“, „Sicherung laden“ und die Versionsnummer.
- **Bewerten:** Symbol des Motivators, Name, Leitfrage, darunter fünf Gesichter als Karten
  (links traurig/rot = 1, rechts lachend/grün = 5, ohne Text). Antippen → nach kurzer Pause (`ADVANCE_MS`) nächster Motivator.
  Ins Feld „Warum?“ tippen → die App wartet; „Weiter →“ unter dem Feld oder Enter geht weiter.
  Unten: runder Zurück-Knopf (auf Motivator 1 zum Start), Zähler, Fortschrittsbalken (antippen springt).
- **Auswertung** (passt ohne Scrollen auf ein Pixel-Handy): Gesamt-Gesicht im Ring, eine Zeile je Motivator mit
  Gesicht und Symbol, Kommentare per Sprechblase aufklappbar. Zeile antippen = ändern.
  „Neu ausfüllen“ löscht die Bewertungen der Woche (zweiter Tipp bestätigt), „Fertig“ führt zum Start.
- Android-Zurück-Geste: ein Motivator zurück bzw. zum Start; vom Start aus wird die App verlassen.

## Gestaltung

- Hell und luftig: großer weicher Kreis im Hintergrund, weiße Karten mit sanften Schatten, zentrierte Inhalte,
  runde Pillen-Knöpfe, Akzentfarbe Petrol. Dunkler Modus mit gleichem Aufbau.
- Gesichter (`js/faces.js`): eigene SVG-Zeichnung mit leichtem Glanz und Schatten. Die Mimik trägt die Bedeutung,
  die Farbe unterstützt sie.
- Ring (`.gauge`): füllt sich mit dem Durchschnitt von Rot nach Grün (`--p` in Prozent).
- App-Icon (`icons/icon.svg`): Gesicht im Farbring wie auf dem Startbildschirm, heller Hintergrund. Die PNG-Dateien
  daneben sind daraus erzeugt; das Ringbild liegt innerhalb der sicheren Zone für runde Android-Icons.
- Symbole (`js/icons.js`): einfache Strichzeichnungen, verfügbar: key, blocks, heart, star, target, bird, sprout.

## Persönliche Motivatoren

Die eigenen Motivatoren stehen bewusst nicht im öffentlichen Code. Sie werden einmalig über einen
Einrichtungslink aufs Handy geladen: `…/motivations-kompass/#setup=<base64url-JSON>`.
Der Teil nach `#` wird vom Browser nie an den Server geschickt. Die App speichert die Liste
in der IndexedDB (`settings` → `motives`) und entfernt den Teil aus der Adresse.

Format der Liste (JSON, UTF-8, dann base64url ohne `=`):

```json
[{ "id": "beispiel", "name": "Beispiel", "q": "Leitfrage?", "icon": "key" }]
```

`id` nie ändern, sonst verlieren alte Bewertungen ihren Bezug. `icon` ist einer der Namen aus `js/icons.js`.

## Datenmodell

IndexedDB-Datenbank `kompass` (nur auf dem Gerät) mit zwei Tabellen (Object Stores):

| Tabelle | Schlüssel | Inhalt |
|---|---|---|
| `entries` | `[week, motive]` | ein Datensatz je Kalenderwoche und Motivator. Index `byWeek` auf `week` |
| `settings` | `key` | Einstellungen, z. B. `motives` (persönliche Motivatoren) |

```json
{ "week": "2026-W46", "motive": "verantwortung", "rating": 4, "comment": "…", "updatedAt": "2026-11-13T09:59:54.160Z" }
```

`rating`: 1 = gar nicht … 5 = voll erfüllt, `null` = noch nicht eingeordnet. Jede Eingabe schreibt sofort nur
diesen einen Datensatz; es gibt keinen Entwurf und keinen Speichermoment. Der Schnitt wird nicht gespeichert,
sondern beim Anzeigen berechnet. Alte Daten aus dem localStorage (bis Version v6) übernimmt die App beim ersten
Start automatisch.

## Änderungen veröffentlichen

1. Code ändern, committen, auf `main` pushen.
2. In `sw.js` die `VERSION` erhöhen.
3. GitHub Pages baut automatisch neu (ca. 1 Minute).
4. Auf dem Handy: App öffnen oder aus dem Hintergrund holen. Die App lädt sich dann selbst neu.
   Welche Version läuft, steht unten in der Zusammenfassung.

## Grenzen und nächste Schritte

- Daten nur auf diesem Handy. Browser-Daten löschen = Daten weg → regelmäßig „Daten sichern“.
- **Sicherung laden** führt die Datei mit den Daten auf dem Gerät zusammen: Gibt es einen Eintrag (Woche + Motivator)
  doppelt, gewinnt der neuere. Motivatoren aus der Datei werden nur übernommen, wenn auf dem Gerät noch keine
  eingerichtet sind. Liest auch Sicherungen aus der Zeit vor v7.
- **Offen:** Verlauf über die Wochen (Daten werden schon gespeichert,
  aber nicht angezeigt), Erinnerung an den Wochencheck.
- Bewusst nicht: Mustererkennung, Cloud-Speicher, Konten.
