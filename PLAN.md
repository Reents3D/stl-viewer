# Stand und nächste Schritte

Stand: **2026-08-04**. Das Werkzeug ist veröffentlicht, vollständig benutzbar und
läuft unter <https://reents3d.github.io/stl-viewer/>.

Diese Datei ist der Arbeitsstand, nicht die Doku — was das Werkzeug kann, steht im
[README](README.md), warum es so gebaut ist, in [DECISIONS.md](DECISIONS.md).

---

## Fertig und im Einsatz

- Datei öffnen per Ziehen und Ablegen — STL (binär und ASCII), STEP und IGES;
  Auswertung im Web Worker
- Kennwerte, topologischer Befund, Gewichtsspanne, Bauraumprüfung
- Viewer: vier Darstellungsmodi, Schnittebene, Messen, sieben Normalansichten
- Anmerkungen mit Markierungspin, Kategorie und gespeichertem Blickwinkel
- PDF-Dokumentation mit Übersicht, Normalansichten, Rundumansichten je Achse und
  einer Seite je Anmerkung
- Kein Upload, per `connect-src 'self'` erzwungen; CI prüft das am Artefakt und
  schlägt auch an, wenn jemand die Richtlinie weiter öffnet als beschlossen
- **Überhang-Ansicht** mit einstellbarer Schwelle und Stützflächenanteil. Die
  Standfläche zählt nicht mit. Am Prüfkörper nachgerechnet: Tisch aus
  20×20×40-Bein und 60×60×10-Platte → 3.600 von 13.600 mm² = 26,5 %.
- **Größenvergleich**: Person 1,75 m, Europalette (EN 13698-1), DIN A4 (ISO 216),
  Kaffeetasse. Die Kamera passt auf Modell **und** Referenz ein; im PDF erscheint
  sie nur auf dem Deckblatt, nicht in den technischen Ansichten.
- **Wandstärke per Klick** — Strahl senkrecht durch die Wand, Wert am Modell und
  in der Liste, unter 1,5 mm rot. Sieben Tests in `tests/lib/thickness.test.ts`.
- **Versionsvergleich**: zweite Datei durchscheinend darüber, Volumen- und
  Maßdifferenz mit Vorzeichen. Ausrichtung über den gemeinsamen CAD-Nullpunkt.
- **STEP- und IGES-Import** (.step/.stp/.iges/.igs) über OpenCascade als
  WebAssembly, nur bei Bedarf nachgeladen. Einheit kommt aus der Datei,
  Tessellierungsgüte einstellbar, Baugruppen werden zusammengelegt und als solche
  ausgewiesen. Bei IGES weist die Oberfläche zusätzlich darauf hin, dass lose
  Flächen formatbedingt sind und nicht auf einen Konstruktionsfehler deuten.
- 91 Tests, CI und Pages-Auslieferung grün

## Offen

Keine der beschlossenen Funktionen mehr. Naheliegende nächste Schritte, falls
weitergebaut wird:

- **Baugruppen getrennt zeigen** statt zusammengelegt — braucht eine Bauteilliste
  mit Sichtbarkeitsschaltern und ist damit ein eigenes Vorhaben.
- **Wandstärke flächig** statt punktweise (Farbkarte über das ganze Modell). Braucht
  eine Beschleunigungsstruktur für die Strahlen; der punktweise Weg ist dafür schon
  in `src/lib/thickness.ts` gekapselt.

## Offen aus dem Gespräch

- Bei der Auswahl der nächsten Funktionen wurde zusätzlich „Something else"
  angehakt, ohne dass ein Text ankam. Der Wunsch dahinter ist weiterhin unbekannt.
- Bauräume am 2026-08-04 von Riko bestätigt: XXL 1.800 × 2.400 × 1.800,
  XXL Hoch 1.200 × 1.200 × **2.200**, Großformat 800 × 800 × 1.000.
  **Die 2.200 sind Absicht:** Der Hersteller gibt 2.000 an, gefahren werden 2.200.
  Der Grund steht als Kommentar in [`src/config/site.ts`](src/config/site.ts),
  damit niemand anhand des Datenblatts "berichtigt". Der FDM-Materialberater
  stimmt damit ebenfalls — dort ist nichts zu tun.

## Handprüfung vor jeder Veröffentlichung

1. Große Datei (> 50 MB) laden — Fortschritt läuft, Oberfläche bleibt bedienbar
2. ASCII-STL laden — gleiche Kennwerte wie die binäre Fassung
3. Datei mit Loch laden — Befund meldet offene Kanten
4. Anmerkung setzen, Modell drehen, Marke bleibt an der richtigen Stelle
5. PDF mit drei Achsen erzeugen — Bilderzahl stimmt mit der Ankündigung überein,
   und auf jeder Anmerkungsseite ist der Pin im Bild zu sehen
6. **Netzwerk-Reiter offen lassen:** Beim Laden einer STL darf genau ein Eintrag
   erscheinen — der eigene Auswertungsstrang, von derselben Herkunft. Bei einer
   STEP-Datei kommt einmalig die WebAssembly dazu, ebenfalls von derselben
   Herkunft. Nichts sonst.
7. STEP- und IGES-Datei mit bekannten Maßen laden — Einheit muss aus der Datei kommen, und
   die Seitenleiste muss den Tessellierungshinweis zeigen

### Hinweis zur Prüfung im Browser

Bildpunkte lassen sich nicht direkt aus der Zeichenfläche lesen — ohne
`preserveDrawingBuffer` liefert `readPixels` nach dem Compositing Müll. Zuverlässig
ist der Umweg über den Export: `HTMLAnchorElement.prototype.click` und
`URL.createObjectURL` abfangen, den PNG- oder PDF-Export auslösen und die Daten
vergleichen. Zwei echte Fehler sind so gefunden worden — fehlende Pins im PDF und
eine verkantete Kamera-Wiederherstellung.
