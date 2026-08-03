/**
 * Bausteine der Oberflaeche. Bewusst klein gehalten und ohne Abhaengigkeiten —
 * gleiche Formensprache wie im FDM-Materialberater: 12 px Radius, Haarlinie
 * statt Schatten, Versalien nur beim Handlungsaufruf.
 */

import type { ReactNode } from "react";

export const cx = (...parts: (string | false | null | undefined)[]): string =>
  parts.filter(Boolean).join(" ");

/* ------------------------------------------------------------------ Flaechen */

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("surface p-4", className)}>{children}</div>;
}

export function Section({
  title,
  children,
  right,
  className,
}: {
  title: string;
  children: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("mb-5", className)}>
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <h2 className="eyebrow">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

/* ---------------------------------------------------------------- Bedienung */

export function Button({
  children,
  onClick,
  variant = "outline",
  disabled,
  className,
  title,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "outline" | "ghost" | "cta" | "danger";
  disabled?: boolean;
  className?: string;
  title?: string;
  type?: "button" | "submit";
}) {
  const styles = {
    cta: "bg-petrol-700 text-canvas uppercase font-bold text-[13px] tracking-wide hover:bg-petrol-600 dark:bg-petrol-300 dark:text-ink dark:hover:bg-petrol-200 px-5 py-2.5",
    primary:
      "bg-petrol-700 text-canvas font-semibold hover:bg-petrol-600 dark:bg-petrol-300 dark:text-ink dark:hover:bg-petrol-200 px-4 py-2",
    outline:
      "border border-hairline dark:border-[#1E2B3D] font-medium hover:border-petrol-400 hover:text-petrol-700 dark:hover:text-petrol-300 px-3.5 py-2",
    ghost: "font-medium hover:bg-petrol-50 dark:hover:bg-white/5 px-3 py-2",
    danger: "border border-bad/40 text-bad font-medium hover:bg-bad/5 px-3 py-2",
  }[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cx(
        "rounded-xl text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
        styles,
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Segmentierte Auswahl — eine Reihe, ein aktiver Eintrag. */
export function SegmentedControl<V extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: V;
  options: ReadonlyArray<{ value: V; label: string; disabled?: boolean; title?: string }>;
  onChange: (value: V) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex rounded-xl border border-hairline dark:border-[#1E2B3D] overflow-hidden"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          disabled={option.disabled}
          title={option.title}
          onClick={() => onChange(option.value)}
          className={cx(
            "flex-1 px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
            "disabled:opacity-35 disabled:cursor-not-allowed",
            value === option.value
              ? "bg-petrol-700 text-canvas dark:bg-petrol-300 dark:text-ink"
              : "hover:bg-petrol-50 dark:hover:bg-white/5",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={cx(
        "flex items-start gap-2.5 py-1.5 group",
        disabled ? "opacity-45 cursor-not-allowed" : "cursor-pointer",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 w-4 h-4 accent-petrol-700 dark:accent-petrol-300"
      />
      <span className="text-sm min-w-0">
        {label}
        {hint && <span className="block text-xs muted mt-0.5 leading-snug">{hint}</span>}
      </span>
    </label>
  );
}

export function Select<V extends string>({
  value,
  options,
  onChange,
  label,
  className,
}: {
  value: V;
  options: ReadonlyArray<{ value: V; label: string }>;
  onChange: (value: V) => void;
  label: string;
  className?: string;
}) {
  return (
    <label className={cx("block", className)}>
      <span className="block text-xs muted mb-1">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as V)}
        className="w-full rounded-lg border border-hairline dark:border-[#1E2B3D] bg-transparent px-2.5 py-1.5 text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="text-ink">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  display,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label: string;
  display?: string;
}) {
  return (
    <label className="block py-1">
      <span className="flex items-baseline justify-between text-xs mb-1">
        <span className="muted">{label}</span>
        <span className="num font-medium">{display ?? value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full"
      />
    </label>
  );
}

/* -------------------------------------------------------------------- Marken */

export function Chip({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "ok" | "bad" | "brand";
}) {
  const tones = {
    neutral: "bg-petrol-50 dark:bg-white/5 text-petrol-800 dark:text-petrol-200",
    good: "bg-good/10 text-good",
    ok: "bg-ok/10 text-ok",
    bad: "bg-bad/10 text-bad",
    brand: "bg-petrol-100 dark:bg-petrol-900 text-petrol-700 dark:text-petrol-200",
  }[tone];
  return (
    <span className={cx("inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold", tones)}>
      {children}
    </span>
  );
}

/**
 * Konfidenzmarke — identisch zum Materialberater, damit dieselbe Angabe in beiden
 * Werkzeugen gleich aussieht.
 */
export function ConfidenceMark({ level, label }: { level: string; label: string }) {
  const style: Record<string, string> = {
    high: "bg-good/10 text-good border-good/30",
    medium: "bg-petrol-500/10 text-petrol-700 dark:text-petrol-300 border-petrol-500/30",
    low: "bg-ok/10 text-ok border-ok/30",
    estimated: "border-dashed border-amber-500/70 text-amber-700 dark:text-amber-400 bg-amber-500/5",
  };
  const short: Record<string, string> = { high: "◆◆", medium: "◆", low: "!", estimated: "≈" };
  return (
    <span
      title={label}
      aria-label={label}
      className={cx(
        "inline-block border rounded px-1 text-[10px] leading-4 font-mono align-middle",
        style[level] ?? style.medium,
      )}
    >
      {short[level] ?? "◆"}
    </span>
  );
}

/** Beschriftung links, Wert rechts — die Grundzeile aller Kennwertlisten. */
export function DataRow({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "good" | "bad" | "ok";
}) {
  const toneClass = tone === "good" ? "text-good" : tone === "bad" ? "text-bad" : tone === "ok" ? "text-ok" : "";
  return (
    <div className="py-1.5 border-b border-hairline dark:border-[#1E2B3D] last:border-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs muted shrink-0">{label}</span>
        <span className={cx("text-sm font-medium text-right num", toneClass)}>{value}</span>
      </div>
      {hint && <p className="text-[11px] muted mt-0.5 leading-snug">{hint}</p>}
    </div>
  );
}

/**
 * Aufklappbarer Hinweis auf nativem <details>: bedienbar per Tastatur, von
 * Screenreadern als aufklappbar angesagt und in der Seitensuche auch zugeklappt
 * auffindbar. Regel wie im Materialberater: Der BEFUND bleibt sichtbar, nur die
 * BEGRUENDUNG klappt weg.
 */
export function Disclosure({
  summary,
  children,
  tone = "neutral",
}: {
  summary: ReactNode;
  children: ReactNode;
  tone?: "neutral" | "warn";
}) {
  const tones = {
    neutral: "border-hairline dark:border-[#1E2B3D] hover:border-petrol-400",
    warn: "border-ok/40 bg-ok/5 hover:border-ok/70",
  }[tone];
  return (
    <details className={cx("group rounded-xl border transition-colors", tones)}>
      <summary className="cursor-pointer list-none px-3 py-2 flex items-start gap-2 text-sm font-medium select-none">
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="w-4 h-4 mt-0.5 shrink-0 transition-transform group-open:rotate-90 muted"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
        <span className="min-w-0">{summary}</span>
      </summary>
      <div className="px-3 pb-3 pl-9 text-sm leading-relaxed muted">{children}</div>
    </details>
  );
}

/* -------------------------------------------------------------------- Symbole */

export function Icon({ path, className = "w-4 h-4" }: { path: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

export const ICONS = {
  orbit: "M12 3a9 9 0 1 0 9 9M3.5 8.5c3-3 12-5 16 .5M12 8a4 4 0 1 0 4 4",
  pin: "M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  ruler: "M3 15 15 3l6 6L9 21zM7 11l2 2M11 7l2 2M15 11l2 2",
  fit: "M4 9V5a1 1 0 0 1 1-1h4M20 9V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4M20 15v4a1 1 0 0 1-1 1h-4",
  cube: "M12 2 3 7v10l9 5 9-5V7ZM3 7l9 5 9-5M12 12v10",
  camera: "M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z M12 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
  document: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8ZM14 3v5h5M9 13h6M9 17h4",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2",
  slice: "M3 12h18M7 6l10 12M17 6 7 18",
  eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  upload: "M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2",
  download: "M12 4v12m0 0 4.5-4.5M12 16l-4.5-4.5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2",
  lock: "M6 10V7a6 6 0 1 1 12 0v3M5 10h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z",
  arrow: "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z",
} as const;
