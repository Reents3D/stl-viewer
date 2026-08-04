/**
 * Wandstaerke entlang der Flaechennormalen.
 *
 * Ausgelagert aus der Szene, weil es sich hier um reine Strahlgeometrie handelt
 * — three.js braucht dafuer keinen WebGL-Kontext, und damit laesst sich das
 * Verhalten unter Node festhalten statt im Browser zu erraten.
 */

import * as THREE from "three";

export interface ThicknessResult {
  /** Abstand vom Klickpunkt bis zur naechsten Flaeche dahinter, in mm. */
  thickness: number;
  /** Austrittspunkt in Weltkoordinaten. */
  exit: THREE.Vector3;
}

/**
 * Strahl vom Auftreffpunkt entgegen der Normalen ins Bauteil.
 *
 * ZWEI FALLEN, BEIDE NOTWENDIG ZU UMGEHEN
 *
 * 1. Der Raycaster ueberspringt Rueckseiten, solange der Werkstoff auf
 *    FrontSide steht — und die Rueckwand einer Wand ist vom Inneren aus genau
 *    das. Ohne Umschalten auf DoubleSide faende der Strahl entweder nichts oder
 *    erst die uebernaechste Flaeche, und die gemessene Staerke waere
 *    stillschweigend zu gross.
 * 2. Startet der Strahl exakt auf der Flaeche, trifft er sie durch
 *    Rundungsfehler sofort wieder selbst und meldet null. Deshalb der kleine
 *    Versatz nach innen, der am Ende wieder aufaddiert wird.
 *
 * WAS DER WERT BEDEUTET — UND WAS NICHT
 * Gemessen wird der Materialweg IN RICHTUNG DER NORMALEN. Bei parallelen
 * Waenden ist das die Wandstaerke. Trifft man dagegen eine Stelle, an der in
 * dieser Richtung gar kein Hohlraum liegt — etwa nahe der Kante eines
 * Hohlkoerpers —, kommt die volle Materialtiefe heraus, und das ist richtig so:
 * Dort IST das Bauteil so dick. Wer diesen Wert fuer eine zu dicke Wand haelt,
 * hat an der falschen Stelle geklickt, nicht falsch gemessen.
 */
export function probeThickness(
  mesh: THREE.Mesh,
  raycaster: THREE.Raycaster,
  worldPoint: THREE.Vector3,
  worldNormal: THREE.Vector3,
  epsilon: number,
): ThicknessResult | null {
  const direction = worldNormal.clone().negate();
  if (direction.lengthSq() === 0) return null;
  direction.normalize();

  const origin = worldPoint.clone().addScaledVector(direction, epsilon);

  const material = mesh.material as THREE.Material;
  const previousSide = material.side;
  material.side = THREE.DoubleSide;
  raycaster.set(origin, direction);
  const hits = raycaster.intersectObject(mesh, false);
  material.side = previousSide;

  const first = hits[0];
  if (!first) return null;

  return { thickness: first.distance + epsilon, exit: first.point.clone() };
}
