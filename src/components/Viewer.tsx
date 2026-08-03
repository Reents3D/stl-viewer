/**
 * Die Zeichenflaeche samt allem, was darueber liegt.
 *
 * React verwaltet hier NICHT die Positionen der Marken. Anmerkungsmarken und
 * Massbeschriftungen haengen an der Kamera und muessten sonst bei jeder Drehung
 * durch den Abgleich — sechzigmal in der Sekunde. Stattdessen meldet die Szene
 * nach jedem gezeichneten Bild zurueck, und diese Komponente schreibt die neuen
 * Positionen direkt in die Stilattribute. React kuemmert sich nur darum, WELCHE
 * Marken es gibt, nicht darum, WO sie stehen.
 */

import { useEffect, useLayoutEffect, useRef } from "react";
import * as THREE from "three";

import type { T } from "../i18n";
import * as fmt from "../lib/format";
import type { Lang } from "../i18n";
import type { LoadedModel } from "../stl/load";
import { ModelScene, type HitResult } from "../viewer/scene";
import {
  ANNOTATION_CATEGORIES,
  type Annotation,
  type Measurement,
  type StandardView,
  type ToolMode,
  type ViewState,
} from "../viewer/types";
import { cx, Icon, ICONS } from "./ui";

const STANDARD_VIEWS: readonly StandardView[] = [
  "iso",
  "front",
  "back",
  "left",
  "right",
  "top",
  "bottom",
];

/** Weiter als das gilt nicht mehr als Klick, sondern als Drehbewegung. */
const CLICK_TOLERANCE_PX = 5;

export interface ViewerProps {
  model: LoadedModel;
  viewState: ViewState;
  buildVolume: { x: number; y: number; z: number };
  tool: ToolMode;
  annotations: readonly Annotation[];
  measurements: readonly Measurement[];
  pendingPoint: { x: number; y: number; z: number } | null;
  activeId: string | null;
  onSceneReady: (scene: ModelScene | null) => void;
  onPick: (hit: HitResult) => void;
  onSelectAnnotation: (id: string) => void;
  onTool: (tool: ToolMode) => void;
  t: T;
  lang: Lang;
}

