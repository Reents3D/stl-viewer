/**
 * Der Ablauf des PDF-Exports: aufnehmen, dann setzen.
 *
 * Getrennt von der Oberflaeche, weil hier eine Reihenfolge einzuhalten ist, die
 * man nicht sieht: Die Kamera wird fuer jede Aufnahme verstellt und muss am Ende
 * wieder dort stehen, wo der Kunde sie gelassen hat — auch wenn zwischendurch
 * abgebrochen wird. Ein Export, der die Ansicht verstellt zurueckgibt, fuehlt
 * sich an wie ein Absturz.
 */

import type { jsPDF } from "jspdf";
import { Vector3 } from "three";

import type { MaterialDensity } from "../config/materials";
import type { BuildVolume } from "../config/site";
import type { Lang, T } from "../i18n";
import type { FitResult } from "../stl/geometry";
import type { LoadedModel } from "../stl/load";
import type { CaptureMarker, ModelScene } from "../viewer/scene";
import { ANNOTATION_CATEGORIES, type Annotation, type Axis, type StandardView } from "../viewer/types";
import { rasterizeSvg } from "./files";
import { buildPdf, SHOT_ASPECT, type PdfTurntable } from "./pdf";
import { countShots } from "./pdf-layout";

export const SHOT_WIDTHS = { klein: 900, mittel: 1400, gross: 2000 } as const;
export type ShotQuality = keyof typeof SHOT_WIDTHS;

const STANDARD_VIEW_ORDER: readonly StandardView[] = [
  "front",
  "back",
  "left",
  "right",
  "top",
  "bottom",
];

export interface ExportOptions {
  axes: readonly Axis[];
  perAxis: number;
  standardViews: boolean;
  annotationPages: boolean;
  quality: ShotQuality;
}

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  axes: ["z", "x", "y"],
  perAxis: 10,
  standardViews: true,
  annotationPages: true,
  quality: "mittel",
};

export function plannedShots(options: ExportOptions, annotationCount: number): number {
  const withAnnotations = options.annotationPages && annotationCount > 0;
  return (
    countShots({
      axes: options.axes.length,
      perAxis: options.perAxis,
      standardViews: options.standardViews,
      annotations: withAnnotations ? annotationCount : 0,
    }) +
    // Eine zusaetzliche Aufnahme: die Uebersicht mit ALLEN Marken.
    (withAnnotations ? 1 : 0)
  );
}

/** Marke einer Anmerkung, wie sie in die Aufnahme gezeichnet wird. */
function toMarker(annotation: Annotation, faded = false): CaptureMarker {
  const category =
    ANNOTATION_CATEGORIES.find((c) => c.id === annotation.category) ?? ANNOTATION_CATEGORIES[0];
  return {
    point: new Vector3(annotation.point.x, annotation.point.y, annotation.point.z),
    label: String(annotation.number),
    color: category.color,
    faded,
  };
}

export interface ExportContext {
  scene: ModelScene;
  model: LoadedModel;
  annotations: readonly Annotation[];
  options: ExportOptions;
  lang: Lang;
  t: T;
  material: MaterialDensity;
  infill: number;
  buildVolume: BuildVolume;
  fit: FitResult;
  logoUrl: string;
  now: Date;
  onProgress: (done: number, total: number) => void;
  /** Wird zwischen den Aufnahmen geprueft. */
  isCancelled: () => boolean;
}

export class ExportCancelled extends Error {
  constructor() {
    super("Export abgebrochen");
    this.name = "ExportCancelled";
  }
}

export async function runPdfExport(context: ExportContext): Promise<jsPDF> {
  const { scene, options, annotations } = context;
  const width = SHOT_WIDTHS[options.quality];
  const height = Math.round(width / SHOT_ASPECT);
  const shot = { width, height, transparent: false };

  const total = plannedShots(options, annotations.length);
  let done = 0;
  const step = (): void => {
    done++;
    context.onProgress(done, total);
  };
  const guard = (): void => {
    if (context.isCancelled()) throw new ExportCancelled();
  };

  // Kamerastand des Kunden merken, BEVOR irgendetwas daran gedreht wird.
  const originalCamera = scene.cameraState();

  try {
    const logo = await rasterizeSvg(context.logoUrl, 42, 7.56);
    guard();

    const heroImage = scene.capture({ ...shot, clean: true });

    /* --------------------------------------------------------- Normalansichten */

    let standardViews: Array<{ view: StandardView; image: string }> | null = null;
    if (options.standardViews) {
      standardViews = [];
      for (const view of STANDARD_VIEW_ORDER) {
        guard();
        scene.setView(view);
        standardViews.push({
          view,
          image: scene.capture({ ...shot, clean: true, hideReference: true }),
        });
        step();
        await nextFrame();
      }
      scene.restoreCamera(originalCamera);
    }

    /* ---------------------------------------------------------- Rundumansichten */

    const turntables: PdfTurntable[] = [];
    for (const axis of options.axes) {
      guard();
      const images = await scene.captureTurntable(axis as Axis, options.perAxis, {
        ...shot,
        hideReference: true,
        onStep: () => step(),
      });
      turntables.push({ axis: axis as Axis, images });
    }

    /* ------------------------------------------------------------- Anmerkungen */

    const annotationImages = new Map<string, string>();
    let annotationOverview: string | null = null;

    if (options.annotationPages && annotations.length > 0) {
      // Zuerst die Uebersicht: alle Marken in einem Bild, aus der Ansicht, die
      // der Kunde zuletzt eingestellt hatte. Sie beantwortet die Frage, die vor
      // jeder Einzelseite kommt — welche Stellen sind ueberhaupt betroffen.
      guard();
      annotationOverview = scene.capture({
        ...shot,
        clean: true,
        hideReference: true,
        markers: annotations.map((a) => toMarker(a)),
      });
      step();
      await nextFrame();

      for (const annotation of annotations) {
        guard();
        // Nur die EIGENE Marke. Die uebrigen blass mitzuzeichnen gaebe Kontext,
        // wuerde auf einem 78 mm breiten Bild aber genau die Eindeutigkeit
        // kosten, um die es auf dieser Seite geht.
        annotationImages.set(
          annotation.id,
          scene.captureFromCamera(annotation.camera, {
            ...shot,
            clean: true,
            hideReference: true,
            markers: [toMarker(annotation)],
          }),
        );
        step();
        await nextFrame();
      }
    }

    return buildPdf({
      lang: context.lang,
      t: context.t,
      model: context.model,
      heroImage,
      standardViews,
      turntables,
      annotations,
      annotationImages,
      annotationOverview,
      material: context.material,
      infill: context.infill,
      buildVolume: context.buildVolume,
      fit: context.fit,
      logo,
      now: context.now,
    });
  } finally {
    // Auch nach einem Abbruch: Die Ansicht gehoert dem Kunden, nicht dem Export.
    scene.restoreCamera(originalCamera);
  }
}

const nextFrame = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => resolve()));
