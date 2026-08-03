# Entscheidungen

Was hier steht, sind Entscheidungen mit Nebenwirkungen — nicht die
selbstverständlichen. Wer eine davon rückgängig machen will, findet hier den Grund,
warum sie so getroffen wurde.

---

## ADR-001 — Kein Upload, und die Richtlinie erzwingt es

**Entscheidung.** Die ausgelieferte Seite trägt `connect-src 'none'` in ihrer
Inhaltssicherheitsrichtlinie.

**Warum.** Die Zusage „Ihre Datei verlässt den Rechner nicht" ist bei
Konstruktionsdaten das eigentliche Verkaufsargument — Prototypen, Bauteile unter
Geheimhaltung. Eine Zusage, die man glauben muss, ist bei diesem Publikum wenig wert.
`connect-src 'none'` macht daraus eine technische Sperre: Der Browser lässt keine
ausgehende Verbindung zu, auch nicht versehentlich, auch nicht durch eine kompromittierte
Abhängigkeit. Ein Kunde prüft das mit offenem Netzwerk-Reiter in zehn Sekunden selbst.

**Preis.** In diesem Projekt darf nie ein `fetch()` entstehen. Es fällt erst im Build
auf, weil die Richtlinie bewusst nur am Artefakt gesetzt wird — im Entwicklungsserver
würde `script-src 'self'` das Inline-Modul von React Refresh blockieren und die Seite
bliebe leer.

---

## ADR-002 — Eigener STL-Parser statt `STLLoader` aus three.js

**Entscheidung.** Parser und Geometrieanalyse sind selbst geschrieben und laufen
gemeinsam in einem Web Worker.

**Warum.** Der `STLLoader` kann beide Formate und ist erprobt, arbeitet aber auf dem
Hauptstrang und meldet keinen Fortschritt. Bei einer 180-MB-Datei — im Großformat nichts
Ungewöhnliches — friert die Oberfläche mehrere Sekunden ein, ohne dass der Besucher
erfährt, ob noch etwas passiert. Dazu kommt: Die Analyse braucht ohnehin einen eigenen
Durchlauf über dieselben Zahlen. Läge sie auf dem Hauptstrang, müsste das Positionsfeld
erst hinüberwandern; bei 100 MB sind das 250 MB, die einmal durch die Übergabe gehen,
bevor überhaupt gerechnet wird.

**Preis.** Ein zweiter Parser für ein Format, für das es schon einen gibt. Er ist durch
18 Tests abgedeckt, darunter die SolidWorks-Falle (ADR-003).

---

## ADR-003 — Formaterkennung über die Dateilänge, nicht über „solid"

**Entscheidung.** Ein STL gilt als binär, wenn `84 + 50 × Dreieckszahl` genau der
Dateigröße entspricht — unabhängig davon, was im Kopf steht.

**Warum.** Der 80-Byte-Kopf eines binären STL darf beliebigen Inhalt haben, und viele
Exporter schreiben dort den Programm- oder Dateinamen hinein. SolidWorks schrieb dort
jahrelang „solid". Jede Prüfung, die nur die ersten fünf Zeichen ansieht, hält solche
Dateien für ASCII. Das Ergebnis ist kein Fehler, sondern ein **leeres Modell**: Der
ASCII-Zweig findet kein `vertex` und liefert null Dreiecke. Ein Kunde sieht eine leere
Fläche und weiß nicht, ob seine Datei kaputt ist oder das Werkzeug.

---

## ADR-004 — Gewicht immer als Spanne

**Entscheidung.** Es gibt keine einzelne Gewichtszahl. Ausgegeben wird „von … bis …",
untere Grenze mit dem gewählten Füllgrad, obere Grenze massiv.

**Warum.** `Volumen × Dichte × Füllgrad` unterstellt, dass der Füllgrad im ganzen Bauteil
gilt. Ein Slicer legt zuerst Wände, Boden und Decke in voller Dichte an und füllt nur den
Rest. Bei einem dünnwandigen Gehäuse besteht das Bauteil fast vollständig aus Wand — dort
liegt die lineare Rechnung um ein Vielfaches zu niedrig. Bei einem massigen Block stimmt
sie gut. Aus einer einzelnen Zahl wäre nicht ablesbar, in welchem der beiden Fälle man
sich befindet. Aus einer weiten Spanne schon: Dann entscheidet die Wandstärke, und dann
muss der Slicer ran.

**Ergänzend.** Ab dem Dreifachen Abstand zwischen den Grenzen, oder bei einem
Oberfläche-zu-Volumen-Verhältnis über dem Vierfachen einer Kugel gleichen Volumens,
weist die Oberfläche ausdrücklich darauf hin.

---

## ADR-005 — Topologieprüfung wird ab 1,2 Mio. Dreiecken übersprungen, und das wird gesagt

**Entscheidung.** Oberhalb der Grenze entfällt der Befund, nicht die Kennwerte. Die
Oberfläche meldet die Auslassung.

**Warum.** Die Prüfung muss deckungsgleiche Eckpunkte verschweißen und dafür eine
Zuordnungstabelle über alle Eckpunkte halten — bei 1,2 Mio. Dreiecken sind das 3,6 Mio.
Einträge und je nach Browser mehrere hundert Megabyte. Darüber kippt der Reiter, statt
langsam zu werden. Abmessungen, Volumen und Oberfläche brauchen diese Tabelle nicht; sie
laufen in einem Durchgang mit konstantem Speicher.

