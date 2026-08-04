/// <reference lib="webworker" />

/**
 * STEP- und IGES-Import in einem eigenen Strang.
 *
 * WARUM EIN ZWEITER WORKER UND NICHT DER VORHANDENE
 * Hier haengt OpenCascade als WebAssembly dran — 7,4 MB. Laege der Import im
 * STL-Worker, zoege ihn jeder Besucher mit, auch wer nie ein STEP oeffnet. So
 * wird die Datei erst geholt, wenn wirklich eine STEP-Datei kommt.
 *
 * WAS DIESER STRANG VON DER RICHTLINIE BRAUCHT
 * Das Nachladen der .wasm laeuft ueber fetch und damit ueber `connect-src`, das
 * Uebersetzen von WebAssembly ueber `script-src 'wasm-unsafe-eval'`. Beides ist
 * in vite.config.ts freigegeben — und beides ist der Preis, der in ADR-013
 * benannt und abgewogen ist. Die Adresse zeigt auf die EIGENE Herkunft; es geht
 * nach wie vor nichts nach draussen und nichts hinaus.
 */

import occtimportjs, { type OcctModule } from "occt-import-js";
import wasmUrl from "occt-import-js/dist/occt-import-js.wasm?url";

import { analyseMesh } from "./geometry";
import { convertOcctResult, occtReadParams } from "./occt";
import type { CadWorkerRequest, WorkerResponse } from "./types";

const ctx = self as unknown as DedicatedWorkerGlobalScope;

/**
 * Einmal laden, dann behalten.
 *
 * Wer zwei STEP-Dateien nacheinander oeffnet, soll nicht zweimal 7,4 MB
 * uebersetzen. Der Worker lebt allerdings nur fuer einen Ladevorgang (siehe
 * load.ts) — der Zwischenspeicher greift daher nur, wenn derselbe Worker
 * mehrere Auftraege bekommt.
 */
let occtPromise: Promise<OcctModule> | null = null;

function loadOcct(): Promise<OcctModule> {
  occtPromise ??= occtimportjs({
    locateFile: (path) => (path.endsWith(".wasm") ? wasmUrl : path),
  });
  return occtPromise;
}

ctx.onmessage = (event: MessageEvent<CadWorkerRequest>) => {
  const { id, buffer, quality, format } = event.data;

  const post = (message: WorkerResponse, transfer?: Transferable[]): void => {
    ctx.postMessage(message, transfer ?? []);
  };

  void (async () => {
    try {
      // Das Laden der Bibliothek ist der langsamste Schritt und meldet keinen
      // eigenen Fortschritt. Ein Balken, der bei null stehenbleibt, sieht aus
      // wie ein Absturz — deshalb wenigstens die Phase benennen.
      post({ id, kind: "progress", phase: "parse", ratio: 0.05 });
      const occt = await loadOcct();

      post({ id, kind: "progress", phase: "parse", ratio: 0.2 });
      const bytes = new Uint8Array(buffer);
      const params = occtReadParams(quality);
      // Derselbe Ergebnisaufbau, dieselbe Umwandlung — nur die Lesefunktion
      // unterscheidet sich. Ab hier weiss der Rest des Werkzeugs nichts mehr
      // davon, aus welchem der beiden Formate das Netz gekommen ist.
      const result =
        format === "iges" ? occt.ReadIgesFile(bytes, params) : occt.ReadStepFile(bytes, params);

      post({ id, kind: "progress", phase: "parse", ratio: 0.85 });
      const converted = convertOcctResult(result);

      post({ id, kind: "progress", phase: "analyse", ratio: 0 });
      const stats = analyseMesh(converted.positions);
      post({ id, kind: "progress", phase: "analyse", ratio: 1 });

      post(
        {
          id,
          kind: "done",
          positions: converted.positions.buffer as ArrayBuffer,
          triangles: converted.triangles,
          format,
          solidName: converted.name,
          trailingBytes: 0,
          parts: converted.parts,
          stats,
        },
        [converted.positions.buffer as ArrayBuffer],
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      post({
        id,
        kind: "error",
        message,
        // Beides ist derselbe Befund fuer den Kunden: OpenCascade kam mit der
        // Datei nicht zurecht. Frueher stand hier not-stl — und der Kunde las
        // unter seiner STEP-Datei "Der Inhalt sieht nicht nach einem STL aus".
        code: "cad-failed",
      });
    }
  })();
};
