/**
 * Seitenleiste mit vier Bereichen.
 *
 * Reiter statt einer langen Spalte: Kennwerte, Darstellung, Anmerkungen und
 * Export werden zu verschiedenen Zeitpunkten gebraucht. Untereinander gelegt
 * waere die Spalte ueber zwei Bildschirmhoehen lang, und der Exportknopf — das
 * Ziel des ganzen Vorgangs — laege ganz unten ausserhalb des Sichtbaren.
 */

import type { ReactNode } from "react";

import type { T } from "../i18n";
import { cx } from "./ui";

export type TabId = "inspect" | "display" | "annotate" | "export";

export function Sidebar({
  t,
  tab,
  onTab,
  annotationCount,
  children,
}: {
  t: T;
  tab: TabId;
  onTab: (tab: TabId) => void;
  annotationCount: number;
  children: ReactNode;
}) {
  const tabs: ReadonlyArray<{ id: TabId; label: string; badge?: number }> = [
    { id: "inspect", label: t("stats.title") },
    { id: "display", label: t("render.title") },
    { id: "annotate", label: t("ann.title"), badge: annotationCount },
    { id: "export", label: t("export.title") },
  ];

  return (
    <aside className="w-full lg:w-[22rem] shrink-0 flex flex-col min-h-0 border-t lg:border-t-0 lg:border-l border-hairline dark:border-[#1E2B3D] bg-canvas dark:bg-[#070E18]">
      <div
        role="tablist"
        aria-label={t("app.name")}
        className="flex shrink-0 border-b border-hairline dark:border-[#1E2B3D] bg-white dark:bg-[#0B121F]"
      >
        {tabs.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={tab === entry.id}
            onClick={() => onTab(entry.id)}
            className={cx(
              "flex-1 px-2 py-2.5 text-xs font-medium transition-colors relative",
              tab === entry.id
                ? "text-petrol-700 dark:text-petrol-300"
                : "muted hover:bg-petrol-50 dark:hover:bg-white/5",
            )}
          >
            {entry.label}
            {entry.badge !== undefined && entry.badge > 0 && (
              <span className="ml-1 num text-[10px] opacity-70">{entry.badge}</span>
            )}
            {tab === entry.id && (
              <span
                aria-hidden="true"
                className="absolute inset-x-2 -bottom-px h-0.5 bg-petrol-700 dark:bg-petrol-300 rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scroll-thin p-3">{children}</div>
    </aside>
  );
}
