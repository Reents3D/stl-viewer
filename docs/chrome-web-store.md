# Einreichung im Chrome Web Store

Alles, was beim Hochladen in ein Feld getippt werden muss, steht hier. Wer die
Erweiterung einreicht, arbeitet diese Datei von oben nach unten ab und muss sich
nichts ausdenken.

**Warum es diese Datei gibt:** Die Store-Texte sind kein Beiwerk. Sie sind der
Grund, warum die Erweiterung überhaupt gebaut wurde. Die Eintragsseite liegt auf
einer Google-Domain, wird indexiert und trägt Firmenname, Anschrift und drei
Verweise auf `reents3d.de`. Ein Eintrag mit lieblosem Text ist ein verschenkter
Eintrag, und Texte, die nur im Store-Formular stehen, sind bei der nächsten
Fassung verloren.

**Schreibregel:** In allen Texten dieser Datei stehen keine Gedankenstriche
(– — ‒ ―), sondern Komma, Doppelpunkt oder Punkt. Bindestriche in Komposita
(3D-Druck, STL-Betrachter) bleiben. Das ist dieselbe Vorgabe wie für die
Website, damit die Texte nebeneinander gleich klingen.

---

## 1. Paket bauen

```bash
npm run pack:ext
```

Das baut nach `dist-extension/`, prüft das Paket und schreibt
`reents3d-stl-betrachter.zip`. Der Lauf gibt eine SHA-256-Prüfsumme aus.
**Diese Prüfsumme gehört in die Notiz zur Einreichung** (Abschnitt 8), sonst ist
später nicht mehr feststellbar, welcher Bau hinter einer Fassung im Store steckt.
Derselbe Stand ergibt immer dasselbe Archiv: Die Zeitstempel im ZIP sind fest
verdrahtet, damit genau diese Frage beantwortbar bleibt.

Bricht die Prüfung ab, steht der Grund im Klartext dabei. Nicht das Prüfskript
lockern: Es prüft genau die Punkte, an denen der Store sonst ablehnt.

### In PowerShell: npm.cmd statt npm

```powershell
Set-Location "C:\Users\Riko\Documents\Claude Code\stl-viewer"
npm.cmd run pack:ext
```

`npm` allein bricht in PowerShell ab:

```
Die Datei "C:\Program Files\nodejs\npm.ps1" kann nicht geladen werden,
da die Ausführung von Skripts auf diesem System deaktiviert ist.
```

Grund ist die Ausführungsrichtlinie, die auf diesem Rechner in allen Bereichen
`Undefined` ist und damit `Restricted` bedeutet. `npm` ist unter Windows ein
PowerShell-Skript, `npm.cmd` dagegen eine Stapeldatei und von der Richtlinie
nicht betroffen. **Die Richtlinie deswegen nicht herabsetzen** — sie schützt
gegen ganz andere Dinge, und `npm.cmd` löst das Problem vollständig.

Und: erst ins Projektverzeichnis wechseln. Ein `npm run` in
`C:\Windows\system32` findet keine `package.json`.

---

## 2. Vor dem Hochladen einmalig

- **Entwicklerkonto** mit einem Firmen-Google-Konto anlegen, nicht mit einem
  privaten. Der Eintrag hängt dauerhaft daran, und eine Übertragung ist mühsam.
  Einmalig 5 USD, gilt für bis zu 20 Erweiterungen.
- **Händlerkonto bejahen.** Reents Technologies GmbH handelt gewerblich, die
  Einstufung nach EWR-Verbraucherschutzrecht ist eindeutig. Dass die Erweiterung
  kostenlos ist, ändert daran nichts.
- **Publisher-Anzeigename:** `Reents Technologies GmbH`, exakt wie im Impressum.
  Der Markenname Reents3D gehört in Titel und Beschreibung, nicht ins
  Publisher-Feld.
- **Domain über die Google Search Console verifizieren.** Danach zeigt der Store
  `reents3d.de` als bestätigt an. Das ist die Kopplung zwischen Eintrag und
  Domain, um die es hier geht.

---

## 3. Eintragstexte

Name, Kurzname und Kurzbeschreibung kommen aus `extension/_locales/`. Sie werden
**nicht** im Store-Formular getippt, sondern aus dem Paket gelesen. Wer sie
ändern will, ändert die Sprachdateien; `npm run check:ext` prüft die
Längengrenzen (45 / 12 / 132 Zeichen).

