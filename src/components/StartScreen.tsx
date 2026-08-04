/**
 * Startseite: der Bildschirm, den ein Kunde als erstes sieht.
 *
 * Er muss genau eine Frage beantworten — "was mache ich hier?" — und dabei die
 * zweite gleich mit erledigen, die bei einer Konstruktionsdatei immer mitkommt:
 * "wo landet meine Datei?". Deshalb steht der Datenschutzhinweis nicht im Fuss,
 * sondern direkt unter dem Ablagefeld.
 */

import type { Lang, T } from "../i18n";
import type { StepQuality } from "../stl/step-mesh";
import { SITE } from "../config/site";
import { Footer } from "./Chrome";
import { Button, Card, Disclosure, Icon, ICONS } from "./ui";

export type UnitChoice = "mm" | "cm" | "inch";

export const UNIT_SCALE: Record<UnitChoice, number> = { mm: 1, cm: 10, inch: 25.4 };

export function StartScreen({
  t,
  lang,
  unit,
  onUnit,
  quality,
  onQuality,
  onPick,
  error,
}: {
  t: T;
  lang: Lang;
  unit: UnitChoice;
  onUnit: (unit: UnitChoice) => void;
  quality: StepQuality;
  onQuality: (quality: StepQuality) => void;
  onPick: () => void;
  error: { title: string; detail: string } | null;
}) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto scroll-thin">
      <div className="max-w-3xl mx-auto px-4 py-10 sm:py-16">
        <p className="eyebrow mb-3">{SITE.brand}</p>
        <h2 className="text-3xl sm:text-4xl font-display font-bold leading-tight mb-3">
          <span className="hero-gradient">{t("drop.title")}</span>
        </h2>
        <p className="muted mb-8 text-[15px] leading-relaxed">{t("drop.sub")}</p>

        {error && (
          <div className="mb-6 rounded-xl border border-bad/40 bg-bad/5 p-4">
            <p className="font-semibold text-bad text-sm">{error.title}</p>
            <p className="text-sm muted mt-1">{error.detail}</p>
          </div>
        )}

        {/* Das Feld ist gross, weil es getroffen werden muss - und es ist
            gleichzeitig eine Schaltflaeche, weil nicht jeder zieht. */}
        <button
          type="button"
          onClick={onPick}
          className="w-full rounded-2xl border-2 border-dashed border-petrol-300 dark:border-petrol-500 bg-petrol-50/60 dark:bg-white/[0.03] px-6 py-14 text-center transition-colors hover:border-petrol-600 hover:bg-petrol-50 dark:hover:bg-white/[0.06]"
        >
          <span className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-petrol-700 text-white dark:bg-petrol-300 dark:text-ink mb-4">
            <Icon path={ICONS.upload} className="w-6 h-6" />
          </span>
          <span className="block font-display font-bold text-lg mb-1">{t("drop.title")}</span>
          <span className="block text-sm muted mb-5">{t("drop.button")}</span>
          <span className="inline-block text-xs muted">STL · STEP · STP</span>
        </button>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <fieldset>
            <legend className="text-xs muted mb-1.5">{t("drop.units")}</legend>
            <div className="flex rounded-xl border border-hairline dark:border-[#1E2B3D] overflow-hidden">
              {(
                [
                  ["mm", t("drop.unitMm")],
                  ["cm", t("drop.unitCm")],
                  ["inch", t("drop.unitInch")],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onUnit(value)}
                  aria-pressed={unit === value}
                  className={
                    unit === value
                      ? "flex-1 px-3 py-2 text-xs font-medium bg-petrol-700 text-canvas dark:bg-petrol-300 dark:text-ink"
                      : "flex-1 px-3 py-2 text-xs font-medium hover:bg-petrol-50 dark:hover:bg-white/5"
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-[11px] muted leading-snug mt-1.5">{t("drop.unitHint")}</p>
            <p className="text-[11px] muted leading-snug mt-1">{t("step.unitNote")}</p>
          </fieldset>

          <fieldset>
            <legend className="text-xs muted mb-1.5">{t("step.quality")}</legend>
            <div className="flex rounded-xl border border-hairline dark:border-[#1E2B3D] overflow-hidden">
              {(
                [
                  ["grob", t("step.qualityCoarse")],
                  ["mittel", t("step.qualityMedium")],
                  ["fein", t("step.qualityFine")],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onQuality(value)}
                  aria-pressed={quality === value}
                  className={
                    quality === value
                      ? "flex-1 px-3 py-2 text-xs font-medium bg-petrol-700 text-canvas dark:bg-petrol-300 dark:text-ink"
                      : "flex-1 px-3 py-2 text-xs font-medium hover:bg-petrol-50 dark:hover:bg-white/5"
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-[11px] muted leading-snug mt-1.5">{t("step.qualityHint")}</p>
          </fieldset>
        </div>

        {/* ------------------------------------------------------- Datenschutz */}

        <Card className="mt-8 border-good/30 bg-good/[0.04]">
          <div className="flex items-start gap-3">
            <span className="shrink-0 grid place-items-center w-9 h-9 rounded-xl bg-good/12 text-good">
              <Icon path={ICONS.lock} className="w-4.5 h-4.5" />
            </span>
            <div className="min-w-0">
              <h3 className="font-display font-bold text-sm mb-1">{t("privacy.title")}</h3>
              <p className="text-sm muted leading-relaxed">{t("privacy.p1")}</p>
            </div>
          </div>
          <div className="mt-3 pl-12">
            <Disclosure summary={t("privacy.open")}>
              <p className="mb-2">{t("privacy.p2")}</p>
              <p className="mb-2">{t("privacy.p3")}</p>
              <p>{t("privacy.p4")}</p>
            </Disclosure>
          </div>
        </Card>

        {/* --------------------------------------------------------- Funktionen */}

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {(
            [
              [ICONS.cube, t("stats.title"), t("stats.dimensions") + ", " + t("stats.volume") + ", " + t("stats.area")],
              [ICONS.slice, t("clip.title"), t("clip.hint")],
              [ICONS.pin, t("ann.title"), t("tool.annotateHint")],
              [ICONS.document, t("export.pdf"), t("export.pdfHint")],
            ] as const
          ).map(([icon, title, text]) => (
            <div key={title} className="surface p-4">
              <span className="inline-grid place-items-center w-8 h-8 rounded-lg bg-petrol-50 dark:bg-white/5 text-petrol-700 dark:text-petrol-300 mb-2.5">
                <Icon path={icon} />
              </span>
              <h3 className="font-display font-bold text-sm mb-1">{title}</h3>
              <p className="text-xs muted leading-relaxed">{text}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center">
          <Button onClick={onPick} variant="cta">
            {t("drop.button")}
          </Button>
        </p>
      </div>

      <Footer t={t} lang={lang} />
    </div>
  );
}
