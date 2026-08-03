/**
 * Werkstoffe der Darstellung — nicht zu verwechseln mit den Druckwerkstoffen
 * in src/config/materials.ts.
 */

import * as THREE from "three";

import type { RenderMode } from "./types";

export interface ModelMaterials {
  surface: THREE.MeshStandardMaterial;
  edges: THREE.LineBasicMaterial;
  wire: THREE.MeshBasicMaterial;
}

export function createMaterials(color: string): ModelMaterials {
  return {
    /**
     * MeshStandardMaterial mit hoher Rauheit und ohne Metallanteil.
     *
     * Ein glaenzender Werkstoff sieht im Bild besser aus und ist zum PRUEFEN
     * schlechter: Glanzlichter legen sich ueber genau die flachen Uebergaenge, an
     * denen man Stufen und Wellen erkennen will. Matt zeigt die Geometrie.
     */
    surface: new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.82,
      metalness: 0.0,
      // Ein gedruckter Koerper ist nie ganz gleichmaessig — eine Spur
      // Eigenleuchten in der Schattenseite haelt Hinterschnitte lesbar.
      emissive: new THREE.Color(color).multiplyScalar(0.06),
      side: THREE.FrontSide,
    }),
    edges: new THREE.LineBasicMaterial({ color: 0x0b1220, transparent: true, opacity: 0.55 }),
    wire: new THREE.MeshBasicMaterial({ color: new THREE.Color(color), wireframe: true }),
  };
}

/**
 * Ab hier wird die Kantenanzeige nicht mehr angeboten.
 *
 * EdgesGeometry vergleicht jede Kante mit ihrer Nachbarkante und legt daraus
 * eigene Liniengeometrie an. Bei 300.000 Dreiecken dauert das schon spuerbar, und
 * das Ergebnis ist bei dieser Dichte ohnehin eine schwarze Flaeche — die Kanten
 * liegen dann naeher beieinander als ein Bildpunkt breit ist. Der Schalter wird
 * deshalb gesperrt statt stillschweigend nichts zu tun.
 */
export const MAX_EDGE_TRIANGLES = 300_000;

/** Schwellenwinkel: nur echte Kanten zeichnen, keine Facetten einer Rundung. */
const EDGE_THRESHOLD_DEGREES = 25;

export function buildEdges(geometry: THREE.BufferGeometry): THREE.EdgesGeometry {
  return new THREE.EdgesGeometry(geometry, EDGE_THRESHOLD_DEGREES);
}

/**
 * Darstellungsmodus auf die Werkstoffe anwenden.
 *
 * `clipping` wandert mit hinein, weil beides denselben Wert beruehrt: Sobald eine
 * Schnittebene aktiv ist, muss die Rueckseite mitgezeichnet werden. Sonst schaut
 * man durch den Schnitt hindurch ins Nichts, statt in das Bauteil hinein.
 */
export function applyRenderMode(
  materials: ModelMaterials,
  mode: RenderMode,
  clipping: boolean,
): { surfaceVisible: boolean; edgesVisible: boolean; wireVisible: boolean } {
  const { surface } = materials;

  surface.side = clipping ? THREE.DoubleSide : THREE.FrontSide;
  surface.transparent = mode === "xray";
  surface.opacity = mode === "xray" ? 0.35 : 1;
  surface.depthWrite = mode !== "xray";
  surface.needsUpdate = true;

  return {
    surfaceVisible: mode !== "wireframe",
    edgesVisible: mode === "edges" || mode === "xray",
    wireVisible: mode === "wireframe",
  };
}

export function setMaterialColor(materials: ModelMaterials, color: string): void {
  const c = new THREE.Color(color);
  materials.surface.color.copy(c);
  materials.surface.emissive.copy(c.clone().multiplyScalar(0.06));
  materials.wire.color.copy(c);
}

/** Hintergruende. Der Verlauf ist der Werksstandard — er gibt dem Koerper Tiefe. */
export function backgroundTexture(kind: "hell" | "dunkel" | "verlauf"): THREE.Color | THREE.Texture {
  if (kind === "hell") return new THREE.Color(0xf4f6f8);
  if (kind === "dunkel") return new THREE.Color(0x0a121c);

  // Ein senkrechter Verlauf als 2x64-Textur. Kein Shader, kein zusaetzliches
  // Objekt in der Szene — und es kostet zwei Kilobyte Grafikspeicher.
  const canvas = document.createElement("canvas");
  canvas.width = 2;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, 64);
    grad.addColorStop(0, "#dfe6ea");
    grad.addColorStop(0.55, "#eef2f4");
    grad.addColorStop(1, "#c8d3da");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