Die **ausführliche Beschreibung** steht dagegen nur im Formular und deshalb hier.

### Deutsch

> Der kostenlose STL-, STEP- und IGES-Betrachter von Reents3D (reents3d.de):
> Konstruktionsdateien im Browser ansehen, vermessen und dokumentieren. Ohne
> Upload, ohne Konto, ohne Registrierung.
>
> Ziehen Sie eine Konstruktionsdatei ins Fenster. Sie sehen sofort Abmessungen,
> Volumen, Oberfläche und Dreieckszahl, drehen das Modell frei, legen eine
> Schnittebene hinein und messen von Punkt zu Punkt. Am Ende erzeugen Sie eine
> PDF-Dokumentation mit Rundumansichten je Achse.
>
> DIE DATEI BLEIBT AUF IHREM RECHNER
>
> Es gibt keinen Upload. Die Datei wird im Browser gelesen und nirgendwo
> gespeichert. Das ist keine Zusage, der Sie glauben müssen: Die Erweiterung
> fordert keine einzige Berechtigung an, und ihre
> Inhaltssicherheitsrichtlinie lässt keine Verbindung nach außen zu. Prüfbar
> mit offenem Netzwerk-Reiter in zehn Sekunden.
>
> Damit eignet sie sich für Bauteile unter Geheimhaltung und für Prototypen, die
> nicht auf einen fremden Server dürfen.
>
> WAS SIE SEHEN
>
> Abmessungen in Millimetern, Volumen, Oberfläche, Dreiecke, Eckpunkte,
> Schwerpunkt
> Gewichtsschätzung für 41 Werkstoffe, wahlweise nach Füllgrad
> Wandstärke per Klick, mit Warnung unter 1,5 mm
> Überhänge farbig markiert, bevor der Druck schiefgeht
> Größenvergleich mit Person, Europalette, A4-Blatt und Tasse
> Prüfung gegen reale Bauräume bis 1.800 x 2.400 x 1.800 mm
> Anmerkungen direkt am Modell, für die Abstimmung mit Kunden und Kollegen
> Versionsvergleich zweier Stände, ausgerichtet über den CAD-Nullpunkt
> PDF-Dokumentation und Bildexport
>
> WELCHE FORMATE
>
> STL binär und ASCII, STEP (.step, .stp) und IGES (.iges, .igs). STEP und IGES
> werden im Browser tesselliert, wahlweise grob, mittel oder fein. Die
> Einheitenwahl entfällt dort: Sie steht in der Datei.
>
> FÜR WEN
>
> Konstrukteure, Einkäufer, Modell- und Messebauer, 3D-Druck-Anwender und alle,
> die eine CAD-Datei prüfen wollen, ohne ein CAD-Programm zu öffnen.
>
> Funktioniert offline. Einmal installiert, braucht die Erweiterung kein
> Netzwerk.
>
> WER DAHINTERSTEHT
>
> Die Reents Technologies GmbH aus Holm bei Hamburg fertigt XXL-3D-Druck,
> Exponate und Messebau mit über 50 eigenen FDM-Anlagen, am Stück bis
> 2.400 mm. Dieses Werkzeug ist quelloffen und kostenlos, auch ohne Auftrag:
> github.com/Reents3D/stl-viewer
>
> Als Website ohne Installation: viewer.reents3d.de
> Zum 3D-Druck-Service: reents3d.de/leistungen/3d-druck-service/
> Zum XXL-3D-Druck: reents3d.de/leistungen/xxl-3d-druck/

### Englisch

