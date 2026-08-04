# Fremde Bestandteile

Der eigene Code dieses Projekts steht unter der MIT-Lizenz (siehe [LICENSE](LICENSE)).
Mitausgeliefert werden die folgenden Bestandteile Dritter.

## occt-import-js — LGPL-2.1

Wird **nur beim Öffnen einer STEP- oder IGES-Datei** nachgeladen und rechnet dann im Browser
des Besuchers.

| | |
| --- | --- |
| Paket | [`occt-import-js`](https://github.com/kovacsv/occt-import-js) 0.0.23 |
| Autor | Viktor Kovács |
| Lizenz | LGPL-2.1 |
| Enthält | [Open CASCADE Technology](https://dev.opencascade.org), LGPL-2.1 mit Ausnahme |
| Lizenztexte | [`/lizenzen/occt-import-js.txt`](public/lizenzen/occt-import-js.txt), [`/lizenzen/occt.txt`](public/lizenzen/occt.txt) — auch unter der ausgelieferten Adresse abrufbar |

### Austauschbarkeit

Die LGPL verlangt, dass sich die Bibliothek durch eine eigene Fassung ersetzen
lässt. Das ist hier gegeben, weil sie als **eigenständige Datei** ausgeliefert
wird und nicht in das Bündel eingebacken ist:

1. `occt-import-js.wasm` neu bauen (Anleitung im Repository des Pakets) oder eine
   andere Fassung besorgen
2. Die Datei unter `dist/assets/` gegen die eigene austauschen — der Dateiname
   trägt einen Inhaltsstempel, er muss übernommen werden
3. Alternativ `node_modules/occt-import-js/dist/occt-import-js.wasm` ersetzen und
   `npm run build` erneut ausführen

Die Datei wird **unverändert** ausgeliefert; es gibt keine eigenen Änderungen am
Quelltext von occt-import-js oder OpenCascade.

### Warum als eigene Datei und nicht eingebettet

Technisch ließe sich die WebAssembly als Base64 ins JavaScript-Bündel legen. Dann
entfiele der Abruf, und die Inhaltssicherheitsrichtlinie könnte bei
`connect-src 'none'` bleiben. Dagegen sprachen zwei Dinge: Der Download wüchse um
ein Drittel auf rund 10 MB, und die Austauschbarkeit oben wäre nur noch über
Umwege herzustellen. Die Abwägung steht in [ADR-013](DECISIONS.md).

## three.js — MIT

3D-Darstellung. Autor: Ricardo Cabello und Mitwirkende.

## jsPDF — MIT

Erzeugung der PDF-Dokumentation. Autoren: James Hall, yWorks GmbH und Mitwirkende.

## React — MIT

Oberfläche. Autor: Meta Platforms, Inc. und Mitwirkende.

## Montserrat und Sora — SIL Open Font License 1.1

Schriften des Corporate Designs, selbst gehostet unter `src/styles/fonts/`.

- Montserrat: Julieta Ulanovsky und Mitwirkende
- Sora: Jonathan Barnbrook / Rathna Ramanathan, Type Design von Ariel Martín Pérez

## Werkstoffdichten — CC BY 4.0

Die Dichtewerte der Gewichtsschätzung stammen aus der offenen Materialdatenbank
der Reents Technologies GmbH.
