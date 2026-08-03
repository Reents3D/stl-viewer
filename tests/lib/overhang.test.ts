import { describe, expect, test } from "vitest";

import { computeOverhang, DEFAULT_OVERHANG_DEGREES } from "../../src/lib/overhang";
import { buildBinaryStl, cube } from "../fixtures";
import { parseBinary } from "../../src/stl/parse";

const WEISS = [1, 1, 1] as const;
const WARN = [1, 0.35, 0.1] as const;

const positionsOf = (tris: readonly (readonly number[])[]): Float32Array =>
  parseBinary(buildBinaryStl(tris)).positions;

const lauf = (positions: Float32Array, minZ: number, grad = DEFAULT_OVERHANG_DEGREES) =>
  computeOverhang(positions, {
    thresholdDegrees: grad,
    minZ,
    baseColor: WEISS,
    warnColor: WARN,
  });

/**
 * Ein einzelnes Dreieck, dessen Unterseite um `grad` gegen die Waagerechte
 * geneigt ist. Herleitung: Mit den Ecken (0,0,z), (0,1,z), (1,0,z+t) ergibt das
 * Kreuzprodukt die Normale (t, 0, -1); ihre z-Komponente ist -1/sqrt(1+t²), also
 * -cos(atan(t)). Mit t = tan(grad) steht die Flaeche genau in diesem Winkel.
 */
function geneigteUnterseite(grad: number, z = 10): number[][] {
  const t = Math.tan((grad * Math.PI) / 180);
  return [[0, 0, z, 0, 1, z, 1, 0, z + t]];
}

describe("Farbfeld", () => {
  test("liefert drei Werte je Eckpunkt", () => {
    const p = positionsOf(cube(60));
    const r = lauf(p, 0);
    expect(r.colors.length).toBe(p.length);
    expect(r.triangles).toBe(12);
  });

  test("faerbt unauffaellige Flaechen in der Grundfarbe", () => {
    const r = lauf(positionsOf(cube(60)), 0);
    // Ohne Ueberhang darf keine einzige Komponente vom Weiss abweichen.
    expect(Array.from(r.colors).every((c) => c === 1)).toBe(true);
  });
});

describe("Bauplatte", () => {
  test("die Standflaeche zaehlt nicht als Ueberhang", () => {
    // Sonst leuchtet bei JEDEM Modell zuerst der Boden rot - und eine Warnung,
    // die als Erstes das Selbstverstaendliche zeigt, wird ueberlesen.
    const r = lauf(positionsOf(cube(60)), 0);
    expect(r.overhangTriangles).toBe(0);
    expect(r.onPlate).toBe(2); // die beiden Dreiecke der Unterseite
    expect(r.fraction).toBe(0);
  });

  test("dieselbe Flaeche schwebend IST ein Ueberhang", () => {
    // Derselbe Wuerfel, aber die Unterkante liegt 10 mm ueber der Platte.
    const angehoben = cube(60).map((t) => t.map((v, i) => (i % 3 === 2 ? v + 10 : v)));
    const r = lauf(positionsOf(angehoben), 0);
    expect(r.overhangTriangles).toBe(2);
    expect(r.onPlate).toBe(0);
    // Eine von sechs Wuerfelflaechen.
    expect(r.fraction).toBeCloseTo(1 / 6, 6);
    expect(r.overhangAreaMm2).toBeCloseTo(3600, 3);
  });
});

describe("Schwellwinkel", () => {
  test("flacher als die Schwelle wird gemeldet", () => {
    // 30 Grad gegen die Waagerechte ist flacher als 45 - braucht Stuetze.
    expect(lauf(positionsOf(geneigteUnterseite(30)), 0, 45).overhangTriangles).toBe(1);
  });

  test("steiler als die Schwelle wird nicht gemeldet", () => {
    expect(lauf(positionsOf(geneigteUnterseite(60)), 0, 45).overhangTriangles).toBe(0);
  });

  test("eine strengere Schwelle meldet weniger", () => {
    const p = positionsOf(geneigteUnterseite(30));
    expect(lauf(p, 0, 45).overhangTriangles).toBe(1);
    expect(lauf(p, 0, 20).overhangTriangles).toBe(0);
  });

  test("die senkrechte Wand bleibt in jeder Einstellung frei", () => {
    // Normale waagerecht, z-Anteil null - darf bei keiner Schwelle unter 90 Grad
    // anschlagen, sonst waere jede Aussenwand rot.
    const wand = [[0, 0, 10, 0, 0, 20, 0, 10, 20]];
    for (const grad of [10, 45, 80]) {
      expect(lauf(positionsOf(wand), 0, grad).overhangTriangles).toBe(0);
    }
  });

  test("die waagerechte Unterseite schlaegt bei jeder Schwelle an", () => {
    expect(lauf(positionsOf(geneigteUnterseite(0)), 0, 20).overhangTriangles).toBe(1);
    expect(lauf(positionsOf(geneigteUnterseite(0)), 0, 60).overhangTriangles).toBe(1);
  });
});

describe("Flaechenbilanz", () => {
  test("Gesamtflaeche stimmt mit der Geometrie ueberein", () => {
    const r = lauf(positionsOf(cube(60)), 0);
    expect(r.totalAreaMm2).toBeCloseTo(6 * 3600, 3);
  });

  test("entartete Dreiecke tragen nichts bei und stuerzen nicht ab", () => {
    const entartet = [[0, 0, 5, 1, 1, 5, 2, 2, 5]]; // kollinear
    const r = lauf(positionsOf(entartet), 0);
    expect(r.totalAreaMm2).toBe(0);
    expect(r.fraction).toBe(0);
    expect(r.overhangTriangles).toBe(0);
  });
});