> The free STL, STEP and IGES viewer by Reents3D (reents3d.de): view, measure
> and document CAD files in your browser. No upload, no account, no sign-up.
>
> Drag a CAD file into the window. You immediately see dimensions, volume,
> surface area and triangle count, rotate the model freely, place a section
> plane and measure point to point. Finally you export a PDF documentation with
> all-round views per axis.
>
> THE FILE STAYS ON YOUR COMPUTER
>
> There is no upload. The file is read in the browser and stored nowhere. You do
> not have to take our word for it: the extension requests no permission at all,
> and its content security policy allows no outbound connection. Verifiable with
> an open network tab in ten seconds.
>
> That makes it suitable for parts under NDA and for prototypes that must not go
> to someone else's server.
>
> WHAT YOU SEE
>
> Dimensions in millimetres, volume, surface area, triangles, vertices, centre
> of mass
> Weight estimate for 41 materials, by infill level
> Wall thickness on click, with a warning below 1.5 mm
> Overhangs highlighted before a print goes wrong
> Size comparison against a person, a euro pallet, an A4 sheet and a mug
> Check against real build volumes up to 1,800 x 2,400 x 1,800 mm
> Annotations directly on the model, for talking to customers and colleagues
> Version comparison of two revisions, aligned on the CAD origin
> PDF documentation and image export
>
> WHICH FORMATS
>
> STL binary and ASCII, STEP (.step, .stp) and IGES (.iges, .igs). STEP and IGES
> are tessellated in the browser, coarse, medium or fine. No unit choice is
> needed there: it is stored in the file.
>
> WHO IT IS FOR
>
> Design engineers, buyers, model and exhibition builders, 3D printing users and
> anyone who wants to check a CAD file without opening a CAD program.
>
> Works offline. Once installed, the extension needs no network.
>
> WHO IS BEHIND IT
>
> Reents Technologies GmbH in Holm near Hamburg produces XXL 3D printing,
> exhibits and trade fair construction on more than 50 in-house FDM machines, up
> to 2,400 mm in one piece. This tool is open source and free, with or without an
> order: github.com/Reents3D/stl-viewer
>
> As a website without installation: viewer.reents3d.de
> 3D printing service: reents3d.de/leistungen/3d-druck-service/
> XXL 3D printing: reents3d.de/leistungen/xxl-3d-druck/

---

## 4. Kategorie und Verweise

| Feld | Wert |
|---|---|
| Kategorie | Werkzeuge (Tools) |
| Sprache | Deutsch, zusätzlich Englisch |
| Website | `https://reents3d.de/werkzeuge/stl-betrachter/` |
| Support | `https://reents3d.de/kontakt/` |
| Datenschutz | `https://reents3d.de/datenschutz/` |

**Alle drei Verweise zeigen auf die Hauptdomain, nicht auf `viewer.reents3d.de`
und nicht auf GitHub.** Das ist keine Kleinigkeit: Der ganze Verweiswert des
Eintrags landet sonst auf einer Unterdomain oder bei Microsoft. Die
Werkzeugseite unter `/werkzeuge/stl-betrachter/` muss vor der Einreichung
existieren, sonst führt der Eintrag ins Leere.

### Warum die Werkzeugseite und nicht die Leistungsseite

Die Versuchung ist, das Website-Feld direkt auf `/leistungen/3d-druck-service/`
zu richten und den Verweis dorthin zu lenken, wo Geld verdient wird. Drei
Gründe dagegen:

**Absichtstreffer.** Wer aus einem Betrachter-Eintrag auf „Website" klickt, will
etwas über das Werkzeug wissen. Eine Verkaufsseite ist an dieser Stelle ein
Themensprung und endet als Absprung. Ein Verweis, dem niemand folgt, ist auch
als Signal wenig wert.

**Die Prüfung sieht hin.** Das Website-Feld soll zur Erweiterung gehören. Ein
Verweis auf eine allgemeine Verkaufsseite liest sich als sachfremde Werbung und
ist ein vermeidbarer Ablehnungsgrund.

**Sackgasse ist eine Frage der Bauart, nicht des Ziels.** Damit der Wert
weiterfließt, muss die Werkzeugseite kräftig intern verlinken: auf
`/leistungen/xxl-3d-druck/`, `/leistungen/3d-druck-service/` und
`/leistungen/cad-konstruktion/`. Dann wandert er mit thematischem Kontext
weiter, statt roh auf einer Seite zu landen, für die der Besucher nicht
gekommen ist.

### Was die Werkzeugseite tragen muss

Eine reine Weiterleitung wäre verschenkt. Die Seite braucht:

- Erklärung des Werkzeugs, Verweis auf den Store-Eintrag und auf
  `viewer.reents3d.de` als Fassung ohne Installation
