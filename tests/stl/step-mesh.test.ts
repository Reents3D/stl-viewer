import { describe, expect, test } from "vitest";

import { analyseMesh } from "../../src/stl/geometry";
import {
  convertOcctResult,
  stepReadParams,
  StepConversionError,
  type OcctResult,
} from "../../src/stl/step-mesh";

/** Ein indizierter Wuerfel, wie ihn OCCT liefern wuerde: 8 Ecken, 12 Dreiecke. */
function indexedCube(s = 10, name = "wuerfel"): OcctResult {
  const position = [
    0, 0, 0, s, 0, 0, s, s, 0, 0, s, 0,
    0, 0, s, s, 0, s, s, s, s, 0, s, s,
  ];
  const index = [
    0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7,
    0, 1, 5, 0, 5, 4, 3, 7, 6, 3, 6, 2,
    0, 4, 7, 0, 7, 3, 1, 2, 6, 1, 6, 5,
  ];
  return {
    success: true,
    root: { name },
    meshes: [{ name, attributes: { position: { array: position } }, index: { array: index } }],
  };
}

describe("Umwandlung eines OCCT-Ergebnisses", () => {
  test("loest die Indizierung in ein flaches Dreiecksfeld auf", () => {
    const c = convertOcctResult(indexedCube(10));
    expect(c.triangles).toBe(12);
    expect(c.positions.length).toBe(12 * 9);
    expect(c.parts).toBe(1);
  });

  test("das Ergebnis rechnet sich wie ein STL derselben Form", () => {
    // Der eigentliche Sinn der Umwandlung: Ab hier laeuft alles durch dieselbe
    // Geometrie wie beim STL. Ein Wuerfel mit 10 mm Kante hat 1.000 mm³ und
    // 600 mm², ganz gleich, aus welchem Format er kam.
    const stats = analyseMesh(convertOcctResult(indexedCube(10)).positions);
    expect(stats.volumeMm3).toBeCloseTo(1000, 3);
    expect(stats.areaMm2).toBeCloseTo(600, 3);
    expect(stats.topology?.watertight).toBe(true);
    expect(stats.topology?.vertices).toBe(8);
  });

  test("legt mehrere Koerper zusammen und zaehlt sie", () => {
    const a = indexedCube(10, "teil-a");
    const b = indexedCube(10, "teil-b");
    const zusammen = convertOcctResult({
      success: true,
      root: { name: "baugruppe" },
      meshes: [...a.meshes, ...b.meshes],
    });
    expect(zusammen.parts).toBe(2);
    expect(zusammen.triangles).toBe(24);
    // Beide Wuerfel liegen aufeinander - das Volumen ist die SUMME, und genau
    // deshalb wird die Koerperzahl mitgegeben.
    expect(analyseMesh(zusammen.positions).volumeMm3).toBeCloseTo(2000, 3);
  });

  test("nimmt den Namen aus der Wurzel", () => {
    expect(convertOcctResult(indexedCube(10, "Halterung A2")).name).toBe("Halterung A2");
  });
});

describe("Fehlerhafte Eingaben", () => {
  test("meldet einen fehlgeschlagenen Import", () => {
    expect(() => convertOcctResult({ success: false, meshes: [] })).toThrow(StepConversionError);
  });

  test("meldet eine Datei ohne Flaechen", () => {
    expect(() => convertOcctResult({ success: true, meshes: [] })).toThrow(/keine Flaechen/);
  });

  test("meldet eine Indexzahl, die nicht durch drei teilbar ist", () => {
    const kaputt = indexedCube();
    kaputt.meshes[0].index.array = [0, 1];
    expect(() => convertOcctResult(kaputt)).toThrow(/nicht durch drei/);
  });

  test("faengt einen Verweis ausserhalb des Eckpunktfeldes ab", () => {
    // Ohne diese Pruefung liefert der Zugriff undefined, Float32Array macht
    // daraus NaN — und das Bauteil verschwindet ohne Fehlermeldung.
    const kaputt = indexedCube();
    kaputt.meshes[0].index.array = [0, 1, 99];
    expect(() => convertOcctResult(kaputt)).toThrow(/Ungueltiger Eckpunktverweis/);
  });
});

describe("Tessellierungsparameter", () => {
  test("gibt Millimeter vor, unabhaengig von der Guete", () => {
    for (const q of ["grob", "mittel", "fein"] as const) {
      expect(stepReadParams(q).linearUnit).toBe("millimeter");
      expect(stepReadParams(q).linearDeflectionType).toBe("bounding_box_ratio");
    }
  });

  test("feiner heisst kleinere Abweichung", () => {
    expect(stepReadParams("fein").linearDeflection).toBeLessThan(
      stepReadParams("mittel").linearDeflection,
    );
    expect(stepReadParams("mittel").linearDeflection).toBeLessThan(
      stepReadParams("grob").linearDeflection,
    );
    expect(stepReadParams("fein").angularDeflection).toBeLessThan(
      stepReadParams("grob").angularDeflection,
    );
  });
});
