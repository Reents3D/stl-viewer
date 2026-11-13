/**
 * Prueft einen Erweiterungsordner so, wie der Chrome Web Store und Chrome selbst
 * ihn beim Installieren lesen — vor dem Hochladen, nicht danach.
 *
 * Laeuft zweimal: im Test gegen den Quellordner extension/ und im Bauskript gegen
 * das fertige Paket. Gibt eine Liste von Befunden zurueck; leer heisst sauber.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { checkPng } from "./png-check.ts";

/**
 * Laengengrenzen der Texte. Store-Grenze fuer die Beschreibung ist 132 Zeichen;
 * Name und Kurzname sind enger gefasst als von Chrome erlaubt, damit sie in der
 * Werkzeugleiste und der Erweiterungsliste nicht abgeschnitten werden.
 */
const MAX_LENGTH: Readonly<Record<string, number>> = {
  extName: 45,
  extShortName: 12,
  extDescription: 132,
};

/** Genau diese Richtlinie ist beschlossen (ADR-013): WebAssembly ja, eval nein. */
const REQUIRED_CSP = "script-src 'self' 'wasm-unsafe-eval'";

interface Manifest {
  manifest_version?: number;
  version?: string;
  default_locale?: string;
  icons?: Record<string, string>;
  action?: { default_icon?: Record<string, string> };
  background?: { service_worker?: string };
  content_security_policy?: { extension_pages?: string };
  permissions?: unknown[];
  host_permissions?: unknown[];
  optional_permissions?: unknown[];
  [key: string]: unknown;
}

type Messages = Record<string, { message?: string }>;

function readJson<T>(file: string, findings: string[]): T | null {
  try {
    return JSON.parse(readFileSync(file, "utf8")) as T;
  } catch (err) {
    findings.push(`${file}: kein gueltiges JSON (${(err as Error).message})`);
    return null;
  }
}

function checkIcons(dir: string, label: string, icons: Record<string, string> | undefined, findings: string[]): void {
  for (const [size, file] of Object.entries(icons ?? {})) {
    const path = join(dir, file);
    if (!existsSync(path)) {
      findings.push(`${label}: ${file} fehlt`);
      continue;
    }
    try {
      const { width, height } = checkPng(readFileSync(path));
      if (width !== Number(size) || height !== Number(size)) {
        findings.push(`${label}: ${file} ist ${width} x ${height}, erwartet ${size} x ${size}`);
      }
    } catch (err) {
      findings.push(`${label}: ${file} nicht dekodierbar — ${(err as Error).message}`);
    }
  }
}

function checkLocales(dir: string, manifest: Manifest, findings: string[]): void {
  const placeholders = [...JSON.stringify(manifest).matchAll(/__MSG_(\w+)__/g)].map((m) => m[1]);
  if (!manifest.default_locale) {
    if (placeholders.length > 0) {
      findings.push("Platzhalter __MSG_…__ ohne default_locale — Chrome laedt das Paket nicht");
    }
    return;
  }
  const localeDir = join(dir, "_locales");
  const locales = existsSync(localeDir) ? readdirSync(localeDir) : [];
  if (!locales.includes(manifest.default_locale)) {
    findings.push(`_locales/${manifest.default_locale} fehlt (default_locale)`);
  }
  for (const locale of locales) {
    const messages = readJson<Messages>(join(dir, "_locales", locale, "messages.json"), findings);
    if (!messages) continue;
    for (const key of placeholders) {
      const text = messages[key]?.message;
      if (!text) {
        findings.push(`_locales/${locale}: Text ${key} fehlt`);
        continue;
      }
      const max = MAX_LENGTH[key];
      if (max !== undefined && [...text].length > max) {
        findings.push(`_locales/${locale}: ${key} hat ${[...text].length} Zeichen, erlaubt sind ${max}`);
      }
    }
  }
}

export function checkExtension(dir: string): string[] {
  const findings: string[] = [];
  const manifest = readJson<Manifest>(join(dir, "manifest.json"), findings);
  if (!manifest) return findings;

  if (manifest.manifest_version !== 3) findings.push("manifest_version muss 3 sein");

  // Der Store nimmt ein bis vier Zahlen von 0 bis 65535, ohne fuehrende Null.
  const parts = (manifest.version ?? "").split(".");
  const validVersion =
    parts.length <= 4 && parts.every((p) => /^(0|[1-9]\d{0,4})$/.test(p) && Number(p) <= 65535);
  if (!validVersion) {
    findings.push(`Version "${manifest.version}" ist keine gueltige Erweiterungsversion`);
  }

  checkIcons(dir, "icons", manifest.icons, findings);
  checkIcons(dir, "action.default_icon", manifest.action?.default_icon, findings);

  const worker = manifest.background?.service_worker;
  if (worker && !existsSync(join(dir, worker))) findings.push(`${worker} fehlt`);

  // "Ihre Datei bleibt bei Ihnen" — dazu gehoert, dass die Erweiterung nichts
  // anfordert. Jede Berechtigung erscheint im Store als Warnhinweis.
  for (const key of ["permissions", "host_permissions", "optional_permissions"] as const) {
    if ((manifest[key]?.length ?? 0) > 0) findings.push(`${key} gesetzt — die Erweiterung kommt ohne aus`);
  }

  const csp = manifest.content_security_policy?.extension_pages ?? "";
  if (!csp.includes(REQUIRED_CSP) || /'unsafe-eval'|'unsafe-inline'/.test(csp)) {
    findings.push(`Richtlinie weicht ab: "${csp}" (erwartet ${REQUIRED_CSP}, ohne unsafe-*)`);
  }

  checkLocales(dir, manifest, findings);
  return findings;
}
