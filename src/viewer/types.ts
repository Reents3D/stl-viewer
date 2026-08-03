/** Zustandstypen des Betrachters. */

export type RenderMode = "solid" | "edges" | "wireframe" | "xray";

export type StandardView = "iso" | "front" | "back" | "left" | "right" | "top" | "bottom";

/**
 * Was ein Klick ins Modell ausloest.
 *
 * Bewusst EIN Modus statt mehrerer Schalter: Ein Klick kann nicht gleichzeitig
 * eine Anmerkung setzen und einen Messpunkt legen. Wer beides angeboten bekommt,
 * bekommt beim ersten Fehlklick eine Anmerkung, die er nicht wollte.
 */
export type ToolMode = "orbit" | "annotate" | "measure";

export type Axis = "x" | "y" | "z";

export interface ClipState {
  enabled: boolean;
  axis: Axis;
  /** 0 bis 1, bezogen auf die Huellkoerperkante der gewaehlten Achse. */
  position: number;
  flip: boolean;
}

export interface ViewState {
  renderMode: RenderMode;
  orthographic: boolean;
  showGrid: boolean;
  showAxes: boolean;
  showBuildVolume: boolean;
  buildVolumeId: string;
  modelColor: string;
  background: "hell" | "dunkel" | "verlauf";
  clip: ClipState;
}

export const DEFAULT_VIEW_STATE: ViewState = {
  renderMode: "solid",
  orthographic: false,
  showGrid: true,
  showAxes: true,
  showBuildVolume: false,
  buildVolumeId: "xxl",
  modelColor: "#B8C4CC",
  background: "verlauf",
  clip: { enabled: false, axis: "z", position: 0.5, flip: false },
};

/**
 * Modellfarben.
 *
 * Ein technisches Grau steht vorn, nicht das Markenpetrol: Beim Pruefen einer
 * Geometrie soll die Form auffallen, nicht die Farbe. Die Filamenttoene daneben
 * helfen bei der Frage "wie wirkt das Bauteil in Schwarz" — sie sind Anhaltspunkte
 * fuer die Anmutung, keine Farbmuster. Verbindlich ist nur ein echtes Musterstueck.
 */
export const MODEL_COLORS: ReadonlyArray<{ hex: string; label: string }> = [
  { hex: "#B8C4CC", label: "Technisch Grau" },
  { hex: "#E8EDF0", label: "Weiss" },
  { hex: "#2B2F33", label: "Schwarz" },
  { hex: "#0C4251", label: "Reents Petrol" },
  { hex: "#88BBD7", label: "Hellblau" },
  { hex: "#C2412D", label: "Rot" },
  { hex: "#D89B2A", label: "Orange" },
  { hex: "#3C7A4B", label: "Gruen" },
  { hex: "#7D6B9E", label: "Violett" },
  { hex: "#C9A227", label: "Gold" },
];

export interface Annotation {
  id: string;
  /** Fortlaufende Nummer fuer Marke, Liste und PDF — bleibt beim Loeschen stabil. */
  number: number;
  /** Position im MODELLKOORDINATENSYSTEM, nicht in Weltkoordinaten. */
  point: { x: number; y: number; z: number };
  normal: { x: number; y: number; z: number };
  /** Kamerastand beim Setzen — erlaubt "Ansicht wiederherstellen" und das PDF. */
  camera: { position: [number, number, number]; target: [number, number, number] };
  title: string;
  text: string;
  category: AnnotationCategory;
}

export type AnnotationCategory = "hinweis" | "aenderung" | "frage" | "freigabe";

export const ANNOTATION_CATEGORIES: ReadonlyArray<{
  id: AnnotationCategory;
  de: string;
  en: string;
  color: string;
}> = [
  { id: "hinweis", de: "Hinweis", en: "Note", color: "#0C4251" },
  { id: "aenderung", de: "Änderung", en: "Change", color: "#b3261e" },
  { id: "frage", de: "Frage", en: "Question", color: "#a86a00" },
  { id: "freigabe", de: "Freigabe", en: "Approved", color: "#14794a" },
];

export interface Measurement {
  id: string;
  a: { x: number; y: number; z: number };
  b: { x: number; y: number; z: number };
  distance: number;
}
