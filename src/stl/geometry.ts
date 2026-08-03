/**
 * Kennwerte aus einem Dreiecksnetz — Abmessungen, Volumen, Oberflaeche,
 * Schwerpunkt und der topologische Befund.
 *
 * Alles hier ist reine Rechnung ohne three.js, damit es im Worker und in der
 * Testsuite unter Node identisch laeuft.
 */

import type { BoundingBox, MeshStats, Topology, Vec3 } from "./types";

/**
 * Ab dieser Groesse wird die Topologiepruefung uebersprungen.
 *
 * Die Pruefung muss deckungsgleiche Eckpunkte verschweissen und dafuer eine
 * Zuordnungstabelle ueber ALLE Eckpunkte halten — bei 1,2 Mio. Dreiecken sind das
 * 3,6 Mio. Eintraege und je nach Browser mehrere hundert Megabyte. Darueber kippt
 * der Reiter, statt langsam zu werden.
 *
 * Abmessungen, Volumen und Oberflaeche brauchen diese Tabelle NICHT: Sie laufen in
 * einem Durchgang mit konstantem Speicher und bleiben deshalb bei jeder Dateigroesse
 * verfuegbar. Deshalb faellt hier nur der Befund weg, nicht die Kennwerte — und die
 * Oberflaeche sagt das auch, statt eine wasserdichte Datei stillschweigend als
 * ungeprueft zu fuehren.
 */
export const MAX_TOPOLOGY_TRIANGLES = 1_200_000;

export function boundingBox(positions: Float32Array): BoundingBox {
  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity;

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  }

  const size: Vec3 = { x: maxX - minX, y: maxY - minY, z: maxZ - minZ };
  return {
    min: { x: minX, y: minY, z: minZ },
    max: { x: maxX, y: maxY, z: maxZ },
    size,
    center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2, z: (minZ + maxZ) / 2 },
    diagonal: Math.hypot(size.x, size.y, size.z),
  };
}

/**
 * Volumen, Oberflaeche, Schwerpunkt und entartete Dreiecke in EINEM Durchgang.
 *
 * Das Volumen entsteht als Summe vorzeichenbehafteter Tetraeder zwischen dem
 * Ursprung und jedem Dreieck. Der Ursprung wird dafuer in den Mittelpunkt der
 * Huelle gelegt: Liegt ein Bauteil bei x = 2.400 mm und ist selbst nur 3 mm dick,
 * subtrahieren sich sonst zwei fast gleich grosse Zahlen voneinander und von der
 * Differenz bleibt in einfacher Genauigkeit kaum eine gueltige Stelle uebrig.
 * Verschoben rechnet dieselbe Formel um Groessenordnungen genauer — und das
 * Ergebnis ist dasselbe, weil eine Verschiebung das Volumen nicht aendert.
 */
function integrate(
  positions: Float32Array,
  origin: Vec3,
): { volume: number; area: number; centroid: Vec3 | null; degenerate: number } {
  let signedVolume = 0;
  let area = 0;
  let degenerate = 0;
  let cx = 0,
    cy = 0,
    cz = 0;

  for (let i = 0; i < positions.length; i += 9) {
    const ax = positions[i] - origin.x;
    const ay = positions[i + 1] - origin.y;
    const az = positions[i + 2] - origin.z;
    const bx = positions[i + 3] - origin.x;
    const by = positions[i + 4] - origin.y;
    const bz = positions[i + 5] - origin.z;
    const gx = positions[i + 6] - origin.x;
    const gy = positions[i + 7] - origin.y;
    const gz = positions[i + 8] - origin.z;

    // Kreuzprodukt der Kantenvektoren = doppelte Dreiecksflaeche als Vektor.
    const e1x = bx - ax,
      e1y = by - ay,
      e1z = bz - az;
    const e2x = gx - ax,
      e2y = gy - ay,
      e2z = gz - az;
    const nx = e1y * e2z - e1z * e2y;
    const ny = e1z * e2x - e1x * e2z;
    const nz = e1x * e2y - e1y * e2x;
    const doubleArea = Math.hypot(nx, ny, nz);

    if (doubleArea === 0) {
      degenerate++;
      continue; // Traegt weder zur Flaeche noch zum Volumen bei.
    }
    area += doubleArea / 2;

    // Spatprodukt / 6 = Volumen des Tetraeders Ursprung-a-b-c.
    const tet = (ax * (by * gz - bz * gy) + ay * (bz * gx - bx * gz) + az * (bx * gy - by * gx)) / 6;
    signedVolume += tet;

    // Schwerpunkt des Tetraeders: Mittel der vier Ecken, davon eine im Ursprung.
    cx += tet * ((ax + bx + gx) / 4);
    cy += tet * ((ay + by + gy) / 4);
    cz += tet * ((az + bz + gz) / 4);
  }

  const centroid =
    Math.abs(signedVolume) > 1e-9
      ? {
          x: cx / signedVolume + origin.x,
          y: cy / signedVolume + origin.y,
          z: cz / signedVolume + origin.z,
        }
      : null;

  return { volume: signedVolume, area, centroid, degenerate };
}

/**
 * Topologischer Befund: Loecher, Mehrfachkanten, widerspruechliche Drehrichtung.
 *
 * Ein STL speichert jeden Eckpunkt so oft, wie Dreiecke ihn benutzen — es gibt
 * keine gemeinsamen Indizes. Ohne Verschweissen waere JEDE Kante eine Einzelkante
 * und jedes Modell voller "Loecher". Verschweisst wird ueber ein Raster, dessen
 * Weite an der Raumdiagonale haengt: absolute Toleranzen wie 0,001 mm passen fuer
 * ein Zahnrad und versagen bei einem 2,4-m-Exponat.
 */
