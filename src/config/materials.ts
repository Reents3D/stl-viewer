/**
 * Dichtewerte fuer die Gewichtsschaetzung.
 *
 * HERKUNFT: uebernommen aus der offenen Materialdatenbank des FDM-Materialberaters
 * (github.com/Reents3D/fdm-material-advisor, Feld `mechanics.density`, Stand
 * 2026-08-03). Die Konfidenz wandert MIT — ein Gewicht, das auf einem geschaetzten
 * Dichtewert beruht, darf sich in der Oberflaeche nicht so darstellen wie eines,
 * das auf einem Datenblatt mit Pruefnorm beruht.
 *
 * WARUM KOPIERT UND NICHT IMPORTIERT: Der Materialberater ist ein eigenes Repo mit
 * eigenem Auslieferungstakt. Ein Fremdimport haette entweder eine Netzwerkanfrage
 * verlangt (verboten, siehe CSP in vite.config.ts) oder ein Untermodul, das bei
 * jedem Klon mitgezogen wird. 41 Zahlenpaare rechtfertigen weder das eine noch das
 * andere. Bei einer Aktualisierung dort gleicht scripts/sync-densities.mjs ab.
 */

export type Confidence = "high" | "medium" | "low" | "estimated";

export interface MaterialDensity {
  id: string;
  name: string;
  /** g/cm³ */
  density: number;
  confidence: Confidence;
}

export const MATERIALS: readonly MaterialDensity[] = [
  { id: "abs", name: "ABS", density: 1.05, confidence: "medium" },
  { id: "abs-gf", name: "ABS-GF", density: 1.12, confidence: "low" },
  { id: "abs-pc", name: "ABS-PC", density: 1.13, confidence: "medium" },
  { id: "asa", name: "ASA", density: 1.05, confidence: "medium" },
  { id: "asa-aero", name: "ASA Aero", density: 0.99, confidence: "medium" },
  { id: "asa-cf", name: "ASA-CF", density: 1.02, confidence: "medium" },
  { id: "esd-abs", name: "ESD-ABS", density: 1.06, confidence: "medium" },
  { id: "esd-petg", name: "ESD-PETG", density: 1.27, confidence: "medium" },
  { id: "esd-pla", name: "ESD-PLA", density: 1.24, confidence: "medium" },
  { id: "greentec", name: "GreenTEC", density: 1.35, confidence: "medium" },
  { id: "hips", name: "HIPS", density: 1.05, confidence: "low" },
  { id: "obc", name: "OBC", density: 0.905, confidence: "low" },
  { id: "pa12", name: "PA12", density: 1.01, confidence: "medium" },
  { id: "pa12-cf", name: "PA12-CF", density: 1.03, confidence: "medium" },
  { id: "pa6", name: "PA6", density: 1.13, confidence: "estimated" },
  { id: "pa6-cf", name: "PA6-CF", density: 1.09, confidence: "medium" },
  { id: "pa6-gf", name: "PA6-GF", density: 1.21, confidence: "medium" },
  { id: "paht", name: "PAHT", density: 1.15, confidence: "medium" },
  { id: "paht-cf", name: "PAHT-CF", density: 1.25, confidence: "medium" },
  { id: "pc", name: "PC", density: 1.2, confidence: "medium" },
  { id: "pc-fr", name: "PC-FR", density: 1.19, confidence: "medium" },
  { id: "pc-pbt", name: "PC-PBT", density: 1.2, confidence: "medium" },
  { id: "pctg", name: "PCTG", density: 1.23, confidence: "medium" },
  { id: "pctg-gf", name: "PCTG-GF", density: 1.31, confidence: "low" },
  { id: "peba", name: "PEBA", density: 1.0, confidence: "low" },
  { id: "pet-cf", name: "PET-CF", density: 1.29, confidence: "medium" },
  { id: "petg", name: "PETG", density: 1.25, confidence: "medium" },
  { id: "petg-cf", name: "PETG-CF", density: 1.27, confidence: "high" },
  { id: "pla", name: "PLA", density: 1.24, confidence: "medium" },
  { id: "pla-cf", name: "PLA-CF", density: 1.26, confidence: "low" },
  { id: "pla-tough", name: "PLA-Tough", density: 1.2, confidence: "medium" },
  { id: "pmma", name: "PMMA", density: 1.17, confidence: "medium" },
  { id: "pp", name: "PP", density: 0.96, confidence: "low" },
  { id: "pps-cf", name: "PPS-CF", density: 1.26, confidence: "high" },
  { id: "pvc", name: "PVC", density: 1.35, confidence: "low" },
  { id: "pvdf", name: "PVDF", density: 1.79, confidence: "low" },
  { id: "tpu-58d", name: "TPU 58D", density: 1.2, confidence: "medium" },
  { id: "tpu-85a", name: "TPU 85A", density: 1.18, confidence: "medium" },
  { id: "tpu-95a", name: "TPU 95A", density: 1.2, confidence: "medium" },
  { id: "tpu-98a", name: "TPU 98A", density: 1.19, confidence: "medium" },
  { id: "tpu-esd", name: "TPU-ESD", density: 1.2, confidence: "medium" },
];

/** PLA ist laut Materialberater das XXL-Arbeitspferd - als Voreinstellung ehrlich. */
export const DEFAULT_MATERIAL_ID = "pla";

export function materialById(id: string): MaterialDensity {
  return MATERIALS.find((m) => m.id === id) ?? MATERIALS.find((m) => m.id === DEFAULT_MATERIAL_ID)!;
}

/**
 * Fuellgrade fuer die Massenschaetzung.
 *
 * Ehrlichkeitsvorbehalt: Das ist eine LINEARE Naeherung ueber das Volumen des
 * Koerpers. Ein echter Slicer rechnet Wandstaerken, Boden- und Deckschichten und
 * Stuetzmaterial getrennt - bei duennwandigen Bauteilen liegt die lineare Naeherung
 * deutlich zu niedrig, weil dort fast alles Wand ist und kaum etwas Fuellung. Der
 * Wert taugt zur Groessenordnung fuer Versand und Handhabung, nicht zur Kalkulation.
 * Genau das steht auch in der Oberflaeche.
 */
export const INFILL_PRESETS = [10, 15, 20, 25, 40, 60, 80, 100] as const;
export const DEFAULT_INFILL = 20;
