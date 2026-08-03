/**
 * Massenschaetzung aus Volumen und Dichte.
 *
 * Das ist der Wert, bei dem ein Werkzeug am leichtesten unehrlich wird: Es
 * multipliziert zwei Zahlen und sieht danach aus wie eine Wiegung. Deshalb gibt
 * diese Funktion IMMER eine Spanne zurueck, nie einen einzelnen Wert.
 */

import type { Confidence } from "../config/materials";

export interface MassEstimate {
  /** Massiv gerechnet — die obere Grenze. */
  solidGrams: number;
  /** Mit dem gewaehlten Fuellgrad linear gerechnet — die untere Grenze. */
  filledGrams: number;
  confidence: Confidence;
}

/**
 * WARUM EINE SPANNE UND KEIN WERT
 *
 * Die lineare Rechnung `Volumen * Dichte * Fuellgrad` unterstellt, dass der
 * Fuellgrad im ganzen Bauteil gilt. Ein Slicer arbeitet anders: Er legt zuerst
 * Waende, Boden und Decke in voller Dichte an und fuellt nur den Rest mit dem
 * eingestellten Muster. Bei einem duennwandigen Gehaeuse besteht das Bauteil
 * fast vollstaendig aus Wand — dort liegt die lineare Rechnung um ein Vielfaches
 * zu niedrig. Bei einem massigen Block stimmt sie gut.
 *
 * Aus einer einzelnen Zahl liesse sich nicht ablesen, in welchem der beiden Faelle
 * man sich befindet. Aus "zwischen 340 g und 1,7 kg" schon: Ist die Spanne weit,
 * entscheidet die Wandstaerke — und dann muss der Slicer ran, nicht dieses
 * Werkzeug. Stuetzmaterial ist in beiden Grenzen NICHT enthalten.
 */
export function estimateMass(
  volumeMm3: number,
  density: number,
  confidence: Confidence,
  infillPercent: number,
): MassEstimate {
  const volumeCm3 = volumeMm3 / 1000;
  const solidGrams = volumeCm3 * density;
  const fraction = Math.min(Math.max(infillPercent, 0), 100) / 100;
  return {
    solidGrams,
    filledGrams: solidGrams * fraction,
    confidence,
  };
}

/**
 * Wie weit liegen die beiden Grenzen auseinander?
 *
 * Ab dem Dreifachen wird in der Oberflaeche ausdruecklich darauf hingewiesen,
 * dass die Zahl fuer eine Kalkulation nicht taugt.
 */
export function spreadFactor(estimate: MassEstimate): number {
  return estimate.filledGrams > 0 ? estimate.solidGrams / estimate.filledGrams : Infinity;
}

/**
 * Verhaeltnis von Oberflaeche zu Volumen, normiert auf eine Kugel gleichen Volumens.
 *
 * 1 = kompakt wie eine Kugel. Grosse Werte bedeuten duennwandig oder stark
 * zerklueftet — genau die Faelle, in denen die lineare Fuellgradrechnung versagt.
 * Damit laesst sich die Warnung begruenden, statt sie zu raten.
 */
export function compactness(volumeMm3: number, areaMm2: number): number {
  if (volumeMm3 <= 0 || areaMm2 <= 0) return Infinity;
  const sphereRadius = Math.cbrt((3 * volumeMm3) / (4 * Math.PI));
  const sphereArea = 4 * Math.PI * sphereRadius * sphereRadius;
  return areaMm2 / sphereArea;
}
