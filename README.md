# STL-, STEP- und IGES-Betrachter

**3D-Modelle zeigen, besprechen und dokumentieren — direkt im Browser, ohne Upload.**

### → [Werkzeug öffnen: reents3d.github.io/stl-viewer](https://reents3d.github.io/stl-viewer/)

Gelesen werden **STL** (binär und ASCII), **STEP** (`.step`, `.stp`) und **IGES**
(`.iges`, `.igs`). Kostenlos, ohne Konto, ohne Installation.

---

## Warum es das gibt

Wir konstruieren für unsere Kunden regelmäßig 3D-Modelle und parametrische
CAD-Modelle. Wenn der Entwurf dann zur Abstimmung geht, steht der Kunde häufig vor
demselben Problem: Auf dem Firmenrechner ist keine CAD-Software installiert, und es wird
auch keine installiert werden. Das Modell, über das gesprochen werden soll, kann er
nicht ansehen.

Bisher hieß die Lösung: Screenshots aus verschiedenen Winkeln, per E-Mail hin und her,
und Änderungswünsche in Worten — „das Loch oben links, nein, das andere". Das kostet
Runden, und Missverständnisse fallen erst im Druck auf.

Mit diesem Werkzeug öffnet der Kunde die Datei einfach im Browser — **STL, STEP oder IGES**,
also auch das Format, in dem eine parametrische Konstruktion das Haus verlässt. Er dreht
das Modell, markiert die Stellen, um die es geht, schreibt seine Änderungswünsche daneben
— und erzeugt daraus eine Dokumentation: das Modell aus allen Richtungen, dazu jede
Markierung als eigenes Bild mit dem zugehörigen Text. Dieses PDF geht zurück in die
Konstruktion, und dort ist ohne Rückfrage klar, welche Stelle gemeint war.

Nebenbei löst es das zweite Problem, das bei Konstruktionsdaten immer mitkommt: Die
Datei wird nirgendwohin hochgeladen. Sie bleibt auf dem Rechner des Kunden.

**Für wen es außerdem taugt:** Maker und alle, die eine STL aus einer fremden Quelle
haben und vor dem Druck wissen wollen, wie groß das Teil wirklich ist, was es wiegen
wird und ob das Netz überhaupt sauber geschlossen ist.

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

### Änderungen markieren

Auf die Stelle klicken, um die es geht. Dort entsteht ein nummerierter Markierungspin mit
Überschrift, Beschreibung und Art — **Hinweis**, **Änderung**, **Frage** oder
**Freigabe**. Der Blickwinkel wird mitgespeichert: Wer die Anmerkung später anklickt,
sieht das Modell wieder genau so, wie Sie es gesehen haben. Und im PDF steht zu jedem Pin
das Bild aus genau diesem Winkel.

Damit wird aus „das Loch oben links, nein, das andere" eine Nummer, ein Bild und ein Satz.

Die Anmerkungen lassen sich als kleine Datei sichern und beim nächsten Mal wieder laden.
**Ohne das Modell** — Sie können sie also weitergeben, ohne Ihr Bauteil mitzugeben.

### Fotos und PDF erzeugen

**Ein Foto** der aktuellen Ansicht, jederzeit.

**Eine vollständige Dokumentation als PDF** — das Blatt, das zurück in die Konstruktion
geht oder in die Projektakte:

- Deckblatt mit Aufmacherbild und den wichtigsten Zahlen
- Kennwerte und Prüfergebnis
- die sechs Normalansichten auf einer Seite
- **Rundumansichten**: eine volle Umdrehung um jede Achse, die Sie auswählen, in
  gleichmäßigen Schritten. Wie viele Bilder je Achse, entscheiden Sie — voreingestellt
  sind zehn.
- **je Markierungspin eine Seite** mit dem Bild aus dem gespeicherten Blickwinkel, der
  Nummer und Ihrem Text

## Ihre Datei bleibt bei Ihnen

Es gibt keinen Upload. Die Datei wird im Arbeitsspeicher Ihres Browsers gelesen und dort
angezeigt; wenn Sie den Reiter schließen, ist sie weg. Kein Konto, keine Cookies, kein
Tracking.

Das ist keine Zusage, der Sie glauben müssen. Die Seite lässt per
Inhaltssicherheitsrichtlinie nur Anfragen an ihre **eigene Herkunft** zu — und die
liefert Dateien aus, sie nimmt keine entgegen:

```
connect-src 'self'
```

Nach draußen kann der Browser aus dieser Seite nichts senden, auch nicht versehentlich.
Wenn Sie es nachsehen wollen: Entwicklerwerkzeuge öffnen, Reiter „Netzwerk", Datei
hineinziehen. Beim Öffnen einer **STL** erscheint dort genau ein Eintrag — der
Auswertungsstrang des Werkzeugs selbst, vom selben Server.

Nur beim Öffnen einer **STEP- oder IGES-Datei** kommt einmalig die Umwandlungsbibliothek dazu
(7,4 MB WebAssembly, ebenfalls vom selben Server). Sie rechnet im Browser; Ihre Datei
geht auch dabei nirgendwohin.

