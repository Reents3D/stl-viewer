# STL-Betrachter

Ein STL-Betrachter, der im Browser des Kunden läuft. Datei ins Fenster ziehen, Modell
drehen, vermessen, kommentieren — und eine PDF-Dokumentation daraus erzeugen. Die Datei
wird nicht hochgeladen und nicht gespeichert.

Zweites offenes Werkzeug der Reents Technologies GmbH nach dem
[FDM-Materialberater](https://github.com/Reents3D/fdm-material-advisor); gleiches
Corporate Design, gleiche Bauweise, gleiche Regeln zur Ehrlichkeit von Zahlen.

**Stand: intern, noch nicht veröffentlicht.**

---

## Warum es das gibt

Ein Kunde schickt eine STL-Datei und fragt: passt das, was wiegt das, was kostet das.
Bis die Antwort da ist, hat jemand die Datei in einen Slicer geladen, gedreht, gemessen
und den Befund in eine E-Mail geschrieben. Dieses Werkzeug verlegt den ersten Teil davon
zum Kunden — mit denselben Zahlen, die intern auch gelten, und mit einem PDF, das man
der Anfrage beilegen kann.

Der Nebeneffekt ist das eigentliche Verkaufsargument: **Konstruktionsdaten verlassen den
Rechner nicht.** Wer unter Geheimhaltung arbeitet, muss seinen Prototypen nicht erst auf
einen fremden Server laden, um ihn anzusehen.

## Was es kann

**Öffnen**

- Ziehen und ablegen im ganzen Fenster, oder Dateiauswahl
- Binäres und ASCII-STL, beliebige Größe (Auswertung in einem eigenen Strang mit
  Fortschrittsanzeige, die Oberfläche friert nicht ein)
- Einheitenwahl mm / cm / Zoll — STL speichert keine Einheit

**Prüfen**

- Abmessungen, Volumen, Oberfläche, Dreiecks- und Eckpunktzahl, Schwerpunkt
- Befund: geschlossenes Netz, offene Kanten, Mehrfachkanten, verdrehte Flächen,
  flächenlose Dreiecke, nach innen gedrehtes Netz
- Gewichtsschätzung für 41 Werkstoffe, immer als Spanne (siehe unten)
- Bauraumprüfung gegen die realen Anlagen, einschließlich „passt nur gedreht"
- Schnittebene entlang X/Y/Z, Punkt-zu-Punkt-Messung
- Darstellung: massiv, mit Kanten, Drahtgitter, durchsichtig; perspektivisch oder
  orthografisch; zehn Modellfarben; Raster, Achsen, Bauraumkasten

**Dokumentieren**

- Anmerkungen direkt am Modell: Klick setzt eine nummerierte Marke mit Titel, Text und
  Kategorie (Hinweis / Änderung / Frage / Freigabe). Der Blickwinkel wird mitgespeichert.
- Anmerkungen als kleine JSON-Datei sichern und wieder laden — **ohne** die Geometrie
- Bildexport der aktuellen Ansicht
- **PDF-Dokumentation**: Deckblatt mit Aufmacherbild und Kennzahlen, Kennwert- und
  Befundseite, sechs Normalansichten, Rundumansichten mit einstellbarer Bilderzahl je
  Rotationsachse (Voreinstellung 10 je Achse), und je Anmerkung eine Seite mit dem Bild
  aus dem gespeicherten Blickwinkel.

## Kein Upload — und warum das nachprüfbar ist

Die Datei wird über die File API in den Arbeitsspeicher gelesen und dort ausgewertet. Es
gibt in diesem Projekt kein `fetch`, kein `XMLHttpRequest`, keinen WebSocket und kein
Formular.

Das ist aber nicht der Grund, warum man es glauben kann. Der Grund steht im
ausgelieferten HTML:

```
connect-src 'none'
```

Die Seite verbietet sich selbst per Inhaltssicherheitsrichtlinie **jede** ausgehende
Netzwerkverbindung. Der Browser lässt eine Übertragung technisch nicht zu — auch nicht,
wenn eine künftige Änderung sie versehentlich einbaut, und auch nicht, wenn eine
Abhängigkeit es versuchen würde. Nachprüfbar im Netzwerk-Reiter der Entwicklerwerkzeuge:
beim Öffnen einer Datei passiert dort nichts.

Schriften, Programmcode und Bildmarke liegen auf demselben Server wie die Seite. Kein
CDN, keine Cookies, kein Tracking, keine externen Ressourcen.

> **Für Entwickler:** In diesem Projekt darf nie ein `fetch()` entstehen. Es fällt erst
> im Build auf, nicht im Entwicklungsserver — die Richtlinie wird bewusst nur am
> Artefakt gesetzt, weil sie sonst den Entwicklungsserver lahmlegt
> (siehe [vite.config.ts](vite.config.ts)).

## Ehrlichkeit der Zahlen

Dieselbe Regel wie im Materialberater: Ein Wert, der geschätzt ist, muss als geschätzt zu
erkennen sein.

- **Gewicht ist immer eine Spanne**, nie ein Wert: von „bei 20 % Füllung" bis „massiv".
  Die lineare Rechnung `Volumen × Dichte × Füllgrad` unterstellt, dass der Füllgrad im
  ganzen Bauteil gilt. Ein Slicer legt zuerst Wände, Boden und Decke in voller Dichte an.
  Bei einem dünnwandigen Gehäuse liegt die lineare Rechnung um ein Vielfaches zu niedrig,
  bei einem massigen Block stimmt sie gut. Aus einer einzelnen Zahl wäre nicht ablesbar,
  in welchem Fall man sich befindet — aus der Spanne schon. Ist sie weit, warnt die
  Oberfläche ausdrücklich. Stützmaterial ist in keiner der beiden Grenzen enthalten.
- **Dichtewerte stammen aus der offenen Materialdatenbank des Materialberaters**,
  einschließlich der Konfidenzangabe. Ein Gewicht auf Basis eines geschätzten
  Dichtewerts wird anders dargestellt als eines auf Basis eines Datenblatts mit Prüfnorm.
- **Volumen und Gewicht sind nur bei geschlossenem Netz belastbar.** Der Befund steht
  deshalb in der Oberfläche und im PDF **vor** der Gewichtsangabe.
- **Die Prüfung auf Löcher wird ab 1,2 Mio. Dreiecken übersprungen** — und das wird
  gesagt, statt eine ungeprüfte Datei als in Ordnung zu führen. Abmessungen, Volumen und
  Oberfläche bleiben bei jeder Größe verfügbar; sie brauchen die Prüftabelle nicht.

## Entwicklung

```bash
npm install
npm run dev
```

| Befehl | Zweck |
| --- | --- |
| `npm run dev` | Entwicklungsserver |
| `npm run build` | Typprüfung und Produktionsbau nach `dist/` |
| `npm run preview` | Gebautes Artefakt lokal ausliefern (mit Richtlinie!) |
| `npm test` | Testsuite |
| `npm run typecheck` | Nur Typprüfung |
| `npm run ci` | Alles zusammen — das, was auch die Pipeline fährt |

Node ab Version 22.

### Aufbau

```
src/
  stl/          Parser und Geometrie — ohne three.js, läuft auch unter Node
    parse.ts        binär + ASCII, Formaterkennung
    geometry.ts     Volumen, Oberfläche, Schwerpunkt, Topologie, Bauraum
    parse.worker.ts Parser + Analyse in einem eigenen Strang
    load.ts         Brücke zur Oberfläche, ein Worker je Ladevorgang
  viewer/       three.js-Szene, vollständig gekapselt
  export/       PDF, Bild, Anmerkungsdatei
  components/   Oberfläche
  config/       Marke, Kontakt, Bauräume, Werkstoffdichten
  i18n/         Deutsch und Englisch
```

**Warum ein eigener Parser statt `STLLoader` aus three.js:** Der Loader arbeitet auf dem
Hauptstrang und meldet keinen Fortschritt. Bei einer 180-MB-Datei friert die Oberfläche
mehrere Sekunden ein. Außerdem braucht die Analyse ohnehin einen Durchlauf über dieselben
Zahlen — beides im Worker zusammenzulegen spart eine vollständige Kopie des
Positionsfeldes.

**Die Z-Achse zeigt nach oben**, nicht die Y-Achse wie in der Voreinstellung von three.js.
STL kommt aus CAD und aus Slicern, dort ist Z die Bauhöhe. So heißt die Höhe in der Datei,
in der Anzeige und im PDF gleich.

### Tests

Getestet wird, was rechnet: Parser, Geometrie und das Seitenraster des PDF. Der Viewer
selbst braucht einen WebGL-Kontext und gehört in die Handprüfung — ein gemockter
WebGL-Kontext beweist über ein gerendertes Bild nichts.

Die Prüfkörper entstehen im Speicher, nicht als Dateien im Repo: Ein Würfel bekannter
Kantenlänge ist als Code nachvollziehbar, eine Binärdatei im Verzeichnis behauptet nur,
ein Würfel zu sein.

### Handprüfung vor jeder Veröffentlichung

1. Große Datei (> 50 MB) laden — Fortschritt läuft, Oberfläche bleibt bedienbar
2. ASCII-STL laden — gleiche Kennwerte wie die binäre Fassung
3. Datei mit Loch laden — Befund meldet offene Kanten
4. Anmerkung setzen, Ansicht drehen, Marke bleibt an der richtigen Stelle
5. PDF mit drei Achsen erzeugen — Bilderzahl im PDF stimmt mit der Ankündigung überein
6. **Netzwerk-Reiter offen lassen: beim Laden der STL darf keine Anfrage auftauchen**

## Veröffentlichung

Der Bau läuft über GitHub Actions nach GitHub Pages. `VITE_BASE` steuert den Basispfad,
damit derselbe Bau unter `reents3d.github.io/stl-viewer/` und später unter einer eigenen
Domain funktioniert.

Alle Marken-, Kontakt- und Adresskonstanten stehen in
[`src/config/site.ts`](src/config/site.ts) — ein Domainwechsel ist ein Commit in einer
Datei.

## Lizenz

Code unter MIT-Lizenz, siehe [LICENSE](LICENSE). Die Dichtewerte stammen aus der
Materialdatenbank des FDM-Materialberaters (CC BY 4.0). Marken Dritter gehören ihren
Inhabern.

Die berechneten Werte beschreiben die Geometrie der übergebenen Datei, nicht ein
gefertigtes Bauteil, und ersetzen keine Bauteilqualifizierung. Siehe
[DISCLAIMER.md](DISCLAIMER.md).
