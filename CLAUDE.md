# Regeln für Claude in diesem Repository

Motivation Tracker (Repository: motivations-kompass): installierbare Web-App (PWA) ohne Build-Schritt, gehostet über GitHub Pages (Production aus `main` unter `/app/`, Beta aus `staging` unter `/beta/`).
Aufbau und Datenmodell: siehe README.md.

## Arbeitsweise (Entwicklungsprozess)
Der Nutzer ist Product Owner und nutzt die App produktiv mit echten Daten. Er will professionelle Entwicklung
lernen und auf die Arbeit übertragen. Daher die Fachbegriffe verwenden (Issue, Feature-Branch, Pull Request,
CI, Staging, Beta, Spec, Akzeptanzkriterium, Abnahme, Merge, Release, Tag, Hotfix, Rollback) und kurz erklären, wenn sie neu sind.

Ablauf (Staging + Spec-driven Development, siehe `specs/README.md`):
**Issue → Spec → Freigabe im Chat → Feature-Branch → PR nach `staging` → CI grün → Auto-Merge → Abnahme in der Beta → Release-PR → Merge durch den Nutzer → GitHub Release automatisch**

Der Nutzer arbeitet so wenig wie möglich in GitHub: Er entscheidet im Chat, nimmt in der Beta-App ab und klickt nur beim Release.
- Branches: `main` = Production (`/app/`), `staging` = Beta (`/beta/`), Arbeit auf `feature/…`, `fix/…`, `spec/…`, `test/…` (von `staging` abzweigen).
- Neue Funktion: zuerst Spec in `specs/` (nach `000-vorlage.md`). Claude zeigt die Spec im Chat (Kernpunkte, Kriterien, Nicht-Ziele, offene Fragen)
  und eröffnet den Spec-PR nach `staging`. Sagt der Nutzer im Chat, dass die Spec passt, schaltet Claude Auto-Merge ein.
  Kleine Korrekturen brauchen keine eigene Spec, ändern aber eine bestehende, wenn sich Verhalten ändert.
- Umsetzung als PR nach `staging`, mit `Closes #…` und Verweis auf die Spec. Beschreiben: was, warum, wie getestet,
  was der Nutzer in der Beta prüfen soll. Tests nennen Spec und Kriterium im Titel, z. B. `[002 AK-7]`.
- PRs nach `staging` (Specs, Umsetzung, Tests, Korrekturen, Rollbacks, Backmerges): Claude schaltet Auto-Merge ein.
  GitHub merged, sobald die Tests grün sind. Wird ein Test rot, behebt Claude die Ursache.
- Nach `main` merged nur der Nutzer: Release-PRs und Hotfixes. Claude schaltet dort nie Auto-Merge ein.
- Release: Claude eröffnet auf Wunsch den PR `staging` → `main` mit Titel „Release vNN – <Kurzbeschreibung>“ und Release Notes
  (umgesetzte Specs und Issues, Hinweise zur Datensicherung). Specs, die im Release stecken, bekommen vorher „Umgesetzt (vNN)“
  (eigener PR nach `staging` mit Auto-Merge). Nach dem Merge legt `.github/workflows/release.yml` Tag und GitHub Release an,
  Titel und Text aus dem Release-PR.
- Hotfix (dringender Fehler in Production): Branch `fix/…` von `main`, PR nach `main` (Nutzer merged), danach PR `main` → `staging` (Backmerge, Auto-Merge).
- Nie direkt auf `main` oder `staging` pushen. Claude merged nie direkt, sondern nutzt nach `staging` ausschließlich Auto-Merge nach grünen Tests.
- Ausgeliefert wird nur nach grünen Tests (`.github/workflows/deploy.yml` startet nach „Tests“).
- Production und Beta sind über `js/env.js` getrennt (eigene Datenbank, eigener Offline-Speicher) und liegen nebeneinander,
  nie ineinander, damit beide installierbar bleiben (Spec 001, AK-10). Diese Trennung nie aufweichen.
- `VERSION` in `sw.js`: jeder Feature-PR erhöht sie um eins. Bei Konflikten `staging` in den Branch mergen und die nächste freie Nummer nehmen.
- Rollback: Merge-Commit per `git revert` auf einem Branch rückgängig machen und als PR einreichen (nach `staging` mit Auto-Merge, nach `main` merged der Nutzer).
- PR-Beschreibungen nach dem Anlegen prüfen: Das GitHub-Werkzeug hängt einen Sitzungs-Link an, der entfernt werden muss (siehe Datenschutz).

Definition of Done (vor jedem PR):
- Akzeptanzkriterien der Spec sind durch Tests abgedeckt (Titel mit `[NNN AK-x]`), soweit automatisch prüfbar.
- Automatische Tests grün: `npm test` (Pixel-Größe, hell und dunkel, ohne Konsolenfehler, Auswertung ohne Scrollen).
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
- Basis-URL: `https://rhrsh.github.io/motivations-kompass/app/#setup=…` (die frühere Adresse ohne `app/` leitet weiter). Bestehende `id`s beibehalten.

## Datenschutz (wichtig, das Repository ist öffentlich)
- Keine persönlichen Daten ins Repository, auch nicht in Specs, Issues oder PRs: keine Namen, E-Mail-Adressen, Arbeitgeber, Firmen, Kollegen, Orte.
- Keine Namen fremder Produkte oder Firmen als Design-Vorlage nennen, weder in Dateien noch in Commit-Nachrichten. Stil nur allgemein beschreiben. Keine fremden Grafiken übernehmen, alles selbst zeichnen.
- Vor jedem Push prüfen: `git grep -n -i` und `git log --format=%B` auf Namen, E-Mail-Adressen und persönliche Motivatoren.
- Die persönlichen Motivatoren des Nutzers stehen nie im Code. Sie werden per Einrichtungslink (`#setup=…`) aufs Gerät geladen. `DEFAULT_MOTIVES` in `js/config.js` bleibt neutral.
- Bewertungen und Kommentare bleiben im Browser des Nutzers. Keine Analyse-Tools, keine Server-Aufrufe, kein Tracking.
- Commit-Autor und Committer nur über die noreply-Adresse von GitHub: `rhrsh <356160256+rhrsh@users.noreply.github.com>`. Vor dem ersten Commit einer Sitzung `git config user.name` und `git config user.email` darauf setzen und nach dem Commit mit `git log -1 --format='%an <%ae> / %cn <%ce>'` prüfen.
- Keine Sitzungs-Links (z. B. `Claude-Session: …`) in Commit-Nachrichten oder Pull Requests. Erlaubt ist nur `Co-Authored-By: Claude … <noreply@anthropic.com>`.
