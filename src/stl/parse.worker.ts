/// <reference lib="webworker" />

/**
 * Parser und Analyse in einem eigenen Strang.
 *
 * Beides zusammen im Worker zu halten hat einen handfesten Grund: Der Parser gibt
 * ein Positionsfeld zurueck, und die Analyse laeuft ueber genau dieses Feld. Laege
 * die Analyse auf dem Hauptstrang, muesste das Feld erst hinueberwandern — bei
 * einem 100-MB-Modell sind das 250 MB, die einmal durch die Uebergabe gehen,
 * bevor ueberhaupt gerechnet wird. So geht es genau einmal hinueber: fertig
 * analysiert, direkt vor dem Zeichnen.
 */

import { analyseMesh } from "./geometry";
import { parseStl, StlError } from "./parse";
import type { WorkerRequest, WorkerResponse } from "./types";

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { id, buffer, scale } = event.data;

  const post = (message: WorkerResponse, transfer?: Transferable[]): void => {
    ctx.postMessage(message, transfer ?? []);
  };

  try {
    // Der Fortschritt wird gedrosselt gemeldet: Jede Nachricht kostet einen
    // Durchlauf durch die Ereignisschleife des Hauptstrangs. Bei 64 Meldungen je
    // Abschnitt bleibt der Balken fluessig, ohne die Oberflaeche zuzuschuetten.
    const parsed = parseStl(buffer, scale, (ratio) => {
      post({ id, kind: "progress", phase: "parse", ratio });
    });

    post({ id, kind: "progress", phase: "analyse", ratio: 0 });
    const stats = analyseMesh(parsed.positions);
    post({ id, kind: "progress", phase: "analyse", ratio: 1 });

    // Das Positionsfeld wird UEBERGEBEN, nicht kopiert. Danach ist es im Worker
    // ungueltig — der Worker wird ohnehin direkt danach beendet.
    post(
      {
        id,
        kind: "done",
        positions: parsed.positions.buffer as ArrayBuffer,
        triangles: parsed.triangles,
        format: parsed.format,
        solidName: parsed.solidName,
        trailingBytes: parsed.trailingBytes,
        stats,
      },
      [parsed.positions.buffer as ArrayBuffer],
    );
  } catch (error) {
    if (error instanceof StlError) {
      post({ id, kind: "error", message: error.message, code: error.code });
      return;
    }
    // RangeError beim Anlegen grosser Felder ist der haeufigste Fall, der hier
    // ankommt — er verdient eine Meldung, die auf die Groesse zeigt.
    const message = error instanceof Error ? error.message : String(error);
    post({
      id,
      kind: "error",
      message,
      code: error instanceof RangeError ? "out-of-memory" : "not-stl",
    });
  }
};
