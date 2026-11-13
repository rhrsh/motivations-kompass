# Regeln für Claude in diesem Repository

Motivations-Kompass: installierbare Web-App (PWA) ohne Build-Schritt, gehostet über GitHub Pages aus `main` (Root).
Aufbau und Datenmodell: siehe README.md.

## Arbeitsweise
- Änderungen direkt auf `main` committen und pushen, außer der Nutzer will ausdrücklich einen Pull Request. GitHub Pages veröffentlicht nur `main`.
- Bei jeder Änderung an App-Dateien `VERSION` in `sw.js` um eins erhöhen, sonst zeigt das Handy die alte Version.
- Neue Dateien, die die App lädt, in die `FILES`-Liste in `sw.js` eintragen.
- Kein Build-Tool, kein Framework, keine externen Skripte oder Schriften. Reines HTML, CSS und JavaScript-Module.
- Nach einer Änderung kurz erklären, was sich geändert hat und warum, in einfacher Sprache. Der Nutzer lernt damit Produktentwicklung mit KI.

## Datenschutz (wichtig, das Repository ist öffentlich)
- Keine persönlichen Daten ins Repository: keine Namen, E-Mail-Adressen, Arbeitgeber, Firmen, Kollegen, Orte.
- Die persönlichen Motivatoren des Nutzers stehen nie im Code. Sie werden per Einrichtungslink (`#setup=…`) aufs Gerät geladen. `DEFAULT_MOTIVES` in `js/config.js` bleibt neutral.
- Bewertungen und Kommentare bleiben im Browser des Nutzers. Keine Analyse-Tools, keine Server-Aufrufe, kein Tracking.
- Commit-Autor nur über die noreply-Adresse von GitHub.
