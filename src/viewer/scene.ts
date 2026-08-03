/**
 * Die 3D-Szene. Kapselt three.js vollstaendig — React sieht nur diese Klasse.
 *
 * KOORDINATENSYSTEM
 * Die Z-Achse zeigt nach oben, nicht die Y-Achse wie in der Voreinstellung von
 * three.js. Grund: STL kommt aus CAD und aus Slicern, und dort ist Z die Bauhoehe.
 * Wuerde der Betrachter auf Y-oben drehen, muesste jede Zahl, die er ausgibt,
 * vorher umgerechnet werden — und irgendwann rutscht dabei eine durch. So heisst
 * die Hoehe in der Datei, in der Anzeige und im PDF gleich.
 */

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import {
  applyRenderMode,
  backgroundTexture,
  buildEdges,
  createMaterials,
  MAX_EDGE_TRIANGLES,
  setMaterialColor,
  type ModelMaterials,
} from "./materials";
import type { Axis, CameraState, ClipState, StandardView, ViewState } from "./types";

export interface HitResult {
  /** Auftreffpunkt in MODELLKOORDINATEN (unabhaengig von Drehung und Lage). */
  local: THREE.Vector3;
  world: THREE.Vector3;
  normal: THREE.Vector3;
}

export interface CaptureOptions {
  width: number;
  height: number;
  /** Gitter, Achsen und Bauraum ausblenden — fuer Dokumentationsbilder. */
  clean?: boolean;
  transparent?: boolean;
  /**
   * Marken, die IN das Bild gezeichnet werden.
   *
   * Ohne sie zeigte die Anmerkungsseite im PDF nur das Bauteil, und die Nummer
   * stand daneben im Text — der Leser sah das Modell, aber nicht die Stelle.
   * Genau dafuer ist die Anmerkung da.
   */
  markers?: readonly CaptureMarker[];
}

export interface CaptureMarker {
  /** Punkt in Modellkoordinaten. */
  point: THREE.Vector3;
  label: string;
  /** Farbe der Kategorie. */
  color: string;
  /** Volle Staerke fuer die gemeinte Stelle, blass fuer die uebrigen. */
  faded?: boolean;
}

const DEG = Math.PI / 180;

export class ModelScene {
  readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly perspective: THREE.PerspectiveCamera;
  private readonly ortho: THREE.OrthographicCamera;
  private camera: THREE.Camera & { position: THREE.Vector3; up: THREE.Vector3 };
  private controls: OrbitControls;

  private readonly modelRoot = new THREE.Group();
  private mesh: THREE.Mesh | null = null;
  private edgeLines: THREE.LineSegments | null = null;
  private wireMesh: THREE.Mesh | null = null;
  private materials: ModelMaterials | null = null;

  private readonly helpers = new THREE.Group();
  private grid: THREE.GridHelper | null = null;
  private axes: THREE.AxesHelper | null = null;
  private buildBox: THREE.LineSegments | null = null;
  private readonly overlay = new THREE.Group();

  private readonly clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
  private clip: ClipState = { enabled: false, axis: "z", position: 0.5, flip: false };

  private readonly raycaster = new THREE.Raycaster();
  private modelSize = new THREE.Vector3(1, 1, 1);
  private modelRadius = 1;

  private frame = 0;
  private needsRender = true;
  private resizeObserver: ResizeObserver | null = null;
  private disposed = false;

  constructor(private readonly container: HTMLElement) {
    const { clientWidth: w, clientHeight: h } = container;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      // preserveDrawingBuffer bleibt AUS. Es kostet bei jedem Bild eine zusaetzliche
      // Kopie des Bildpuffers, und gebraucht wird der Puffer nur beim Export.
      // Dort wird stattdessen im selben Durchlauf gezeichnet und ausgelesen —
      // solange zwischen render() und toDataURL() nichts liegt, ist er gueltig.
      preserveDrawingBuffer: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w || 1, h || 1, false);
    this.renderer.localClippingEnabled = true;
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    this.renderer.domElement.style.display = "block";
    this.renderer.domElement.style.touchAction = "none";
    container.appendChild(this.renderer.domElement);

