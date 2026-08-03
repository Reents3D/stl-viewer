/**
 * Anmerkungen sichern und zurueckholen.
 *
 * Gespeichert werden AUSSCHLIESSLICH die Anmerkungen — nie die Geometrie. Eine
 * Datei, die das Modell mitnimmt, waere bequemer und wuerde genau das aufheben,
 * wofuer dieses Werkzeug gebaut ist: Der Kunde soll eine Datei weitergeben
 * koennen, ohne sein Bauteil mitzugeben.
 *
 * Der Preis dafuer steht in der Oberflaeche: Ohne die zugehoerige STL sind die
 * Anmerkungen wertlos. Deshalb merkt sich die Datei Namen und Dreieckszahl des
 * Modells und warnt, wenn beides nicht passt.
 */

import type { Annotation, AnnotationCategory } from "../viewer/types";
import { ANNOTATION_CATEGORIES } from "../viewer/types";

export const ANNOTATION_FILE_FORMAT = "reents3d-stl-annotations";
export const ANNOTATION_FILE_VERSION = 1;

export interface AnnotationFile {
  format: typeof ANNOTATION_FILE_FORMAT;
  version: number;
  model: {
    fileName: string;
    triangles: number;
    /** Kantenlaengen in mm — zweite Probe auf dasselbe Bauteil. */
    size: [number, number, number];
  };
  created: string;
  annotations: Annotation[];
}

export function toAnnotationFile(
  annotations: readonly Annotation[],
  model: { fileName: string; triangles: number; size: [number, number, number] },
  now: Date,
): AnnotationFile {
  return {
    format: ANNOTATION_FILE_FORMAT,
    version: ANNOTATION_FILE_VERSION,
    model,
    created: now.toISOString(),
    annotations: [...annotations],
  };
}

export type ParseResult =
  | { ok: true; file: AnnotationFile; matchesModel: boolean }
  | { ok: false; reason: "not-json" | "wrong-format" | "no-annotations" };

/**
 * Einlesen mit vollstaendiger Pruefung.
 *
 * Die Datei kommt von aussen — moeglicherweise per E-Mail, moeglicherweise von
 * Hand bearbeitet. Jedes Feld wird geprueft, bevor es in den Zustand wandert:
 * Eine Anmerkung mit fehlender Position wuerde sonst beim Projizieren eine
 * Ausnahme werfen und die ganze Ansicht mitreissen.
 */
export function parseAnnotationFile(
  text: string,
  current: { fileName: string; triangles: number },
): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, reason: "not-json" };
  }

  if (!isRecord(raw) || raw.format !== ANNOTATION_FILE_FORMAT) {
    return { ok: false, reason: "wrong-format" };
  }
  const model = isRecord(raw.model) ? raw.model : {};
  const list = Array.isArray(raw.annotations) ? raw.annotations : [];
  const annotations = list.map(normaliseAnnotation).filter((a): a is Annotation => a !== null);

  if (annotations.length === 0) return { ok: false, reason: "no-annotations" };

  const file: AnnotationFile = {
    format: ANNOTATION_FILE_FORMAT,
    version: typeof raw.version === "number" ? raw.version : 1,
    model: {
      fileName: typeof model.fileName === "string" ? model.fileName : "",
      triangles: typeof model.triangles === "number" ? model.triangles : 0,
      size: isVec3Array(model.size) ? model.size : [0, 0, 0],
    },
    created: typeof raw.created === "string" ? raw.created : new Date(0).toISOString(),
    annotations,
  };

  // Die Dreieckszahl ist die schaerfere Probe: Dateinamen werden umbenannt,
  // die Dreieckszahl aendert sich nur, wenn das Modell ein anderes ist.
  const matchesModel =
    file.model.triangles === current.triangles || file.model.fileName === current.fileName;

  return { ok: true, file, matchesModel };
}

function normaliseAnnotation(value: unknown, index: number): Annotation | null {
  if (!isRecord(value)) return null;
  const point = toVec3(value.point);
  if (!point) return null;

  const normal = toVec3(value.normal) ?? { x: 0, y: 0, z: 1 };
  const camera = isRecord(value.camera) ? value.camera : {};
  const position = isVec3Array(camera.position) ? camera.position : ([0, 0, 1] as [number, number, number]);
  const target = isVec3Array(camera.target) ? camera.target : ([0, 0, 0] as [number, number, number]);
  // Dateien aus fruehen Fassungen kennen `up` nicht — dann gilt Z nach oben,
  // die Voreinstellung des Betrachters.
  const up = isVec3Array(camera.up) ? camera.up : ([0, 0, 1] as [number, number, number]);

  const category = ANNOTATION_CATEGORIES.some((c) => c.id === value.category)
    ? (value.category as AnnotationCategory)
    : "hinweis";

  return {
    id: typeof value.id === "string" && value.id.length > 0 ? value.id : `import-${index}`,
    number: typeof value.number === "number" ? value.number : index + 1,
    point,
    normal,
    camera: { position, target, up },
    title: typeof value.title === "string" ? value.title : "",
    text: typeof value.text === "string" ? value.text : "",
    category,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toVec3(value: unknown): { x: number; y: number; z: number } | null {
  if (!isRecord(value)) return null;
  const { x, y, z } = value;
  if (!isFiniteNumber(x) || !isFiniteNumber(y) || !isFiniteNumber(z)) return null;
  return { x, y, z };
}

function isVec3Array(value: unknown): value is [number, number, number] {
  return Array.isArray(value) && value.length === 3 && value.every(isFiniteNumber);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
