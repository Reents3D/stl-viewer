# STL-Betrachter

**3D-Modelle zeigen, besprechen und dokumentieren — direkt im Browser, ohne Upload.**

### → [Werkzeug öffnen: reents3d.github.io/stl-viewer](https://reents3d.github.io/stl-viewer/)

Kostenlos, ohne Konto, ohne Installation.

---

Sie haben eine STL-Datei und wollen sie ansehen, jemandem zeigen oder etwas dazu
anmerken. Bisher hieß das: CAD-Software installieren, oder die Datei irgendwo hochladen,
oder Screenshots hin- und herschicken.

Dieses Werkzeug macht daraus einen Schritt: Datei ins Fenster ziehen. Fertig.

---

## Für wen

**Für Kunden**, die ein Modell prüfen wollen, bevor sie es in Auftrag geben — ohne
Software zu installieren und ohne Konstruktionsdaten aus der Hand zu geben.

**Für Maker**, die schnell wissen wollen, wie groß ein Teil wirklich ist, was es wiegen
wird und ob das Netz überhaupt sauber geschlossen ist.

**Für die Abstimmung zwischen beiden.** Statt „das Loch oben links, nein, das andere"
setzen Sie eine nummerierte Bemerkung ans Modell und schicken ein PDF, in dem jede
Bemerkung mit dem passenden Bild steht.

## Was Sie damit machen

### Ein Modell zeigen

Datei hineinziehen, drehen, zoomen. Sieben feste Ansichten auf Knopfdruck (vorn, hinten,
links, rechts, oben, unten, isometrisch). Zehn Farben, damit Sie sehen, wie das Teil in
Schwarz oder in Weiß wirkt. Eine Schnittebene, die das Modell aufschneidet — praktisch,
wenn Sie in einen Hohlraum sehen oder eine Wandstärke beurteilen wollen.

### Wissen, woran Sie sind

Auf einen Blick: Abmessungen, Volumen, Oberfläche, Schwerpunkt, Dreieckszahl.

Dazu eine Prüfung, die man einem Modell nicht ansieht — ob das Netz **geschlossen** ist.
Ein Modell mit Löchern sieht am Bildschirm völlig normal aus und macht im Druck Ärger.
Der Betrachter zählt offene Kanten, Mehrfachkanten und verdreht gewickelte Flächen und
sagt Ihnen, was er gefunden hat.

Außerdem: Was wiegt das Teil ungefähr, in 41 gängigen Werkstoffen? Und passt es in eine
Maschine — auch wenn es dafür gedreht werden muss?

Messen können Sie auch: zwei Punkte anklicken, Abstand ablesen.

### Bemerkungen setzen

Auf die Stelle klicken, über die Sie sprechen wollen. Es entsteht eine nummerierte Marke
mit Überschrift, Beschreibung und Art — Hinweis, Änderung, Frage oder Freigabe. Der
Blickwinkel wird mitgespeichert: Wer die Bemerkung später anklickt, sieht das Modell
wieder genau so, wie Sie es gesehen haben.

Die Bemerkungen lassen sich als kleine Datei sichern und beim nächsten Mal wieder laden.
**Ohne das Modell** — Sie können sie also weitergeben, ohne Ihr Bauteil mitzugeben.

### Fotos und PDF erzeugen

**Ein Foto** der aktuellen Ansicht, jederzeit.

**Eine vollständige PDF-Dokumentation**, die Sie einer Anfrage beilegen oder in die Akte
legen können:

- Deckblatt mit Aufmacherbild und den wichtigsten Zahlen
- Kennwerte und Prüfergebnis
- die sechs Normalansichten auf einer Seite
- **Rundumansichten**: eine volle Umdrehung um jede Achse, die Sie auswählen, in
  gleichmäßigen Schritten. Wie viele Bilder je Achse, entscheiden Sie — voreingestellt
  sind zehn.
- je Bemerkung eine Seite mit Bild aus dem gespeicherten Blickwinkel und Ihrem Text

## Ihre Datei bleibt bei Ihnen

Es gibt keinen Upload. Die Datei wird im Arbeitsspeicher Ihres Browsers gelesen und dort
angezeigt; wenn Sie den Reiter schließen, ist sie weg. Kein Konto, keine Cookies, kein
Tracking.

Das ist keine Zusage, der Sie glauben müssen. Die Seite verbietet sich selbst per
Inhaltssicherheitsrichtlinie **jede** ausgehende Netzwerkverbindung:

```
connect-src 'none'
```

Der Browser lässt eine Übertragung technisch nicht zu — auch nicht versehentlich. Wenn
Sie es nachsehen wollen: Entwicklerwerkzeuge öffnen, Reiter „Netzwerk", Datei
hineinziehen. Dort passiert nichts.

Für Bauteile unter Geheimhaltung ist das der eigentliche Unterschied: Sie müssen Ihren
Prototypen nicht erst auf einen fremden Server laden, um ihn anzusehen.

## Öffnen

