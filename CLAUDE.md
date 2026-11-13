# Regeln für Claude in diesem Repository

Motivations-Kompass: installierbare Web-App (PWA) ohne Build-Schritt, gehostet über GitHub Pages aus `main` (Root).
Aufbau und Datenmodell: siehe README.md.

## Arbeitsweise
- Änderungen direkt auf `main` committen und pushen, außer der Nutzer will ausdrücklich einen Pull Request. GitHub Pages veröffentlicht nur `main`.
- Bei jeder Änderung an App-Dateien `VERSION` in `sw.js` um eins erhöhen, sonst zeigt das Handy die alte Version.
- Neue Dateien, die die App lädt, in die `FILES`-Liste in `sw.js` eintragen.
- Kein Build-Tool, kein Framework, keine externen Skripte oder Schriften. Reines HTML, CSS und JavaScript-Module.
- Nach einer Änderung kurz erklären, was sich geändert hat und warum, in einfacher Sprache. Der Nutzer lernt damit Produktentwicklung mit KI. Dabei offen sagen, was Claude selbst entschieden hat, ohne zu fragen.
- Bei größeren oder mehrdeutigen Wünschen erst kurz kritisch prüfen, Optionen mit Empfehlung nennen und nachfragen. Kleine, eindeutige Wünsche direkt umsetzen.
- Vor dem Push testen: Playwright ist vorinstalliert. Lokal mit `python3 -m http.server` ausliefern, mit Pixel-Größe (412 × 870, isMobile, hasTouch) in hell und dunkel durchklicken, auf Konsolenfehler achten und prüfen, dass die Auswertung ohne Scrollen passt.
- Die Gestaltung (siehe README, Abschnitt Gestaltung) beibehalten: Farben nur über die Tokens in `css/app.css`, gleiche Gesichter und Symbole auf allen Bildschirmen.

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
