/**
 * Umwandlung des OCCT-Ergebnisses in dieselbe Form, die der STL-Zweig liefert.
 *
 * Reine Rechnung ohne WebAssembly und ohne three.js — damit laesst sie sich
 * unter Node pruefen, waehrend die Tessellierung selbst nur im Browser laeuft.
 *
 * OCCT liefert INDIZIERTE Netze, der Rest des Werkzeugs erwartet ein flaches
 * Dreiecksfeld mit neun Werten je Dreieck. Der Grund fuer diese Form steht in
 * geometry.ts: Volumen, Oberflaeche und Topologie laufen alle ueber dieselbe
 * Anordnung, und ein zweiter Weg dorthin waere ein zweiter Ort fuer Fehler.
 */

export interface OcctMesh {
  name?: string;
  attributes: {
    position: { array: ArrayLike<number> };
    normal?: { array: ArrayLike<number> };
  };
  index: { array: ArrayLike<number> };
}

export interface OcctResult {
  success: boolean;
  meshes: OcctMesh[];
  root?: { name?: string };
}

export class StepConversionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StepConversionError";
  }
}

export interface ConvertedStep {
  positions: Float32Array;
  triangles: number;
  /** Zahl der Einzelkoerper. Groesser als eins heisst: Es ist eine Baugruppe. */
  parts: number;
  /** Name aus der Baumwurzel oder dem einzigen Koerper, sofern vorhanden. */
  name: string | null;
}

/**
 * Alle Koerper eines STEP zu einem Dreiecksfeld zusammenlegen.
 *
 * WARUM ZUSAMMENGELEGT WIRD
 * Eine STEP-Datei kann eine ganze Baugruppe enthalten. Der Betrachter zeigt
 * einen Koerper — das ist eine bewusste Grenze, keine Nachlaessigkeit: Getrennte
 * Koerper braeuchten eine Bauteilliste, Sichtbarkeitsschalter und eine eigene
 * Auswahl, und das ist ein anderes Werkzeug. Die Zahl der zusammengelegten
 * Koerper wird deshalb mitgegeben und in der Oberflaeche ausgewiesen: Bei einer
 * Baugruppe ist das Volumen die SUMME der Teile, und wer das nicht weiss, haelt
 * es fuer das Volumen eines Bauteils.
 */
export function convertOcctResult(result: OcctResult): ConvertedStep {
  if (!result.success) {
    throw new StepConversionError("OpenCascade konnte die Datei nicht lesen.");
  }
  const meshes = result.meshes ?? [];
  if (meshes.length === 0) {
    throw new StepConversionError("Die Datei enthaelt keine Flaechen.");
  }

  let triangles = 0;
  for (const mesh of meshes) {
    const indexCount = mesh.index?.array?.length ?? 0;
    if (indexCount % 3 !== 0) {
      throw new StepConversionError(
        `Ein Koerper hat ${indexCount} Indizes — nicht durch drei teilbar.`,
      );
    }
    triangles += indexCount / 3;
  }
  if (triangles === 0) {
    throw new StepConversionError("Die Tessellierung ergab kein einziges Dreieck.");
  }

  const positions = new Float32Array(triangles * 9);
  let out = 0;

  for (const mesh of meshes) {
    const source = mesh.attributes.position.array;
    const index = mesh.index.array;
    const vertexCount = source.length / 3;

    for (let i = 0; i < index.length; i++) {
      const v = index[i];
      // Ein Index ausserhalb des Feldes wuerde stillschweigend Nullen liefern
      // und das Bauteil bis in den Ursprung ziehen — sichtbar als riesiger
      // Splitter, dessen Ursache niemand findet.
      if (v < 0 || v >= vertexCount) {
        throw new StepConversionError(`Ungueltiger Eckpunktverweis ${v} in einem Koerper.`);
      }
      positions[out++] = source[v * 3];
      positions[out++] = source[v * 3 + 1];
      positions[out++] = source[v * 3 + 2];
    }
  }

  return {
    positions,
    triangles,
    parts: meshes.length,
    name: pickName(result),
  };
}

function pickName(result: OcctResult): string | null {
  const candidates = [result.root?.name, result.meshes.length === 1 ? result.meshes[0].name : null];
  for (const candidate of candidates) {
    const clean = candidate?.trim();
    if (clean && clean.length > 1) return clean.slice(0, 80);
  }
  return null;
}

/**
 * Tessellierungsgueten.
 *
 * `bounding_box_ratio` bezieht die Abweichung auf die mittlere Kantenlaenge des
 * Huellkoerpers — dieselbe Einstellung liefert damit bei einem Kleinteil und bei
 * einem 2,4-m-Exponat ein aehnlich feines Ergebnis. Ein absoluter Wert taete das
 * nicht: 0,1 mm sind am Zahnrad viel und am Messeexponat nichts.
 *
 * Die Winkelabweichung steht in Bogenmass.
 */
export const STEP_QUALITY = {
  grob: { linearDeflection: 0.005, angularDeflection: 0.8 },
  mittel: { linearDeflection: 0.001, angularDeflection: 0.5 },
  fein: { linearDeflection: 0.0002, angularDeflection: 0.25 },
} as const;

export type StepQuality = keyof typeof STEP_QUALITY;
export const DEFAULT_STEP_QUALITY: StepQuality = "mittel";

export function stepReadParams(quality: StepQuality): {
  linearUnit: "millimeter";
  linearDeflectionType: "bounding_box_ratio";
  linearDeflection: number;
  angularDeflection: number;
} {
  return {
    // Ausdruecklich gesetzt, obwohl es die Voreinstellung ist: Ein STEP traegt
    // seine Einheit in der Datei, und OCCT rechnet auf diese hier um. Damit
    // entfaellt die Einheitenwahl, die beim STL noetig ist — und man sieht im
    // Quelltext, dass das kein Versehen ist.
    linearUnit: "millimeter",
    linearDeflectionType: "bounding_box_ratio",
    ...STEP_QUALITY[quality],
  };
}
