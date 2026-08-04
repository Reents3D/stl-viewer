/**
 * Darstellung und Schnittebene.
 *
 * Nichts hier veraendert das Modell — nur, wie es zu sehen ist. Deshalb steht in
 * diesem Bereich auch kein einziger Wert, der spaeter in einem Dokument landet.
 */

import type { Lang, T } from "../../i18n";
import * as fmt from "../../lib/format";
import type { OverhangResult } from "../../lib/overhang";
import type { ClipState, OverhangState, RenderMode, ViewState } from "../../viewer/types";
import { MODEL_COLORS, OVERHANG_COLOR } from "../../viewer/types";
import { referenceInfo, SCALE_REFERENCES } from "../../viewer/reference";
import { cx, SegmentedControl, Section, Select, Slider, Toggle } from "../ui";

export function DisplayPanel({
  t,
  lang,
  view,
  onChange,
  canShowEdges,
  overhang,
}: {
  t: T;
  lang: Lang;
  view: ViewState;
  onChange: (next: ViewState) => void;
  canShowEdges: boolean;
  overhang: OverhangResult | null;
}) {
  const patch = (partial: Partial<ViewState>): void => onChange({ ...view, ...partial });
  const patchClip = (partial: Partial<ClipState>): void =>
    onChange({ ...view, clip: { ...view.clip, ...partial } });
  const patchOverhang = (partial: Partial<OverhangState>): void =>
    onChange({ ...view, overhang: { ...view.overhang, ...partial } });

  const reference = referenceInfo(view.scaleReference);
  const referenceSize = reference.size;
  const referenceSource = reference.source
    ? lang === "de"
      ? reference.source.de
      : reference.source.en
    : null;

  return (
    <>
      <Section title={t("render.title")}>
        <div className="surface p-3 space-y-3">
          <SegmentedControl<RenderMode>
            ariaLabel={t("render.title")}
            value={view.renderMode}
            onChange={(renderMode) => patch({ renderMode })}
            options={[
              { value: "solid", label: t("render.solid") },
              {
                value: "edges",
                label: t("render.edges"),
                disabled: !canShowEdges,
                title: canShowEdges ? undefined : t("render.edgesDisabled"),
              },
              { value: "wireframe", label: t("render.wireframe") },
              { value: "xray", label: t("render.xray") },
            ]}
          />
          {!canShowEdges && <p className="text-[11px] muted leading-snug">{t("render.edgesDisabled")}</p>}

          <div>
            <span className="block text-xs muted mb-1.5">{t("render.color")}</span>
            <div className="flex flex-wrap gap-1.5">
              {MODEL_COLORS.map((color) => (
                <button
                  key={color.hex}
                  type="button"
                  title={color.label}
                  aria-label={color.label}
                  aria-pressed={view.modelColor === color.hex}
                  onClick={() => patch({ modelColor: color.hex })}
                  style={{ background: color.hex }}
                  className={cx(
                    "w-6 h-6 rounded-md border transition-transform",
                    view.modelColor === color.hex
                      ? "border-petrol-700 dark:border-petrol-300 scale-110 ring-2 ring-petrol-300/50"
                      : "border-hairline dark:border-[#1E2B3D] hover:scale-105",
                  )}
                />
              ))}
            </div>
          </div>

          <SegmentedControl<ViewState["background"]>
            ariaLabel={t("render.background")}
            value={view.background}
            onChange={(background) => patch({ background })}
            options={[
              { value: "verlauf", label: t("bg.verlauf") },
              { value: "hell", label: t("bg.hell") },
              { value: "dunkel", label: t("bg.dunkel") },
            ]}
          />

          <div className="pt-1 border-t border-hairline dark:border-[#1E2B3D]">
            <Toggle
              checked={view.orthographic}
              onChange={(orthographic) => patch({ orthographic })}
              label={t("render.orthographic")}
              hint={t("render.orthographicHint")}
            />
            <Toggle
              checked={view.showGrid}
              onChange={(showGrid) => patch({ showGrid })}
              label={t("render.grid")}
            />
            <Toggle
              checked={view.showAxes}
              onChange={(showAxes) => patch({ showAxes })}
              label={t("render.axes")}
            />
            <Toggle
              checked={view.showBuildVolume}
              onChange={(showBuildVolume) => patch({ showBuildVolume })}
              label={t("build.show")}
            />
          </div>
        </div>
      </Section>

      <Section title={t("scale.title")}>
        <div className="surface p-3">
          <Select
            label={t("scale.label")}
            value={view.scaleReference}
            onChange={(scaleReference) => patch({ scaleReference })}
            options={SCALE_REFERENCES.map((r) => ({
              value: r.id,
              label: lang === "de" ? r.de : r.en,
            }))}
          />
          <p className="text-[11px] muted mt-2 leading-snug">{t("scale.hint")}</p>
          {referenceSize && (
            <p className="text-[11px] muted mt-1.5 num">
              {t("scale.size")}: {referenceSize.x} × {referenceSize.y} × {referenceSize.z} mm
              {referenceSource && <span className="ml-1">({referenceSource})</span>}
            </p>
          )}
          {view.scaleReference !== "none" && (
            <p className="text-[11px] muted mt-1 leading-snug">{t("scale.inCover")}</p>
          )}
        </div>
      </Section>

      <Section title={t("overhang.title")}>
        <div className="surface p-3">
          <Toggle
            checked={view.overhang.enabled}
            onChange={(enabled) => patchOverhang({ enabled })}
            label={t("overhang.enable")}
            hint={t("overhang.hint")}
          />

          {view.overhang.enabled && (
            <div className="mt-2 space-y-2">
              <Slider
                label={t("overhang.threshold")}
                min={10}
                max={80}
                step={5}
                value={view.overhang.degrees}
                onChange={(degrees) => patchOverhang({ degrees })}
                display={`${view.overhang.degrees}°`}
              />

              {overhang && (
                <div className="pt-2 border-t border-hairline dark:border-[#1E2B3D]">
                  {overhang.overhangTriangles === 0 ? (
                    <p className="text-sm text-good leading-snug">{t("overhang.none")}</p>
                  ) : (
                    <p className="flex items-baseline gap-2">
                      <span
                        aria-hidden="true"
                        className="inline-block w-3 h-3 rounded-sm shrink-0"
                        style={{ background: OVERHANG_COLOR }}
                      />
                      <span className="text-sm font-medium num">
                        {t("overhang.result", {
                          p: fmt.num(overhang.fraction * 100, lang, 1),
                          area: fmt.area(overhang.overhangAreaMm2, lang),
                        })}
                      </span>
                    </p>
                  )}
                  <p className="text-[11px] muted mt-1.5 leading-snug">{t("overhang.plateNote")}</p>
                  <p className="text-[11px] muted mt-1 leading-snug">
                    {t("overhang.orientationNote")}
                  </p>
                  <p className="text-[11px] muted mt-1 leading-snug">{t("overhang.limit")}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Section>

      <Section title={t("clip.title")}>
        <div className="surface p-3">
          <Toggle
            checked={view.clip.enabled}
            onChange={(enabled) => patchClip({ enabled })}
            label={t("clip.enable")}
            hint={t("clip.hint")}
          />

          {view.clip.enabled && (
            <div className="mt-2 space-y-2">
              <SegmentedControl<ClipState["axis"]>
                ariaLabel={t("clip.axis")}
                value={view.clip.axis}
                onChange={(axis) => patchClip({ axis })}
                options={[
                  { value: "x", label: "X" },
                  { value: "y", label: "Y" },
                  { value: "z", label: "Z" },
                ]}
              />
              <Slider
                label={t("clip.position")}
                min={0}
                max={100}
                value={Math.round(view.clip.position * 100)}
                onChange={(value) => patchClip({ position: value / 100 })}
                display={`${Math.round(view.clip.position * 100)} %`}
              />
              <Toggle
                checked={view.clip.flip}
                onChange={(flip) => patchClip({ flip })}
                label={t("clip.flip")}
              />
            </div>
          )}
        </div>
      </Section>
    </>
  );
}
