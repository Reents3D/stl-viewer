/**
 * Groessenvergleich: bekannte Gegenstaende neben dem Modell.
 *
 * WARUM DAS DIE WICHTIGSTE ANZEIGE IM GANZEN WERKZEUG IST
 * Am Bildschirm sieht ein 60-mm-Wuerfel genauso gross aus wie ein 2,4-m-Exponat —
 * die Kamera passt beides gleich ins Bild. In der Seitenleiste steht zwar
 * "1.800 x 900 x 2.400 mm", aber eine Zahl erzeugt keine Vorstellung. Eine
 * Silhouette daneben schon, und zwar sofort und ohne Nachdenken.
 *
 * Bei einem Dienstleister, dessen Alleinstellung Grossformat ist, ist die
 * fehlende Groessenvorstellung die teuerste Fehlannahme im ganzen Ablauf: Sie
 * faellt erst auf, wenn das Bauteil in der Halle steht.
 *
 * ALLE MASSE SIND ECHT, KEINE GESCHAETZTEN
 * Europalette nach EN 13698-1, DIN A4 nach ISO 216. Die Person steht auf
 * 1.750 mm — das ist eine Setzung, aber eine uebliche und offen benannte.
 */

import * as THREE from "three";

export type ScaleReferenceId = "none" | "person" | "palette" | "a4" | "tasse";

export interface ScaleReferenceInfo {
  id: ScaleReferenceId;
  de: string;
  en: string;
  /** Aussenmasse in mm, wie sie in der Oberflaeche stehen. */
  size: { x: number; y: number; z: number } | null;
  /** Kurze Herkunftsangabe — damit niemand raten muss, woher die Zahl kommt. */
  source?: { de: string; en: string };
}

export const SCALE_REFERENCES: readonly ScaleReferenceInfo[] = [
  { id: "none", de: "Keiner", en: "None", size: null },
  {
    id: "person",
    de: "Person, 1,75 m",
    en: "Person, 1.75 m",
    size: { x: 500, y: 300, z: 1750 },
    source: { de: "angenommene Körpergröße", en: "assumed body height" },
  },
  {
    id: "palette",
    de: "Europalette",
    en: "Euro pallet",
    size: { x: 1200, y: 800, z: 144 },
    source: { de: "EN 13698-1", en: "EN 13698-1" },
  },
  {
    id: "a4",
    de: "DIN-A4-Blatt",
    en: "A4 sheet",
    size: { x: 297, y: 210, z: 1 },
    source: { de: "ISO 216", en: "ISO 216" },
  },
  {
    id: "tasse",
    de: "Kaffeetasse",
    en: "Coffee mug",
    size: { x: 105, y: 80, z: 95 },
    source: { de: "übliche Bauform", en: "typical shape" },
  },
];

export function referenceInfo(id: ScaleReferenceId): ScaleReferenceInfo {
  return SCALE_REFERENCES.find((r) => r.id === id) ?? SCALE_REFERENCES[0];
}

/** Petrol-400 aus dem Corporate Design: deutlich anders als das Bauteilgrau. */
const REFERENCE_COLOR = 0x4d8298;

function material(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: REFERENCE_COLOR,
    roughness: 0.95,
    metalness: 0,
    // Kein Glanz und kein Eigenleuchten: Die Referenz soll im Bild hinter dem
    // Bauteil zuruecktreten. Sie beantwortet eine Frage, sie ist nicht der Inhalt.
  });
}

/**
 * Baut das Referenzobjekt. Der Ursprung der Gruppe liegt MITTIG in x und y und
 * UNTEN in z — der Aufsetzpunkt auf der Bauplatte. Damit laesst es sich neben
 * das Modell stellen, ohne dass der Aufrufer die Hoehe kennen muss.
 */
export function buildReference(id: ScaleReferenceId): THREE.Group | null {
  switch (id) {
    case "person":
      return buildPerson(1750);
    case "palette":
      return buildPallet();
    case "a4":
      return buildSheet();
    case "tasse":
      return buildMug();
    default:
      return null;
  }
}

/* --------------------------------------------------------------------- Person */

/**
 * Eine Figur aus Grundkoerpern statt einer nachgezeichneten Silhouette.
 *
 * Ein flacher Umriss saehe eleganter aus, verschwindet aber, sobald der Kunde
 * das Modell dreht — von der Seite bleibt ein Strich. Ein Koerper aus Zylindern
 * und Kugeln ist aus jeder Richtung als Mensch erkennbar, und genau darauf
 * kommt es an: Man muss ihn nicht deuten.
 */
