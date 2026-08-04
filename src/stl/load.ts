/**
 * Bruecke zwischen Datei-Ablage und Worker.
 *
 * Je Ladevorgang entsteht ein FRISCHER Worker, der danach beendet wird. Das kostet
 * rund zehn Millisekunden und loest dafuer den Abbruch geschenkt mit: Wer eine
 * zweite Datei hineinzieht, waehrend die erste noch laeuft, beendet den alten
 * Strang einfach — ohne Abbruchprotokoll, ohne halb gefuellte Felder und ohne die
 * Frage, welches der beiden Ergebnisse zuerst zurueckkommt.
 */

import { DEFAULT_STEP_QUALITY, type StepQuality } from "./step-mesh";
import type {
  MeshStats,
  StepWorkerRequest,
  StlErrorCode,
  StlFormat,
  WorkerRequest,
  WorkerResponse,
} from "./types";

export interface LoadedModel {
  /** Eindeutig je Ladevorgang — dient als React-Schluessel. */
  key: string;
  fileName: string;
  fileSize: number;
  positions: Float32Array;
  triangles: number;
  format: StlFormat;
  solidName: string | null;
  trailingBytes: number;
  stats: MeshStats;
  /** Angewandter Skalierungsfaktor (1 = mm, 25.4 = Zoll-Datei). Bei STEP immer 1. */
  scale: number;
  /** Nur bei STEP: Zahl der zusammengelegten Einzelkoerper. */
  parts?: number;
  /** Nur bei STEP: die verwendete Tessellierungsguete. */
  quality?: StepQuality;
}

export interface LoadProgress {
  phase: "read" | "parse" | "analyse";
  ratio: number;
}

export class StlLoadError extends Error {
  constructor(
    public readonly code: StlErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "StlLoadError";
  }
}

let sequence = 0;

export interface LoadHandle {
  promise: Promise<LoadedModel>;
  /** Bricht ab; die Zusage wird nicht mehr erfuellt und auch nicht abgelehnt. */
  cancel: () => void;
}

export function loadStl(
  file: File,
  options: {
    scale?: number;
    quality?: StepQuality;
    onProgress?: (p: LoadProgress) => void;
  } = {},
): LoadHandle {
  const id = ++sequence;
  const step = isStepFile(file);
  // Bei STEP gibt es keinen Skalierungsfaktor: Die Einheit steht in der Datei,
  // OpenCascade rechnet sie auf Millimeter um. Ein zusaetzlicher Faktor waere
  // eine zweite, widersprechende Angabe.
  const scale = step ? 1 : (options.scale ?? 1);
  const quality = options.quality ?? DEFAULT_STEP_QUALITY;
  let worker: Worker | null = null;
  let cancelled = false;

  const cancel = (): void => {
    cancelled = true;
    worker?.terminate();
    worker = null;
  };

  const promise = new Promise<LoadedModel>((resolve, reject) => {
    options.onProgress?.({ phase: "read", ratio: 0 });

    file
      .arrayBuffer()
      .then((buffer) => {
        if (cancelled) return;
        options.onProgress?.({ phase: "read", ratio: 1 });

        // Vite loest diese Form beim Bauen auf und legt den Worker als eigene
        // Datei neben das Buendel — gleiche Herkunft, deshalb genuegt der
        // Richtlinie worker-src 'self'.
        //
        // Zwei getrennte Worker, weil am STEP-Zweig OpenCascade als
        // WebAssembly haengt: 7,4 MB, die sonst jeder Besucher mitzoege, auch
        // wer nur STL oeffnet.
        worker = step
          ? new Worker(new URL("./step.worker.ts", import.meta.url), { type: "module" })
          : new Worker(new URL("./parse.worker.ts", import.meta.url), { type: "module" });

        worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
          const data = event.data;
          if (data.id !== id || cancelled) return;

          if (data.kind === "progress") {
            options.onProgress?.({ phase: data.phase, ratio: data.ratio });
            return;
          }

          if (data.kind === "error") {
            cancel();
            reject(new StlLoadError(data.code, data.message));
            return;
          }

          const model: LoadedModel = {
            key: `${id}-${file.name}`,
            fileName: file.name,
            fileSize: file.size,
            positions: new Float32Array(data.positions),
            triangles: data.triangles,
            format: data.format,
            solidName: data.solidName,
            trailingBytes: data.trailingBytes,
            stats: data.stats,
            scale,
            parts: data.parts,
            quality: step ? quality : undefined,
          };
          cancel();
          resolve(model);
        };

        worker.onerror = (event) => {
          if (cancelled) return;
          cancel();
          reject(
            new StlLoadError(
              "not-stl",
              event.message || "Der Auswertungsstrang wurde unerwartet beendet.",
            ),
          );
        };

        const request: WorkerRequest | StepWorkerRequest = step
          ? { id, buffer, quality }
          : { id, buffer, scale };
        // Auch der Eingabepuffer wird uebergeben statt kopiert. Danach ist er auf
        // dem Hauptstrang leer — deshalb wird er hier auch nirgends aufgehoben.
        worker.postMessage(request, [buffer]);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : String(error);
        reject(new StlLoadError("not-stl", `Die Datei liess sich nicht lesen: ${message}`));
      });
  });

  return { promise, cancel };
}

/** Dateiendung pruefen, bevor Megabyte gelesen werden. */
export function looksLikeStlFile(file: File): boolean {
  return /\.(stl|step|stp)$/i.test(file.name);
}

/**
 * STEP oder IGES-artige Endung?
 *
 * .stp ist die verbreitete Kurzform von .step — beide meinen dasselbe Format.
 * Wer nur auf .step prueft, weist die Haelfte aller Dateien ab, die aus
 * SolidWorks und Inventor herauskommen.
 */
export function isStepFile(file: File): boolean {
  return /\.(step|stp)$/i.test(file.name);
}

/** Fuer die Anzeige: welches Format wurde erkannt? */
export function fileKind(file: File): "stl" | "step" | "unbekannt" {
  if (isStepFile(file)) return "step";
  if (/\.stl$/i.test(file.name)) return "stl";
  return "unbekannt";
}
