/**
 * Typen fuer occt-import-js.
 *
 * Das Paket liefert keine mit — es ist eine Emscripten-Ausgabe von OpenCascade
 * und kennt TypeScript nicht. Beschrieben ist hier nur, was dieses Projekt
 * benutzt; die uebrigen Funktionen (ReadBrepFile, ReadIgesFile) bleiben
 * absichtlich aussen vor, damit die Datei nicht mehr verspricht, als geprueft ist.
 */

declare module "occt-import-js" {
  import type { OcctResult } from "../stl/step-mesh";

  export interface OcctReadParams {
    linearUnit?: "millimeter" | "centimeter" | "meter" | "inch" | "foot";
    linearDeflectionType?: "bounding_box_ratio" | "absolute_value";
    linearDeflection?: number;
    angularDeflection?: number;
  }

  export interface OcctModule {
    ReadStepFile(content: Uint8Array, params: OcctReadParams | null): OcctResult;
  }

  export interface OcctFactoryOptions {
    /**
     * Emscripten fragt hier nach der Adresse der .wasm-Datei.
     *
     * MUSS gesetzt werden. Ohne die Angabe raet die Glue-Datei anhand von
     * `document.currentScript` — und im Web Worker eines gebuendelten Projekts
     * gibt es das nicht. Der Abruf ginge dann an eine Adresse, die es nicht gibt.
     */
    locateFile?: (path: string, prefix: string) => string;
  }

  export default function occtimportjs(options?: OcctFactoryOptions): Promise<OcctModule>;
}

declare module "occt-import-js/dist/occt-import-js.wasm?url" {
  const url: string;
  export default url;
}
