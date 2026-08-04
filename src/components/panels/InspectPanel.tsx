/**
 * Kennwerte, Befund, Gewichtsschaetzung und Bauraumpruefung.
 *
 * Reihenfolge nach dem, was ein Kunde zuerst wissen will: Wie gross ist es, ist
 * es in Ordnung, was wiegt es, passt es in die Maschine. Der Befund steht bewusst
 * VOR dem Gewicht — eine Gewichtsangabe zu einem Netz mit Loechern ist eine
 * Zahl ohne Grundlage, und das muss man vorher gelesen haben.
 */

import { MATERIALS, materialById, INFILL_PRESETS } from "../../config/materials";
import { SITE, trackedUrl } from "../../config/site";
import type { Lang, T } from "../../i18n";
import { compactness, estimateMass, FILIGREE_THRESHOLD } from "../../lib/estimate";
import * as fmt from "../../lib/format";
import { fitsInBuildVolume } from "../../stl/geometry";
import type { LoadedModel } from "../../stl/load";
import type { StepQuality } from "../../stl/step-mesh";
import { Chip, ConfidenceMark, DataRow, Disclosure, Icon, ICONS, Section, Select, Slider } from "../ui";

/** Schluesselteil fuer die i18n-Beschriftung der Tessellierungsguete. */
function qualityKey(quality: StepQuality | undefined): "Coarse" | "Medium" | "Fine" {
  if (quality === "grob") return "Coarse";
  if (quality === "fein") return "Fine";
  return "Medium";
}

