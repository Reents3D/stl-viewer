import { describe, expect, test } from "vitest";
import * as THREE from "three";

import { probeThickness } from "../../src/lib/thickness";

/**
 * Hohlwuerfel: aussen 0..60, innen 5..55, Wandstaerke also ueberall 5 mm.
 *
 * Die inneren Flaechen sind umgekehrt gewickelt — ihre Normalen zeigen in den
 * Hohlraum, weg vom Material. So ist es in jedem korrekten STL eines Hohlkoerpers.
 */
function hollowCube(): THREE.Mesh {
  const box = (
    x0: number, y0: number, z0: number,
    x1: number, y1: number, z1: number,
  ): number[][] => {
    const v: Record<number, [number, number, number]> = {
      0: [x0, y0, z0], 1: [x1, y0, z0], 2: [x1, y1, z0], 3: [x0, y1, z0],
      4: [x0, y0, z1], 5: [x1, y0, z1], 6: [x1, y1, z1], 7: [x0, y1, z1],
    };
    const faces: Array<[number, number, number]> = [
      [0, 2, 1], [0, 3, 2], [4, 5, 6], [4, 6, 7], [0, 1, 5], [0, 5, 4],
      [3, 7, 6], [3, 6, 2], [0, 4, 7], [0, 7, 3], [1, 2, 6], [1, 6, 5],
    ];
    return faces.map((f) => [...v[f[0]], ...v[f[1]], ...v[f[2]]]);
  };
  const flip = (tris: number[][]): number[][] =>
    tris.map((t) => [t[0], t[1], t[2], t[6], t[7], t[8], t[3], t[4], t[5]]);

  const tris = [...box(0, 0, 0, 60, 60, 60), ...flip(box(5, 5, 5, 55, 55, 55))];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(tris.flat(), 3));
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ side: THREE.FrontSide }));
  mesh.updateMatrixWorld(true);
  return mesh;
}

const EPS = 1e-4;
const messen = (mesh: THREE.Mesh, punkt: [number, number, number], normale: [number, number, number]) =>
  probeThickness(
    mesh,
    new THREE.Raycaster(),
    new THREE.Vector3(...punkt),
    new THREE.Vector3(...normale),
    EPS,
  );

describe("Wandstaerke am Hohlwuerfel", () => {
  test("misst die Wand mittig auf jeder der sechs Flaechen mit 5 mm", () => {
    const mesh = hollowCube();
    const faelle: Array<[[number, number, number], [number, number, number]]> = [
      [[60, 30, 30], [1, 0, 0]],
      [[0, 30, 30], [-1, 0, 0]],
      [[30, 60, 30], [0, 1, 0]],
      [[30, 0, 30], [0, -1, 0]],
      [[30, 30, 60], [0, 0, 1]],
      [[30, 30, 0], [0, 0, -1]],
    ];
    for (const [punkt, normale] of faelle) {
      const r = messen(mesh, punkt, normale);
      expect(r, `Flaeche mit Normale ${normale.join(",")}`).not.toBeNull();
      expect(r!.thickness).toBeCloseTo(5, 3);
    }
  });

  test("meldet nahe der Kante die volle Materialtiefe — und das ist richtig", () => {
    // Bei y = 59 liegt der Hohlraum (5..55) NICHT in Strahlrichtung. Das Bauteil
    // ist dort ueber die ganze Breite massiv, die Antwort 60 mm ist die Wahrheit.
    // Im Browser sah das zunaechst nach einem Messfehler aus; dieser Test haelt
    // fest, dass es keiner ist.
    const r = messen(hollowCube(), [60, 59, 30], [1, 0, 0]);
    expect(r!.thickness).toBeCloseTo(60, 3);
  });

  test("liefert den Austrittspunkt auf der Rueckwand", () => {
    const r = messen(hollowCube(), [60, 30, 30], [1, 0, 0]);
    expect(r!.exit.x).toBeCloseTo(55, 3);
    expect(r!.exit.y).toBeCloseTo(30, 3);
  });

  test("trifft die Rueckseite auch bei FrontSide-Werkstoff", () => {
    // Der eigentliche Kern: Die Rueckwand ist vom Inneren aus eine Rueckseite.
    // Ohne das Umschalten auf DoubleSide waere sie unsichtbar fuer den Strahl,
    // und gemessen wuerde die uebernaechste Flaeche — 55 statt 5 mm.
    const mesh = hollowCube();
    expect((mesh.material as THREE.Material).side).toBe(THREE.FrontSide);
    expect(messen(mesh, [60, 30, 30], [1, 0, 0])!.thickness).toBeCloseTo(5, 3);
    // Und der Werkstoff steht danach wieder so, wie er vorher stand.
    expect((mesh.material as THREE.Material).side).toBe(THREE.FrontSide);
  });
});

describe("Grenzfaelle", () => {
  test("ohne Gegenstueck kommt null zurueck, nicht null Millimeter", () => {
    // Eine einzelne Flaeche: Der Strahl verlaesst sie und trifft nichts mehr.
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute([0, 0, 0, 10, 0, 0, 0, 10, 0], 3),
    );
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
    mesh.updateMatrixWorld(true);
    expect(messen(mesh, [2, 2, 0], [0, 0, 1])).toBeNull();
  });

  test("eine Normale der Laenge null ergibt keine Messung", () => {
    expect(messen(hollowCube(), [60, 30, 30], [0, 0, 0])).toBeNull();
  });

  test("misst unabhaengig davon, ob die Normale normiert uebergeben wird", () => {
    const mesh = hollowCube();
    const a = messen(mesh, [60, 30, 30], [1, 0, 0])!.thickness;
    const b = messen(mesh, [60, 30, 30], [7, 0, 0])!.thickness;
    expect(b).toBeCloseTo(a, 6);
  });
});
