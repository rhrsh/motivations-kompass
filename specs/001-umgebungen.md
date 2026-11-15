# 001 – Umgebungen: Production und Beta

**Status:** Umgesetzt (v19) · **Issues:** #2, #5, #7

## Problem

Die App wird produktiv mit echten Daten genutzt und parallel weiterentwickelt. Unfertige Änderungen dürfen echte Daten
nie gefährden, und neue Funktionen sollen vor dem Release ausprobiert werden können, auch mehrere zusammen.

## User Story

**Als** Product Owner, der die App selbst nutzt,
**möchte ich** eine dauerhaft verfügbare Beta mit dem neuesten integrierten Stand und mit Testdaten,
**damit** ich Änderungen prüfen kann, bevor ich sie bewusst für meine echte App freigebe.

## Akzeptanzkriterien

- **AK-1** Production (Branch `main`) liegt unter `…/motivations-kompass/app/`, die Beta (Branch `staging`) unter `…/motivations-kompass/beta/`.
- **AK-2** Die Beta nutzt eine eigene Datenbank. Daten der Production werden dort nie gelesen oder verändert.
- **AK-3** Production und Beta haben getrennte Offline-Speicher. Keiner löscht den anderen, Production speichert keine Dateien der Beta.
- **AK-4** Die Beta ist erkennbar: Abzeichen „Beta“ in der App, installiert mit Namen „Motivation Tracker Beta“, unter dem Icon „Motivation Beta“, und eigenem Icon.
- **AK-5** Wird die Beta zum ersten Mal mit leerer Datenbank geöffnet, lädt sie automatisch Beispieldaten für die zurückliegenden Wochen.
- **AK-6** „Daten zurücksetzen“ leert die Beta. Danach werden keine Beispieldaten mehr von selbst geladen.
- **AK-7** „Beispieldaten laden“ füllt die zurückliegenden Wochen mit erkennbaren Verläufen (steigt, sinkt, stabil) und einer ausgelassenen Woche. Die laufende Woche bleibt frei.
- **AK-8** Production zeigt keine Beta-Kennzeichnung und keine Beta-Werkzeuge.
- **AK-9** Ausgeliefert wird nur ein Stand, dessen automatische Tests grün sind.
- **AK-10** Production und Beta lassen sich gleichzeitig als eigene Apps installieren. Keine liegt im Zuständigkeitsbereich (Scope) der anderen.
- **AK-11** Die frühere Adresse `…/motivations-kompass/` leitet auf Production weiter, auch mit Einrichtungslink (`#setup=…`). Bisherige Daten bleiben erhalten.
- **AK-12** Eine früher unter `…/motivations-kompass/` installierte App räumt ihren alten Offline-Speicher-Dienst (Service Worker) selbst ab.

## Nicht-Ziele

- Keine Preview je Pull Request: Die Beta zeigt den integrierten Stand von `staging`.
- Kein Abgleich von Daten zwischen Beta und Production. Mit echten Daten testen geht über „Daten sichern“ und „Sicherung laden“.

## Entscheidungen

- Beide Umgebungen liegen unter derselben Adresse und teilen sich den Speicher des Browsers. `js/env.js` erkennt die
  Umgebung am Pfad und vergibt eigene Namen für Datenbank und Offline-Speicher.
- Beispieldaten werden nur beim allerersten leeren Start automatisch geladen, damit eigene Testeingaben erhalten bleiben.
- Production unter `/app/` statt direkt unter `/`: Lag die Beta unterhalb von Production, behandelte Android beide als
  dieselbe App, und es ließ sich nur eine installieren (AK-10). Nebeneinanderliegende Adressen lösen das. Daten sind
  davon nicht betroffen, weil der Browser sie pro Website speichert, nicht pro Unterordner.
- Staging statt Trunk-based: Releases sollen bewusste Entscheidungen sein und mehrere Tickets zusammen geprüft werden.