    this.perspective = new THREE.PerspectiveCamera(38, (w || 1) / (h || 1), 0.1, 100_000);
    this.ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, -100_000, 100_000);
    this.perspective.up.set(0, 0, 1);
    this.ortho.up.set(0, 0, 1);
    this.perspective.position.set(120, -160, 100);
    this.camera = this.perspective;

    this.controls = new OrbitControls(this.perspective, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.09;
    this.controls.screenSpacePanning = true;
    this.controls.addEventListener("change", () => this.invalidate());

    this.scene.add(this.modelRoot, this.helpers, this.overlay);
    this.setupLights();
    this.setBackground("verlauf");

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);

    this.tick();
  }

  /* ---------------------------------------------------------------- Beleuchtung */

  /**
   * Drei Lichtquellen, davon eine an der Kamera.
   *
   * Reine Weltlichter sehen bei einer festen Ansicht besser aus, lassen aber beim
   * Drehen ganze Seiten schwarz werden — und eine schwarze Flaeche kann man nicht
   * pruefen. Das Kameralicht haelt die zugewandte Seite immer lesbar, die
   * Weltlichter geben die Plastizitaet, die eine reine Stirnbeleuchtung verliert.
   */
  private setupLights(): void {
    const hemi = new THREE.HemisphereLight(0xffffff, 0x505a66, 1.15);
    hemi.position.set(0, 0, 1);

    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(0.6, -1, 1.4);

    const fill = new THREE.DirectionalLight(0xdfe9f2, 0.55);
    fill.position.set(-1, 0.8, 0.3);

    const headlight = new THREE.DirectionalLight(0xffffff, 0.85);
    headlight.position.set(0, 0, 1);
    this.perspective.add(headlight);
    this.ortho.add(headlight.clone());

    this.scene.add(hemi, key, fill, this.perspective, this.ortho);
  }

  /* --------------------------------------------------------------------- Modell */

  setModel(positions: Float32Array, center: THREE.Vector3, size: THREE.Vector3): void {
    this.clearModel();

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    // Die Geometrie wird in ihren eigenen Mittelpunkt verschoben. Danach dreht
    // jede Rotation der Gruppe um die Mitte des Bauteils statt um den Nullpunkt
    // der Datei — bei einem Modell, das im CAD bei x = 2.400 mm lag, waere das
    // sonst eine Drehung um einen Punkt weit ausserhalb des Bildes.
    geometry.translate(-center.x, -center.y, -center.z);
    // Nicht indizierte Geometrie: computeVertexNormals legt jedem Eckpunkt die
    // Normale SEINES Dreiecks bei. Genau das will man bei STL — facettiert.
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    this.materials = createMaterials("#B8C4CC");
    this.mesh = new THREE.Mesh(geometry, this.materials.surface);
    this.mesh.name = "modell";

    this.wireMesh = new THREE.Mesh(geometry, this.materials.wire);
    this.wireMesh.visible = false;

    this.modelRoot.add(this.mesh, this.wireMesh);
    // Unterkante auf die Bauplatte legen.
    this.modelRoot.position.set(0, 0, size.z / 2);
    this.modelRoot.rotation.set(0, 0, 0);

    if (geometry.index === null && positions.length / 9 <= MAX_EDGE_TRIANGLES) {
      this.edgeLines = new THREE.LineSegments(buildEdges(geometry), this.materials.edges);
      this.edgeLines.visible = false;
      this.modelRoot.add(this.edgeLines);
    }

    this.modelSize = size.clone();
    this.modelRadius = size.length() / 2;

    this.buildGrid();
    this.setView("iso");
    this.invalidate();
  }

  private clearModel(): void {
    for (const object of [this.mesh, this.wireMesh, this.edgeLines]) {
      if (!object) continue;
      this.modelRoot.remove(object);
    }
    this.mesh?.geometry.dispose();
    this.edgeLines?.geometry.dispose();
    this.materials?.surface.dispose();
    this.materials?.wire.dispose();
    this.materials?.edges.dispose();
    this.mesh = null;
    this.wireMesh = null;
    this.edgeLines = null;
    this.materials = null;
  }

  hasModel(): boolean {
    return this.mesh !== null;
  }

  /** Zahl der Dreiecke — entscheidet, ob die Kantenanzeige angeboten wird. */
  canShowEdges(): boolean {
    return this.edgeLines !== null;
  }

  /* ----------------------------------------------------------------- Hilfsobjekte */

  private buildGrid(): void {
    this.helpers.clear();
    this.grid = null;
    this.axes = null;
    this.buildBox = null;

    // Rasterweite auf eine runde Zahl in der Groessenordnung des Bauteils.
    const span = Math.max(this.modelSize.x, this.modelSize.y) * 1.8 || 100;
    const step = niceStep(span / 10);
    const extent = Math.ceil(span / step) * step;

    const grid = new THREE.GridHelper(extent * 2, (extent * 2) / step, 0x8fa3b0, 0xc7d2da);
    // GridHelper liegt in der XZ-Ebene. Aufrichten, damit es zur Z-oben-Welt passt.
    grid.rotation.x = 90 * DEG;
    const gridMaterial = grid.material as THREE.Material | THREE.Material[];
    for (const m of Array.isArray(gridMaterial) ? gridMaterial : [gridMaterial]) {
      m.transparent = true;
      m.opacity = 0.55;
    }
    this.grid = grid;

    this.axes = new THREE.AxesHelper(extent * 0.35);

    this.helpers.add(grid, this.axes);
  }

  private buildVolumeBox(x: number, y: number, z: number): void {
    if (this.buildBox) {
      this.helpers.remove(this.buildBox);
      this.buildBox.geometry.dispose();
      (this.buildBox.material as THREE.Material).dispose();
      this.buildBox = null;
    }
    const box = new THREE.BoxGeometry(x, y, z);
    const edges = new THREE.EdgesGeometry(box);
    box.dispose();
    this.buildBox = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x0c4251, transparent: true, opacity: 0.7 }),
    );
    this.buildBox.position.set(0, 0, z / 2);
    this.helpers.add(this.buildBox);
  }

  /* ---------------------------------------------------------------- Zustand */

  applyViewState(state: ViewState, buildVolume: { x: number; y: number; z: number }): void {
    if (!this.materials) return;

    const visibility = applyRenderMode(this.materials, state.renderMode, state.clip.enabled);
    if (this.mesh) this.mesh.visible = visibility.surfaceVisible;
    if (this.wireMesh) this.wireMesh.visible = visibility.wireVisible;
    if (this.edgeLines) this.edgeLines.visible = visibility.edgesVisible && this.canShowEdges();

    setMaterialColor(this.materials, state.modelColor);

    if (this.grid) this.grid.visible = state.showGrid;
    if (this.axes) this.axes.visible = state.showAxes;

    if (state.showBuildVolume) {
      if (!this.buildBox) this.buildVolumeBox(buildVolume.x, buildVolume.y, buildVolume.z);
      if (this.buildBox) this.buildBox.visible = true;
    } else if (this.buildBox) {
      this.buildBox.visible = false;
    }

    this.setBackground(state.background);
    this.setClip(state.clip);
    this.setOrthographic(state.orthographic);
    this.invalidate();
  }

  private setBackground(kind: ViewState["background"]): void {
    const bg = backgroundTexture(kind);
    if (this.scene.background instanceof THREE.Texture) this.scene.background.dispose();
    this.scene.background = bg;
  }

  /**
   * Schnittebene setzen.
   *
   * Der Reglerwert 0..1 wird auf die WELTausdehnung der gewaehlten Achse
   * abgebildet, nicht auf die Modellkoordinaten: Sobald das Bauteil gedreht ist,
   * liegen die beiden nicht mehr uebereinander, und der Regler wuerde am Modell
   * vorbeischneiden.
   */
  private setClip(clip: ClipState): void {
    this.clip = { ...clip };
    if (!this.materials) return;

    if (!clip.enabled) {
      this.materials.surface.clippingPlanes = null;
      this.materials.wire.clippingPlanes = null;
      this.materials.edges.clippingPlanes = null;
      return;
    }

    const world = this.worldBounds();
    const axisIndex: Record<Axis, 0 | 1 | 2> = { x: 0, y: 1, z: 2 };
    const i = axisIndex[clip.axis];
    const min = world.min.getComponent(i);
    const max = world.max.getComponent(i);
    const at = min + (max - min) * clip.position;

    const normal = new THREE.Vector3();
    normal.setComponent(i, clip.flip ? 1 : -1);
    this.clipPlane.set(normal, clip.flip ? -at : at);

    const planes = [this.clipPlane];
    this.materials.surface.clippingPlanes = planes;
    this.materials.wire.clippingPlanes = planes;
    this.materials.edges.clippingPlanes = planes;
  }

  private worldBounds(): THREE.Box3 {
    const box = new THREE.Box3();
    if (this.mesh) box.setFromObject(this.modelRoot);
    else box.setFromCenterAndSize(new THREE.Vector3(), new THREE.Vector3(1, 1, 1));
    return box;
  }

  private setOrthographic(on: boolean): void {
    const target = this.controls.target.clone();
    const position = this.camera.position.clone();
    const up = this.camera.up.clone();

    this.camera = on ? this.ortho : this.perspective;
    this.camera.position.copy(position);
    this.camera.up.copy(up);

    if (on) this.updateOrthoFrustum();
    else this.perspective.updateProjectionMatrix();

    this.controls.object = this.camera as THREE.PerspectiveCamera | THREE.OrthographicCamera;
    this.controls.target.copy(target);
    this.controls.update();
  }

  private updateOrthoFrustum(): void {
    const { clientWidth: w, clientHeight: h } = this.container;
    const aspect = (w || 1) / (h || 1);
    // Abstand zum Ziel bestimmt den sichtbaren Ausschnitt — so verhaelt sich das
    // Mausrad in der orthografischen Ansicht wie in der perspektivischen.
    const distance = this.camera.position.distanceTo(this.controls.target);
    const halfHeight = Math.max(distance * Math.tan(19 * DEG), this.modelRadius * 0.05);
    this.ortho.left = -halfHeight * aspect;
    this.ortho.right = halfHeight * aspect;
    this.ortho.top = halfHeight;
    this.ortho.bottom = -halfHeight;
    this.ortho.updateProjectionMatrix();
  }

  /* ----------------------------------------------------------------- Ansichten */

  setView(view: StandardView): void {
    const target = new THREE.Vector3(0, 0, this.modelSize.z / 2);
    const distance = this.fitDistance();

    const directions: Record<StandardView, [number, number, number]> = {
      iso: [0.72, -0.86, 0.62],
      front: [0, -1, 0],
      back: [0, 1, 0],
      left: [-1, 0, 0],
      right: [1, 0, 0],
      top: [0, 0, 1],
      bottom: [0, 0, -1],
    };

    const dir = new THREE.Vector3(...directions[view]).normalize();
    // Von oben und von unten faellt die Blickrichtung mit der Hochachse zusammen.
    // Die Kamera braucht dann eine andere Bezugsrichtung, sonst ist die Drehung um
    // die Blickachse unbestimmt und das Bild kippt zufaellig.
    const up = view === "top" || view === "bottom" ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1);

    this.perspective.up.copy(up);
    this.ortho.up.copy(up);
    this.camera.up.copy(up);
    this.camera.position.copy(target.clone().addScaledVector(dir, distance));
    this.controls.target.copy(target);
    if (this.camera === this.ortho) this.updateOrthoFrustum();
    this.controls.update();
    this.invalidate();
  }

  /** Abstand, bei dem das Modell vollstaendig ins Bild passt. */
  private fitDistance(): number {
    const { clientWidth: w, clientHeight: h } = this.container;
    const aspect = (w || 1) / (h || 1);
    const vFov = this.perspective.fov * DEG;
    // Bei hochkantem Fenster begrenzt die BREITE, nicht die Hoehe.
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
    const limiting = Math.min(vFov, hFov);
    return (this.modelRadius / Math.sin(limiting / 2)) * 1.12;
  }

  frameModel(): void {
    const distance = this.fitDistance();
    const target = new THREE.Vector3(0, 0, this.modelSize.z / 2);
    const dir = this.camera.position.clone().sub(this.controls.target).normalize();
    this.camera.position.copy(target.clone().addScaledVector(dir, distance));
    this.controls.target.copy(target);
    if (this.camera === this.ortho) this.updateOrthoFrustum();
    this.controls.update();
    this.invalidate();
  }

  /**
   * Kamerastand vollstaendig — einschliesslich der Oben-Richtung.
   *
   * `up` gehoert zwingend dazu: Von oben und von unten faellt die Blickrichtung
   * mit der Hochachse zusammen, deshalb schaltet setView() dort auf (0,1,0) um.
   * Wurde nur Position und Ziel gemerkt, kam eine gespeicherte Ansicht nach
   * einem Besuch in der Draufsicht VERKANTET zurueck — dieselbe Blickrichtung,
   * aber um die Sichtachse gedreht. Im PDF hiess das: Das Bild zur Anmerkung
   * zeigte die richtige Stelle in einer Lage, in der der Kunde sie nie gesehen
   * hatte. Aufgefallen beim Vergleich zweier Aufnahmen, die identisch haetten
   * sein muessen.
   */
  cameraState(): CameraState {
    const p = this.camera.position;
    const t = this.controls.target;
    const u = this.camera.up;
    return { position: [p.x, p.y, p.z], target: [t.x, t.y, t.z], up: [u.x, u.y, u.z] };
  }

  restoreCamera(state: CameraState): void {
    // Aeltere Anmerkungsdateien kennen `up` nicht. Z nach oben ist die
    // Voreinstellung dieses Betrachters und damit der richtige Rueckfall.
    const up: [number, number, number] = state.up ?? [0, 0, 1];
    this.perspective.up.set(...up);
    this.ortho.up.set(...up);
    this.camera.up.set(...up);
    this.camera.position.set(...state.position);
    this.controls.target.set(...state.target);
    if (this.camera === this.ortho) this.updateOrthoFrustum();
    this.controls.update();
    this.invalidate();
  }

  /* -------------------------------------------------------------------- Treffer */

  /**
   * Strahl in die Szene schicken.
   *
   * Nur bei einem Klick, nie bei einer Mausbewegung: Der Strahl laeuft ohne
   * Beschleunigungsstruktur linear durch ALLE Dreiecke. Bei einer halben Million
   * kostet das im zweistelligen Millisekundenbereich — einmal beim Klick nicht
   * spuerbar, sechzigmal je Sekunde dagegen eine ruckelnde Oberflaeche.
   */
  pick(clientX: number, clientY: number): HitResult | null {
    if (!this.mesh) return null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.camera as THREE.PerspectiveCamera);
    const hits = this.raycaster.intersectObject(this.mesh, false);

    for (const hit of hits) {
      // Der Raycaster kennt die Schnittebene nicht. Ohne diese Pruefung liesse
      // sich eine Anmerkung auf eine Flaeche setzen, die gar nicht zu sehen ist —
      // sie wuerde erst wieder auftauchen, wenn man den Schnitt aufhebt.
      if (this.clip.enabled && this.clipPlane.distanceToPoint(hit.point) < 0) continue;
      if (!hit.face) continue;

      const normalWorld = hit.face.normal
        .clone()
        .applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(this.mesh.matrixWorld))
        .normalize();

      return {
        world: hit.point.clone(),
        local: this.mesh.worldToLocal(hit.point.clone()),
        normal: normalWorld,
      };
    }
    return null;
  }

  /** Modellkoordinate auf Bildschirmkoordinate abbilden (fuer Marken und Masse). */
  project(local: THREE.Vector3): { x: number; y: number; visible: boolean } | null {
    if (!this.mesh) return null;
    const world = this.mesh.localToWorld(local.clone());
    const ndc = world.clone().project(this.camera as THREE.PerspectiveCamera);
    const rect = this.renderer.domElement.getBoundingClientRect();
    return {
      x: ((ndc.x + 1) / 2) * rect.width,
      y: ((-ndc.y + 1) / 2) * rect.height,
      visible: ndc.z < 1,
    };
  }

  /** Zeigt die Flaeche an dieser Stelle zur Kamera? Grundlage fuer verdeckte Marken. */
  facesCamera(local: THREE.Vector3, normal: THREE.Vector3): boolean {
    if (!this.mesh) return true;
    const world = this.mesh.localToWorld(local.clone());
    const toCamera = this.camera.position.clone().sub(world).normalize();
    const worldNormal = normal
      .clone()
      .applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(this.mesh.matrixWorld))
      .normalize();
    return worldNormal.dot(toCamera) > 0;
  }

  localToWorld(local: THREE.Vector3): THREE.Vector3 {
    return this.mesh ? this.mesh.localToWorld(local.clone()) : local.clone();
  }

  /* ------------------------------------------------------------------- Overlay */

  /** Messstrecken als Liniengeometrie in der Szene (nicht als HTML). */
  setMeasureLines(segments: ReadonlyArray<[THREE.Vector3, THREE.Vector3]>): void {
    this.overlay.clear();
    if (!this.mesh || segments.length === 0) {
      this.invalidate();
      return;
    }
    const points: number[] = [];
    for (const [a, b] of segments) {
      const wa = this.mesh.localToWorld(a.clone());
      const wb = this.mesh.localToWorld(b.clone());
      points.push(wa.x, wa.y, wa.z, wb.x, wb.y, wb.z);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    const material = new THREE.LineBasicMaterial({ color: 0x0b1220 });
    const lines = new THREE.LineSegments(geometry, material);
    // Ueber allem zeichnen: Ein Massband, das im Bauteil verschwindet, misst
    // zwar richtig, ist aber nicht ablesbar.
    lines.renderOrder = 999;
    material.depthTest = false;
    this.overlay.add(lines);
    this.invalidate();
  }

  /* ------------------------------------------------------------------- Aufnahme */

  /**
   * Ein Bild in beliebiger Aufloesung.
   *
   * Zwischen render() und toDataURL() darf NICHTS liegen. Ohne
   * preserveDrawingBuffer gibt der Browser den Zeichenpuffer frei, sobald er die
   * Kontrolle zurueckbekommt — ein await an dieser Stelle liefert ein schwarzes
   * Bild, und zwar zuverlaessig erst auf fremden Rechnern.
   */
  capture(options: CaptureOptions): string {
    const { width, height, clean = false, transparent = false, markers } = options;
    const previousSize = new THREE.Vector2();
    this.renderer.getSize(previousSize);
    const previousRatio = this.renderer.getPixelRatio();
    const previousBackground = this.scene.background;
    const helpersVisible = this.helpers.visible;

    if (clean) this.helpers.visible = false;
    if (transparent) this.scene.background = null;

    this.renderer.setPixelRatio(1);
    this.renderer.setSize(width, height, false);
    this.updateProjection(width / height);
    this.renderer.render(this.scene, this.camera as THREE.PerspectiveCamera);

    const mime = transparent ? "image/png" : "image/jpeg";
    let dataUrl: string;

    if (markers && markers.length > 0) {
      // Ueber eine zweite, zweidimensionale Flaeche gelegt statt als Objekt in
      // die Szene gehaengt: Eine Marke soll IMMER gleich gross sein, egal wie
      // weit die Kamera weg steht, und sie soll nie im Bauteil verschwinden.
      // Beides waere mit einem Sprite in der Szene ein Kampf gegen die
      // Perspektive und den Tiefenpuffer.
      const overlay = document.createElement("canvas");
      overlay.width = width;
      overlay.height = height;
      const ctx = overlay.getContext("2d");
      if (ctx) {
        // drawImage liest denselben Zeichenpuffer wie toDataURL und muss
        // deshalb ebenso im selben Durchlauf passieren.
        ctx.drawImage(this.renderer.domElement, 0, 0, width, height);
        for (const marker of markers) this.drawMarker(ctx, marker, width, height);
        dataUrl = overlay.toDataURL(mime, 0.92);
      } else {
        dataUrl = this.renderer.domElement.toDataURL(mime, 0.92);
      }
    } else {
      dataUrl = this.renderer.domElement.toDataURL(mime, 0.92);
    }

    this.helpers.visible = helpersVisible;
    this.scene.background = previousBackground;
    this.renderer.setPixelRatio(previousRatio);
    this.renderer.setSize(previousSize.x, previousSize.y, false);
    this.updateProjection((this.container.clientWidth || 1) / (this.container.clientHeight || 1));
    this.invalidate();

    return dataUrl;
  }

  /**
   * Eine Anmerkungsmarke ins Bild zeichnen.
   *
   * Die Nummernscheibe sitzt NEBEN dem Punkt, nicht darauf, und ist mit einer
   * Linie damit verbunden. Direkt auf den Punkt gesetzt wuerde sie genau das
   * verdecken, worum es geht — bei einer 2 mm schmalen Kante ist die Scheibe
   * breiter als das Merkmal. Der Punkt selbst bleibt als kleiner Kreis sichtbar.
   */
  private drawMarker(
    ctx: CanvasRenderingContext2D,
    marker: CaptureMarker,
    width: number,
    height: number,
  ): void {
    if (!this.mesh) return;

    const world = this.mesh.localToWorld(marker.point.clone());
    const ndc = world.project(this.camera as THREE.PerspectiveCamera);
    // Ausserhalb des Sichtkegels wird nichts gezeichnet — eine Marke am
    // Bildrand, die zu einem Punkt hinter der Kamera gehoert, waere eine Luege.
    if (ndc.z > 1 || Math.abs(ndc.x) > 1.4 || Math.abs(ndc.y) > 1.4) return;

    const x = ((ndc.x + 1) / 2) * width;
    const y = ((-ndc.y + 1) / 2) * height;

    // Groesse relativ zum Bild, damit die Marke bei 900 wie bei 2000 Bildpunkten
    // gleich wirkt.
    const r = Math.max(11, width * 0.019);
    const gap = r * 2.4;
    // Nach oben versetzt, ausser es ist dort kein Platz mehr.
    const above = y - gap - r > 4;
    const cy = above ? y - gap : y + gap;
    const cx = Math.min(Math.max(x, r + 4), width - r - 4);

    ctx.save();
    ctx.globalAlpha = marker.faded ? 0.45 : 1;

    // Verbindungslinie, weiss unterlegt: auf einem hellen Bauteil waere eine
    // dunkle Linie unsichtbar, auf einem dunklen eine helle.
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = r * 0.42;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(cx, cy);
    ctx.stroke();
    ctx.strokeStyle = marker.color;
    ctx.lineWidth = r * 0.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(cx, cy);
    ctx.stroke();

    // Der genaue Punkt.
    ctx.beginPath();
    ctx.arc(x, y, r * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = marker.color;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = r * 0.16;
    ctx.fill();
    ctx.stroke();

    // Nummernscheibe.
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = marker.color;
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = r * 0.5;
    ctx.shadowOffsetY = r * 0.12;
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = r * 0.2;
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.font = `700 ${Math.round(r * 1.15)}px Montserrat, Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(marker.label, cx, cy + r * 0.06);

    ctx.restore();
  }

  private updateProjection(aspect: number): void {
    this.perspective.aspect = aspect;
    this.perspective.updateProjectionMatrix();
    if (this.camera === this.ortho) {
      const distance = this.camera.position.distanceTo(this.controls.target);
      const halfHeight = Math.max(distance * Math.tan(19 * DEG), this.modelRadius * 0.05);
      this.ortho.left = -halfHeight * aspect;
      this.ortho.right = halfHeight * aspect;
      this.ortho.top = halfHeight;
      this.ortho.bottom = -halfHeight;
      this.ortho.updateProjectionMatrix();
    }
  }

  /**
   * Rundumaufnahme um eine Achse.
   *
   * Gedreht wird das MODELL, nicht die Kamera. Ein Kameraflug um ein stehendes
   * Objekt zieht die Lichter mit durchs Bild — die Bilderfolge im PDF haette dann
   * bei jedem Schritt eine andere Ausleuchtung, und ein Kunde liest den Unterschied
   * als Formunterschied. Ein Drehteller unter fester Beleuchtung zeigt in allen
   * Bildern dieselbe Oberflaeche.
   */
  async captureTurntable(
    axis: Axis,
    count: number,
    options: Omit<CaptureOptions, "clean"> & { onStep?: (index: number) => void },
  ): Promise<string[]> {
    const shots: string[] = [];
    const originalRotation = this.modelRoot.rotation.clone();

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      this.modelRoot.rotation.set(
        axis === "x" ? angle : 0,
        axis === "y" ? angle : 0,
        axis === "z" ? angle : 0,
      );
      this.modelRoot.updateMatrixWorld(true);
      shots.push(this.capture({ ...options, clean: true }));
      options.onStep?.(i + 1);
      // Einen Bilddurchlauf abgeben, damit der Fortschrittsbalken sichtbar
      // weiterlaeuft statt am Ende in einem Sprung zu springen.
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }

    this.modelRoot.rotation.copy(originalRotation);
    this.modelRoot.updateMatrixWorld(true);
    this.invalidate();
    return shots;
  }

  /** Bild aus einem festen Kamerastand — fuer die Anmerkungsseiten im PDF. */
  captureFromCamera(
    state: { position: [number, number, number]; target: [number, number, number] },
    options: CaptureOptions,
  ): string {
    const previous = this.cameraState();
    this.restoreCamera(state);
    const image = this.capture(options);
    this.restoreCamera(previous);
    return image;
  }

  /* ------------------------------------------------------------------ Bildlauf */

  private resize(): void {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.updateProjection(w / h);
    this.invalidate();
  }

  invalidate(): void {
    this.needsRender = true;
  }

  /**
   * Wird nach JEDEM gezeichneten Bild aufgerufen.
   *
   * Daran haengen die Anmerkungsmarken und die Massbeschriftungen. Sie liegen als
   * HTML ueber der Zeichenflaeche und muessen ihre Position neu bekommen, sobald
   * sich die Kamera bewegt — aber NICHT ueber den Zustand von React: Ein
   * setState je Bild waere sechzig Durchlaeufe des Abgleichs in der Sekunde. Der
   * Empfaenger schreibt stattdessen direkt in die Stilattribute.
   */
  onRendered: (() => void) | null = null;

  private tick = (): void => {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.tick);
    // update() loest bei Bewegung ein 'change'-Ereignis aus und setzt darueber
    // needsRender. Steht die Kamera still, wird auch nichts gezeichnet — auf
    // einem Notebook macht das im Leerlauf den Unterschied zwischen warm und kalt.
    this.controls.update();
    if (!this.needsRender) return;
    this.needsRender = false;
    this.renderer.render(this.scene, this.camera as THREE.PerspectiveCamera);
    this.onRendered?.();
  };

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.controls.dispose();
    this.clearModel();
    this.overlay.clear();
    this.helpers.clear();
    if (this.scene.background instanceof THREE.Texture) this.scene.background.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

/** Rasterweite auf 1, 2, 5 oder 10 der passenden Groessenordnung runden. */
function niceStep(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 10;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}
