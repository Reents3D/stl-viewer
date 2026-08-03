/**
 * Zusammenschaltung: Zustand, Dateiannahme und die Wege zwischen den Bereichen.
 *
 * Alles, was ein Kunde anfasst, laeuft hier zusammen. Der Aufbau folgt einer
 * Regel: Die Datei ist der einzige Eingang, und sie geht nirgends hinaus. Es gibt
 * in diesem Projekt kein fetch, kein XHR und keinen Serveraufruf — die
 * Inhaltssicherheitsrichtlinie im Build wuerde ihn ohnehin blockieren
 * (connect-src 'none', siehe vite.config.ts).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Header } from "./components/Chrome";
import { Sidebar, type TabId } from "./components/Sidebar";
import { StartScreen, UNIT_SCALE, type UnitChoice } from "./components/StartScreen";
import { Viewer } from "./components/Viewer";
import { AnnotationsPanel } from "./components/panels/AnnotationsPanel";
import { DisplayPanel } from "./components/panels/DisplayPanel";
import { ExportPanel, type ExportProgress } from "./components/panels/ExportPanel";
import { InspectPanel } from "./components/panels/InspectPanel";
import { DEFAULT_INFILL, DEFAULT_MATERIAL_ID, materialById } from "./config/materials";
import { SITE } from "./config/site";
import {
  parseAnnotationFile,
  toAnnotationFile,
} from "./export/annotations-file";
import { downloadBlob, downloadDataUrl, downloadJson, pickFile } from "./export/files";
import { pdfFileName } from "./export/pdf";
import {
  DEFAULT_EXPORT_OPTIONS,
  ExportCancelled,
  runPdfExport,
  type ExportOptions,
} from "./export/run-export";
import { detectLang, makeT, type Lang } from "./i18n";
import * as fmt from "./lib/format";
import { fitsInBuildVolume } from "./stl/geometry";
import { loadStl, looksLikeStlFile, StlLoadError, type LoadedModel, type LoadProgress } from "./stl/load";
import type { StlErrorCode } from "./stl/types";
import type { ModelScene, HitResult } from "./viewer/scene";
import {
  DEFAULT_VIEW_STATE,
  type Annotation,
  type Measurement,
  type ToolMode,
  type ViewState,
} from "./viewer/types";

const LOGO_URL = `${import.meta.env.BASE_URL}brand/reents-logo-horizontal-color.svg`;

export default function App() {
  const [lang, setLang] = useState<Lang>(detectLang);
  const t = useMemo(() => makeT(lang), [lang]);

  const [unit, setUnit] = useState<UnitChoice>("mm");
  const [model, setModel] = useState<LoadedModel | null>(null);
  const [loading, setLoading] = useState<LoadProgress | null>(null);
  const [error, setError] = useState<{ code: StlErrorCode; message: string } | null>(null);
  const [dragging, setDragging] = useState(false);

  const [view, setView] = useState<ViewState>(DEFAULT_VIEW_STATE);
  const [tool, setTool] = useState<ToolMode>("orbit");
  const [tab, setTab] = useState<TabId>("inspect");

  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [pendingPoint, setPendingPoint] = useState<{ x: number; y: number; z: number } | null>(null);

  const [materialId, setMaterialId] = useState<string>(DEFAULT_MATERIAL_ID);
  const [infill, setInfill] = useState<number>(DEFAULT_INFILL);

  const [exportOptions, setExportOptions] = useState<ExportOptions>(DEFAULT_EXPORT_OPTIONS);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);

  const sceneRef = useRef<ModelScene | null>(null);
  const loadRef = useRef<{ cancel: () => void } | null>(null);
  const cancelExportRef = useRef(false);
  // Anmerkungsnummern werden NIE neu vergeben. Wer #3 loescht, hat danach #1, #2,
  // #4 — und die Nummern in einer bereits verschickten PDF stimmen weiterhin.
  const annotationCounter = useRef(0);

  /* --------------------------------------------------------------- Datei laden */

  const openFiles = useCallback(
    (files: readonly File[]) => {
      const file = files.find(looksLikeStlFile) ?? files[0];
      if (!file) return;
      if (!looksLikeStlFile(file)) {
        setError({ code: "not-stl", message: t("error.wrongType") });
        return;
      }

      loadRef.current?.cancel();
      setError(null);
      setLoading({ phase: "read", ratio: 0 });

      const handle = loadStl(file, {
        scale: UNIT_SCALE[unit],
        onProgress: setLoading,
      });
      loadRef.current = handle;

      handle.promise
        .then((loaded) => {
          setModel(loaded);
          setAnnotations([]);
          setMeasurements([]);
          setPendingPoint(null);
          setActiveId(null);
          annotationCounter.current = 0;
          setTool("orbit");
          setTab("inspect");
          setLoading(null);
        })
        .catch((cause: unknown) => {
          setLoading(null);
          if (cause instanceof StlLoadError) {
            setError({ code: cause.code, message: cause.message });
          } else {
            setError({ code: "not-stl", message: String(cause) });
          }
        });
    },
    [t, unit],
  );

  const pickStl = useCallback(async () => {
    const file = await pickFile(".stl,model/stl,application/sla");
    if (file) openFiles([file]);
  }, [openFiles]);

  /* ------------------------------------------------------- Ziehen und Ablegen */

  useEffect(() => {
    // Die Annahme haengt am FENSTER, nicht an einem Feld. Wer eine Datei
    // hineinzieht, zielt nicht — er laesst los. Ein Ablagebereich, den man
    // treffen muss, ist ein Bedienfehler in Wartestellung.
    let depth = 0;

    const onDragEnter = (event: DragEvent) => {
      if (!event.dataTransfer?.types.includes("Files")) return;
      depth++;
      setDragging(true);
    };
    const onDragOver = (event: DragEvent) => {
      if (!event.dataTransfer?.types.includes("Files")) return;
      // Ohne preventDefault oeffnet der Browser die Datei selbst und ersetzt
      // die Anwendung durch eine Downloadaufforderung.
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    };
    const onDragLeave = () => {
      // Zaehler statt eines einfachen Schalters: dragleave feuert auch beim
      // Uebergang zwischen zwei Kindelementen, und der Schleier flackerte.
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragging(false);
    };
    const onDrop = (event: DragEvent) => {
      event.preventDefault();
      depth = 0;
      setDragging(false);
      const files = Array.from(event.dataTransfer?.files ?? []);
      if (files.length > 0) openFiles(files);
    };

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, [openFiles]);

  /* ------------------------------------------------------------------ Treffer */

  const handlePick = useCallback(
    (hit: HitResult) => {
      const scene = sceneRef.current;
      if (!scene) return;
      const point = { x: hit.local.x, y: hit.local.y, z: hit.local.z };

      if (tool === "annotate") {
        annotationCounter.current += 1;
        const annotation: Annotation = {
          id: `a${annotationCounter.current}-${Math.round(hit.local.x * 100)}`,
          number: annotationCounter.current,
          point,
          normal: { x: hit.normal.x, y: hit.normal.y, z: hit.normal.z },
          camera: scene.cameraState(),
          title: "",
          text: "",
          category: "hinweis",
        };
        setAnnotations((current) => [...current, annotation]);
        setActiveId(annotation.id);
        setTab("annotate");
        return;
      }

      if (tool === "measure") {
        if (!pendingPoint) {
          setPendingPoint(point);
          return;
        }
        const distance = Math.hypot(
          point.x - pendingPoint.x,
          point.y - pendingPoint.y,
          point.z - pendingPoint.z,
        );
        setMeasurements((current) => [
          ...current,
          { id: `m${current.length + 1}-${Math.round(distance * 100)}`, a: pendingPoint, b: point, distance },
        ]);
        setPendingPoint(null);
        setTab("annotate");
      }
    },
    [pendingPoint, tool],
  );

  /* -------------------------------------------------------------- Anmerkungen */

  const updateAnnotation = useCallback((id: string, patch: Partial<Annotation>) => {
    setAnnotations((current) =>
      current.map((annotation) => (annotation.id === id ? { ...annotation, ...patch } : annotation)),
    );
  }, []);

  const deleteAnnotation = useCallback((id: string) => {
    setAnnotations((current) => current.filter((annotation) => annotation.id !== id));
    setActiveId((current) => (current === id ? null : current));
  }, []);

  const saveAnnotations = useCallback(() => {
    if (!model) return;
    const size = model.stats.bbox.size;
    downloadJson(
      toAnnotationFile(
        annotations,
        {
          fileName: model.fileName,
          triangles: model.triangles,
          size: [size.x, size.y, size.z],
        },
        new Date(),
      ),
      `${fmt.safeFileName(model.fileName)}-anmerkungen.json`,
    );
  }, [annotations, model]);

  const loadAnnotations = useCallback(async () => {
    if (!model) return;
    const file = await pickFile(".json,application/json");
    if (!file) return;

    const result = parseAnnotationFile(await file.text(), {
      fileName: model.fileName,
      triangles: model.triangles,
    });
    if (!result.ok) {
      setError({ code: "not-stl", message: t("error.wrongType") });
      return;
    }
    if (
      !result.matchesModel &&
      !window.confirm(
        t("ann.loadMismatch", { name: result.file.model.fileName, current: model.fileName }),
      )
    ) {
      return;
    }

    setAnnotations(result.file.annotations);
    annotationCounter.current = result.file.annotations.reduce(
      (max, annotation) => Math.max(max, annotation.number),
      0,
    );
    setTab("annotate");
  }, [model, t]);

  /* ------------------------------------------------------------------ Export */

  const exportPng = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene || !model) return;
    const image = scene.capture({ width: 2000, height: 1500, clean: false });
    downloadDataUrl(
      image,
      `${fmt.isoDate(new Date())}-${fmt.safeFileName(model.fileName)}.jpg`,
    );
  }, [model]);

  const exportPdf = useCallback(async () => {
    const scene = sceneRef.current;
    if (!scene || !model) return;

    cancelExportRef.current = false;
    setExportProgress({ done: 0, total: 1, assembling: false });

    const volume = SITE.buildVolumes.find((v) => v.id === view.buildVolumeId) ?? SITE.buildVolumes[0];
    const now = new Date();

    try {
      const doc = await runPdfExport({
        scene,
        model,
        annotations,
        options: exportOptions,
        lang,
        t,
        material: materialById(materialId),
        infill,
        buildVolume: volume,
        fit: fitsInBuildVolume(model.stats.bbox.size, volume),
        logoUrl: LOGO_URL,
        now,
        onProgress: (done, total) => setExportProgress({ done, total, assembling: false }),
        isCancelled: () => cancelExportRef.current,
      });

      setExportProgress({ done: 1, total: 1, assembling: true });
      // Ein Bilddurchlauf, damit "wird zusammengesetzt" sichtbar wird, bevor
      // jsPDF den Hauptstrang fuer die Dauer der Ausgabe belegt.
      await new Promise((resolve) => requestAnimationFrame(resolve));
      downloadBlob(doc.output("blob"), pdfFileName(model, now));
    } catch (cause: unknown) {
      if (!(cause instanceof ExportCancelled)) {
        setError({ code: "not-stl", message: cause instanceof Error ? cause.message : String(cause) });
      }
    } finally {
      setExportProgress(null);
    }
  }, [annotations, exportOptions, infill, lang, materialId, model, t, view.buildVolumeId]);

  /* -------------------------------------------------------------------- Aufbau */

  const buildVolume = useMemo(
    () => SITE.buildVolumes.find((v) => v.id === view.buildVolumeId) ?? SITE.buildVolumes[0],
    [view.buildVolumeId],
  );

  return (
    <div className="h-full flex flex-col">
      <Header
        lang={lang}
        onLang={setLang}
        t={t}
        hasModel={model !== null}
        onNewFile={pickStl}
      />

      {model === null ? (
        <StartScreen
          t={t}
          lang={lang}
          unit={unit}
          onUnit={setUnit}
          onPick={pickStl}
          error={error ? { title: t("error.title"), detail: errorDetail(t, error) } : null}
        />
      ) : (
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
          <Viewer
            model={model}
            viewState={view}
            buildVolume={buildVolume}
            tool={tool}
            annotations={annotations}
            measurements={measurements}
            pendingPoint={pendingPoint}
            activeId={activeId}
            onSceneReady={(scene) => {
              sceneRef.current = scene;
            }}
            onPick={handlePick}
            onSelectAnnotation={(id) => {
              setActiveId(id);
              setTab("annotate");
            }}
            onTool={setTool}
            t={t}
            lang={lang}
          />

          <Sidebar t={t} tab={tab} onTab={setTab} annotationCount={annotations.length}>
            {tab === "inspect" && (
              <InspectPanel
                t={t}
                lang={lang}
                model={model}
                materialId={materialId}
                onMaterial={setMaterialId}
                infill={infill}
                onInfill={setInfill}
                buildVolumeId={view.buildVolumeId}
                onBuildVolume={(buildVolumeId) => setView({ ...view, buildVolumeId })}
              />
            )}
            {tab === "display" && (
              <DisplayPanel
                t={t}
                view={view}
                onChange={setView}
                canShowEdges={sceneRef.current?.canShowEdges() ?? false}
              />
            )}
            {tab === "annotate" && (
              <AnnotationsPanel
                t={t}
                lang={lang}
                annotations={annotations}
                activeId={activeId}
                onSelect={setActiveId}
                onUpdate={updateAnnotation}
                onDelete={deleteAnnotation}
                onRestoreView={(annotation) => sceneRef.current?.restoreCamera(annotation.camera)}
                onSave={saveAnnotations}
                onLoad={loadAnnotations}
                measurements={measurements}
                onDeleteMeasurement={(id) =>
                  setMeasurements((current) => current.filter((m) => m.id !== id))
                }
                onClearMeasurements={() => {
                  setMeasurements([]);
                  setPendingPoint(null);
                }}
              />
            )}
            {tab === "export" && (
              <ExportPanel
                t={t}
                options={exportOptions}
                onChange={setExportOptions}
                annotationCount={annotations.length}
                onPng={exportPng}
                onPdf={exportPdf}
                onCancel={() => {
                  cancelExportRef.current = true;
                }}
                progress={exportProgress}
              />
            )}
          </Sidebar>
        </div>
      )}

      {loading && <LoadingVeil t={t} progress={loading} onCancel={() => loadRef.current?.cancel()} />}
      {dragging && <DropVeil t={t} />}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function DropVeil({ t }: { t: ReturnType<typeof makeT> }) {
  return (
    <div className="dropveil">
      <div className="dropveil-frame">
        <p className="font-display font-bold text-2xl mb-2">{t("drop.release")}</p>
        <p className="text-sm opacity-80">{t("drop.privacy")}</p>
      </div>
    </div>
  );
}

function LoadingVeil({
  t,
  progress,
  onCancel,
}: {
  t: ReturnType<typeof makeT>;
  progress: LoadProgress;
  onCancel: () => void;
}) {
  const label = {
    read: t("load.read"),
    parse: t("load.parse"),
    analyse: t("load.analyse"),
  }[progress.phase];

  return (
    <div className="dropveil">
      <div className="surface p-6 w-[min(24rem,90vw)] text-center">
        <p className="font-display font-bold text-sm mb-3">{label}</p>
        <div className="h-2 rounded-full bg-petrol-100 dark:bg-white/10 overflow-hidden">
          <div
            className="h-full bg-petrol-700 dark:bg-petrol-300"
            style={{ width: `${Math.round(progress.ratio * 100)}%` }}
          />
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="mt-4 text-xs muted hover:text-bad transition-colors"
        >
          {t("load.cancel")}
        </button>
      </div>
    </div>
  );
}

function errorDetail(t: ReturnType<typeof makeT>, error: { code: StlErrorCode; message: string }): string {
  const known = {
    empty: t("error.empty"),
    "too-small": t("error.too-small"),
    "not-stl": t("error.not-stl"),
    "no-triangles": t("error.no-triangles"),
    truncated: t("error.truncated"),
    "out-of-memory": t("error.out-of-memory"),
  }[error.code];
  // Die Meldung aus dem Parser steht DAHINTER, nicht anstelle: Sie nennt den
  // technischen Grund, den ein Konstrukteur braucht, um die Datei neu zu
  // exportieren — die uebersetzte Zeile allein sagt nur, dass etwas fehlt.
  return error.message && error.message !== known ? `${known} ${error.message}` : known;
}
