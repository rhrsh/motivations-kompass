# Motivation Tracker

Wöchentlicher Check: Wie gut sind meine Motivatoren erfüllt?
Installierbare Web-App (PWA), läuft auf dem Handy, Daten bleiben auf dem Gerät.

Name: „Motivation Tracker“, unter dem Icon kurz „Motivation“. Repository, Web-Adresse, Datenbank (`kompass`) und
Format der Sicherung (`motivations-kompass/2`) behalten den alten Namen, damit Einrichtungslink, Daten und alte
Sicherungen weiter funktionieren.

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
| `js/env.js` | **Umgebung:** Production oder Beta, eigene Datenbank und eigener Offline-Speicher |
| `js/week.js` | Kalenderwoche (ISO) |
| `js/history.js` | **Verlauf:** Wochenliste, Richtung, Übersicht und Detail |
| `js/sample.js` | Beispieldaten, nur in der Beta |
| `manifest.webmanifest` | Macht die Seite installierbar (Name, Icon, Vollbild) |
| `sw.js` | Service Worker: App startet auch offline |
| `specs/` | **Spezifikationen:** was die App tun soll, mit Akzeptanzkriterien |
| `root/` | Weiterleitung von der früheren Adresse auf `app/` |
| `tests/`, `playwright.config.js`, `package.json` | Automatische Tests (nur Entwicklung, nicht Teil der App) |
| `.github/workflows/` | CI (Tests), Auslieferung (Production und Beta), GitHub Release |

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
- **Verlauf** (Knopf auf dem Start, Link in der Auswertung): je Motivator eine Zeile mit 8 Wochenbalken
  (Höhe = Bewertung, Farbe unterstützt), darunter Richtung und Höhe, z. B. „steigt · jetzt weitgehend“.
  Richtung = Schnitt der letzten 4 bewerteten Wochen gegen die 4 davor, ab 0,5 Unterschied, erst ab 6 bewerteten
  Wochen. Ausgelassene Wochen als grauer Strich. Ältere Wochen per Pfeil oder Wischen (nach rechts = älter).
  Zeile antippen → Detail: Linie über alle Wochen, Vergleich in Zahlen, alle Kommentare (neueste zuerst).
  Bewusst ohne Gesamtschnitt, Gewichtung oder Empfehlung: Die App zeigt, der Mensch entscheidet.
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
Einrichtungslink aufs Handy geladen: `…/motivations-kompass/app/#setup=<base64url-JSON>`.
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

## Umgebungen

| Umgebung | Adresse | Branch | Daten |
|---|---|---|---|
| **Production** | `…/motivations-kompass/app/` | `main` | echte Daten (Datenbank `kompass`) |
| **Beta** | `…/motivations-kompass/beta/` | `staging` | Testdaten (Datenbank `kompass-beta`) |

Die frühere Adresse `…/motivations-kompass/` leitet auf Production weiter (Dateien in `root/`).
Production und Beta liegen nebeneinander statt ineinander, damit sich beide als eigene Apps installieren lassen.
Beide gehören zur selben Website und teilen sich den Speicher des Browsers. `js/env.js` erkennt die Umgebung
am Pfad und gibt Datenbank und Offline-Speicher eigene Namen, damit die Beta echte Daten nie berührt.
Die Beta ist mit „Beta“ gekennzeichnet (in der App und mit eigenem Icon aus `icons/beta/`, das die Auslieferung nur
dort einsetzt). Beim ersten Öffnen lädt sie Beispieldaten; unten gibt es „Beispieldaten laden“ und „Daten zurücksetzen“.
Um mit echten Daten zu testen: in Production „Daten sichern“, in der Beta „Sicherung laden“.
Details und Akzeptanzkriterien: `specs/001-umgebungen.md`.

## Entwicklungsprozess

```
Issue → Spec → Freigabe im Chat → Feature-Branch → PR nach staging → Tests (CI) → Auto-Merge → Beta → Abnahme
      → Release-PR staging → main → Merge durch den Product Owner → Production → GitHub Release (automatisch)
```

1. **Issue:** Wunsch im Backlog (GitHub Issues).
2. **Spec** (`specs/`): Problem, User Story, nummerierte Akzeptanzkriterien (AK-1 …), Nicht-Ziele, Entscheidungen.
   Der Product Owner gibt sie im Chat frei. Siehe `specs/README.md`.
3. **Feature-Branch** (`feature/…`, `fix/…`) von `staging`, dann **Pull Request nach `staging`**.
4. **CI** (`.github/workflows/ci.yml`): Die Tests in `tests/` laufen automatisch. Ihre Titel nennen das Kriterium,
   z. B. `[002 AK-7]`. Lokal: `npm install`, dann `npm test`.
5. **Auto-Merge:** Sind die Tests grün, merged GitHub den PR nach `staging` selbst. Ein Ruleset verhindert Merges ohne grüne Tests.
6. **Beta:** `.github/workflows/deploy.yml` liefert den Stand von `staging` aus. Abnahme gegen die Akzeptanzkriterien,
   auch mehrere Tickets zusammen (Integrationstest).
7. **Release:** Pull Request `staging` → `main` mit Release Notes. Den Merge macht der Product Owner, das ist das Release.
   Danach legt `.github/workflows/release.yml` Tag `vNN` und GitHub Release an.
8. **Hotfix:** dringende Korrektur von `main` aus direkt nach `main`, danach zurück nach `staging` (Backmerge).

**Rollback:** Den Merge mit „Revert“ rückgängig machen, die vorige Version ist dann wieder live.

## Grenzen und nächste Schritte

- Daten nur auf diesem Handy. Browser-Daten löschen = Daten weg → regelmäßig „Daten sichern“.
- **Sicherung laden** führt die Datei mit den Daten auf dem Gerät zusammen: Gibt es einen Eintrag (Woche + Motivator)
  doppelt, gewinnt der neuere. Motivatoren aus der Datei werden nur übernommen, wenn auf dem Gerät noch keine
  eingerichtet sind. Liest auch Sicherungen aus der Zeit vor v7.
- **Offen:** Erinnerung an den Wochencheck.
- Verworfen: eigene Entscheidungsfrage im Verlauf (`specs/003-entscheidungsfrage.md`).
- Bewusst nicht: Mustererkennung, Cloud-Speicher, Konten.
