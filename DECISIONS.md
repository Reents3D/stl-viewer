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

> **Nachtrag zu ADR-001:** Für die STEP-Unterstützung ist die Richtlinie am
> 2026-08-04 auf `connect-src 'self'` und `script-src 'self' 'wasm-unsafe-eval'`
> gelockert worden — siehe [ADR-013](#adr-013--step-unterstützung-kostet-die-absolute-form-der-zusage).
> Der obige Absatz beschreibt damit den Stand bis zu diesem Tag.

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

**Ergänzend.** Liegt das Verhältnis von Oberfläche zu Volumen über dem Vierfachen einer
Kugel gleichen Volumens, weist die Oberfläche ausdrücklich darauf hin und nennt den
Faktor.

**Korrektur vom 2026-08-03.** Bis dahin löste zusätzlich ein Abstand der beiden Grenzen
über dem Dreifachen die Warnung aus. Das war falsch: Dieser Abstand ist exakt
`100 ÷ Füllgrad` und hängt allein am Schieberegler — bei der Voreinstellung von 20 %
ergibt er immer 5. Die Warnung erschien damit unter **jedem** Bauteil, auch unter einem
massiven Würfel. Eine Warnung, die immer da ist, wird nach dem dritten Modell nicht mehr
gelesen. Aufgefallen ist es an einem Fachwerkrahmen, bei dem sie sachlich sogar zutraf.
Jetzt entscheidet nur noch die Form. Tests halten die Schwelle fest: Würfel 1,24
schweigt, Blech 5,8 warnt.

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

---

## ADR-013 — STEP-Unterstützung kostet die absolute Form der Zusage

**Status:** beschlossen am 2026-08-03, umgesetzt am 2026-08-04 — einschliesslich
IGES, das dieselbe Bibliothek und dasselbe Ergebnisformat nutzt und deshalb keine
eigene Entscheidung braucht.

**Entscheidung.** STEP-Dateien werden über `occt-import-js` (OpenCascade als
WebAssembly, LGPL-2.1) im Browser tesselliert. Dafür wird die
Inhaltssicherheitsrichtlinie an zwei Stellen gelockert:

```
script-src  'self' 'wasm-unsafe-eval'     (statt nur 'self')
connect-src 'self'                        (statt 'none')
```

**Warum beides nötig ist — gemessen, nicht angenommen.** Auf der ausgelieferten
Seite mit der bisherigen Richtlinie:

```
new WebAssembly.Module(bytes)  →  CompileError: Compiling or instantiating
                                  WebAssembly module violates CSP
fetch('./favicon.svg')         →  TypeError: Failed to fetch
```

Das Kompilieren von WebAssembly verlangt `'wasm-unsafe-eval'`. Das Nachladen der
7,4 MB großen `.wasm`-Datei läuft über `fetch` und damit über `connect-src`.

**Was sich an der Zusage ändert.** Aus „der Browser kann nichts senden" wird
„der Browser darf nur mit dem Server reden, von dem die Seite kam — und der
liefert Dateien aus, er nimmt keine entgegen". Sachlich fast gleich stark, als
Satz schwächer. Die Vorführung bleibt: Beim Öffnen einer STL passiert im
Netzwerk-Reiter weiterhin nichts; erst eine STEP-Datei löst genau eine Anfrage
aus, an die eigene Herkunft, für eine statische Datei.

**Warum nicht einbetten und `'none'` behalten.** Technisch möglich: die
`.wasm` als Base64 in ein JS-Bündel legen, dann entfällt der `fetch`. Dagegen
sprechen zwei Dinge. Der Download wächst von 7,4 auf rund 10 MB, weil Base64
ein Drittel aufschlägt. Und die LGPL verlangt, dass sich die Bibliothek
austauschen lässt — als eigene Datei ist das selbstverständlich, eingebacken
ins Bündel müsste man den Austausch eigens ermöglichen und dokumentieren.
`'wasm-unsafe-eval'` wäre auch dann nötig.

**Nachgelagerte Ehrlichkeitspflicht.** Ein STEP ist kein Netz, sondern eine
exakte Flächenbeschreibung. Volumen, Oberfläche und Befund beziehen sich nach
der Tessellierung auf den ERSATZ, nicht auf das Original — ein Zylinder wird zum
Vieleck. Das muss in der Oberfläche stehen, sobald eine STEP-Datei geöffnet ist,
und nicht nur hier. Positiv: STEP trägt seine Einheit in der Datei, die
Einheitenwahl beim Öffnen entfällt dort.

---

## ADR-014 — Das Bild trägt die Wortmarke, das PDF nicht

**Status:** beschlossen und umgesetzt am 2026-08-07.

**Entscheidung.** Der Bildexport („Bild sichern") zeichnet die Wortmarke unten rechts
ins Bild. Die bis zu 78 Einzelaufnahmen im PDF bleiben unberührt.

**Warum der Unterschied.** Ein einzelnes Bild verlässt das Werkzeug und wandert danach
durch Mails, Angebotsmappen und Chatverläufe. Nach dem zweiten Weiterleiten ist nicht
mehr erkennbar, woher es stammt — genau dann, wenn es kommerziell etwas wert wäre. Beim
PDF steht die Herkunft auf dem Deckblatt; eine Marke zusätzlich auf jeder Rundumansicht
wäre Krach statt Kennzeichnung.

**Zwei Fassungen, nicht eine.** Der Hintergrund ist wahlweise hell, dunkel oder ein
Verlauf, und unten rechts kann statt des Hintergrunds auch das Bauteil stehen. Eine
feste Farbe wäre in einem der Fälle unsichtbar. Deshalb wird die mittlere Helligkeit
genau an der Stelle gemessen, an der die Marke landet, und danach zwischen der schwarzen
und der weißen Fassung gewählt. Gewichtet nach Wahrnehmung statt als schlichter
Kanalmittelwert — sonst gälten sattes Blau und sattes Gelb als gleich hell.

**Falle, die dabei umgangen wurde.** Zwischen `render()` und `toDataURL()` darf nichts
liegen, sonst gibt der Browser den Zeichenpuffer frei und das Bild wird schwarz (siehe
den Hinweis an `capture`). Die beiden SVG-Dateien werden deshalb **vor** der Aufnahme
geladen; im Aufnahmedurchlauf selbst steht kein `await`.

**Was bewusst nicht geprüft wird.** Ob die Marke auf dem Bauteil oder daneben liegt.
Die Helligkeitsmessung deckt beides ab, eine Ausweichlogik („Marke verschieben, wenn
Bauteil darunter") wäre Aufwand für einen Fall, den der Kunde durch Drehen selbst löst.

---

## ADR-015 — Die Chrome-Erweiterung ist ein zweites Bauziel, kein zweites Projekt

**Status:** beschlossen und umgesetzt am 2026-08-11.

**Entscheidung.** Dieselbe Anwendung wird zusätzlich als Chrome-Erweiterung
ausgeliefert. Sie entsteht aus demselben Quelltext, derselben Vite-Konfiguration
und derselben Inhaltssicherheitsrichtlinie; unterschieden wird über
`VITE_TARGET=extension`. Was die Erweiterung darüber hinaus braucht, liegt
versioniert in `extension/`: Manifest, Dienstprogramm, Sprachdateien, Symbole.

**Warum überhaupt eine Erweiterung.** Aus dem Eintrag im Chrome Web Store
entsteht eine indexierte Seite auf einer Google-Domain, die Firmenname,
Anschrift und drei Verweise auf `reents3d.de` trägt, dazu die automatische
Spiegelung in einschlägigen Erweiterungsverzeichnissen. Der Anlass ist also
Sichtbarkeit. Getragen wird er nur, wenn das Werkzeug für sich steht, und das
tut es hier: Es war vorher fertig.

**Warum kein eigenes Repository.** Die Zusage „Ihre Datei verlässt den Rechner
nicht" hängt an genau einer Richtlinie (ADR-001, ADR-013). Ein zweites
Repository oder auch nur eine zweite Konfigurationsdatei hätte zur Folge, dass
diese Richtlinie an zwei Stellen steht. Zwei Fassungen laufen auseinander, ohne
dass es jemandem auffällt, denn die Anwendung funktioniert danach genauso gut.
Genau diese Klasse von Fehler ist der Grund, warum es `check-artifact.mjs`
überhaupt gibt.

**Warum die Erweiterung keine einzige Berechtigung anfordert.** Jede
Berechtigung erscheint bei der Installation als Satz, den der Nutzer lesen muss.
Ein Werkzeug, das mit „kein Upload" wirbt und dabei Zugriff auf alle Seiten
verlangt, widerlegt sich beim Einschalten selbst. Der Klick auf das Symbol
öffnet die im Paket liegende Seite über `chrome.tabs.create`, und das braucht
keine Berechtigung. Der bequeme Zusatz, einen bereits offenen Reiter
wiederzuverwenden, bräuchte `chrome.tabs.query` mit `url` und damit die
Berechtigung `tabs` — sie würde als Zugriff auf den Browserverlauf angezeigt.
Der Tausch lohnt nicht. `check-extension.mjs` bricht ab, falls jemand später
anders entscheidet, ohne diesen Absatz gelesen zu haben.

**Warum das Paket kein Rahmen um die Website ist.** Naheliegend wäre ein
Fenster, das `viewer.reents3d.de` einbettet. Der Store lehnt solche Pakete als
blosse Verpackung ab, und die Zusage wäre dahin: Eine eingebettete Seite lädt
ihren Code aus dem Netz. Das Paket enthält deshalb alles, einschließlich der
7,4 MB großen WebAssembly von OpenCascade. Damit läuft die Erweiterung offline,
und das ist gegenüber der Website ein eigenes Argument statt einer Kopie.

**Was am Bau angepasst wurde und warum.** `CNAME` und `manifest.webmanifest`
fallen aus dem Paket: Beide gehören zum Webbau, funktionieren in einer
Erweiterung nicht falsch, sondern sinnlos, und was sinnlos im Paket liegt,
erzeugt bei der Prüfung Rückfragen. Der Titel wird gekürzt, weil der lange für
die Google-Suche geschrieben ist und in einem Reiter nur abschneidet. Der
Basispfad bleibt `/`: Eine Seite unter `chrome-extension://<kennung>/` hat die
Paketwurzel als Herkunftswurzel, absolute Verweise treffen also genau. Das gilt
auch für die Arbeiter, die Vite über `new URL(..., import.meta.url)` auflöst.

**Herkunftskennung.** `SITE.utm` ist über die Umgebung austauschbar und lautet
im Erweiterungsbau `utm_source=chrome-web-store`. Ohne diese Trennung landen
Website und Erweiterung in einem Topf, und die Frage, ob der Store-Eintrag
Besucher bringt, wäre nicht zu beantworten. Es ist die Frage, wegen der es die
Erweiterung gibt.

**Was der Bau selbst prüft.** `check-artifact.mjs` läuft unverändert auch auf
`dist-extension` — Richtlinie und fremde Ressourcen gelten dort genauso.
Darüber liegt `check-extension.mjs` mit dem, was nur für den Store gilt:
Manifestfassung, Berechtigungen, Richtlinie der Erweiterungsseiten,
Symbolgrößen als echte PNG-Kopfdaten, Vollständigkeit und Längengrenzen beider
Sprachfassungen (45 / 12 / 132 Zeichen), Reste aus dem Webbau. Der Grund ist
nicht Ordnungsliebe: Eine abgelehnte Einreichung kostet keinen Code, sondern
Tage, und fast alles, was zur Ablehnung führt, ist vorher am Paket ablesbar.

**Warum ein eigener ZIP-Schreiber.** `zip` fehlt unter Windows,
`Compress-Archive` aus PowerShell schreibt je nach Fassung Backslashes als
Pfadtrenner, und ein Archiv mit Backslashes packt Chrome falsch aus. Eine
Abhängigkeit dafür stünde dauerhaft in THIRD-PARTY.md. Das Format ist alt und
festgelegt; die Zeitstempel im Archiv sind fest verdrahtet, damit dasselbe Paket
immer dieselbe Prüfsumme hat und die Frage „ist das Hochgeladene das Gebaute"
beantwortbar bleibt statt geglaubt zu werden.

**Was bewusst nicht gebaut wurde.** Kein Kontextmenü auf STL-Verweisen fremder
Seiten und keine Einblendung auf Modellportalen. Beides wäre nützlich, beides
verlangt Zugriff auf fremde Seiten und macht aus einer Erweiterung ohne
Berechtigungen eine mit der breitesten von allen.
