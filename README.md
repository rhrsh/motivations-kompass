# Motivations-Kompass

Wöchentlicher Check: Wie gut sind meine Motivatoren erfüllt?
Installierbare Web-App (PWA), läuft auf dem Handy, Daten bleiben auf dem Gerät.

## Aufbau

| Datei | Wofür |
|---|---|
| `index.html` | Gerüst der beiden Bildschirme (Bewerten, Zusammenfassung) |
| `css/app.css` | Aussehen. Farben oben als Tokens |
| `js/config.js` | **Inhalte:** neutrale Standard-Motivatoren, Skala |
| `js/storage.js` | **Datenhaltung:** Speichern im Browser, Entwurf, Export |
| `js/app.js` | **Logik:** Ablauf, Navigation, Zusammenfassung |
| `manifest.webmanifest` | Macht die Seite installierbar (Name, Icon, Vollbild) |
| `sw.js` | Service Worker: App startet auch offline |

## Persönliche Motivatoren

Die eigenen Motivatoren stehen bewusst nicht im öffentlichen Code. Sie werden einmalig über einen
Einrichtungslink aufs Handy geladen: `…/motivations-kompass/#setup=<base64url-JSON>`.
Der Teil nach `#` wird vom Browser nie an den Server geschickt. Die App speichert die Liste unter
`kompass:motives` im localStorage und entfernt den Teil aus der Adresse.

## Datenmodell

Ein Eintrag pro Kalenderwoche im `localStorage` unter `kompass:checks`:

```json
{ "2026-W46": { "week": "2026-W46", "ratings": { "verantwortung": 3 }, "comments": { "verantwortung": "…" }, "average": 3.0, "updatedAt": "…" } }
```

Ältere Wochen bleiben gespeichert, werden in v1 aber nicht angezeigt.

## Änderungen veröffentlichen

1. Code ändern, committen, auf `main` pushen.
2. In `sw.js` die `VERSION` erhöhen.
3. GitHub Pages baut automatisch neu (ca. 1 Minute).
4. Auf dem Handy: App öffnen oder aus dem Hintergrund holen. Die App lädt sich dann selbst neu.
   Welche Version läuft, steht unten in der Zusammenfassung.

## Grenzen v1

- Daten nur auf diesem Handy. Browser-Daten löschen = Daten weg → regelmäßig „Daten sichern“.
- Kein Verlauf über die Zeit, keine Mustererkennung (bewusst out of scope).
