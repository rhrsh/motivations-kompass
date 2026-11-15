# Regeln für Claude in diesem Repository

Motivation Tracker (Repository: motivations-kompass): installierbare Web-App (PWA) ohne Build-Schritt, gehostet über GitHub Pages aus `main` (Root).
Aufbau und Datenmodell: siehe README.md.

## Arbeitsweise (Entwicklungsprozess)
Der Nutzer ist Product Owner und nutzt die App produktiv mit echten Daten. Er will professionelle Entwicklung
lernen und auf die Arbeit übertragen. Daher die Fachbegriffe verwenden (Issue, Feature-Branch, Pull Request,
CI, Preview, Abnahme, Merge, Release, Rollback) und kurz erklären, wenn sie neu sind.

Ablauf: **Issue → Feature-Branch → Pull Request → CI grün → Preview → Abnahme → Merge = Release**
- Jede Änderung beginnt mit einem Issue (User Story mit Akzeptanzkriterien). Kleine Korrekturen dürfen ohne Issue starten.
- Nie direkt auf `main` pushen. Arbeit auf einem Feature-Branch (`feature/…`, `fix/…`), dann Pull Request nach `main`.
  Im PR auf das Issue verweisen (`Closes #…`) und beschreiben: was, warum, wie getestet, was der Nutzer in der Preview prüfen soll.
- Nur der Nutzer merged. Claude merged nie selbst.
- Production = `main` unter `/`. Preview = neuester offener Pull Request unter `/beta/` (siehe `.github/workflows/deploy.yml`).
- Preview und Production sind über `js/env.js` getrennt (eigene Datenbank, eigener Offline-Speicher). Diese Trennung nie aufweichen.
- Rollback: Merge-Commit auf einem Branch per `git revert` rückgängig machen und als PR einreichen.

Definition of Done (vor jedem PR):
- Automatische Tests grün: `npm test` (Pixel-Größe, hell und dunkel, ohne Konsolenfehler, Auswertung ohne Scrollen).
  Neue Funktionen bekommen einen Test in `tests/`.
- Zusätzlich neue Bildschirme mit Playwright ansehen (Screenshots hell und dunkel).
- `VERSION` in `sw.js` um eins erhöht, neue App-Dateien in `FILES` eingetragen.
- README aktuell. Datenschutzprüfung (siehe unten) erledigt.

Datensicherheit:
- Gespeicherte Daten bleiben immer lesbar. Änderungen am Datenmodell nur mit Migration (`DB_VERSION` erhöhen),
  vorher mit Daten im alten Format testen. Im PR deutlich vermerken, dass der Nutzer vor dem Merge „Daten sichern“ soll.

Technik und Gestaltung:
- Kein Build-Tool, kein Framework, keine externen Skripte oder Schriften in der App. Reines HTML, CSS und JavaScript-Module.
  `package.json` dient nur den Tests.
- Die Gestaltung (siehe README, Abschnitt Gestaltung) beibehalten: Farben nur über die Tokens in `css/app.css`,
  gleiche Gesichter und Symbole auf allen Bildschirmen.

Kommunikation:
- Nach einer Änderung kurz erklären, was sich geändert hat und warum, in einfacher Sprache. Dabei offen sagen,
  was Claude selbst entschieden hat, ohne zu fragen.
- Bei größeren oder mehrdeutigen Wünschen erst kurz kritisch prüfen, Optionen mit Empfehlung nennen und nachfragen.
  Kleine, eindeutige Wünsche direkt umsetzen.

## Einrichtungslink
- Ändert der Nutzer Motivatoren, Leitfragen oder Symbole, einen neuen Einrichtungslink erzeugen (Format siehe README) und **nur im Chat** ausgeben, nie in Dateien, Commits oder Kommentare schreiben.
- Basis-URL: `https://rhrsh.github.io/motivations-kompass/#setup=…`. Bestehende `id`s beibehalten.

## Datenschutz (wichtig, das Repository ist öffentlich)
- Keine persönlichen Daten ins Repository: keine Namen, E-Mail-Adressen, Arbeitgeber, Firmen, Kollegen, Orte.
- Keine Namen fremder Produkte oder Firmen als Design-Vorlage nennen, weder in Dateien noch in Commit-Nachrichten. Stil nur allgemein beschreiben. Keine fremden Grafiken übernehmen, alles selbst zeichnen.
- Vor jedem Push prüfen: `git grep -n -i` und `git log --format=%B` auf Namen, E-Mail-Adressen und persönliche Motivatoren.
- Die persönlichen Motivatoren des Nutzers stehen nie im Code. Sie werden per Einrichtungslink (`#setup=…`) aufs Gerät geladen. `DEFAULT_MOTIVES` in `js/config.js` bleibt neutral.
- Bewertungen und Kommentare bleiben im Browser des Nutzers. Keine Analyse-Tools, keine Server-Aufrufe, kein Tracking.
- Commit-Autor und Committer nur über die noreply-Adresse von GitHub: `rhrsh <356160256+rhrsh@users.noreply.github.com>`. Vor dem ersten Commit einer Sitzung `git config user.name` und `git config user.email` darauf setzen und nach dem Commit mit `git log -1 --format='%an <%ae> / %cn <%ce>'` prüfen.
- Keine Sitzungs-Links (z. B. `Claude-Session: …`) in Commit-Nachrichten oder Pull Requests. Erlaubt ist nur `Co-Authored-By: Claude … <noreply@anthropic.com>`.