- **Einen kompakten Begriffsteil** mit den zwölf bis fünfzehn Begriffen, die
  der Betrachter selbst verwendet: Tessellierung, Wandstärke, Überhang,
  Bauraum, Volumen gegen Gewicht, STL gegen STEP gegen IGES, Netz geschlossen.
  Das ist ein Bruchteil der Arbeit eines vollen Glossars, passt thematisch
  genau zu diesen Besuchern und macht aus der Landeseite eine Seite mit
  eigenem Rang statt einer Durchreiche.
- Interne Verweise auf die drei Leistungsseiten oben, im Fließtext und nicht
  nur im Fuß

Ein vollständiges Glossar über die ganze Website ist ein eigenes Vorhaben:
sinnvoll für Longtail und für die Zitierfähigkeit in KI-Antworten, aber kein
Ziel für externe Verweise und keine Voraussetzung für diese Einreichung.

### Was im Beschreibungstext KEIN Verweis ist

Die ausführliche Beschreibung ist reiner Text. Kein HTML, kein Markdown, und
Adressen werden nicht zu anklickbaren Verweisen. Die Adressen im Text sind
Markenerwähnungen, die gelesen und kopiert werden, aber sie sind nicht der
Verweis. Der steht in den drei Feldern der Tabelle oben. Wer den Text mit
Adressen füllt in der Annahme, damit Verweise zu sammeln, verschenkt die
Zeilen, die den Besucher überzeugen sollen.

---

## 5. Angaben zum Datenschutz

Der Store verlangt diese Angaben und lehnt ohne sie ab.

**Einziger Zweck (single purpose):**

> Die Erweiterung öffnet einen Betrachter für 3D-Dateien in den Formaten STL,
> STEP und IGES. Sie zeigt Geometrie und Kennwerte der geöffneten Datei an und
> erzeugt daraus eine Dokumentation. Sie tut nichts darüber hinaus.

**Berechtigungen:** keine. Es gibt nichts zu begründen. Die Erweiterung
deklariert weder `permissions` noch `host_permissions` noch `content_scripts`;
`npm run check:ext` bricht ab, falls das jemand ändert.

**Fremdcode (remote code):** nein. Sämtlicher Code liegt im Paket,
einschließlich der WebAssembly von OpenCascade für den STEP- und IGES-Import.
Zur Laufzeit wird nichts nachgeladen.

**Datenerhebung:** keine der abgefragten Kategorien. Weder
personenidentifizierende Angaben noch Gesundheits-, Finanz-, Authentifizierungs-,
Standort- oder Nutzungsdaten, kein Website-Inhalt. Die geöffnete
Konstruktionsdatei verlässt den Rechner nicht.

Die drei Zusicherungen am Ende des Formulars (keine Weitergabe, kein Verkauf,
Nutzung nur für den angegebenen Zweck) treffen zu und werden bestätigt.

---

## 6. Bildmaterial

Muss vor dem Hochladen erzeugt werden, der Store nimmt dafür keine Vorlage
entgegen.

| Element | Maße | Pflicht |
|---|---|---|
| Bildschirmfoto | 1280 x 800 oder 640 x 400 px | ja, 1 bis 5 Stück |
| Kleine Kachel | 440 x 280 px | empfohlen |
| Marquee-Kachel | 1400 x 560 px | freiwillig |

Vorschlag für die fünf Bildschirmfotos, in dieser Reihenfolge, weil das erste in
der Suchergebnisliste erscheint:

1. Modell geladen, Seitenleiste mit Abmessungen und Volumen sichtbar
2. Der Hinweis „Kein Upload" im Kopf, zusammen mit einem leeren Netzwerk-Reiter
   der Entwicklerwerkzeuge daneben. Das ist das Verkaufsargument, und ein Bild
   davon ist stärker als jeder Satz
3. Wandstärkenprüfung mit rot markierter dünner Stelle
4. Bauraumprüfung mit dem Größenvergleich
5. Erzeugtes PDF mit den Rundumansichten

Aufnehmen im gebauten Paket, nicht im Entwicklungsserver: Der Titel und die
Fußzeile unterscheiden sich.

**Ein echtes Reents3D-Bauteil verwenden**, kein Testmodell. Ein Exponat oder ein
XXL-Teil zeigt in einem Bild, worum es geht; ein grauer Würfel zeigt nichts.

### So wird aufgenommen

