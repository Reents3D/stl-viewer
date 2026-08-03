import { describe, expect, test } from "vitest";

import { analyseMesh, boundingBox, fitsInBuildVolume } from "../../src/stl/geometry";
import { parseBinary } from "../../src/stl/parse";
import { buildBinaryStl, cube, flippedCube, openCube } from "../fixtures";

const positionsOf = (triangles: readonly (readonly number[])[]): Float32Array =>
  parseBinary(buildBinaryStl(triangles)).positions;

describe("Huellkoerper", () => {
  test("misst Kantenlaengen und Mittelpunkt", () => {
    const box = boundingBox(positionsOf(cube(10)));
    expect(box.size).toEqual({ x: 10, y: 10, z: 10 });
    expect(box.center).toEqual({ x: 5, y: 5, z: 5 });
    expect(box.diagonal).toBeCloseTo(Math.sqrt(300), 5);
  });
});

describe("Volumen und Oberflaeche", () => {
  test("rechnet den Wuerfel exakt", () => {
    const stats = analyseMesh(positionsOf(cube(10)));
    expect(stats.volumeMm3).toBeCloseTo(1000, 3);
    expect(stats.areaMm2).toBeCloseTo(600, 3);
    expect(stats.triangles).toBe(12);
    expect(stats.degenerate).toBe(0);
  });

  test("setzt den Schwerpunkt in die Mitte", () => {
    const c = analyseMesh(positionsOf(cube(10))).centroid;
    expect(c?.x).toBeCloseTo(5, 4);
    expect(c?.y).toBeCloseTo(5, 4);
    expect(c?.z).toBeCloseTo(5, 4);
  });

  test("bleibt genau, wenn das Bauteil weit ausserhalb des Ursprungs liegt", () => {
    // Der eigentliche Grund fuer die Verschiebung in den Huellenmittelpunkt: Ein
    // 3 mm duennes Blech bei x = 2.400 mm. Ohne Verschiebung loeschen sich in
    // einfacher Genauigkeit die gueltigen Stellen gegenseitig aus.
    const far = cube(3).map((t) => t.map((v, i) => (i % 3 === 0 ? v + 2400 : v)));
    const stats = analyseMesh(positionsOf(far));
    expect(stats.volumeMm3).toBeCloseTo(27, 2);
    expect(stats.centroid?.x).toBeCloseTo(2401.5, 2);
  });

  test("meldet ein negatives Vorzeichen bei nach innen gedrehtem Netz", () => {
    // Alle Dreiecke umgedreht: geometrisch derselbe Koerper, aber die Aussenseite
    // zeigt nach innen. Der Betrag stimmt, das Vorzeichen ist der Befund.
    const inverted = cube(10).map((t) => [t[0], t[1], t[2], t[6], t[7], t[8], t[3], t[4], t[5]]);
    const stats = analyseMesh(positionsOf(inverted));
    expect(stats.volumeMm3).toBeCloseTo(1000, 3);
    expect(stats.signedVolumeMm3).toBeLessThan(0);
  });
});

describe("Topologie", () => {
  test("erkennt den geschlossenen Wuerfel als wasserdicht", () => {
    const t = analyseMesh(positionsOf(cube(10))).topology;
    expect(t?.watertight).toBe(true);
    expect(t?.vertices).toBe(8); // 36 Eckpunkte in der Datei, 8 nach dem Verschweissen
    expect(t?.boundaryEdges).toBe(0);
    expect(t?.nonManifoldEdges).toBe(0);
    expect(t?.flippedEdges).toBe(0);
  });

  test("findet das Loch im offenen Wuerfel", () => {
    const t = analyseMesh(positionsOf(openCube(10))).topology;
    expect(t?.watertight).toBe(false);
    expect(t?.boundaryEdges).toBe(4); // die vier Kanten der fehlenden Deckflaeche
  });

  test("findet ein verkehrt herum gewickeltes Dreieck", () => {
    const t = analyseMesh(positionsOf(flippedCube(10))).topology;
    expect(t?.flippedEdges).toBeGreaterThan(0);
  });

  test("laesst sich abschalten und meldet das", () => {
    const stats = analyseMesh(positionsOf(cube(10)), { skipTopology: true });
    expect(stats.topology).toBeNull();
    expect(stats.topologySkipped).toBe(true);
    // Die Kennwerte bleiben trotzdem vollstaendig.
    expect(stats.volumeMm3).toBeCloseTo(1000, 3);
  });
});

describe("Bauraumpruefung", () => {
  const xxl = { x: 1800, y: 2400, z: 1800 };

  test("passt bei achsparalleler Lage", () => {
    const r = fitsInBuildVolume({ x: 500, y: 600, z: 400 }, xxl);
    expect(r.fits).toBe(true);
    expect(r.needsRotation).toBe(false);
    expect(r.requiredScale).toBe(1);
  });

  test("passt liegend, obwohl es stehend zu hoch waere", () => {
    // 2.300 mm Hoehe uebersteigt jede Achse ausser der 2.400er. Ein Vergleich
    // Achse fuer Achse haette hier faelschlich "zu gross" gemeldet.
    const r = fitsInBuildVolume({ x: 300, y: 300, z: 2300 }, xxl);
    expect(r.fits).toBe(true);
    expect(r.needsRotation).toBe(true);
  });

  test("meldet den noetigen Verkleinerungsfaktor", () => {
    const r = fitsInBuildVolume({ x: 3600, y: 300, z: 300 }, xxl);
    expect(r.fits).toBe(false);
    expect(r.requiredScale).toBeCloseTo(2400 / 3600, 4);
  });
});