function analyseTopology(positions: Float32Array, diagonal: number): Topology {
  const tolerance = Math.max(diagonal * 1e-6, Number.MIN_VALUE);
  const inv = 1 / tolerance;

  const vertexIds = new Map<string, number>();
  const indices = new Int32Array(positions.length / 3);
  let nextId = 0;

  for (let i = 0, v = 0; i < positions.length; i += 3, v++) {
    const key = `${Math.round(positions[i] * inv)},${Math.round(positions[i + 1] * inv)},${Math.round(
      positions[i + 2] * inv,
    )}`;
    let id = vertexIds.get(key);
    if (id === undefined) {
      id = nextId++;
      vertexIds.set(key, id);
    }
    indices[v] = id;
  }
  vertexIds.clear();

  const vertices = nextId;
  // Kantenschluessel aus zwei Eckpunktnummern. Bei 3,6 Mio. Eckpunkten bleibt
  // vertices * vertices unter 2^53 und damit exakt als Zahl darstellbar.
  const edges = new Map<number, number>();

  const bump = (a: number, b: number): void => {
    const lo = a < b ? a : b;
    const hi = a < b ? b : a;
    const key = lo * vertices + hi;
    const cur = edges.get(key) ?? 0;
    // Gepackt: untere 16 Bit Gesamtzahl, obere 16 Bit Zahl der Durchlaeufe in
    // kanonischer Richtung. Zwei Zaehler in einer Zahl sparen eine zweite Tabelle.
    const total = Math.min((cur & 0xffff) + 1, 0xffff);
    const forward = Math.min((cur >>> 16) + (a < b ? 1 : 0), 0xffff);
    edges.set(key, (forward << 16) | total);
  };

  for (let t = 0; t < indices.length; t += 3) {
    const a = indices[t];
    const b = indices[t + 1];
    const c = indices[t + 2];
    if (a === b || b === c || a === c) continue; // entartet, keine echte Kante
    bump(a, b);
    bump(b, c);
    bump(c, a);
  }

  let boundaryEdges = 0;
  let nonManifoldEdges = 0;
  let flippedEdges = 0;

  for (const packed of edges.values()) {
    const total = packed & 0xffff;
    const forward = packed >>> 16;
    if (total === 1) boundaryEdges++;
    else if (total > 2) nonManifoldEdges++;
    // Bei zwei Nachbarn muss die Kante GENAU EINMAL in jede Richtung durchlaufen
    // werden. Zweimal dieselbe Richtung heisst: eines der beiden Dreiecke ist
    // verkehrt herum gewickelt — das Netz ist zwar geschlossen, aber die Aussen-
    // seite ist nicht mehr eindeutig.
    else if (total === 2 && forward !== 1) flippedEdges++;
  }

  return {
    vertices,
    boundaryEdges,
    nonManifoldEdges,
    flippedEdges,
    watertight: boundaryEdges === 0 && nonManifoldEdges === 0,
  };
}

export function analyseMesh(
  positions: Float32Array,
  options: { skipTopology?: boolean } = {},
): MeshStats {
  const triangles = positions.length / 9;
  const bbox = boundingBox(positions);
  const { volume, area, centroid, degenerate } = integrate(positions, bbox.center);

  const topologySkipped = options.skipTopology === true || triangles > MAX_TOPOLOGY_TRIANGLES;

  return {
    triangles,
    degenerate,
    bbox,
    volumeMm3: Math.abs(volume),
    signedVolumeMm3: volume,
    areaMm2: area,
    centroid,
    topology: topologySkipped ? null : analyseTopology(positions, bbox.diagonal),
    topologySkipped,
  };
}

/* ------------------------------------------------------------------ Bauraum */

export interface FitResult {
  fits: boolean;
  /** Passt nur, wenn das Bauteil um 90-Grad-Schritte gedreht wird. */
  needsRotation: boolean;
  /** Faktor, um den das Bauteil kleiner werden muesste. 1 = passt. */
  requiredScale: number;
}

/**
 * Passt das Bauteil in einen Bauraum?
 *
 * Beide Kantentripel werden absteigend sortiert und dann paarweise verglichen.
 * Das prueft ALLE sechs achsparallelen Lagen auf einmal: Wenn die laengste Kante
 * des Bauteils in die laengste Kammerkante passt, die zweitlaengste in die
 * zweitlaengste und die kuerzeste in die kuerzeste, gibt es eine Drehung, in der
 * es hineingeht — und sonst gibt es keine. Ein Vergleich Achse fuer Achse haette
 * ein 2.300 mm hohes Bauteil als "zu gross" abgewiesen, obwohl es liegend passt.
 *
 * Nicht geprueft werden schraege Lagen. Die sind im Grossformat unueblich, und ein
 * "passt schraeg" waere eine Zusage, die die Fertigung einloesen muss.
 */
export function fitsInBuildVolume(
  size: Vec3,
  volume: { x: number; y: number; z: number },
): FitResult {
  const part = [size.x, size.y, size.z].sort((a, b) => b - a);
  const room = [volume.x, volume.y, volume.z].sort((a, b) => b - a);

  const fits = part.every((edge, i) => edge <= room[i]);
  const axisAligned = size.x <= volume.x && size.y <= volume.y && size.z <= volume.z;

  const worstRatio = Math.max(...part.map((edge, i) => (room[i] > 0 ? edge / room[i] : Infinity)));

  return {
    fits,
    needsRotation: fits && !axisAligned,
    requiredScale: worstRatio <= 1 ? 1 : 1 / worstRatio,
  };
}
