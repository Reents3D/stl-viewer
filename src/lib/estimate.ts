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
 * ACHTUNG — das ist KEIN Hinweis auf die Bauteilform. Der Wert ist exakt
 * `100 / Fuellgrad` und haengt ausschliesslich am Schieberegler: bei 20 %
 * kommt immer 5 heraus, bei einem Wuerfel wie bei einem Gitter.
 *
 * Bis 2026-08-03 stand er in der Bedingung fuer die Warnung "duennwandig".
 * Folge: Bei der Voreinstellung von 20 % Fuellung erschien die Warnung unter
 * JEDEM Bauteil. Eine Warnung, die immer da ist, ist keine Warnung mehr — sie
 * wird nach dem dritten Modell nicht mehr gelesen. Aufgefallen an einem
 * Fachwerkrahmen, bei dem sie sachlich sogar zutraf, aber mit dem falschen Wort.
 *
 * Der Wert bleibt, weil er fuer die Anzeige der Spanne selbst gebraucht wird.
 * Fuer die Frage "ist die untere Grenze belastbar" ist `compactness` zustaendig.
 */
export function spreadFactor(estimate: MassEstimate): number {
  return estimate.filledGrams > 0 ? estimate.solidGrams / estimate.filledGrams : Infinity;
}

/**
 * Oberflaeche im Verhaeltnis zum Volumen, normiert auf eine Kugel gleichen Volumens.
 *
 * Die Kugel ist der kompakteste Koerper ueberhaupt, deshalb ist sie der Nullpunkt:
 *
 *   Kugel                        1,0
 *   Wuerfel                      1,2
 *   Platte 100 x 100 x 2 mm      5,8
 *   Fachwerk aus schlanken Staeben  ~9
 *   Gehaeuse mit 1 mm Wand      ~16
 *
 * Je hoeher der Wert, desto mehr besteht das Bauteil aus Rand statt aus Inhalt —
 * und desto weniger sagt der Fuellgrad ueber die Masse aus, weil ein Slicer den
 * Rand ohnehin voll ausdruckt. Das ist die EINZIGE Groesse hier, die etwas ueber
 * die Form aussagt.
 */
export function compactness(volumeMm3: number, areaMm2: number): number {
  if (volumeMm3 <= 0 || areaMm2 <= 0) return Infinity;
  const sphereRadius = Math.cbrt((3 * volumeMm3) / (4 * Math.PI));
  const sphereArea = 4 * Math.PI * sphereRadius * sphereRadius;
  return areaMm2 / sphereArea;
}

/**
 * Ab hier ist die untere Grenze der Massenschaetzung nicht mehr belastbar.
 *
 * 4 liegt oberhalb aller kompakten Formen (Wuerfel 1,2, Zylinder ~1,3, auch ein
 * kraeftiger Winkel bleibt darunter) und unterhalb der Faelle, in denen der Rand
 * das Bauteil ausmacht. Eine duenne Platte liegt bei 5,8 und wird damit erfasst —
 * zu Recht: Bei 2 mm Dicke besteht sie nur aus Boden- und Deckschicht, der
 * Fuellgrad aendert an ihrer Masse praktisch nichts.
 */
export const FILIGREE_THRESHOLD = 4;

export function isFiligree(volumeMm3: number, areaMm2: number): boolean {
  return compactness(volumeMm3, areaMm2) > FILIGREE_THRESHOLD;
}
