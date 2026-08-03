/**
 * Anmerkungen und Messungen.
 *
 * Die Liste ist die Wahrheit, nicht die Marke am Modell: Eine Anmerkung, die man
 * nur findet, wenn man das Bauteil in die richtige Lage dreht, ist keine
 * Dokumentation. Deshalb steht jede hier mit Nummer, Titel, Text und Position —
 * und dieselbe Reihenfolge landet im PDF.
 */

import type { Lang, T } from "../../i18n";
import * as fmt from "../../lib/format";
import { ANNOTATION_CATEGORIES, type Annotation, type Measurement } from "../../viewer/types";
import { Button, cx, Icon, ICONS, Section } from "../ui";

export function AnnotationsPanel({
  t,
  lang,
  annotations,
  activeId,
  onSelect,
  onUpdate,
  onDelete,
  onRestoreView,
  onSave,
  onLoad,
  measurements,
  onDeleteMeasurement,
  onClearMeasurements,
}: {
  t: T;
  lang: Lang;
  annotations: readonly Annotation[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, patch: Partial<Annotation>) => void;
  onDelete: (id: string) => void;
  onRestoreView: (annotation: Annotation) => void;
  onSave: () => void;
  onLoad: () => void;
  measurements: readonly Measurement[];
  onDeleteMeasurement: (id: string) => void;
  onClearMeasurements: () => void;
}) {
  return (
    <>
      <Section
        title={t("ann.title")}
        right={
          annotations.length > 0 ? (
            <span className="text-xs muted num">{annotations.length}</span>
          ) : undefined
        }
      >
        {annotations.length === 0 ? (
          <p className="text-sm muted leading-snug surface p-3">{t("ann.empty")}</p>
        ) : (
          <div className="space-y-2">
            {annotations.map((annotation) => (
              <AnnotationCard
                key={annotation.id}
                t={t}
                lang={lang}
                annotation={annotation}
                active={annotation.id === activeId}
                onSelect={() => onSelect(annotation.id === activeId ? null : annotation.id)}
                onUpdate={(patch) => onUpdate(annotation.id, patch)}
                onDelete={() => onDelete(annotation.id)}
                onRestoreView={() => onRestoreView(annotation)}
              />
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-3">
          <Button onClick={onSave} disabled={annotations.length === 0} variant="outline">
            <span className="inline-flex items-center gap-1.5">
              <Icon path={ICONS.download} className="w-3.5 h-3.5" />
              {t("ann.save")}
            </span>
          </Button>
          <Button onClick={onLoad} variant="outline">
            <span className="inline-flex items-center gap-1.5">
              <Icon path={ICONS.upload} className="w-3.5 h-3.5" />
              {t("ann.load")}
            </span>
          </Button>
        </div>
        <p className="text-[11px] muted mt-2 leading-snug">{t("ann.saveHint")}</p>
      </Section>

      <Section
        title={t("measure.title")}
        right={
          measurements.length > 0 ? (
            <button
              type="button"
              onClick={onClearMeasurements}
              className="text-xs muted hover:text-bad transition-colors"
            >
              {t("measure.clear")}
            </button>
          ) : undefined
        }
      >
        {measurements.length === 0 ? (
          <p className="text-sm muted leading-snug surface p-3">{t("measure.empty")}</p>
        ) : (
          <div className="surface px-3 py-1">
            {measurements.map((measurement, index) => (
              <div
                key={measurement.id}
                className="flex items-baseline justify-between gap-2 py-1.5 border-b border-hairline dark:border-[#1E2B3D] last:border-0"
              >
                <span className="text-xs muted shrink-0">
                  {t("measure.distance")} {index + 1}
                </span>
                <span className="text-sm font-medium num">
                  {fmt.num(measurement.distance, lang, 2)} mm
                </span>
                <button
                  type="button"
                  onClick={() => onDeleteMeasurement(measurement.id)}
                  className="muted hover:text-bad transition-colors shrink-0"
                  aria-label={t("ann.delete")}
                >
                  <Icon path={ICONS.trash} className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="text-[11px] muted mt-2 leading-snug">{t("measure.note")}</p>
      </Section>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function AnnotationCard({
  t,
  lang,
  annotation,
  active,
  onSelect,
  onUpdate,
  onDelete,
  onRestoreView,
}: {
  t: T;
  lang: Lang;
  annotation: Annotation;
  active: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<Annotation>) => void;
  onDelete: () => void;
  onRestoreView: () => void;
}) {
  const category =
    ANNOTATION_CATEGORIES.find((c) => c.id === annotation.category) ?? ANNOTATION_CATEGORIES[0];

  return (
    <div
      className={cx(
        "surface p-3 transition-colors",
        active && "border-petrol-400 dark:border-petrol-400",
      )}
    >
      <button type="button" onClick={onSelect} className="flex items-start gap-2.5 w-full text-left">
        <span
          className="shrink-0 grid place-items-center w-6 h-6 rounded-full text-white text-[11px] font-display font-bold"
          style={{ background: category.color }}
        >
          {annotation.number}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium truncate">
            {annotation.title || t("ann.new")}
          </span>
          <span className="block text-[11px] muted">{lang === "de" ? category.de : category.en}</span>
        </span>
        <Icon
          path="m9 18 6-6-6-6"
          className={cx("w-4 h-4 mt-1 muted transition-transform shrink-0", active && "rotate-90")}
        />
      </button>

      {active && (
        <div className="mt-3 pt-3 border-t border-hairline dark:border-[#1E2B3D] space-y-2.5">
          <label className="block">
            <span className="block text-xs muted mb-1">{t("ann.titleField")}</span>
            <input
              type="text"
              value={annotation.title}
              placeholder={t("ann.titlePlaceholder")}
              onChange={(event) => onUpdate({ title: event.target.value })}
              className="w-full rounded-lg border border-hairline dark:border-[#1E2B3D] bg-transparent px-2.5 py-1.5 text-sm"
            />
          </label>

          <label className="block">
            <span className="block text-xs muted mb-1">{t("ann.textField")}</span>
            <textarea
              value={annotation.text}
              placeholder={t("ann.textPlaceholder")}
              rows={3}
              onChange={(event) => onUpdate({ text: event.target.value })}
              className="w-full rounded-lg border border-hairline dark:border-[#1E2B3D] bg-transparent px-2.5 py-1.5 text-sm resize-y"
            />
          </label>

          <div>
            <span className="block text-xs muted mb-1">{t("ann.category")}</span>
            <div className="flex flex-wrap gap-1.5">
              {ANNOTATION_CATEGORIES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onUpdate({ category: option.id })}
                  className={cx(
                    "px-2 py-1 rounded-md text-[11px] font-semibold border transition-colors",
                    annotation.category === option.id
                      ? "text-white border-transparent"
                      : "muted border-hairline dark:border-[#1E2B3D] hover:border-petrol-400",
                  )}
                  style={
                    annotation.category === option.id ? { background: option.color } : undefined
                  }
                >
                  {lang === "de" ? option.de : option.en}
                </button>
              ))}
            </div>
          </div>

          <p className="text-[11px] muted num">
            {t("ann.position")}: {fmt.num(annotation.point.x, lang, 1)} /{" "}
            {fmt.num(annotation.point.y, lang, 1)} / {fmt.num(annotation.point.z, lang, 1)} mm
          </p>

          <div className="flex flex-wrap gap-2">
            <Button onClick={onRestoreView} variant="outline">
              {t("ann.goto")}
            </Button>
            <Button onClick={onDelete} variant="danger">
              {t("ann.delete")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