> Bis zum 4. August 2026 stand hier `connect-src 'none'` — der Browser ließ überhaupt
> keine Anfrage zu. Das war die stärkere Zusage und ist mit der STEP-Unterstützung
> gefallen. Die Abwägung steht offen in [ADR-013](DECISIONS.md).

Für Bauteile unter Geheimhaltung ist das der eigentliche Unterschied: Sie müssen Ihren
Prototypen nicht erst auf einen fremden Server laden, um ihn anzusehen.

## Öffnen

**[reents3d.github.io/stl-viewer](https://reents3d.github.io/stl-viewer/)** — im Browser
öffnen, Datei hineinziehen. Sonst nichts.

Gelesen werden **STL** (binär und ASCII), **STEP** (`.step`, `.stp`) und **IGES**
(`.iges`, `.igs`). Bei STEP und IGES entfällt die Einheitenwahl — sie steht in der Datei.

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

**Bei STEP und IGES beziehen sich alle Werte auf die Tessellierung.** Beide Formate
beschreiben Flächen exakt; zum Anzeigen und Rechnen wird daraus ein Dreiecksnetz. Ein Zylinder wird dabei zum
Vieleck — Volumen und Oberfläche liegen deshalb geringfügig unter den exakten Werten. Wie
fein genähert wird, stellen Sie beim Öffnen ein; die Oberfläche weist die gewählte Stufe
aus. Enthält die Datei eine **Baugruppe**, werden alle Körper zu einem Modell
zusammengelegt, und Volumen wie Gewicht sind die Summe aller Teile — auch das steht dann
in der Seitenleiste.

Alle Werte beschreiben die **Geometrie der Datei** — nicht ein gefertigtes Bauteil. Für
eine Kalkulation ist die Berechnung eines Slicers mit dem tatsächlichen Druckprofil
maßgeblich. Ausführlich in [DISCLAIMER.md](DISCLAIMER.md).

---

## Für Entwickler

Vite, React, TypeScript, Tailwind 4, three.js, jsPDF, occt-import-js (nur für STEP und IGES,
nachgeladen). Kein Server, kein Backend, kein Build-Schritt zur Laufzeit.

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
                (STL selbst geschrieben, STEP und IGES über OpenCascade als WebAssembly)
  viewer/       three.js-Szene, vollständig gekapselt
  export/       PDF, Bild, Anmerkungsdatei
  components/   Oberfläche
  config/       Marke, Kontakt, Bauräume, Werkstoffdichten
  i18n/         Deutsch und Englisch
```

**Eigener STL-Parser statt `STLLoader` aus three.js.** Der Loader arbeitet auf dem
Hauptstrang und meldet keinen Fortschritt; bei einer 180-MB-Datei friert die Oberfläche
mehrere Sekunden ein. Hier laufen Parser und Analyse gemeinsam in einem Web Worker — das
spart außerdem eine vollständige Kopie des Positionsfeldes.

**Die Z-Achse zeigt nach oben**, nicht die Y-Achse wie in der Voreinstellung von three.js.
Alle drei Formate kommen aus CAD und aus Slicern, dort ist Z die Bauhöhe. So heißt die Höhe in der Datei,
in der Anzeige und im PDF gleich.

**Im eigenen Quelltext gibt es kein `fetch`, und es darf keines geben.** Die einzige
Anfrage, die je entsteht, holt die WebAssembly für den STEP- und IGES-Import — von der eigenen
Herkunft, aus dem Worker heraus. Die Pipeline prüft
das gebaute Artefakt auf die Richtlinie und den Quelltext auf ausgehende Aufrufe. Details
und die übrigen Entscheidungen mit Nebenwirkungen: [DECISIONS.md](DECISIONS.md).

### Tests

Getestet wird, was rechnet: Parser, Geometrie und das Seitenraster des PDF. Prüfkörper
entstehen im Speicher, nicht als Dateien im Repo — ein Würfel bekannter Kantenlänge ist
als Code nachvollziehbar, eine Binärdatei im Verzeichnis behauptet nur, ein Würfel zu
sein.

**Kundendateien gehören nie ins Repository.** `.gitignore` sperrt `*.stl`, `*.step`,
`*.stp`, `*.iges` und `*.igs`.

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

Eigener Code unter MIT-Lizenz, siehe [LICENSE](LICENSE).

Der STEP- und IGES-Import nutzt [occt-import-js](https://github.com/kovacsv/occt-import-js)
(**LGPL-2.1**) mit Open CASCADE Technology. Die Bibliothek wird unverändert und als
eigenständige Datei ausgeliefert und lässt sich austauschen — Einzelheiten und die
übrigen Bestandteile in [THIRD-PARTY.md](THIRD-PARTY.md).

Die Werkstoffdichten stammen aus der offenen Materialdatenbank der Reents Technologies
GmbH (CC BY 4.0). Marken Dritter gehören ihren Inhabern.