export function InspectPanel({
  t,
  lang,
  model,
  materialId,
  onMaterial,
  infill,
  onInfill,
  buildVolumeId,
  onBuildVolume,
}: {
  t: T;
  lang: Lang;
  model: LoadedModel;
  materialId: string;
  onMaterial: (id: string) => void;
  infill: number;
  onInfill: (value: number) => void;
  buildVolumeId: string;
  onBuildVolume: (id: string) => void;
}) {
  const { stats } = model;
  const size = stats.bbox.size;
  const material = materialById(materialId);
  const estimate = estimateMass(stats.volumeMm3, material.density, material.confidence, infill);
  const volume = SITE.buildVolumes.find((v) => v.id === buildVolumeId) ?? SITE.buildVolumes[0];
  const fit = fitsInBuildVolume(size, volume);
  // Nur die Form entscheidet, nicht der Fuellgrad — siehe Kommentar an
  // spreadFactor in lib/estimate.ts.
  const surfaceRatio = compactness(stats.volumeMm3, stats.areaMm2);
  const filigree = surfaceRatio > FILIGREE_THRESHOLD;

  return (
    <>
      <Section title={t("stats.title")}>
        <div className="surface px-3 py-1">
          <DataRow
            label={t("stats.dimensions")}
            value={
              <>
                {fmt.num(size.x, lang, 1)} × {fmt.num(size.y, lang, 1)} × {fmt.num(size.z, lang, 1)}{" "}
                <span className="muted text-xs">mm</span>
              </>
            }
          />
          <DataRow label={t("stats.longestEdge")} value={fmt.mm(Math.max(size.x, size.y, size.z), lang)} />
          <DataRow label={t("stats.volume")} value={fmt.volume(stats.volumeMm3, lang)} />
          <DataRow label={t("stats.area")} value={fmt.area(stats.areaMm2, lang)} />
          <DataRow label={t("stats.triangles")} value={fmt.integer(stats.triangles, lang)} />
          {stats.topology && (
            <DataRow label={t("stats.vertices")} value={fmt.integer(stats.topology.vertices, lang)} />
          )}
          {stats.centroid && (
            <DataRow
              label={t("stats.centroid")}
              value={`${fmt.num(stats.centroid.x, lang, 1)} / ${fmt.num(stats.centroid.y, lang, 1)} / ${fmt.num(stats.centroid.z, lang, 1)}`}
            />
          )}
          <DataRow
            label={t("stats.format")}
            value={
              model.format === "step"
                ? "STEP"
                : model.format === "binary"
                  ? "Binär-STL"
                  : "ASCII-STL"
            }
          />
          <DataRow label={t("stats.fileSize")} value={fmt.fileSize(model.fileSize, lang)} />
          {model.solidName && <DataRow label={t("stats.modelName")} value={model.solidName} />}
        </div>

        {/* Bei STEP beziehen sich ALLE Zahlen darueber auf die Tessellierung.
            Der Hinweis steht deshalb direkt darunter und nicht im Kleingedruckten. */}
        {model.format === "step" && (
          <div className="mt-2 space-y-1.5">
            <p className="text-[11px] text-ok leading-snug">
              {t("step.approximation", { q: t(`step.quality${qualityKey(model.quality)}`) })}
            </p>
            {(model.parts ?? 1) > 1 && (
              <p className="text-[11px] text-ok leading-snug">
                {t("step.assembly", { n: model.parts ?? 1 })}
              </p>
            )}
          </div>
        )}
      </Section>

      <Findings t={t} lang={lang} model={model} />

      {/* ------------------------------------------------------------ Gewicht */}

      <Section title={t("mass.title")}>
        <div className="surface p-3">
          <Select
            label={t("mass.material")}
            value={materialId}
            onChange={onMaterial}
            options={MATERIALS.map((m) => ({
              value: m.id,
              label: `${m.name} — ${fmt.num(m.density, lang, 2)} g/cm³`,
            }))}
          />
          <div className="mt-2">
            <Slider
              label={t("mass.infill")}
              value={infill}
              min={5}
              max={100}
              step={5}
              onChange={onInfill}
              display={`${infill} %`}
            />
            <div className="flex flex-wrap gap-1 mt-1">
              {INFILL_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onInfill(preset)}
                  className={
                    infill === preset
                      ? "px-1.5 py-0.5 rounded text-[11px] font-semibold bg-petrol-700 text-canvas dark:bg-petrol-300 dark:text-ink"
                      : "px-1.5 py-0.5 rounded text-[11px] muted hover:bg-petrol-50 dark:hover:bg-white/5"
                  }
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-hairline dark:border-[#1E2B3D]">
            <p className="text-lg font-display font-bold estimated inline-block">
              {t("mass.between", {
                low: fmt.mass(estimate.filledGrams, lang),
                high: fmt.mass(estimate.solidGrams, lang),
              })}
            </p>
            <p className="text-[11px] muted mt-1">
              {t("mass.lowLabel", { p: infill })} → {t("mass.highLabel")}{" "}
              <ConfidenceMark level={material.confidence} label={t(`confidence.${material.confidence}`)} />
            </p>
            {filigree && (
              <p className="text-[11px] text-ok mt-2 leading-snug">
                {t("mass.filigree", { f: fmt.num(surfaceRatio, lang, 1) })}
              </p>
            )}
            <p className="text-[11px] muted mt-2 leading-snug">{t("mass.note")}</p>
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------------------ Bauraum */}

      <Section title={t("build.title")}>
        <div className="surface p-3">
          <Select
            label={t("build.machine")}
            value={buildVolumeId}
            onChange={onBuildVolume}
            options={SITE.buildVolumes.map((v) => ({
              value: v.id,
              label: `${v.name} — ${v.x} × ${v.y} × ${v.z} mm`,
            }))}
          />
          <p
            className={
              fit.fits
                ? "text-sm mt-2.5 leading-snug text-good"
                : "text-sm mt-2.5 leading-snug text-bad"
            }
          >
            {!fit.fits
              ? t("build.tooBig", { p: Math.floor(fit.requiredScale * 100) })
              : fit.needsRotation
                ? t("build.fitsRotated")
                : t("build.fits")}
          </p>

          {/* Die Bauraumliste ist die Stelle, an der ein Kunde gerade ueber Groesse
              nachdenkt — und damit die einzige, an der ein Verweis auf die Fertigung
              kein Werbebanner ist, sondern die naechste Frage beantwortet. */}
          <a
            href={trackedUrl(SITE.urls.xxl)}
            target="_blank"
            rel="noopener"
            className="mt-3 flex items-start gap-2 rounded-xl border border-hairline dark:border-[#1E2B3D] p-2.5 transition-colors hover:border-petrol-400 group"
          >
            <span className="shrink-0 grid place-items-center w-7 h-7 rounded-lg bg-petrol-50 dark:bg-white/5 text-petrol-700 dark:text-petrol-300">
              <Icon path={ICONS.cube} className="w-4 h-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-petrol-700 dark:text-petrol-300 group-hover:underline underline-offset-2">
                {t("build.cta")} →
              </span>
              <span className="block text-[11px] muted leading-snug mt-0.5">
                {t("build.ctaHint")}
              </span>
            </span>
          </a>
        </div>
      </Section>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function Findings({ t, lang, model }: { t: T; lang: Lang; model: LoadedModel }) {
  const { stats } = model;
  const topo = stats.topology;

  const problems: Array<{ label: string; value: string; hint?: string }> = [];
  if (topo) {
    if (topo.boundaryEdges > 0) {
      problems.push({
        label: t("check.boundaryEdges"),
        value: fmt.integer(topo.boundaryEdges, lang),
        hint: t("check.watertightNo"),
      });
    }
    if (topo.nonManifoldEdges > 0) {
      problems.push({
        label: t("check.nonManifold"),
        value: fmt.integer(topo.nonManifoldEdges, lang),
        hint: t("check.nonManifoldHint"),
      });
    }
    if (topo.flippedEdges > 0) {
      problems.push({
        label: t("check.flipped"),
        value: fmt.integer(topo.flippedEdges, lang),
        hint: t("check.flippedHint"),
      });
    }
  }
  if (stats.degenerate > 0) {
    problems.push({ label: t("check.degenerate"), value: fmt.integer(stats.degenerate, lang) });
  }

  const clean = topo?.watertight === true && problems.length === 0 && stats.signedVolumeMm3 >= 0;

  return (
    <Section
      title={t("check.title")}
      right={
        stats.topologySkipped ? (
          <Chip tone="neutral">—</Chip>
        ) : clean ? (
          <Chip tone="good">{t("ui.yes")}</Chip>
        ) : (
          <Chip tone="bad">{problems.length || 1}</Chip>
        )
      }
    >
      <div className="surface p-3">
        {stats.topologySkipped ? (
          <p className="text-sm muted leading-snug">{t("check.skipped")}</p>
        ) : (
          <>
            <p
              className={
                topo?.watertight ? "text-sm text-good leading-snug" : "text-sm text-bad leading-snug"
              }
            >
              {topo?.watertight ? t("check.watertightYes") : t("check.watertightNo")}
            </p>

            {problems.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {problems.map((problem) => (
                  <Disclosure
                    key={problem.label}
                    tone="warn"
                    summary={
                      <span className="flex items-baseline justify-between gap-2 w-full">
                        <span>{problem.label}</span>
                        <span className="num font-semibold">{problem.value}</span>
                      </span>
                    }
                  >
                    {problem.hint ?? t("check.watertightNo")}
                  </Disclosure>
                ))}
              </div>
            )}

            {clean && <p className="text-xs muted mt-1.5">{t("check.allGood")}</p>}
          </>
        )}

        {stats.signedVolumeMm3 < 0 && (
          <p className="text-xs text-ok mt-2 leading-snug">{t("check.inverted")}</p>
        )}
        {model.trailingBytes > 0 && (
          <p className="text-xs muted mt-2 leading-snug">
            {t("check.trailing", { n: model.trailingBytes })}
          </p>
        )}
      </div>
    </Section>
  );
}