1. `chrome://extensions` öffnen, Entwicklermodus einschalten, „Entpackte
   Erweiterung laden", `dist-extension/` wählen
2. Betrachter öffnen, Modell laden, Ansicht einrichten
3. `F12`, dann `Strg+Shift+M` für die Geräteleiste
4. Maße auf **1280 x 800** stellen
5. `Strg+Shift+P`, „Capture screenshot" tippen, Enter

Die Aufnahme landet in den Downloads.

**Geräteskalierung ruhig auf 2 stehen lassen.** Die Aufnahme ist dann 2560 x
1600, und das ist die bessere Ausgangslage: Beim Halbieren entsteht jeder
Zielpunkt aus vier gemessenen. Kanten und Schrift werden dadurch sauberer als
bei einer Aufnahme in Zielgröße. `store-bild.mjs` rechnet ganzzahlige Faktoren
selbst herunter.

### Und danach, zwingend

```powershell
node scripts/store-bild.mjs "$env:USERPROFILE\Downloads\aufnahmen" docs/store-assets --masse 1280x800
```

Quelle und Ziel dürfen beide Ordner sein, dann laufen alle fünf in einem Zug
durch. Einzeln geht auch:

```powershell
node scripts/store-bild.mjs "$env:USERPROFILE\Downloads\localhost.png" docs/store-assets/bildschirmfoto-1.png --masse 1280x800
```

**Dieser Schritt ist keine Kür.** Der Store verlangt 24-Bit-PNG ohne Alpha,
jede Aufnahme aus den Entwicklerwerkzeugen ist aber RGBA, und ein 32-Bit-PNG
wird abgelehnt, auch wenn jeder Alphawert 255 ist. Dem Bild sieht man nichts an;
die Ablehnung kommt erst nach dem Hochladen.

---

## 7. Nach der Freigabe

- **Werkzeugseite auf reents3d.de** mit dem Store-Verweis ergänzen und intern
  auf `/leistungen/xxl-3d-druck/` verlinken. Ohne diesen Schritt ist der
  Eintrag eine Sackgasse.
- **Edge Add-ons und Firefox AMO:** dasselbe Paket, dieselben Texte. Beide
  nehmen Manifest V3. Das ist der billigste Teil der ganzen Übung und
  verdreifacht die Zahl der Einträge.
- **Besucher zählen:** Die Verweise aus der Erweiterung tragen
  `utm_source=chrome-web-store`, die von der Website `utm_source=github`. Damit
  ist die Frage, ob der Store-Eintrag Besucher bringt, beantwortbar.

---

## 8. Fassungen

Die Fassung der Erweiterung steht in `extension/manifest.json` und ist bewusst
**nicht** an `package.json` gekoppelt: Die Website wird bei jedem Push
veröffentlicht, die Erweiterung in einzelnen geprüften Ständen. Zwei
Lebensläufe, zwei Zahlen.

Vor jeder Einreichung die Fassung erhöhen. Der Store nimmt dieselbe Nummer kein
zweites Mal an.

| Fassung | Datum | SHA-256 des Archivs | Bemerkung |
|---|---|---|---|
| 1.0.0 | gebaut 2026-08-11, Einreichung offen | `6708a53a344d5f10ef7500956407aba07783b075cfaa67d216949bf5927bf52d` | Erstveröffentlichung |

---

## 9. Was hochgeladen wird: ZIP, nicht CRX

Das Formular „Neues Element hinzufügen" nimmt eine **ZIP**-Datei mit der
`manifest.json` in der Wurzel. Genau das schreibt `npm run pack:ext`.

**Keine CRX hochladen.** Eine `.crx` ist das signierte Paket, das Chrome zum
Installieren verwendet; der Store erzeugt sie selbst und signiert sie mit einem
Schlüssel, den er verwaltet. Die Funktion „Erweiterung packen" unter
`chrome://extensions` erzeugt zwar eine `.crx` samt `.pem`, aber die ist für die
Verteilung außerhalb des Stores gedacht. Im Upload-Feld wird sie abgelehnt.

Folgerung für den Schlüssel: Es gibt keinen, um den man sich kümmern müsste. Die
Kennung der Erweiterung vergibt der Store beim ersten Hochladen und behält sie
über alle weiteren Fassungen bei. Ein `"key"`-Feld gehört deshalb **nicht** ins
Manifest.
