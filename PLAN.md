# Stand und nächste Schritte

Stand: **2026-08-03**. Das Werkzeug ist veröffentlicht, vollständig benutzbar und
läuft unter <https://reents3d.github.io/stl-viewer/>.

Diese Datei ist der Arbeitsstand, nicht die Doku — was das Werkzeug kann, steht im
[README](README.md), warum es so gebaut ist, in [DECISIONS.md](DECISIONS.md).

---

## Fertig und im Einsatz

- STL öffnen per Ziehen und Ablegen, binär und ASCII, Auswertung im Web Worker
- Kennwerte, topologischer Befund, Gewichtsspanne, Bauraumprüfung
- Viewer: vier Darstellungsmodi, Schnittebene, Messen, sieben Normalansichten
- Anmerkungen mit Markierungspin, Kategorie und gespeichertem Blickwinkel
- PDF-Dokumentation mit Übersicht, Normalansichten, Rundumansichten je Achse und
  einer Seite je Anmerkung
- Kein Upload, per `connect-src 'none'` erzwungen; CI prüft das am Artefakt
- 67 Tests, CI und Pages-Auslieferung grün

## In Arbeit

**Überhang-Ansicht** — die Rechnung liegt fertig und geprüft in
[`src/lib/overhang.ts`](src/lib/overhang.ts) (11 Tests), ist aber **noch nicht
verdrahtet**. Es fehlt:

1. Darstellungsmodus `overhang` in `RenderMode` (src/viewer/types.ts)
2. In `ModelScene`: Farbattribut aus `computeOverhang` an die Geometrie hängen,
   `material.vertexColors = true`, `material.color` auf Weiß. Grund- und Warnfarbe
   müssen vorher mit `THREE.Color` in den linearen Arbeitsfarbraum umgerechnet
   werden — die Funktion erwartet lineares RGB, kein Bildschirm-Hex.
3. Schwellwinkel als Regler in `DisplayPanel` (Voreinstellung 45°)
4. Stützflächenanteil als Kennzahl in `InspectPanel` und im PDF
5. Beim Wechsel zurück: `vertexColors` wieder aus, sonst bleibt das Modell bunt

Achtung bei großen Modellen: Jede Änderung des Schwellwinkels rechnet einmal über
alle Dreiecke. Bei zwei Millionen sind das spürbare Millisekunden — der Regler
sollte erst beim Loslassen rechnen, nicht bei jedem Schritt.

## Beschlossen, noch nicht gebaut

Reihenfolge nach Nutzen im Ablauf „konstruieren → Kunde sieht zu → markiert →
PDF zurück in die Konstruktion".

### 1. Größenvergleich

Referenzobjekte neben dem Modell: Person 1.750 mm, Europalette 1.200 × 800 × 144,
DIN A4, Kaffeetasse. **Der wichtigste der fünf Punkte:** Am Bildschirm sieht ein
60-mm-Würfel genauso groß aus wie ein 2,4-m-Exponat. Bei einem Dienstleister,
dessen Alleinstellung Großformat ist, ist das die teuerste Fehlvorstellung im
ganzen Ablauf — sie fällt erst auf, wenn das Teil in der Halle steht.

Zu beachten: Die Kameraeinpassung muss die Referenz einschließen, sonst steht die
Person außerhalb des Bildes. Und das Deckblatt des PDF sollte sie mitnehmen.

### 2. Wandstärke per Klick

Punkt anklicken, Strahl entlang der Flächennormalen nach innen, Abstand bis zur
Rückwand. Beantwortet die häufigste Rückfrage vor dem Druck an genau der Stelle,
auf die der Kunde ohnehin zeigt.

Zwei Fallen: Der Raycaster überspringt Rückseiten, solange das Material auf
`FrontSide` steht — für die Messung vorübergehend auf `DoubleSide` schalten. Und
die Methode misst entlang der Normalen; bei keilförmigen Wänden ist das nicht die
kleinste Dicke. Das gehört in die Oberfläche, nicht nur in den Quelltext.

### 3. Versionsvergleich zweier STL

Zweite Datei laden, alte Fassung durchscheinend darüber, Kennwertdifferenz
ausweisen. Für die Runde **nach** der Änderung. Ausrichtung über den gemeinsamen
CAD-Ursprung, nicht über die Hüllkörpermitte — bei Revisionen derselben
Konstruktion ist der Ursprung gleich, die Hüllkörpermitte nicht.

### 4. STEP-Import

Siehe [ADR-013](DECISIONS.md). Beschlossen einschließlich der Lockerung der
Richtlinie auf `connect-src 'self'` und `'wasm-unsafe-eval'`. Umfang:

- `occt-import-js` als Abhängigkeit, WASM **nur bei einer STEP-Datei** nachladen
- Richtlinie in `vite.config.ts` ändern **und** `scripts/check-artifact.mjs`
  mitziehen — sonst schlägt die eigene Prüfung fehl
- README und Startseite umformulieren: aus „kann nichts senden" wird „darf nur mit
  der eigenen Herkunft reden, und die nimmt nichts entgegen"
- In der Oberfläche ausweisen, dass Volumen und Befund sich auf die
  **Tessellierung** beziehen, nicht auf die exakten Flächen
- Einheitenwahl entfällt bei STEP — die Einheit steht in der Datei
- LGPL-Hinweise und Lizenztext mitliefern

## Offen aus dem Gespräch

- Bei der Auswahl der nächsten Funktionen wurde zusätzlich „Something else"
  angehakt, ohne Text. **Nachfragen, was gemeint war.**
- Der Name **„Großformat"** für die Anlage 800 × 800 × 1.000 mm ist gesetzt, aber
  nicht bestätigt — steht in [`src/config/site.ts`](src/config/site.ts).

## Handprüfung vor jeder Veröffentlichung

1. Große Datei (> 50 MB) laden — Fortschritt läuft, Oberfläche bleibt bedienbar
2. ASCII-STL laden — gleiche Kennwerte wie die binäre Fassung
3. Datei mit Loch laden — Befund meldet offene Kanten
4. Anmerkung setzen, Modell drehen, Marke bleibt an der richtigen Stelle
5. PDF mit drei Achsen erzeugen — Bilderzahl stimmt mit der Ankündigung überein,
   und auf jeder Anmerkungsseite ist der Pin im Bild zu sehen
6. **Netzwerk-Reiter offen lassen: beim Laden der STL darf keine Anfrage auftauchen**

### Hinweis zur Prüfung im Browser

Bildpunkte lassen sich nicht direkt aus der Zeichenfläche lesen — ohne
`preserveDrawingBuffer` liefert `readPixels` nach dem Compositing Müll. Zuverlässig
ist der Umweg über den Export: `HTMLAnchorElement.prototype.click` und
`URL.createObjectURL` abfangen, den PNG- oder PDF-Export auslösen und die Daten
vergleichen. Zwei echte Fehler sind so gefunden worden — fehlende Pins im PDF und
eine verkantete Kamera-Wiederherstellung.
