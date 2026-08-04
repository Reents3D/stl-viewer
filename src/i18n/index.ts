/**
 * Zweisprachigkeit, flach und ohne Bibliothek.
 *
 * Ein Woerterbuch aus Paaren reicht fuer ein Werkzeug dieser Groesse. Wichtiger als
 * die Technik ist die Regel: Es gibt KEINEN Text im Quelltext der Ansichten. Sobald
 * eine Zeichenkette dort steht, existiert sie nur auf Deutsch — und faellt erst
 * jemandem auf, der die Oberflaeche auf Englisch umstellt.
 */

export const LANGS = ["de", "en"] as const;
export type Lang = (typeof LANGS)[number];

type Entry = { de: string; en: string };

const S = {
  "app.name": { de: "STL-Betrachter", en: "STL Viewer" },
  "app.tagline": {
    de: "Modell prüfen, kommentieren, dokumentieren",
    en: "Inspect, annotate and document your model",
  },
  "cta.request": { de: "Projekt anfragen", en: "Request a project" },
  "cta.advisor": { de: "Materialberater", en: "Material advisor" },

  /* ------------------------------------------------------------- Datei oeffnen */
  "drop.title": { de: "STL-Datei hierher ziehen", en: "Drop an STL file here" },
  "drop.sub": {
    de: "Oder Datei auswählen. Binäres und ASCII-STL, beliebige Größe.",
    en: "Or choose a file. Binary and ASCII STL, any size.",
  },
  "drop.button": { de: "Datei auswählen", en: "Choose file" },
  "drop.release": { de: "Loslassen zum Öffnen", en: "Release to open" },
  "drop.privacy": {
    de: "Die Datei bleibt auf Ihrem Rechner. Es gibt keinen Upload.",
    en: "The file stays on your computer. There is no upload.",
  },
  "drop.units": { de: "Einheit der Datei", en: "File unit" },
  "drop.unitMm": { de: "Millimeter", en: "Millimetres" },
  "drop.unitInch": { de: "Zoll (× 25,4)", en: "Inches (× 25.4)" },
  "drop.unitCm": { de: "Zentimeter (× 10)", en: "Centimetres (× 10)" },
  "drop.unitHint": {
    de: "STL speichert keine Einheit. Millimeter ist die übliche Annahme.",
    en: "STL stores no unit. Millimetres is the usual assumption.",
  },

  /* -------------------------------------------------------------------- Laden */
  "load.read": { de: "Datei wird gelesen", en: "Reading file" },
  "load.parse": { de: "Dreiecke werden gelesen", en: "Reading triangles" },
  "load.analyse": { de: "Modell wird vermessen", en: "Measuring model" },
  "load.cancel": { de: "Abbrechen", en: "Cancel" },

  /* ------------------------------------------------------------------ Fehler */
  "error.title": { de: "Die Datei ließ sich nicht öffnen", en: "The file could not be opened" },
  "error.empty": { de: "Die Datei ist leer.", en: "The file is empty." },
  "error.too-small": {
    de: "Die Datei ist zu klein für ein STL.",
    en: "The file is too small to be an STL.",
  },
  "error.not-stl": {
    de: "Der Inhalt sieht nicht nach einem STL aus.",
    en: "The content does not look like an STL.",
  },
  "error.no-triangles": { de: "Die Datei enthält keine Dreiecke.", en: "The file contains no triangles." },
  "error.truncated": { de: "Die Datei ist unvollständig.", en: "The file is incomplete." },
  "error.out-of-memory": {
    de: "Das Modell ist für den verfügbaren Arbeitsspeicher zu groß.",
    en: "The model is too large for the available memory.",
  },
  "error.wrongType": {
    de: "Das ist keine STL-Datei. Erwartet wird eine Datei mit der Endung .stl.",
    en: "That is not an STL file. A file ending in .stl is expected.",
  },
  "error.retry": { de: "Andere Datei wählen", en: "Choose another file" },

  /* ----------------------------------------------------------------- Kennwerte */
  "stats.title": { de: "Kennwerte", en: "Measurements" },
  "stats.dimensions": { de: "Abmessungen", en: "Dimensions" },
  "stats.volume": { de: "Volumen", en: "Volume" },
  "stats.area": { de: "Oberfläche", en: "Surface area" },
  "stats.triangles": { de: "Dreiecke", en: "Triangles" },
  "stats.vertices": { de: "Eckpunkte", en: "Vertices" },
  "stats.centroid": { de: "Schwerpunkt", en: "Centre of mass" },
  "stats.format": { de: "Format", en: "Format" },
  "stats.fileSize": { de: "Dateigröße", en: "File size" },
  "stats.modelName": { de: "Modellname", en: "Model name" },
  "stats.longestEdge": { de: "Längste Kante", en: "Longest edge" },

  /* -------------------------------------------------------------------- Befund */
  "check.title": { de: "Befund", en: "Findings" },
  "check.watertight": { de: "Geschlossenes Netz", en: "Closed mesh" },
  "check.watertightYes": {
    de: "Das Netz ist geschlossen. Volumen und Gewicht sind belastbar.",
    en: "The mesh is closed. Volume and weight are meaningful.",
  },
  "check.watertightNo": {
    de: "Das Netz hat Löcher. Volumen und Gewicht sind nur Näherungen.",
    en: "The mesh has holes. Volume and weight are approximations only.",
  },
  "check.boundaryEdges": { de: "Offene Kanten", en: "Open edges" },
  "check.nonManifold": { de: "Mehrfachkanten", en: "Non-manifold edges" },
  "check.nonManifoldHint": {
    de: "An diesen Kanten treffen mehr als zwei Flächen zusammen. Slicer entscheiden dort uneinheitlich, was innen und außen ist.",
    en: "More than two faces meet at these edges. Slicers disagree on what is inside and outside there.",
  },
  "check.flipped": { de: "Verdrehte Flächen", en: "Flipped faces" },
  "check.flippedHint": {
    de: "Einzelne Dreiecke sind verkehrt herum gewickelt. Das Modell kann geschlossen sein und trotzdem falsch gefüllt werden.",
    en: "Individual triangles are wound the wrong way. The model can be closed and still be filled incorrectly.",
  },
  "check.degenerate": { de: "Flächenlose Dreiecke", en: "Zero-area triangles" },
  "check.inverted": {
    de: "Das gesamte Netz zeigt nach innen. Viele Slicer drucken dann den Negativraum.",
    en: "The entire mesh points inwards. Many slicers will then print the negative space.",
  },
  "check.trailing": {
    de: "Hinter dem letzten Dreieck stehen {n} Bytes, die nicht zum Format gehören. Das Modell ist trotzdem vollständig.",
    en: "There are {n} bytes after the last triangle that are not part of the format. The model is complete regardless.",
  },
  "check.skipped": {
    de: "Für die Prüfung auf Löcher ist das Modell zu groß. Abmessungen, Volumen und Oberfläche stimmen trotzdem.",
    en: "The model is too large for the hole check. Dimensions, volume and surface area are still correct.",
  },
  "check.allGood": { de: "Keine Auffälligkeiten.", en: "Nothing unusual found." },

  /* ------------------------------------------------------------------ Gewicht */
  "mass.title": { de: "Gewichtsschätzung", en: "Weight estimate" },
  "mass.material": { de: "Werkstoff", en: "Material" },
  "mass.infill": { de: "Füllgrad", en: "Infill" },
  "mass.between": { de: "{low} bis {high}", en: "{low} to {high}" },
  "mass.lowLabel": { de: "bei {p} % Füllung", en: "at {p} % infill" },
  "mass.highLabel": { de: "massiv", en: "solid" },
  "mass.note": {
    de: "Lineare Näherung ohne Wandstärken und ohne Stützmaterial. Für die Größenordnung, nicht für die Kalkulation.",
    en: "Linear approximation without wall thickness or support material. For orders of magnitude, not for costing.",
  },
  "mass.filigree": {
    de: "Viel Oberfläche im Verhältnis zum Volumen (Faktor {f} gegenüber einer Kugel gleichen Volumens). Bei dünnen Wänden, Rippen, Streben oder Gittern besteht das Bauteil überwiegend aus Rand — den druckt der Slicer voll aus, unabhängig vom Füllgrad. Die untere Grenze liegt dann zu niedrig.",
    en: "Large surface area relative to volume (factor {f} compared with a sphere of equal volume). With thin walls, ribs, struts or lattices the part consists mostly of perimeter — which the slicer prints solid regardless of infill. The lower bound is then too low.",
  },
  "mass.densitySource": {
    de: "Dichte aus dem FDM-Materialberater",
    en: "Density from the FDM material advisor",
  },
  "confidence.high": { de: "belegt (mehrere Quellen)", en: "substantiated (multiple sources)" },
  "confidence.medium": { de: "belegt (eine Quelle)", en: "substantiated (one source)" },
  "confidence.low": { de: "Quelle zweifelhaft", en: "source questionable" },
  "confidence.estimated": { de: "geschätzt, keine Quelle", en: "estimated, no source" },

  /* ------------------------------------------------------------------ Bauraum */
  "build.title": { de: "Bauraum", en: "Build volume" },
  "build.machine": { de: "Anlage", en: "Machine" },
  "build.fits": { de: "Passt in den Bauraum.", en: "Fits in the build volume." },
  "build.fitsRotated": {
    de: "Passt — aber nur gedreht. In der Lage der Datei ist es zu groß.",
    en: "Fits — but only rotated. In the file's orientation it is too large.",
  },
  "build.tooBig": {
    de: "Zu groß für diese Anlage. Auf {p} % verkleinert würde es passen, sonst muss geteilt werden.",
    en: "Too large for this machine. Scaled to {p} % it would fit, otherwise it must be split.",
  },
  "build.show": { de: "Bauraum einblenden", en: "Show build volume" },
  "build.cta": {
    de: "Diese Größen fertigt Reents3D",
    en: "Reents3D manufactures at these sizes",
  },
  "build.ctaHint": {
    de: "Über 50 Maschinen, Bauraum bis 1.800 × 2.400 × 1.800 mm, Veredelung inhouse.",
    en: "Over 50 machines, build volume up to 1,800 × 2,400 × 1,800 mm, finishing in-house.",
  },

  /* ----------------------------------------------------------------- Werkzeuge */
  "tool.title": { de: "Werkzeug", en: "Tool" },
  "tool.orbit": { de: "Drehen", en: "Orbit" },
  "tool.annotate": { de: "Anmerkung setzen", en: "Add annotation" },
  "tool.measure": { de: "Messen", en: "Measure" },
  "tool.thickness": { de: "Wandstärke", en: "Wall thickness" },
  "tool.orbitHint": { de: "Ziehen dreht, Rad zoomt, rechte Taste verschiebt", en: "Drag to orbit, wheel to zoom, right button to pan" },
  "tool.thicknessHint": {
    de: "Auf eine Fläche klicken — gemessen wird senkrecht hindurch bis zur Rückwand",
    en: "Click a face — measured straight through to the opposite wall",
  },

  /* -------------------------------------------------------------- Wandstaerke */
  "thickness.title": { de: "Wandstärken", en: "Wall thickness" },
  "thickness.empty": {
    de: "Auf eine Fläche des Modells klicken. Der Betrachter misst senkrecht durch die Wand bis zur Rückseite.",
    en: "Click a face of the model. The viewer measures straight through the wall to the far side.",
  },
  "thickness.at": { de: "Stelle {n}", en: "Spot {n}" },
  "thickness.clear": { de: "Alle löschen", en: "Clear all" },
  "thickness.note": {
    de: "Gemessen wird senkrecht zur angeklickten Fläche. Bei parallelen Wänden ist das die Wandstärke; bei keilförmigen Wänden ist es der Abstand in dieser Richtung, nicht die kleinste Dicke.",
    en: "Measured perpendicular to the clicked face. With parallel walls that is the wall thickness; with tapered walls it is the distance in that direction, not the smallest thickness.",
  },
  "thickness.miss": {
    de: "Kein Gegenstück gefunden — an dieser Stelle geht der Strahl aus dem Bauteil heraus, ohne wieder auf eine Fläche zu treffen. Das passiert an offenen Kanten und bei nach innen gedrehten Netzen.",
    en: "No opposite face found — at this spot the ray leaves the part without hitting another face. This happens at open edges and with inverted meshes.",
  },
  "thickness.thin": {
    de: "Unter 1,5 mm wird es im FDM-Druck heikel: Das ist weniger als zwei Wandbahnen einer 0,8-mm-Düse.",
    en: "Below 1.5 mm FDM printing gets tricky: that is less than two perimeters of a 0.8 mm nozzle.",
  },
  "tool.annotateHint": { de: "Auf das Modell klicken, um eine Anmerkung zu setzen", en: "Click the model to place an annotation" },
  "tool.measureHint": { de: "Zwei Punkte auf dem Modell anklicken", en: "Click two points on the model" },

  "view.iso": { de: "Isometrisch", en: "Isometric" },
  "view.front": { de: "Vorn", en: "Front" },
  "view.back": { de: "Hinten", en: "Back" },
  "view.left": { de: "Links", en: "Left" },
  "view.right": { de: "Rechts", en: "Right" },
  "view.top": { de: "Oben", en: "Top" },
  "view.bottom": { de: "Unten", en: "Bottom" },
  "view.fit": { de: "Einpassen", en: "Fit to view" },
  "view.title": { de: "Ansicht", en: "View" },

  "render.title": { de: "Darstellung", en: "Display" },
  "render.solid": { de: "Massiv", en: "Solid" },
  "render.edges": { de: "Mit Kanten", en: "With edges" },
  "render.wireframe": { de: "Drahtgitter", en: "Wireframe" },
  "render.xray": { de: "Durchsichtig", en: "X-ray" },
  "render.edgesDisabled": {
    de: "Kantenanzeige ab 300.000 Dreiecken nicht verfügbar — die Linien lägen dichter als ein Bildpunkt.",
    en: "Edge display unavailable above 300,000 triangles — the lines would be denser than a pixel.",
  },
  "render.orthographic": { de: "Orthografisch", en: "Orthographic" },
  "render.orthographicHint": {
    de: "Ohne Perspektive — parallele Kanten bleiben parallel, wie in einer technischen Zeichnung.",
    en: "No perspective — parallel edges stay parallel, as in a technical drawing.",
  },
  "render.grid": { de: "Raster", en: "Grid" },
  "render.axes": { de: "Achsen", en: "Axes" },
  "render.color": { de: "Farbe", en: "Colour" },
  "render.background": { de: "Hintergrund", en: "Background" },
  "bg.hell": { de: "Hell", en: "Light" },
  "bg.dunkel": { de: "Dunkel", en: "Dark" },
  "bg.verlauf": { de: "Verlauf", en: "Gradient" },

  /* -------------------------------------------------------- Versionsvergleich */
  "compare.title": { de: "Versionsvergleich", en: "Version comparison" },
  "compare.load": { de: "Zweite Fassung laden", en: "Load second version" },
  "compare.hint": {
    de: "Legt eine zweite STL durchscheinend über das Modell — für die Runde nach der Änderung.",
    en: "Overlays a second STL on the model, semi-transparent — for the round after the change.",
  },
  "compare.aligned": {
    de: "Ausgerichtet über den gemeinsamen CAD-Nullpunkt, nicht über die Mitte. Stammen beide Dateien aus derselben Konstruktion, liegen sie damit richtig übereinander.",
    en: "Aligned by the shared CAD origin, not by the centre. If both files come from the same design, they line up correctly.",
  },
  "compare.show": { de: "Einblenden", en: "Show" },
  "compare.remove": { de: "Entfernen", en: "Remove" },
  "compare.loaded": { de: "Geladen", en: "Loaded" },
  "compare.deltaVolume": { de: "Volumen", en: "Volume" },
  "compare.deltaSize": { de: "Abmessungen", en: "Dimensions" },
  "compare.unchanged": { de: "unverändert", en: "unchanged" },
  "compare.originWarning": {
    de: "Die beiden Nullpunkte liegen weit auseinander. Vermutlich wurde eine der Dateien im CAD verschoben exportiert — dann ist der Vergleich nicht aussagekräftig.",
    en: "The two origins are far apart. One of the files was probably exported from a moved position — the comparison is then not meaningful.",
  },

  /* --------------------------------------------------------- Groessenvergleich */
  "scale.title": { de: "Größenvergleich", en: "Size reference" },
  "scale.label": { de: "Referenzobjekt", en: "Reference object" },
  "scale.hint": {
    de: "Stellt einen bekannten Gegenstand neben das Modell. Am Bildschirm sieht ein 60-mm-Teil genauso groß aus wie ein 2,4-m-Exponat — daneben nicht mehr.",
    en: "Places a familiar object next to the model. On screen a 60 mm part looks the same size as a 2.4 m exhibit — next to a reference it no longer does.",
  },
  "scale.size": { de: "Maße", en: "Dimensions" },
  "scale.inCover": {
    de: "Erscheint auch auf dem Deckblatt der PDF-Dokumentation.",
    en: "Also appears on the cover page of the PDF documentation.",
  },

  /* ---------------------------------------------------------------- Ueberhang */
  "overhang.title": { de: "Überhänge", en: "Overhangs" },
  "overhang.enable": { de: "Überhänge einfärben", en: "Highlight overhangs" },
  "overhang.hint": {
    de: "Färbt Flächen ein, die flacher als die Schwelle nach unten zeigen. Dort braucht der Druck Stützmaterial — und die Oberfläche wird dort rauer.",
    en: "Colours faces that point downward at a shallower angle than the threshold. The print needs support material there — and the surface comes out rougher.",
  },
  "overhang.threshold": { de: "Schwelle gegen die Waagerechte", en: "Angle from horizontal" },
  "overhang.share": { de: "Stützfläche", en: "Support area" },
  "overhang.result": {
    de: "{p} % der Oberfläche ({area})",
    en: "{p} % of the surface ({area})",
  },
  "overhang.none": {
    de: "Keine Fläche unterhalb der Schwelle. In dieser Lage kommt der Druck ohne Stützen aus.",
    en: "No face below the threshold. In this orientation the print needs no support.",
  },
  "overhang.plateNote": {
    de: "Die Standfläche zählt nicht mit — sie zeigt zwar nach unten, liegt aber auf der Bauplatte.",
    en: "The face resting on the plate does not count — it points downward but sits on the build plate.",
  },
  "overhang.limit": {
    de: "Betrachtet die Neigung jeder Fläche, nicht ob darunter Bauteil steht. Eine Fläche, die auf dem Modell selbst aufliegt, wird hier trotzdem markiert. Die Stützmenge rechnet nur ein Slicer.",
    en: "Considers the tilt of each face, not whether the part supports it from below. A face resting on the model itself is still marked. Only a slicer computes the amount of support.",
  },
  "overhang.orientationNote": {
    de: "Gilt für die Lage in der Datei. Gedreht gedruckt ändert sich das Ergebnis.",
    en: "Applies to the orientation in the file. Printed rotated, the result changes.",
  },

  "clip.title": { de: "Schnittebene", en: "Section plane" },
  "clip.enable": { de: "Schnitt anzeigen", en: "Show section" },
  "clip.axis": { de: "Achse", en: "Axis" },
  "clip.position": { de: "Position", en: "Position" },
  "clip.flip": { de: "Umkehren", en: "Flip" },
  "clip.hint": {
    de: "Schneidet das Modell auf, um Innenräume und Wandstärken zu zeigen.",
    en: "Cuts the model open to reveal cavities and wall thickness.",
  },

  /* --------------------------------------------------------------- Anmerkungen */
  "ann.title": { de: "Anmerkungen", en: "Annotations" },
  "ann.empty": {
    de: "Noch keine Anmerkungen. Werkzeug „Anmerkung setzen“ wählen und auf das Modell klicken.",
    en: "No annotations yet. Select the annotation tool and click the model.",
  },
  "ann.new": { de: "Neue Anmerkung", en: "New annotation" },
  "ann.titleField": { de: "Überschrift", en: "Title" },
  "ann.titlePlaceholder": { de: "z. B. Wandstärke prüfen", en: "e.g. check wall thickness" },
  "ann.textField": { de: "Beschreibung", en: "Description" },
  "ann.textPlaceholder": { de: "Was fällt hier auf?", en: "What is noteworthy here?" },
  "ann.category": { de: "Art", en: "Type" },
  "ann.delete": { de: "Löschen", en: "Delete" },
  "ann.goto": { de: "Ansicht wiederherstellen", en: "Restore view" },
  "ann.position": { de: "Position", en: "Position" },
  "ann.save": { de: "Anmerkungen sichern", en: "Save annotations" },
  "ann.load": { de: "Anmerkungen laden", en: "Load annotations" },
  "ann.saveHint": {
    de: "Speichert nur die Anmerkungen als kleine Datei — nicht das Modell. Beim nächsten Mal zusammen mit derselben STL wieder laden.",
    en: "Saves only the annotations as a small file — not the model. Load it again next time along with the same STL.",
  },
  "ann.loadMismatch": {
    de: "Diese Anmerkungen wurden zu „{name}“ erstellt, geöffnet ist „{current}“. Trotzdem übernehmen?",
    en: "These annotations were made for “{name}”, but “{current}” is open. Apply anyway?",
  },
  "ann.count": { de: "{n} Anmerkungen", en: "{n} annotations" },

  /* -------------------------------------------------------------------- Messen */
  "measure.title": { de: "Messungen", en: "Measurements" },
  "measure.empty": {
    de: "Zwei Punkte auf dem Modell anklicken, um den Abstand zu messen.",
    en: "Click two points on the model to measure the distance.",
  },
  "measure.pending": { de: "Zweiten Punkt wählen …", en: "Choose the second point …" },
  "measure.distance": { de: "Abstand", en: "Distance" },
  "measure.clear": { de: "Alle löschen", en: "Clear all" },
  "measure.note": {
    de: "Gemessen wird zwischen zwei Punkten auf der Oberfläche, nicht zwischen Konstruktionskanten.",
    en: "Measured between two points on the surface, not between design edges.",
  },

  /* -------------------------------------------------------------------- Export */
  "export.title": { de: "Export", en: "Export" },
  "export.png": { de: "Bild sichern (PNG)", en: "Save image (PNG)" },
  "export.pngHint": { de: "Aktuelle Ansicht als Bild", en: "Current view as an image" },
  "export.pdf": { de: "PDF-Dokumentation", en: "PDF documentation" },
  "export.pdfHint": {
    de: "Deckblatt, Kennwerte, Rundumansichten und alle Anmerkungen",
    en: "Cover page, measurements, all-round views and every annotation",
  },
  "export.build": { de: "PDF erzeugen", en: "Create PDF" },
  "export.options": { de: "Umfang", en: "Scope" },
  "export.turntable": { de: "Rundumansichten", en: "All-round views" },
  "export.perAxis": { de: "Bilder je Achse", en: "Images per axis" },
  "export.axisX": { de: "Um die X-Achse", en: "About the X axis" },
  "export.axisY": { de: "Um die Y-Achse", en: "About the Y axis" },
  "export.axisZ": { de: "Um die Z-Achse (Drehteller)", en: "About the Z axis (turntable)" },
  "export.axesHint": {
    de: "Je Achse eine volle Umdrehung in gleichen Schritten. Drei Achsen mit je 10 Bildern ergeben 30 Aufnahmen auf etwa 5 Seiten.",
    en: "One full revolution per axis in equal steps. Three axes with 10 images each yield 30 shots on about 5 pages.",
  },
  "export.standardViews": { de: "Sechs Normalansichten", en: "Six standard views" },
  "export.standardViewsHint": {
    de: "Vorn, hinten, links, rechts, oben, unten — orthografisch auf einer Seite.",
    en: "Front, back, left, right, top, bottom — orthographic on one page.",
  },
  "export.annotationPages": { de: "Anmerkungsseiten", en: "Annotation pages" },
  "export.annotationPagesHint": {
    de: "Je Anmerkung ein Bild aus dem gespeicherten Blickwinkel mit Text.",
    en: "One image per annotation from its stored viewpoint, with text.",
  },
  "export.quality": { de: "Bildgröße", en: "Image size" },
  "export.qualityLow": { de: "Klein (900 px)", en: "Small (900 px)" },
  "export.qualityMedium": { de: "Mittel (1400 px)", en: "Medium (1400 px)" },
  "export.qualityHigh": { de: "Groß (2000 px)", en: "Large (2000 px)" },
  "export.qualityHint": {
    de: "Größere Bilder ergeben ein schärferes, aber deutlich größeres PDF.",
    en: "Larger images produce a sharper but considerably bigger PDF.",
  },
  "export.running": { de: "Bild {i} von {n}", en: "Image {i} of {n}" },
  "export.assembling": { de: "PDF wird zusammengesetzt …", en: "Assembling PDF …" },
  "export.estimate": { de: "Etwa {n} Aufnahmen", en: "About {n} shots" },
  "export.cancel": { de: "Abbrechen", en: "Cancel" },
  "export.nothingSelected": {
    de: "Nichts ausgewählt — mindestens ein Abschnitt muss angehakt sein.",
    en: "Nothing selected — at least one section must be ticked.",
  },

  /* ---------------------------------------------------------------------- PDF */
  "pdf.docTitle": { de: "Modelldokumentation", en: "Model documentation" },
  "pdf.created": { de: "Erstellt am", en: "Created" },
  "pdf.file": { de: "Datei", en: "File" },
  "pdf.page": { de: "Seite {i} von {n}", en: "Page {i} of {n}" },
  "pdf.overview": { de: "Übersicht", en: "Overview" },
  "pdf.sectionStats": { de: "Kennwerte", en: "Measurements" },
  "pdf.sectionCheck": { de: "Befund", en: "Findings" },
  "pdf.sectionViews": { de: "Normalansichten", en: "Standard views" },
  "pdf.sectionTurntable": { de: "Rundumansichten um die {axis}-Achse", en: "All-round views about the {axis} axis" },
  "pdf.sectionAnnotations": { de: "Anmerkungen", en: "Annotations" },
  "pdf.noAnnotations": { de: "Keine Anmerkungen erfasst.", en: "No annotations recorded." },
  "pdf.annotationView": {
    de: "Blickwinkel beim Setzen der Markierung",
    en: "Viewpoint at the time of marking",
  },
  "pdf.annotationOverview": {
    de: "Übersicht: alle {n} markierten Stellen am Modell",
    en: "Overview: all {n} marked spots on the model",
  },
  "pdf.disclaimer": {
    de: "Alle Werte wurden aus der übergebenen STL-Datei berechnet. Sie beschreiben die Geometrie der Datei, nicht ein gefertigtes Bauteil, und ersetzen keine Bauteilqualifizierung. Gewichtsangaben sind Schätzungen ohne Wandstärken und Stützmaterial.",
    en: "All values were computed from the supplied STL file. They describe the geometry of the file, not a manufactured part, and do not replace part qualification. Weights are estimates without wall thickness or support material.",
  },
  "pdf.privacyNote": {
    de: "Erstellt im Browser. Die STL-Datei wurde nicht übertragen und nicht gespeichert.",
    en: "Created in the browser. The STL file was neither transmitted nor stored.",
  },

  /* ---------------------------------------------------------------- Datenschutz */
  "privacy.badge": {
    de: "Kein Upload, Bearbeitung lokal in Ihrem Browser",
    en: "No upload, processed locally in your browser",
  },
  /** Kurzform fuer schmale Kopfzeilen — dieselbe Aussage, ohne die Zeile zu sprengen. */
  "privacy.badgeShort": { de: "Kein Upload", en: "No upload" },
  "privacy.title": { de: "Ihre Datei bleibt bei Ihnen", en: "Your file stays with you" },
  "privacy.p1": {
    de: "Dieses Werkzeug lädt nichts hoch. Die STL-Datei wird im Arbeitsspeicher Ihres Browsers gelesen und dort angezeigt — beim Schließen des Reiters ist sie weg.",
    en: "This tool uploads nothing. The STL file is read into your browser's memory and displayed there — when you close the tab, it is gone.",
  },
  "privacy.p2": {
    de: "Das ist keine Zusage, der Sie glauben müssen: Die Seite verbietet sich selbst per Inhaltssicherheitsrichtlinie jede Netzwerkverbindung (connect-src 'none'). Der Browser lässt eine Übertragung technisch nicht zu, auch nicht versehentlich. Prüfbar im Netzwerk-Reiter der Entwicklerwerkzeuge.",
    en: "This is not a promise you have to take on trust: the page forbids itself any network connection via its content security policy (connect-src 'none'). The browser will not permit a transfer, not even accidentally. Verifiable in the network tab of your developer tools.",
  },
  "privacy.p3": {
    de: "Es gibt keine Cookies, keine Zählpixel und keine externen Ressourcen. Schriften, Programmcode und Bildmarke liegen auf demselben Server wie die Seite.",
    en: "There are no cookies, no tracking pixels and no external resources. Fonts, code and logo are served from the same server as the page.",
  },
  "privacy.open": { de: "Wie wird das sichergestellt?", en: "How is this ensured?" },

  /* ------------------------------------------------------------------- Fusszeile */
  "footer.production": { de: "Fertigung", en: "Production" },
  "footer.about": { de: "Zu diesem Werkzeug", en: "About this tool" },
  "footer.aboutText": {
    de: "Kostenlos und quelloffen. Berechnete Werte beschreiben die Datei, nicht ein gefertigtes Bauteil.",
    en: "Free and open source. Computed values describe the file, not a manufactured part.",
  },
  "footer.legal": {
    de: "Code MIT-lizenziert. Kein Tracking, keine Cookies, keine externen Ressourcen.",
    en: "Code under MIT licence. No tracking, no cookies, no external resources.",
  },
  "footer.imprint": { de: "Impressum", en: "Imprint" },
  "footer.privacy": { de: "Datenschutz", en: "Privacy" },

  /* ------------------------------------------------------------------ Allgemein */
  "ui.close": { de: "Schließen", en: "Close" },
  "ui.cancel": { de: "Abbrechen", en: "Cancel" },
  "ui.confirm": { de: "Übernehmen", en: "Apply" },
  "ui.yes": { de: "Ja", en: "Yes" },
  "ui.no": { de: "Nein", en: "No" },
  "ui.newFile": { de: "Andere Datei", en: "Another file" },
  "ui.home": { de: "Zurück zum Anfang — neue Datei öffnen", en: "Back to the start — open another file" },
  "ui.discardConfirm": {
    de: "{n} Anmerkungen gehen verloren, wenn Sie das Modell schließen. Sie lassen sich unter „Anmerkungen“ vorher sichern. Trotzdem fortfahren?",
    en: "{n} annotations will be lost if you close the model. You can save them first under “Annotations”. Continue anyway?",
  },
  "ui.shortcuts": { de: "Tastenkürzel", en: "Keyboard shortcuts" },
  "ui.of": { de: "von", en: "of" },
} satisfies Record<string, Entry>;

export type TKey = keyof typeof S;

/**
 * Uebersetzer mit Platzhaltern in geschweiften Klammern.
 * Ein fehlender Schluessel gibt den Schluessel zurueck statt leer zu bleiben —
 * eine leere Beschriftung faellt in der Oberflaeche nicht auf, "ann.title" schon.
 */
export function makeT(lang: Lang) {
  return (key: TKey, params?: Record<string, string | number>): string => {
    const entry = S[key] as Entry | undefined;
    let text = entry ? entry[lang] : String(key);
    if (params) {
      for (const [name, value] of Object.entries(params)) {
        text = text.replaceAll(`{${name}}`, String(value));
      }
    }
    return text;
  };
}

export type T = ReturnType<typeof makeT>;

/** Startsprache aus dem Browser, mit Deutsch als Rueckfall. */
export function detectLang(): Lang {
  if (typeof navigator === "undefined") return "de";
  return navigator.language.toLowerCase().startsWith("de") ? "de" : "en";
}