export function Viewer(props: ViewerProps) {
  const {
    model,
    viewState,
    buildVolume,
    tool,
    annotations,
    measurements,
    pendingPoint,
    activeId,
    onSceneReady,
    onPick,
    onSelectAnnotation,
    onTool,
    t,
    lang,
  } = props;

  const hostRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<ModelScene | null>(null);
  const pinRefs = useRef(new Map<string, HTMLElement>());
  const labelRefs = useRef(new Map<string, HTMLElement>());

  // Der Rueckruf nach jedem Bild sieht immer den AKTUELLEN Stand — ueber Refs,
  // nicht ueber die Abhaengigkeiten eines Effekts. Sonst zeigte er nach dem
  // Loeschen einer Anmerkung noch auf die alte Liste.
  const latest = useRef({ annotations, measurements, pendingPoint, activeId });
  latest.current = { annotations, measurements, pendingPoint, activeId };

  /* ------------------------------------------------------------- Szene anlegen */

  useLayoutEffect(() => {
    if (!hostRef.current) return;
    const scene = new ModelScene(hostRef.current);
    sceneRef.current = scene;
    scene.onRendered = () => syncOverlays(scene, latest.current, pinRefs.current, labelRefs.current);
    onSceneReady(scene);

    return () => {
      scene.onRendered = null;
      scene.dispose();
      sceneRef.current = null;
      onSceneReady(null);
    };
    // Absichtlich nur einmal: Die Szene ueberlebt jeden Modellwechsel. Sie neu
    // aufzubauen hiesse, den WebGL-Kontext wegzuwerfen — Browser geben davon nur
    // eine begrenzte Zahl aus, und irgendwann bleibt die Flaeche schwarz.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------------------------------------------------- Modell setzen */

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const { bbox } = model.stats;
    scene.setModel(
      model.positions,
      new THREE.Vector3(bbox.center.x, bbox.center.y, bbox.center.z),
      new THREE.Vector3(bbox.size.x, bbox.size.y, bbox.size.z),
    );
  }, [model]);

  useEffect(() => {
    sceneRef.current?.applyViewState(viewState, buildVolume);
  }, [viewState, buildVolume]);

  /**
   * Neue Marken brauchen ein neues Bild.
   *
   * Die Szene zeichnet nur, wenn sich etwas bewegt hat — und eine neu gesetzte
   * Anmerkung bewegt die Kamera nicht. Ohne diesen Anstoss bleibt die frische
   * Marke in der linken oberen Ecke liegen, bis der Kunde das Modell zufaellig
   * einmal dreht: Sie wird erst beim naechsten `onRendered` positioniert. Genau
   * so ist der Fehler in der Handpruefung aufgefallen — Marke angelegt, Liste
   * gefuellt, aber am Modell klebte sie bei 0/0.
   */
  useEffect(() => {
    sceneRef.current?.invalidate();
  }, [annotations, measurements, pendingPoint, activeId]);

  /* ----------------------------------------------------------------- Messlinien */

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.setMeasureLines(
      measurements.map(
        (m) =>
          [new THREE.Vector3(m.a.x, m.a.y, m.a.z), new THREE.Vector3(m.b.x, m.b.y, m.b.z)] as [
            THREE.Vector3,
            THREE.Vector3,
          ],
      ),
    );
  }, [measurements]);

  /* --------------------------------------------------------------------- Klick */

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let downX = 0;
    let downY = 0;
    let downAt = 0;

    const onPointerDown = (event: PointerEvent) => {
      downX = event.clientX;
      downY = event.clientY;
      downAt = event.timeStamp;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.button !== 0) return;
      // Ein Klick, der das Modell gedreht hat, darf keine Anmerkung setzen.
      // Ohne diese Pruefung bekommt jeder, der das Bauteil einmal herumdreht,
      // am Ende der Bewegung eine Marke geschenkt.
      const moved = Math.hypot(event.clientX - downX, event.clientY - downY);
      if (moved > CLICK_TOLERANCE_PX || event.timeStamp - downAt > 700) return;

      const scene = sceneRef.current;
      if (!scene) return;
      const hit = scene.pick(event.clientX, event.clientY);
      if (hit) onPick(hit);
    };

    host.addEventListener("pointerdown", onPointerDown);
    host.addEventListener("pointerup", onPointerUp);
    return () => {
      host.removeEventListener("pointerdown", onPointerDown);
      host.removeEventListener("pointerup", onPointerUp);
    };
  }, [onPick]);

  /* ------------------------------------------------------------------ Tastatur */

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      // In einem Eingabefeld gehoeren die Ziffern in den Text, nicht an die Kamera.
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const byNumber: Record<string, StandardView> = {
        "1": "front",
        "2": "back",
        "3": "left",
        "4": "right",
        "5": "top",
        "6": "bottom",
        "7": "iso",
      };
      const view = byNumber[event.key];
      if (view) {
        sceneRef.current?.setView(view);
        return;
      }
      if (event.key.toLowerCase() === "f") sceneRef.current?.frameModel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ------------------------------------------------------------------ Aufbau */

  const cursor = tool === "orbit" ? "cursor-grab active:cursor-grabbing" : "cursor-crosshair";
  const hint =
    tool === "annotate"
      ? t("tool.annotateHint")
      : tool === "measure"
        ? latest.current.pendingPoint
          ? t("measure.pending")
          : t("tool.measureHint")
        : t("tool.orbitHint");

  return (
    <div className="relative flex-1 min-w-0 min-h-0 bg-canvas dark:bg-[#070E18]">
      <div ref={hostRef} className={cx("absolute inset-0", cursor)} />

      {/* ------------------------------------------------------------- Marken */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {annotations.map((annotation) => {
          const category =
            ANNOTATION_CATEGORIES.find((c) => c.id === annotation.category) ??
            ANNOTATION_CATEGORIES[0];
          return (
            <button
              key={annotation.id}
              type="button"
              ref={(element) => {
                if (element) pinRefs.current.set(annotation.id, element);
                else pinRefs.current.delete(annotation.id);
              }}
              onClick={() => onSelectAnnotation(annotation.id)}
              data-active={annotation.id === activeId}
              className="pin pointer-events-auto"
              style={{ background: category.color, left: 0, top: 0 }}
              title={annotation.title || `#${annotation.number}`}
            >
              {annotation.number}
            </button>
          );
        })}

        {measurements.map((measurement) => (
          <span
            key={measurement.id}
            ref={(element) => {
              if (element) labelRefs.current.set(measurement.id, element);
              else labelRefs.current.delete(measurement.id);
            }}
            className="measure-label"
            style={{ left: 0, top: 0 }}
          >
            {fmt.num(measurement.distance, lang, 2)} mm
          </span>
        ))}

        {pendingPoint && (
          <span
            ref={(element) => {
              if (element) labelRefs.current.set("__pending", element);
              else labelRefs.current.delete("__pending");
            }}
            className="measure-label"
            style={{ left: 0, top: 0, background: "#0C4251" }}
          >
            1
          </span>
        )}
      </div>

      {/* ------------------------------------------------------------ Werkzeug */}
      {/* Oben links, weil dort der Blick zuerst hinfaellt und weil die
          Ansichtsknoepfe rechts stehen — zwei Gruppen, die nichts miteinander
          zu tun haben, gehoeren nicht nebeneinander. */}
      <div className="absolute top-3 left-3 flex gap-1 surface p-1">
        {(
          [
            ["orbit", ICONS.orbit, t("tool.orbit")],
            ["annotate", ICONS.pin, t("tool.annotate")],
            ["measure", ICONS.ruler, t("tool.measure")],
          ] as const
        ).map(([mode, icon, label]) => (
          <button
            key={mode}
            type="button"
            className="toolbtn"
            aria-pressed={tool === mode}
            aria-label={label}
            title={label}
            onClick={() => onTool(mode)}
          >
            <Icon path={icon} />
          </button>
        ))}
      </div>

      {/* ---------------------------------------------------------- Ansichten */}
      <div className="absolute top-3 right-3 flex flex-wrap justify-end gap-1 max-w-[60%]">
        {STANDARD_VIEWS.map((view) => (
          <button
            key={view}
            type="button"
            onClick={() => sceneRef.current?.setView(view)}
            className="surface px-2.5 py-1.5 text-[11px] font-medium hover:border-petrol-400 hover:text-petrol-700 dark:hover:text-petrol-300 transition-colors"
          >
            {t(`view.${view}`)}
          </button>
        ))}
        <button
          type="button"
          onClick={() => sceneRef.current?.frameModel()}
          title={`${t("view.fit")} (F)`}
          className="surface px-2.5 py-1.5 text-[11px] font-medium hover:border-petrol-400 hover:text-petrol-700 dark:hover:text-petrol-300 transition-colors inline-flex items-center gap-1.5"
        >
          <Icon path={ICONS.fit} className="w-3.5 h-3.5" />
          {t("view.fit")}
        </button>
      </div>

      {/* -------------------------------------------------------------- Hinweis */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
        <span className="surface px-3 py-1.5 text-[11px] muted whitespace-nowrap">{hint}</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

interface OverlayState {
  annotations: readonly Annotation[];
  measurements: readonly Measurement[];
  pendingPoint: { x: number; y: number; z: number } | null;
  activeId: string | null;
}

/**
 * Marken und Beschriftungen an die neue Kameralage nachfuehren.
 *
 * Laeuft nach jedem gezeichneten Bild. Deshalb steht hier kein setState, kein
 * Anlegen von Objekten in der Schleife und keine Formatierung — nur Rechnen und
 * Schreiben in style. Bei zwanzig Anmerkungen sind das zwanzig Projektionen je
 * Bild; alles andere waere an dieser Stelle zu teuer.
 */
function syncOverlays(
  scene: ModelScene,
  state: OverlayState,
  pins: Map<string, HTMLElement>,
  labels: Map<string, HTMLElement>,
): void {
  const vector = new THREE.Vector3();

  for (const annotation of state.annotations) {
    const element = pins.get(annotation.id);
    if (!element) continue;
    vector.set(annotation.point.x, annotation.point.y, annotation.point.z);
    const screen = scene.project(vector);
    if (!screen || !screen.visible) {
      element.style.display = "none";
      continue;
    }
    const normal = new THREE.Vector3(annotation.normal.x, annotation.normal.y, annotation.normal.z);
    const front = scene.facesCamera(vector, normal);
    element.style.display = "";
    element.style.left = `${screen.x}px`;
    element.style.top = `${screen.y}px`;
    element.dataset.behind = String(!front);
    // Verdeckte Marken duerfen keine Klicks abfangen, die dem Modell gelten.
    element.style.pointerEvents = front ? "auto" : "none";
  }

  for (const measurement of state.measurements) {
    const element = labels.get(measurement.id);
    if (!element) continue;
    vector.set(
      (measurement.a.x + measurement.b.x) / 2,
      (measurement.a.y + measurement.b.y) / 2,
      (measurement.a.z + measurement.b.z) / 2,
    );
    const screen = scene.project(vector);
    if (!screen || !screen.visible) {
      element.style.display = "none";
      continue;
    }
    element.style.display = "";
    element.style.left = `${screen.x}px`;
    element.style.top = `${screen.y}px`;
  }

  const pending = state.pendingPoint;
  const pendingElement = labels.get("__pending");
  if (pending && pendingElement) {
    vector.set(pending.x, pending.y, pending.z);
    const screen = scene.project(vector);
    if (screen && screen.visible) {
      pendingElement.style.display = "";
      pendingElement.style.left = `${screen.x}px`;
      pendingElement.style.top = `${screen.y}px`;
    } else {
      pendingElement.style.display = "none";
    }
  }
}