Eine stillschweigende Auslassung wäre schlimmer als die Auslassung selbst: Eine Datei
ohne Befund sähe aus wie eine Datei ohne Befunde.

---

## ADR-006 — Volumen wird um den Hüllenmittelpunkt integriert

**Entscheidung.** Vor der Summation der Tetraedervolumen wird der Ursprung in den
Mittelpunkt des Hüllkörpers gelegt.

**Warum.** STL speichert Koordinaten in einfacher Genauigkeit. Liegt ein Bauteil im CAD
bei x = 2.400 mm und ist selbst nur 3 mm dick, subtrahieren sich in der Formel zwei fast
gleich große Zahlen voneinander, und von der Differenz bleibt kaum eine gültige Stelle
übrig. Verschoben rechnet dieselbe Formel um Größenordnungen genauer — und das Ergebnis
ist dasselbe, weil eine Verschiebung das Volumen nicht ändert. Ein Test hält den Fall
fest.

---

## ADR-007 — Bauraumprüfung über sortierte Kantenlängen

**Entscheidung.** Bauteil- und Bauraumkanten werden absteigend sortiert und paarweise
verglichen.

**Warum.** Das prüft alle sechs achsparallelen Lagen auf einmal. Ein Vergleich Achse für
Achse hätte ein 2.300 mm hohes Bauteil als „zu groß" abgewiesen, obwohl es in der
2.400er-Achse liegend hineingeht. Schräge Lagen werden bewusst **nicht** geprüft: Sie
sind im Großformat unüblich, und ein „passt schräg" wäre eine Zusage, die die Fertigung
einlösen muss.

---

## ADR-008 — Der Drehteller dreht das Modell, nicht die Kamera

**Entscheidung.** Für die Rundumansichten wird das Modell unter festen Lichtern gedreht.

**Warum.** Ein Kameraflug um ein stehendes Objekt zieht die Lichter mit durchs Bild. Die
Bilderfolge im PDF hätte dann bei jedem Schritt eine andere Ausleuchtung — und ein Kunde
liest den Unterschied als Formunterschied. Ein Drehteller unter fester Beleuchtung zeigt
in allen Bildern dieselbe Oberfläche.

---

## ADR-009 — Helvetica im PDF statt Montserrat und Sora

**Entscheidung.** Das PDF wird in Helvetica gesetzt.

**Warum.** Das Corporate Design steht auf zwei Schriften, die als variable
woff2-Dateien im Projekt liegen. jsPDF kann nur TTF einbetten — eine Umwandlung wäre ein
zusätzlicher Bauschritt, und eingebettet hätten die beiden Schnitte rund 300 KB an jedes
erzeugte PDF gehängt. Dagegen steht der Gewinn: eine andere Grotesk. Helvetica ist eine
der 14 Standardschriften jedes PDF-Betrachters; das Dokument bleibt klein, der Text
bleibt durchsuchbar und kopierbar. Die Marke trägt hier die Bildmarke, die Farbe und der
Aufbau.

---

## ADR-010 — Anmerkungsdateien enthalten die Geometrie nicht

**Entscheidung.** „Anmerkungen sichern" speichert ausschließlich die Anmerkungen, dazu
Dateiname, Dreieckszahl und Abmessungen des Modells zur Wiedererkennung.

**Warum.** Eine Datei, die das Modell mitnimmt, wäre bequemer und würde genau das
aufheben, wofür dieses Werkzeug gebaut ist: Der Kunde soll eine Datei weitergeben können,
ohne sein Bauteil mitzugeben.

**Preis.** Ohne die zugehörige STL sind die Anmerkungen wertlos. Beim Laden wird deshalb
gegen Dreieckszahl und Dateinamen geprüft und bei Abweichung nachgefragt. Die
Dreieckszahl ist dabei die schärfere Probe — Dateinamen werden umbenannt.

---

## ADR-011 — Anmerkungsnummern werden nie neu vergeben

**Entscheidung.** Wird Anmerkung 3 gelöscht, heißen die übrigen weiterhin 1, 2, 4.

**Warum.** Die Nummern stehen in bereits verschickten PDF-Dokumenten und in E-Mails
darüber. Eine Neuvergabe würde aus „bitte prüfen Sie Punkt 4" nachträglich einen Verweis
auf eine andere Stelle machen.

---

## ADR-012 — Marken werden außerhalb von React positioniert

**Entscheidung.** Anmerkungsmarken und Maßbeschriftungen liegen als HTML über der
Zeichenfläche, ihre Position schreibt ein Rückruf nach jedem gezeichneten Bild direkt in
die Stilattribute.

**Warum.** Die Marken hängen an der Kamera. Über den Zustand von React geführt wäre das
ein `setState` je Bild — sechzig Durchläufe des Abgleichs in der Sekunde, bei zwanzig
Anmerkungen. React verwaltet deshalb nur, **welche** Marken es gibt, nicht, **wo** sie
stehen.

**Falle, die dabei entstand.** Die Szene zeichnet nur, wenn sich etwas bewegt hat — und
eine neu gesetzte Anmerkung bewegt die Kamera nicht. Ohne einen ausdrücklichen Anstoß
blieb die frische Marke in der linken oberen Ecke liegen, bis der Kunde das Modell
zufällig einmal drehte. In der Handprüfung aufgefallen, seitdem stößt ein Effekt das
Neuzeichnen an.
