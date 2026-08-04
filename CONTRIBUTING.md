# Mitarbeit

## Vor dem ersten Commit

```bash
npm install
npm run ci     # Typprüfung, Tests, Bau — genau das, was die Pipeline fährt
```

## Die eine Regel, die nicht verhandelbar ist

**Dieses Projekt baut keine Netzwerkverbindung auf.** Kein `fetch`, kein
`XMLHttpRequest`, kein WebSocket, kein `sendBeacon`, kein Formular mit `action`, keine
Ressource von einem fremden Server — auch keine Schrift von einem CDN.

Der Grund steht in [ADR-001](DECISIONS.md). Die Pipeline prüft beides: den Quelltext auf
solche Aufrufe und das gebaute Artefakt auf die Richtlinie. Wer eine Abhängigkeit
hinzufügt, die im Hintergrund etwas nachlädt, bemerkt es dort — nicht erst bei einem
Kunden.

Wird eine neue Funktion gebraucht, die zwingend eine Verbindung erfordert, ist das kein
Merge-Konflikt, sondern eine Grundsatzfrage: Sie gehört dann in ein anderes Werkzeug.

## Was wo hingehört

| Verzeichnis | Inhalt | Bedingung |
| --- | --- | --- |
| `src/stl/` | Parser, Geometrie | **kein** three.js, **kein** DOM — muss unter Node laufen |
| `src/viewer/` | three.js-Szene | kein React |
| `src/components/` | Oberfläche | kein three.js außer über `ModelScene` |
| `src/export/` | PDF, Bild, Anmerkungsdatei | Layoutrechnung getrennt von jsPDF halten |
| `src/config/` | Marke, Kontakt, Bauräume, Dichten | **alle** Konstanten, nirgends sonst |
| `src/i18n/` | sämtliche Texte | kein Text im Quelltext der Ansichten |

Dateien bleiben unter 400 Zeilen, in Ausnahmen unter 800. Funktionen unter 50 Zeilen.

## Zahlen und Ehrlichkeit

Wer einen berechneten Wert hinzufügt, beantwortet vorher drei Fragen:

1. **Woher kommt er?** Gemessen aus der Datei, oder geschätzt? Geschätzte Werte tragen
   die Klasse `.estimated` oder eine Konfidenzmarke.
2. **Wann ist er falsch?** Wenn es einen Fall gibt, in dem er in die Irre führt, muss
   dieser Fall in der Oberfläche stehen — nicht nur im Quelltext.
3. **Wird etwas ausgelassen?** Eine übersprungene Prüfung wird gemeldet. Eine Datei ohne
   Befund darf nicht aussehen wie eine Datei ohne Befunde.

## Tests

Getestet wird, was rechnet: `src/stl/`, `src/export/pdf-layout.ts`, `src/lib/`.
Mindestens 80 % Zeilenabdeckung in diesen Bereichen.

Prüfkörper entstehen im Speicher (`tests/fixtures.ts`), nicht als Dateien im Repo. Ein
Würfel bekannter Kantenlänge ist als Code nachvollziehbar; eine Binärdatei im Verzeichnis
behauptet nur, ein Würfel zu sein.

**Kundendaten gehören nie ins Repo.** `.gitignore` sperrt `*.stl`, `*.step`, `*.stp`,
`*.iges` und `*.igs` außerhalb von `tests/fixtures/`. Wer eine Kundendatei zur Fehlersuche braucht, legt sie außerhalb des
Arbeitsverzeichnisses ab.

Der Viewer selbst wird von Hand geprüft — die Liste steht im
[README](README.md#handprüfung-vor-jeder-veröffentlichung). Ein gemockter WebGL-Kontext
beweist über ein gerendertes Bild nichts.

## Kommentare

Kommentare erklären **warum**, nicht **was**. Besonders wertvoll sind die, die einen
bereits gemachten Fehler festhalten — siehe die Formaterkennung in
[`src/stl/parse.ts`](src/stl/parse.ts) oder die Markenpositionierung in
[`src/components/Viewer.tsx`](src/components/Viewer.tsx). Wer eine solche Stelle
„aufräumt", baut den Fehler wieder ein.

Entscheidungen mit Nebenwirkungen kommen als ADR nach [DECISIONS.md](DECISIONS.md).

## Commits

```
<typ>: <beschreibung>
```

Typen: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`.
