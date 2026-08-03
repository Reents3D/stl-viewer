/**
 * Seitenraster fuer Bilderstrecken — reine Rechnung, ohne jsPDF.
 *
 * Getrennt gehalten, damit sich das Verhalten pruefen laesst, ohne ein PDF zu
 * erzeugen und wieder auseinanderzunehmen. Der Fehler, der hier lauert, ist nicht
 * ein haessliches Layout, sondern ein STILLSCHWEIGEND ABGESCHNITTENES: Passen 10
 * Bilder nicht auf eine Seite und rechnet der Umbruch falsch, fehlen im PDF zwei
 * Ansichten, ohne dass irgendwo steht, dass sie fehlen.
 */

export interface GridInput {
  count: number;
  areaWidth: number;
  areaHeight: number;
  /** Breite geteilt durch Hoehe eines Bildes. */
  aspect: number;
  gap: number;
  captionHeight: number;
}

export interface Grid {
  columns: number;
  rowsPerPage: number;
  cellWidth: number;
  imageHeight: number;
  cellHeight: number;
  perPage: number;
  pages: number;
}

/**
 * Spaltenzahl nach Bildmenge.
 *
 * Feste Stufen statt einer Optimierung: Zehn Bilder in vier Spalten ergeben zwei
 * volle Reihen und eine mit zwei Bildern — das sieht nach Fehler aus. Drei Spalten
 * ergeben drei volle Reihen und eine mit einem Bild, was als Rest lesbar ist. Die
 * Stufen sind so gewaehlt, dass die letzte Reihe moeglichst voll wird.
 */
export function columnsFor(count: number): number {
  if (count <= 2) return 2;
  if (count <= 4) return 2;
  if (count <= 12) return 3;
  if (count <= 24) return 4;
  return 5;
}

export function imageGrid(input: GridInput): Grid {
  const { count, areaWidth, areaHeight, aspect, gap, captionHeight } = input;
  const columns = Math.max(1, Math.min(columnsFor(count), count));

  const cellWidth = (areaWidth - gap * (columns - 1)) / columns;
  const imageHeight = cellWidth / aspect;
  const cellHeight = imageHeight + captionHeight;

  // +gap im Zaehler: Die letzte Reihe braucht keinen Abstand unter sich.
  const rowsPerPage = Math.max(1, Math.floor((areaHeight + gap) / (cellHeight + gap)));
  const perPage = columns * rowsPerPage;

  return {
    columns,
    rowsPerPage,
    cellWidth,
    imageHeight,
    cellHeight,
    perPage,
    pages: Math.max(1, Math.ceil(count / perPage)),
  };
}

export interface Placement {
  index: number;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Alle Bildpositionen ausrechnen — eine je Bild, keine faellt unter den Tisch. */
export function placeImages(input: GridInput, originX: number, originY: number): Placement[] {
  const grid = imageGrid(input);
  const out: Placement[] = [];

  for (let i = 0; i < input.count; i++) {
    const onPage = i % grid.perPage;
    out.push({
      index: i,
      page: Math.floor(i / grid.perPage),
      x: originX + (onPage % grid.columns) * (grid.cellWidth + input.gap),
      y: originY + Math.floor(onPage / grid.columns) * (grid.cellHeight + input.gap),
      width: grid.cellWidth,
      height: grid.imageHeight,
    });
  }
  return out;
}

/**
 * Wie viele Aufnahmen entstehen insgesamt?
 *
 * Steht vor dem Start in der Oberflaeche: Bei drei Achsen, 20 Bildern je Achse und
 * 12 Anmerkungen sind es 78 Renderdurchgaenge. Das dauert, und wer es vorher weiss,
 * bricht nicht nach dreissig Sekunden ab, weil er den Rechner fuer haengengeblieben
 * haelt.
 */
export function countShots(options: {
  axes: number;
  perAxis: number;
  standardViews: boolean;
  annotations: number;
}): number {
  return (
    options.axes * options.perAxis + (options.standardViews ? 6 : 0) + options.annotations
  );
}
