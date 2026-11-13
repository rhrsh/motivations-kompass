# Motivations-Kompass

Wöchentlicher Check: Wie gut sind meine Motivatoren erfüllt?
Installierbare Web-App (PWA), läuft auf dem Handy, Daten bleiben auf dem Gerät.

## Aufbau

| Datei | Wofür |
|---|---|
| `index.html` | Gerüst der beiden Bildschirme (Bewerten, Zusammenfassung) |
| `css/app.css` | Aussehen. Farben oben als Tokens |
| `js/config.js` | **Inhalte:** neutrale Standard-Motivatoren, Skala |
| `js/storage.js` | **Datenhaltung:** IndexedDB, Umzug alter Daten, Export |
| `js/app.js` | **Logik:** Ablauf, Navigation, Zusammenfassung |
| `manifest.webmanifest` | Macht die Seite installierbar (Name, Icon, Vollbild) |
| `sw.js` | Service Worker: App startet auch offline |

## Bedienung

- Stufe antippen („Voll erfüllt“ … „Gar nicht erfüllt“) → nach kurzer Pause (`ADVANCE_MS` in `js/config.js`) kommt der nächste Motivator.
- In der Pause ins Feld „Warum?“ tippen → die App wartet. Enter auf der Tastatur geht weiter.
- Fortschrittsbalken antippen springt zu einem Motivator. In der Zusammenfassung einen Motivator antippen, um ihn zu ändern.
- Intern werden die Stufen als 1 (gar nicht) bis 5 (voll) gespeichert; angezeigt werden nur Worte.

## Persönliche Motivatoren

Die eigenen Motivatoren stehen bewusst nicht im öffentlichen Code. Sie werden einmalig über einen
Einrichtungslink aufs Handy geladen: `…/motivations-kompass/#setup=<base64url-JSON>`.
Der Teil nach `#` wird vom Browser nie an den Server geschickt. Die App speichert die Liste
in der IndexedDB (`settings` → `motives`) und entfernt den Teil aus der Adresse.

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

## Grenzen v1

- Daten nur auf diesem Handy. Browser-Daten löschen = Daten weg → regelmäßig „Daten sichern“.
- Kein Verlauf über die Zeit, keine Mustererkennung (bewusst out of scope).
