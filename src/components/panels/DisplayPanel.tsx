/**
 * Darstellung und Schnittebene.
 *
 * Nichts hier veraendert das Modell — nur, wie es zu sehen ist. Deshalb steht in
 * diesem Bereich auch kein einziger Wert, der spaeter in einem Dokument landet.
 */

import type { T } from "../../i18n";
import type { ClipState, RenderMode, ViewState } from "../../viewer/types";
import { MODEL_COLORS } from "../../viewer/types";
import { cx, SegmentedControl, Section, Slider, Toggle } from "../ui";

export function DisplayPanel({
  t,
  view,
  onChange,
  canShowEdges,
}: {
  t: T;
  view: ViewState;
  onChange: (next: ViewState) => void;
  canShowEdges: boolean;
}) {
  const patch = (partial: Partial<ViewState>): void => onChange({ ...view, ...partial });
  const patchClip = (partial: Partial<ClipState>): void =>
    onChange({ ...view, clip: { ...view.clip, ...partial } });

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
