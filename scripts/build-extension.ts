/**
 * Baut die Chrome-Erweiterung und das ZIP fuer den Web Store.
 *
 *   npm run build:extension
 *
 * Ablauf:
 *   1. Vite im Modus "extension" baut die Anwendung nach dist-extension/
 *      (eigene UTM-Kennung, kurzer Titel, kein Web-Manifest — siehe vite.config.ts).
 *   2. Was nur zur Webseite gehoert (CNAME, manifest.webmanifest), fliegt raus.
 *   3. Der Inhalt von extension/ kommt dazu: manifest.json, background.js,
 *      Sprachdateien, Icons.
 *   4. Pruefungen: Manifest, Icons, Texte (scripts/lib/extension-check.ts), die
 *      Richtlinie im HTML (scripts/check-artifact.mjs) und die UTM-Kennung.
 *   5. ZIP mit festen Zeitstempeln: gleicher Inhalt ergibt dieselbe Datei.
 *
 * WARUM DAS IM REPO STEHT
 * Bis Version 1.0.0 wurde das Paket von Hand zusammengestellt. Dabei ist ein
 * beschaedigtes icon-48.png in den Store gelangt, und manche Nutzer konnten die
 * Erweiterung nicht installieren. Jetzt bricht der Bau an genau dieser Stelle ab.
 */

import { cpSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { zipSync, type Zippable } from "fflate";
import { build } from "vite";
import { checkExtension } from "./lib/extension-check.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SOURCE = join(ROOT, "extension");
const OUT = join(ROOT, "dist-extension");

/** Fester Zeitstempel im ZIP — sonst aendert jeder Bau die Datei, auch ohne Aenderung. */
const ZIP_MTIME = new Date(2020, 0, 1, 12, 0, 0);

/** Nur fuer die Webseite: Domain-Zuordnung von GitHub Pages und das PWA-Manifest. */
const WEB_ONLY = ["CNAME", "manifest.webmanifest"];

function fail(message: string): never {
  console.error(`\nFEHLER: ${message}`);
  process.exit(1);
}

function listFiles(dir: string): string[] {
  return readdirSync(dir)
    .flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? listFiles(path) : [path];
    })
    .sort();
}

function checkUtm(): void {
  const bundle = listFiles(join(OUT, "assets"))
    .filter((f) => f.endsWith(".js"))
    .map((f) => readFileSync(f, "utf8"))
    .join("\n");
  if (!bundle.includes("utm_source=chrome-web-store")) {
    fail("UTM-Kennung der Erweiterung fehlt im Buendel — lief Vite im Modus extension?");
  }
  if (bundle.includes("utm_source=github&")) {
    fail("UTM-Kennung der Webfassung im Erweiterungsbuendel");
  }
}

function writeZip(version: string): string {
  // Der Store verlangt Schraegstriche — unter Windows liefert path.join Backslashes.
  // Sortiert wird nach dem fertigen Namen, damit die Reihenfolge im ZIP unter
  // Windows und Linux gleich ist.
  const entries = listFiles(OUT)
    .map((path) => ({ path, name: relative(OUT, path).split(sep).join("/") }))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  const files: Zippable = {};
  for (const { path, name } of entries) files[name] = [readFileSync(path), { mtime: ZIP_MTIME }];
  const zipFile = join(ROOT, `reents3d-stl-betrachter-${version}.zip`);
  writeFileSync(zipFile, zipSync(files, { level: 9 }));
  return zipFile;
}

await build({ root: ROOT, mode: "extension", logLevel: "warn" });

for (const name of WEB_ONLY) rmSync(join(OUT, name), { force: true });
cpSync(SOURCE, OUT, { recursive: true });

const findings = checkExtension(OUT);
if (findings.length > 0) fail(`Paket nicht einreichbar:\n  ${findings.join("\n  ")}`);
console.log("  OK   Manifest, Icons und Texte");

const artifact = spawnSync(process.execPath, [join(ROOT, "scripts", "check-artifact.mjs"), OUT], {
  stdio: "inherit",
});
if (artifact.status !== 0) fail("Artefaktpruefung fehlgeschlagen");

checkUtm();
console.log("  OK   UTM-Kennung chrome-web-store");

const { version } = JSON.parse(readFileSync(join(OUT, "manifest.json"), "utf8")) as { version: string };
const zipFile = writeZip(version);
const size = (statSync(zipFile).size / 1024 / 1024).toFixed(1);
console.log(`\nErweiterung ${version} gebaut: ${relative(ROOT, zipFile)} (${size} MB)`);
