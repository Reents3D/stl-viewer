# Haftungsausschluss

## Was die Werte beschreiben

Alle angezeigten und exportierten Werte werden aus der geöffneten Datei berechnet — STL,
STEP oder IGES. Sie beschreiben die **Geometrie dieser Datei** — nicht ein gefertigtes
Bauteil.

Zwischen beiden liegen Schwindung, Bauraumtoleranz, Orientierung, Schichtstärke,
Nachbearbeitung und Werkstoffverhalten. Keine dieser Größen steht in einer dieser Dateien.

## STEP und IGES: gerechnet wird die Tessellierung

STL enthält bereits Dreiecke. STEP und IGES beschreiben Flächen dagegen **exakt** — als
Zylinder, Kegel, Freiformfläche. Zum Anzeigen und Rechnen wird daraus im Browser ein
Dreiecksnetz erzeugt (Tessellierung, einstellbar grob/mittel/fein).

Alle Kennwerte beziehen sich damit auf dieses Netz, nicht auf die exakte Fläche. Ein
Zylinder wird zum Vieleck: **Volumen und Oberfläche liegen geringfügig unter den exakten
Werten**, mit gröberer Einstellung stärker. Für Maße und Bauraumprüfung ist das
bedeutungslos, für eine Volumen- oder Gewichtsangabe an der dritten Stelle nicht.

IGES speichert häufig einzelne Flächen statt eines geschlossenen Körpers. Der Befund
meldet dann „Netz hat Löcher" — das ist eine Eigenschaft des Formats und kein Fehler der
Konstruktion. Volumen und Gewicht sind in diesem Fall trotzdem nicht belastbar.

Eine Baugruppe aus mehreren Körpern wird zu einem Modell zusammengelegt. Volumen und
Gewicht sind dann die **Summe aller Teile**; die Zahl der Einzelkörper wird ausgewiesen.

## Gewicht

Gewichtsangaben sind **Schätzungen** und werden bewusst als Spanne ausgegeben. Sie
enthalten **keine** Wandstärken, **keine** Boden- und Deckschichten und **kein**
Stützmaterial. Für dünnwandige Bauteile liegt die untere Grenze deutlich zu niedrig.

Für eine Kalkulation ist ausschließlich die Berechnung eines Slicers mit dem tatsächlich
vorgesehenen Druckprofil maßgeblich.

## Volumen und Oberfläche

Volumen und Schwerpunkt sind nur bei einem geschlossenen Netz physikalisch sinnvoll. Bei
einem Netz mit Löchern liefert die Rechnung weiterhin ein Ergebnis, aber es hängt davon
ab, wie die Löcher liegen. Der Befund weist diesen Fall aus; er steht deshalb vor der
Gewichtsangabe.

## Befund

Die Prüfung auf offene Kanten, Mehrfachkanten und verdrehte Flächen ist eine
**topologische** Prüfung. Sie sagt nichts über Druckbarkeit im Sinne von Wandstärken,
Überhängen, Verzug oder Stützbarkeit. Ein Modell ohne Befund kann trotzdem nicht
druckbar sein.

Ab 1,2 Mio. Dreiecken wird die Prüfung übersprungen. Das wird in der Oberfläche und im
PDF ausgewiesen.

## Bauraumprüfung

Geprüft werden ausschließlich achsparallele Lagen einschließlich der sechs
90-Grad-Drehungen. Schräge Lagen werden nicht geprüft. Ein „passt" bedeutet, dass der
Hüllkörper hineingeht — nicht, dass das Bauteil in dieser Lage sinnvoll oder
wirtschaftlich zu fertigen ist.

## Keine Zusage

Dieses Werkzeug erzeugt kein Angebot, keine Machbarkeitszusage und keine
Bauteilqualifizierung. Verbindlich ist ausschließlich eine schriftliche Bestätigung der
Reents Technologies GmbH.

## Datenverarbeitung

Die geöffnete Datei wird ausschließlich im Arbeitsspeicher des Browsers verarbeitet und
nicht übertragen. Die Inhaltssicherheitsrichtlinie der ausgelieferten Seite lässt
ausgehende Verbindungen nur zur eigenen Herkunft zu (`connect-src 'self'`) — also zu dem
statischen Dateiserver, der die Seite ausliefert und nichts entgegennimmt. Die einzige
Anfrage, die dabei überhaupt entsteht, holt beim Öffnen einer STEP- oder IGES-Datei das
Leseprogramm (OpenCascade als WebAssembly) von demselben Server nach. Die Begründung
steht in [ADR-013](DECISIONS.md).

Unberührt davon bleiben die Zugriffsprotokolle des Servers, der die Seite ausliefert
(bei GitHub Pages: GitHub). Diese erfassen den Abruf der Seite, nicht die geöffnete Datei.
