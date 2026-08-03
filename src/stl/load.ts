/**
 * Bruecke zwischen Datei-Ablage und Worker.
 *
 * Je Ladevorgang entsteht ein FRISCHER Worker, der danach beendet wird. Das kostet
 * rund zehn Millisekunden und loest dafuer den Abbruch geschenkt mit: Wer eine
 * zweite Datei hineinzieht, waehrend die erste noch laeuft, beendet den alten
 * Strang einfach — ohne Abbruchprotokoll, ohne halb gefuellte Felder und ohne die
 * Frage, welches der beiden Ergebnisse zuerst zurueckkommt.
 */

import type { MeshStats, StlErrorCode, StlFormat, WorkerRequest, WorkerResponse } from "./types";

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
  /** Angewandter Skalierungsfaktor (1 = mm, 25.4 = Zoll-Datei). */
  scale: number;
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
  options: { scale?: number; onProgress?: (p: LoadProgress) => void } = {},
): LoadHandle {
  const id = ++sequence;
  const scale = options.scale ?? 1;
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
        worker = new Worker(new URL("./parse.worker.ts", import.meta.url), { type: "module" });

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

        const request: WorkerRequest = { id, buffer, scale };
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
  return /\.stl$/i.test(file.name);
}
