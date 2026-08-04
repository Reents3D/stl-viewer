/** Gemeinsame Typen fuer Parser, Analyse und Worker-Protokoll. */

import type { CadFormat, TessellationQuality } from "./occt";

/**
 * "step" steht bewusst neben den beiden STL-Formen.
 *
 * Ein STEP ist etwas anderes als ein Dreiecksnetz: Es beschreibt Flaechen exakt.
 * Was der Betrachter davon anzeigt und misst, ist die TESSELLIERUNG — eine
 * Annaeherung, deren Feinheit eingestellt wird. Die Unterscheidung wandert
 * deshalb bis in die Oberflaeche und ins PDF durch, statt hier zu enden.
 */
export type StlFormat = "binary" | "ascii" | "step" | "iges";

export interface ParsedStl {
  /** 9 Werte je Dreieck (3 Eckpunkte x/y/z), nicht indiziert. */
  positions: Float32Array;
  triangles: number;
  format: StlFormat;
  /** Name aus der `solid <name>`-Zeile, sofern vorhanden und nicht leer. */
  solidName: string | null;
  /**
   * Bytes, die hinter dem letzten Dreieck stehen. Manche Exporter haengen
   * Metadaten an. Kein Fehler, aber ein Hinweis darauf, dass die Datei nicht
   * exakt der Spezifikation folgt - deshalb wird es gezaehlt statt verschwiegen.
   */
  trailingBytes: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface BoundingBox {
  min: Vec3;
  max: Vec3;
  /** max - min, in Dateieinheiten (per Konvention mm). */
  size: Vec3;
  center: Vec3;
  /** Raumdiagonale - Bezugsgroesse fuer alle Toleranzen. */
  diagonal: number;
}

export interface Topology {
  /** Eckpunkte nach dem Verschweissen deckungsgleicher Koordinaten. */
  vertices: number;
  /** Kanten, die nur EINMAL vorkommen: das Netz hat dort ein Loch. */
  boundaryEdges: number;
  /** Kanten, an denen mehr als zwei Dreiecke haengen. */
  nonManifoldEdges: number;
  /** Kanten mit zwei gleichgerichteten Nachbarn: widerspruechliche Drehrichtung. */
  flippedEdges: number;
  watertight: boolean;
}

export interface MeshStats {
  triangles: number;
  /** Dreiecke ohne Flaeche (zwei gleiche Ecken oder kollinear). */
  degenerate: number;
  bbox: BoundingBox;
  /** mm³, Betrag. Nur bei geschlossenem Netz physikalisch sinnvoll. */
  volumeMm3: number;
  /**
   * mm³ mit Vorzeichen. Negativ = das Netz ist nach innen gedreht.
   * Wird getrennt gefuehrt, weil das Vorzeichen ein BEFUND ist, kein Rechenrest.
   */
  signedVolumeMm3: number;
  /** mm² Oberflaeche. */
  areaMm2: number;
  /** Schwerpunkt des Koerpers (nicht der Dreiecke). Null bei Volumen ~ 0. */
  centroid: Vec3 | null;
  /** Null, wenn die Pruefung wegen der Modellgroesse ausgelassen wurde. */
  topology: Topology | null;
  topologySkipped: boolean;
}

/* ------------------------------------------------------------ Worker-Protokoll */

export interface WorkerRequest {
  id: number;
  buffer: ArrayBuffer;
  /** Faktor auf alle Koordinaten, z. B. 25.4 fuer Zoll-Dateien. */
  scale: number;
}

export interface CadWorkerRequest {
  id: number;
  buffer: ArrayBuffer;
  /** Welche Lesefunktion von OpenCascade zustaendig ist. */
  format: CadFormat;
  /**
   * Feinheit der Tessellierung. KEIN Skalierungsfaktor — ein STEP traegt seine
   * Einheit in der Datei, OpenCascade rechnet sie auf Millimeter um.
   */
  quality: TessellationQuality;
}

export type WorkerResponse =
  | { id: number; kind: "progress"; phase: "parse" | "analyse"; ratio: number }
  | {
      id: number;
      kind: "done";
      positions: ArrayBuffer;
      triangles: number;
      format: StlFormat;
      solidName: string | null;
      trailingBytes: number;
      /** Nur bei STEP/IGES: Zahl der zusammengelegten Einzelkoerper. */
      parts?: number;
      stats: MeshStats;
    }
  | { id: number; kind: "error"; message: string; code: StlErrorCode };

export type StlErrorCode =
  | "empty"
  | "too-small"
  | "not-stl"
  | "no-triangles"
  | "truncated"
  | "out-of-memory"
  | "cad-failed"
  /** Endung gehoert zu keinem der gelesenen Formate. */
  | "unsupported";
