# Stand und nächste Schritte

Stand: **2026-08-04**. Das Werkzeug ist veröffentlicht, vollständig benutzbar und
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
- **Überhang-Ansicht** mit einstellbarer Schwelle und Stützflächenanteil. Die
  Standfläche zählt nicht mit. Am Prüfkörper nachgerechnet: Tisch aus
  20×20×40-Bein und 60×60×10-Platte → 3.600 von 13.600 mm² = 26,5 %.
- **Größenvergleich**: Person 1,75 m, Europalette (EN 13698-1), DIN A4 (ISO 216),
  Kaffeetasse. Die Kamera passt auf Modell **und** Referenz ein; im PDF erscheint
  sie nur auf dem Deckblatt, nicht in den technischen Ansichten.
- **Wandstärke per Klick** — Strahl senkrecht durch die Wand, Wert am Modell und
  in der Liste, unter 1,5 mm rot. Sieben Tests in `tests/lib/thickness.test.ts`.
- **Versionsvergleich**: zweite STL durchscheinend darüber, Volumen- und
  Maßdifferenz mit Vorzeichen. Ausrichtung über den gemeinsamen CAD-Nullpunkt.
- 74 Tests, CI und Pages-Auslieferung grün

## Offen

### STEP-Import

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
