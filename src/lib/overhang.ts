/**
 * Ueberhaenge: welche Flaechen brauchen beim Druck eine Stuetze.
 *
 * Reine Rechnung ohne three.js, damit sie sich pruefen laesst. Der Viewer
 * bekommt fertige Eckpunktfarben und die Kennzahl zurueck.
 */

/** RGB im linearen Arbeitsfarbraum von three.js, nicht als Bildschirmwert. */
export type LinearRgb = readonly [number, number, number];

export interface OverhangResult {
  /** Drei Werte je Eckpunkt, passend zu den uebergebenen Positionen. */
  colors: Float32Array;
  overhangAreaMm2: number;
  totalAreaMm2: number;
  /** Anteil der Flaeche, die eine Stuetze braucht. 0 bis 1. */
  fraction: number;
  triangles: number;
  overhangTriangles: number;
  /** Dreiecke, die flach auf der Bauplatte liegen und deshalb nicht zaehlen. */
  onPlate: number;
}

export const DEFAULT_OVERHANG_DEGREES = 45;

/**
 * Ueberhangpruefung.
 *
 * DAS KRITERIUM
 * Massgeblich ist die z-Komponente der Flaechennormalen. Eine waagerechte
 * Deckflaeche hat +1, eine senkrechte Wand 0, eine waagerechte Unterseite -1.
 * Eine Stuetze braucht es, wenn die Flaeche staerker nach unten zeigt als der
 * Schwellwinkel erlaubt: nz < -cos(Schwelle). Bei den ueblichen 45 Grad ist
 * das nz < -0,707.
 *
 * WARUM DIE BAUPLATTE AUSGENOMMEN WIRD
 * Die Standflaeche eines Bauteils zeigt senkrecht nach unten und erfuellt das
 * Kriterium immer. Ohne Ausnahme leuchtet bei jedem Modell zuerst der Boden
 * rot — und eine Warnung, die als Erstes das Selbstverstaendliche anzeigt,
 * wird zusammen mit allem anderen ueberlesen. Dreiecke, deren drei Ecken auf
 * der Unterkante liegen, stehen auf der Platte und zaehlen nicht.
 *
 * WAS ES NICHT LEISTET
 * Das ist eine Flaechenbetrachtung, keine Stuetzberechnung. Ob eine Flaeche
 * tatsaechlich in der Luft haengt oder auf dem Bauteil selbst aufliegt, sagt
 * die Normale nicht — dafuer muesste man von jedem Dreieck nach unten
 * schauen. Ein Slicer tut genau das. Hier geht es um die Frage, WO ueberhaengt
 * wird, nicht um die Stuetzmenge.
 */
export function computeOverhang(
  positions: Float32Array,
  options: {
    thresholdDegrees?: number;
    minZ: number;
    /** Toleranz, innerhalb derer ein Punkt als "auf der Platte" gilt. */
    plateTolerance?: number;
    baseColor: LinearRgb;
    warnColor: LinearRgb;
  },
): OverhangResult {
  const threshold = options.thresholdDegrees ?? DEFAULT_OVERHANG_DEGREES;
  const limit = -Math.cos((threshold * Math.PI) / 180);
  const plateTolerance = options.plateTolerance ?? 0.05;
  const [br, bg, bb] = options.baseColor;
  const [wr, wg, wb] = options.warnColor;

  const vertexCount = positions.length / 3;
  const colors = new Float32Array(vertexCount * 3);

  let totalArea = 0;
  let overhangArea = 0;
  let overhangTriangles = 0;
  let onPlate = 0;
  const plateLimit = options.minZ + plateTolerance;

  for (let i = 0; i < positions.length; i += 9) {
    const ax = positions[i], ay = positions[i + 1], az = positions[i + 2];
    const bx = positions[i + 3], by = positions[i + 4], bz = positions[i + 5];
    const cx = positions[i + 6], cy = positions[i + 7], cz = positions[i + 8];

    const e1x = bx - ax, e1y = by - ay, e1z = bz - az;
    const e2x = cx - ax, e2y = cy - ay, e2z = cz - az;
    const nx = e1y * e2z - e1z * e2y;
    const ny = e1z * e2x - e1x * e2z;
    const nz = e1x * e2y - e1y * e2x;
    const doubleArea = Math.hypot(nx, ny, nz);

    let overhang = false;
    if (doubleArea > 0) {
      const area = doubleArea / 2;
      totalArea += area;
      const restsOnPlate = az <= plateLimit && bz <= plateLimit && cz <= plateLimit;
      if (restsOnPlate) {
        onPlate++;
      } else if (nz / doubleArea < limit) {
        overhang = true;
        overhangArea += area;
        overhangTriangles++;
      }
    }

    const r = overhang ? wr : br;
    const g = overhang ? wg : bg;
    const b = overhang ? wb : bb;
    // Farb- und Positionsfeld sind gleich lang und gleich angeordnet: drei
    // Werte je Eckpunkt, neun je Dreieck. Der Index laeuft deshalb im
    // Gleichschritt mit `i` — nicht geteilt.
    for (let v = 0; v < 3; v++) {
      const o = i + v * 3;
      colors[o] = r;
      colors[o + 1] = g;
      colors[o + 2] = b;
    }
  }

  return {
    colors,
    overhangAreaMm2: overhangArea,
    totalAreaMm2: totalArea,
    fraction: totalArea > 0 ? overhangArea / totalArea : 0,
    triangles: positions.length / 9,
    overhangTriangles,
    onPlate,
  };
}