**[reents3d.github.io/stl-viewer](https://reents3d.github.io/stl-viewer/)** — im Browser
öffnen, Datei hineinziehen. Sonst nichts.

Läuft in jedem aktuellen Browser mit WebGL, auch auf Tablet und Telefon. Bei sehr großen
Modellen (über ein paar Millionen Dreiecke) ist ein Rechner die bessere Wahl — dort
steht mehr Arbeitsspeicher zur Verfügung.

Wer es lieber selbst betreibt oder daran entwickelt, braucht Node ab Version 22:

```bash
npm install
npm run dev
```

## Was die Zahlen bedeuten

Ein Werkzeug, das Zahlen ausgibt, kann auf zwei Arten nützlich sein: Es kann genau sein,
oder es kann ehrlich sagen, wo es das nicht ist. Hier wird das zweite versucht.

**Das Gewicht ist immer eine Spanne**, nie ein einzelner Wert — von „bei 20 % Füllung"
bis „massiv". Die einfache Rechnung `Volumen × Dichte × Füllgrad` nimmt an, dass der
Füllgrad im ganzen Bauteil gilt. Ein Slicer arbeitet anders: Er legt zuerst Wände, Boden
und Decke in voller Dichte an und füllt nur den Rest. Bei einem dünnwandigen Gehäuse
liegt die einfache Rechnung deshalb weit zu niedrig, bei einem massigen Block stimmt sie
gut. Aus einer einzelnen Zahl könnten Sie nicht erkennen, in welchem Fall Sie sind — aus
der Spanne schon. Ist sie weit, sagt es Ihnen das Werkzeug ausdrücklich. Stützmaterial
ist in keiner der beiden Grenzen enthalten.

**Volumen und Gewicht sind nur bei geschlossenem Netz belastbar.** Deshalb steht das
Prüfergebnis vor der Gewichtsangabe — in der Oberfläche wie im PDF.

**Sehr große Modelle werden nicht auf Löcher geprüft.** Ab etwa 1,2 Mio. Dreiecken
bräuchte die Prüfung mehr Arbeitsspeicher, als ein Browser zuverlässig hergibt. Dann
entfällt sie — und das Werkzeug sagt es. Abmessungen, Volumen und Oberfläche stimmen
weiterhin.

**Die Bauraumprüfung berücksichtigt Drehungen um 90°**, aber keine schrägen Lagen. Ein
„passt" heißt: Der Hüllkörper geht hinein. Es heißt nicht, dass die Fertigung in dieser
Lage sinnvoll ist.

Alle Werte beschreiben die **Geometrie der Datei** — nicht ein gefertigtes Bauteil. Für
eine Kalkulation ist die Berechnung eines Slicers mit dem tatsächlichen Druckprofil
maßgeblich. Ausführlich in [DISCLAIMER.md](DISCLAIMER.md).

---

## Für Entwickler

Vite, React, TypeScript, Tailwind 4, three.js, jsPDF. Kein Server, kein Backend, kein
Build-Schritt zur Laufzeit.

| Befehl | Zweck |
| --- | --- |
| `npm run dev` | Entwicklungsserver |
| `npm run build` | Typprüfung und Bau nach `dist/` |
| `npm run preview` | Gebautes Artefakt lokal ausliefern |
| `npm test` | Testsuite |
| `npm run ci` | Alles zusammen — das, was auch die Pipeline fährt |

### Aufbau

```
src/
  stl/          Parser und Geometrie — ohne three.js, läuft auch unter Node
  viewer/       three.js-Szene, vollständig gekapselt
  export/       PDF, Bild, Bemerkungsdatei
  components/   Oberfläche
  config/       Marke, Kontakt, Bauräume, Werkstoffdichten
  i18n/         Deutsch und Englisch
```

**Eigener STL-Parser statt `STLLoader` aus three.js.** Der Loader arbeitet auf dem
Hauptstrang und meldet keinen Fortschritt; bei einer 180-MB-Datei friert die Oberfläche
mehrere Sekunden ein. Hier laufen Parser und Analyse gemeinsam in einem Web Worker — das
spart außerdem eine vollständige Kopie des Positionsfeldes.

**Die Z-Achse zeigt nach oben**, nicht die Y-Achse wie in der Voreinstellung von three.js.
STL kommt aus CAD und aus Slicern, dort ist Z die Bauhöhe. So heißt die Höhe in der Datei,
in der Anzeige und im PDF gleich.

**Es gibt kein `fetch` in diesem Projekt, und es darf keines geben.** Die Pipeline prüft
das gebaute Artefakt auf die Richtlinie und den Quelltext auf ausgehende Aufrufe. Details
und die übrigen Entscheidungen mit Nebenwirkungen: [DECISIONS.md](DECISIONS.md).

### Tests

Getestet wird, was rechnet: Parser, Geometrie und das Seitenraster des PDF. Prüfkörper
entstehen im Speicher, nicht als Dateien im Repo — ein Würfel bekannter Kantenlänge ist
als Code nachvollziehbar, eine Binärdatei im Verzeichnis behauptet nur, ein Würfel zu
sein.

**Kundendateien gehören nie ins Repository.** `.gitignore` sperrt `*.stl`.

Der Viewer selbst wird von Hand geprüft; die Liste steht in
[CONTRIBUTING.md](CONTRIBUTING.md).

### Veröffentlichen

Jeder Push auf `main` baut und veröffentlicht nach GitHub Pages. Die Pipeline prüft
vorher Typen, Tests und das gebaute Artefakt — unter anderem darauf, dass die
Inhaltssicherheitsrichtlinie noch drinsteht.

Alle Marken-, Kontakt- und Adresskonstanten stehen in
[`src/config/site.ts`](src/config/site.ts) — ein Domainwechsel ist ein Commit in einer
Datei.

## Lizenz

Code unter MIT-Lizenz, siehe [LICENSE](LICENSE). Die Werkstoffdichten stammen aus der
offenen Materialdatenbank der Reents Technologies GmbH (CC BY 4.0). Marken Dritter
gehören ihren Inhabern.
