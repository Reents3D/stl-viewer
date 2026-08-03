/**
 * Zahlenausgabe.
 *
 * Eine Regel zieht sich durch alles hier: Es wird nie mehr Genauigkeit angezeigt,
 * als in den Daten steckt. Ein STL speichert Koordinaten in einfacher Genauigkeit —
 * das sind rund sieben signifikante Stellen. Eine Kantenlaenge mit vier
 * Nachkommastellen auszugeben behauptet eine Messung, die die Datei nicht hergibt.
 */

import type { Lang } from "../i18n";

const locale = (lang: Lang): string => (lang === "de" ? "de-DE" : "en-GB");

export function num(value: number, lang: Lang, digits = 1): string {
  if (!Number.isFinite(value)) return "–";
  // Werte, die auf der ANGEZEIGTEN Stelle zu null werden, verlieren ihr
  // Vorzeichen. Beim Schwerpunkt eines mittig liegenden Bauteils bleibt aus der
  // Summation ein Rest wie -3e-14 stehen; ohne diese Zeile steht dort "-0,0" —
  // rechnerisch richtig, gelesen wird es als Messfehler. Die Pruefung auf
  // `value === 0` allein genuegt dafuer nicht: -3e-14 ist nicht null.
  const smallest = 0.5 * 10 ** -digits;
  const normalised = Math.abs(value) < smallest ? 0 : value;
  return normalised.toLocaleString(locale(lang), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function integer(value: number, lang: Lang): string {
  if (!Number.isFinite(value)) return "–";
  return Math.round(value).toLocaleString(locale(lang));
}

/**
 * Laenge in mm. Ab einem Meter zusaetzlich in Metern — bei einem 2.400-mm-Exponat
 * ist "2.400 mm" richtig, aber "2,40 m" ist die Zahl, die man sich merkt.
 */
export function mm(value: number, lang: Lang): string {
  if (!Number.isFinite(value)) return "–";
  const digits = value >= 100 ? 1 : value >= 10 ? 2 : 3;
  const base = `${num(value, lang, digits)} mm`;
  return value >= 1000 ? `${base} (${num(value / 1000, lang, 2)} m)` : base;
}

/** Volumen: unter einem Kubikzentimeter in mm³, darueber in cm³, ab einem Liter zusaetzlich. */
export function volume(mm3: number, lang: Lang): string {
  if (!Number.isFinite(mm3)) return "–";
  if (mm3 < 1000) return `${num(mm3, lang, 1)} mm³`;
  const cm3 = mm3 / 1000;
  const base = `${num(cm3, lang, cm3 >= 100 ? 0 : 2)} cm³`;
  return cm3 >= 1000 ? `${base} (${num(cm3 / 1000, lang, 2)} l)` : base;
}

export function area(mm2: number, lang: Lang): string {
  if (!Number.isFinite(mm2)) return "–";
  if (mm2 < 100) return `${num(mm2, lang, 1)} mm²`;
  const cm2 = mm2 / 100;
  return cm2 >= 10_000
    ? `${num(cm2 / 10_000, lang, 2)} m²`
    : `${num(cm2, lang, cm2 >= 100 ? 0 : 1)} cm²`;
}

export function mass(grams: number, lang: Lang): string {
  if (!Number.isFinite(grams)) return "–";
  if (grams < 1) return `${num(grams, lang, 2)} g`;
  if (grams < 1000) return `${num(grams, lang, grams >= 100 ? 0 : 1)} g`;
  return `${num(grams / 1000, lang, 2)} kg`;
}

export function fileSize(bytes: number, lang: Lang): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${num(bytes / 1024, lang, 0)} KB`;
  return `${num(bytes / (1024 * 1024), lang, 1)} MB`;
}

/** Datum fuer Dateinamen und PDF-Kopf: ISO, weil es sich sortieren laesst. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function dateTime(date: Date, lang: Lang): string {
  return date.toLocaleString(locale(lang), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Dateinamen entschaerfen.
 *
 * Der Name kommt vom Kunden und landet im Dateinamen des Exports. Windows lehnt
 * neun Zeichen rundheraus ab, und ein Name mit Schraegstrich erzeugt beim
 * Herunterladen einen Pfad statt einer Datei.
 */
export function safeFileName(name: string, fallback = "modell"): string {
  const base = name
    .replace(/\.stl$/i, "")
    .replace(/[<>:"/\\|?*]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return base.length > 0 ? base : fallback;
}
