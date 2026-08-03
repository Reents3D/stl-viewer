/**
 * Export: Bild und PDF-Dokumentation.
 *
 * Die Aufnahmezahl steht VOR dem Start da. Drei Achsen mit je zwanzig Bildern
 * plus zwoelf Anmerkungen sind 78 Renderdurchgaenge — das dauert auf einem
 * Buerorechner deutlich ueber eine Minute. Wer die Zahl vorher sieht, waehlt
 * bewusst; wer sie nicht sieht, haelt den Rechner fuer haengengeblieben.
 */

import type { T } from "../../i18n";
import {
  plannedShots,
  type ExportOptions,
  type ShotQuality,
} from "../../export/run-export";
import type { Axis } from "../../viewer/types";
import { Button, Icon, ICONS, SegmentedControl, Section, Slider, Toggle } from "../ui";

export interface ExportProgress {
  done: number;
  total: number;
  assembling: boolean;
}

export function ExportPanel({
  t,
  options,
  onChange,
  annotationCount,
  onPng,
  onPdf,
  onCancel,
  progress,
}: {
  t: T;
  options: ExportOptions;
  onChange: (next: ExportOptions) => void;
  annotationCount: number;
  onPng: () => void;
  onPdf: () => void;
  onCancel: () => void;
  progress: ExportProgress | null;
}) {
  const shots = plannedShots(options, annotationCount);
  const nothingSelected =
    options.axes.length === 0 && !options.standardViews && !options.annotationPages;

  const toggleAxis = (axis: Axis): void => {
    const next = options.axes.includes(axis)
      ? options.axes.filter((a) => a !== axis)
      : [...options.axes, axis];
    onChange({ ...options, axes: next });
  };

  if (progress) {
    const percent = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
    return (
      <Section title={t("export.title")}>
        <div className="surface p-4">
          <p className="text-sm font-medium mb-2">
            {progress.assembling
              ? t("export.assembling")
              : t("export.running", { i: progress.done, n: progress.total })}
          </p>
          <div className="h-2 rounded-full bg-petrol-100 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full bg-petrol-700 dark:bg-petrol-300 transition-[width] duration-150"
              style={{ width: `${progress.assembling ? 100 : percent}%` }}
            />
          </div>
          <Button onClick={onCancel} variant="outline" className="mt-3 w-full">
            {t("export.cancel")}
          </Button>
        </div>
      </Section>
    );
  }

  return (
    <>
      <Section title={t("export.png")}>
        <div className="surface p-3">
          <p className="text-xs muted mb-2.5 leading-snug">{t("export.pngHint")}</p>
          <Button onClick={onPng} variant="outline" className="w-full">
            <span className="inline-flex items-center gap-2">
              <Icon path={ICONS.camera} className="w-4 h-4" />
              {t("export.png")}
            </span>
          </Button>
        </div>
      </Section>

      <Section title={t("export.pdf")}>
        <div className="surface p-3 space-y-3">
          <p className="text-xs muted leading-snug">{t("export.pdfHint")}</p>

          {/* -------------------------------------------------- Rundumansichten */}
          <div className="pt-1 border-t border-hairline dark:border-[#1E2B3D]">
            <span className="block text-xs muted mb-1.5">{t("export.turntable")}</span>
            <div className="space-y-0.5">
              {(
                [
                  ["z", t("export.axisZ")],
                  ["x", t("export.axisX")],
                  ["y", t("export.axisY")],
                ] as const
              ).map(([axis, label]) => (
                <Toggle
                  key={axis}
                  checked={options.axes.includes(axis)}
                  onChange={() => toggleAxis(axis)}
                  label={label}
                />
              ))}
            </div>

            <div className="mt-2">
              <Slider
                label={t("export.perAxis")}
                min={4}
                max={36}
                step={1}
                value={options.perAxis}
                onChange={(perAxis) => onChange({ ...options, perAxis })}
                display={String(options.perAxis)}
              />
            </div>
            <p className="text-[11px] muted leading-snug">{t("export.axesHint")}</p>
          </div>

          {/* ------------------------------------------------------ Weiteres */}
          <div className="pt-2 border-t border-hairline dark:border-[#1E2B3D]">
            <Toggle
              checked={options.standardViews}
              onChange={(standardViews) => onChange({ ...options, standardViews })}
              label={t("export.standardViews")}
              hint={t("export.standardViewsHint")}
            />
            <Toggle
              checked={options.annotationPages}
              onChange={(annotationPages) => onChange({ ...options, annotationPages })}
              label={t("export.annotationPages")}
              hint={
                annotationCount > 0
                  ? t("export.annotationPagesHint")
                  : `${t("export.annotationPagesHint")} (${t("pdf.noAnnotations")})`
              }
              disabled={annotationCount === 0}
            />
          </div>

          {/* ------------------------------------------------------ Bildgroesse */}
          <div className="pt-2 border-t border-hairline dark:border-[#1E2B3D]">
            <span className="block text-xs muted mb-1.5">{t("export.quality")}</span>
            <SegmentedControl<ShotQuality>
              ariaLabel={t("export.quality")}
              value={options.quality}
              onChange={(quality) => onChange({ ...options, quality })}
              options={[
                { value: "klein", label: t("export.qualityLow") },
                { value: "mittel", label: t("export.qualityMedium") },
                { value: "gross", label: t("export.qualityHigh") },
              ]}
            />
            <p className="text-[11px] muted mt-1.5 leading-snug">{t("export.qualityHint")}</p>
          </div>

          <div className="pt-2 border-t border-hairline dark:border-[#1E2B3D]">
            <p className="text-xs muted mb-2">{t("export.estimate", { n: shots })}</p>
            <Button onClick={onPdf} variant="primary" disabled={nothingSelected} className="w-full">
              <span className="inline-flex items-center gap-2">
                <Icon path={ICONS.document} className="w-4 h-4" />
                {t("export.build")}
              </span>
            </Button>
            {nothingSelected && (
              <p className="text-[11px] text-bad mt-1.5">{t("export.nothingSelected")}</p>
            )}
          </div>
        </div>
      </Section>
    </>
  );
}