function buildPerson(height: number): THREE.Group {
  const group = new THREE.Group();
  const mat = material();
  const H = height;

  const add = (geometry: THREE.BufferGeometry, x: number, y: number, z: number): void => {
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(x, y, z);
    group.add(mesh);
  };

  /** Zylinder stehen in three.js entlang y — fuer die Z-oben-Welt aufrichten. */
  const limb = (radius: number, length: number): THREE.CylinderGeometry => {
    const g = new THREE.CylinderGeometry(radius, radius, length, 12);
    g.rotateX(Math.PI / 2);
    return g;
  };

  // Beine: von der Platte bis zur Huefte.
  const legLength = 0.47 * H;
  add(limb(0.032 * H, legLength), -0.045 * H, 0, legLength / 2);
  add(limb(0.032 * H, legLength), 0.045 * H, 0, legLength / 2);

  // Rumpf: von der Huefte bis zur Schulter, leicht kastenfoermig.
  const torsoHeight = 0.29 * H;
  const torso = new THREE.BoxGeometry(0.19 * H, 0.1 * H, torsoHeight);
  add(torso, 0, 0, legLength + torsoHeight / 2);

  // Arme: haengen seitlich am Rumpf.
  const armLength = 0.3 * H;
  const shoulder = legLength + torsoHeight;
  add(limb(0.026 * H, armLength), -0.115 * H, 0, shoulder - armLength / 2 - 0.02 * H);
  add(limb(0.026 * H, armLength), 0.115 * H, 0, shoulder - armLength / 2 - 0.02 * H);

  // Hals und Kopf.
  add(limb(0.022 * H, 0.04 * H), 0, 0, shoulder + 0.02 * H);
  add(new THREE.SphereGeometry(0.043 * H, 20, 14), 0, 0, shoulder + 0.083 * H);

  return group;
}

/* ----------------------------------------------------------------- Europalette */

/** 1200 x 800 x 144 mm nach EN 13698-1: neun Kloetze, drei Kufen, Deckbretter. */
function buildPallet(): THREE.Group {
  const group = new THREE.Group();
  const mat = material();
  const add = (g: THREE.BufferGeometry, x: number, y: number, z: number): void => {
    const mesh = new THREE.Mesh(g, mat);
    mesh.position.set(x, y, z);
    group.add(mesh);
  };

  // Untere Kufen (drei Bretter quer, 22 mm dick)
  const runner = new THREE.BoxGeometry(1200, 100, 22);
  for (const y of [-350, 0, 350]) add(runner, 0, y, 11);

  // Kloetze 100 x 100 x 78 mm, neun Stueck
  const block = new THREE.BoxGeometry(100, 145, 78);
  for (const x of [-550, 0, 550]) for (const y of [-327, 0, 327]) add(block, x, y, 22 + 39);

  // Deckbretter: fuenf Laengsbretter, 22 mm
  const board = new THREE.BoxGeometry(1200, 100, 22);
  for (const y of [-350, -175, 0, 175, 350]) add(board, 0, y, 144 - 11);

  return group;
}

/* -------------------------------------------------------------- DIN-A4-Blatt */

/**
 * 297 x 210 mm, flach auf der Platte.
 *
 * Ein Millimeter dick statt der echten 0,1 mm: Ein Blatt in wahrer Staerke ist
 * bei einem Bauteil von zwei Metern nicht mehr als eine Kante und damit als
 * Vergleich wertlos.
 */
function buildSheet(): THREE.Group {
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(297, 210, 1), material());
  mesh.position.set(0, 0, 0.5);
  group.add(mesh);
  return group;
}

/* -------------------------------------------------------------- Kaffeetasse */

function buildMug(): THREE.Group {
  const group = new THREE.Group();
  const mat = material();

  const body = new THREE.CylinderGeometry(40, 36, 95, 24);
  body.rotateX(Math.PI / 2);
  const mesh = new THREE.Mesh(body, mat);
  mesh.position.set(0, 0, 47.5);
  group.add(mesh);

  const handle = new THREE.TorusGeometry(22, 5, 8, 20, Math.PI * 1.2);
  const handleMesh = new THREE.Mesh(handle, mat);
  handleMesh.position.set(52, 0, 52);
  handleMesh.rotation.set(Math.PI / 2, 0, -Math.PI / 2.6);
  group.add(handleMesh);

  return group;
}
