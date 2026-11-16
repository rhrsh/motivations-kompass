# Specs (Spezifikationen)

Hier steht, **was** die App tun soll und woran man erkennt, dass es stimmt. Der Code folgt den Specs, nicht umgekehrt.

## Ablauf (Spec-driven Development)

1. **Spec schreiben:** neue Datei nach `000-vorlage.md`, fortlaufend nummeriert. Status „Entwurf“.
2. **Spec-Freigabe:** Pull Request nur mit der Spec nach `staging`. Der Merge durch den Product Owner gibt den Bau frei (Status „Freigegeben“).
3. **Umsetzung:** Pull Request mit Code und Tests nach `staging`. Jeder Test nennt Spec und Kriterium, z. B. `[002 AK-7]`.
4. **Abnahme in der Beta** gegen die Akzeptanzkriterien.
5. **Release:** mit dem nächsten Release-PR nach `main` (Status „Umgesetzt (vNN)“).
6. **Änderungen am Verhalten** beginnen mit einer Änderung der Spec. Die Spec bleibt die aktuelle Beschreibung.

## Nachgezogene Specs

Die Specs 004 bis 008 beschreiben Funktionen, die vor der Einführung von Specs gebaut wurden. Sie halten das heutige
Verhalten fest. Fragwürdiges steht unter „Offen“ und wird nur nach Entscheidung des Product Owners geändert.
Jede Spec zeigt unter „Testabdeckung“, welcher Test welches Kriterium prüft.

## Regeln

- Akzeptanzkriterien sind nummeriert (**AK-1**, **AK-2**, …), prüfbar und beschreiben Verhalten, nicht Technik.
- Nummern werden nie neu vergeben. Fällt ein Kriterium weg, wird es durchgestrichen und begründet.
- Verworfene Specs bleiben mit Status „Verworfen“ und Begründung stehen.
- „Nicht-Ziele“ sind genauso wichtig wie Ziele: Sie verhindern, dass mehr gebaut wird als gewollt.
- Das Repository ist öffentlich: nur neutrale Beschreibungen, keine persönlichen Daten oder Motivatoren.

## Übersicht

| Spec | Thema | Status |
|---|---|---|
| [001](001-umgebungen.md) | Umgebungen: Production und Beta | Umgesetzt (v21) |
| [002](002-verlauf.md) | Verlauf über mehrere Wochen | Umgesetzt (v18) |
| [003](003-entscheidungsfrage.md) | Eigene Entscheidungsfrage im Verlauf | Verworfen |
| [004](004-wochencheck-bewerten.md) | Wochencheck: Motivatoren bewerten | Umgesetzt (v21) |
| [005](005-start-und-auswertung.md) | Start und Auswertung der Woche | Umgesetzt (v21) |
| [006](006-daten-sichern-und-laden.md) | Daten sichern und laden | Umgesetzt (v21) |
| [007](007-einrichtung-der-motivatoren.md) | Einrichtung der Motivatoren | Umgesetzt (v21) |
| [008](008-installation-offline-updates.md) | Installation, Offline-Betrieb und Updates | Umgesetzt (v21) |
