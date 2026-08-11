#!/usr/bin/env node
/**
 * Prueft das gebaute ERWEITERUNGSPAKET, bevor es in den Chrome Web Store geht.
 *
 * WARUM ES DIESE PRUEFUNG BRAUCHT
 * Eine abgelehnte Einreichung kostet keinen Code, sondern Tage: Die Pruefung
 * durch Google laeuft nicht in Minuten, und jede Runde beginnt von vorn. Fast
 * alles, was zu einer Ablehnung fuehrt, ist vorher am Paket ablesbar — eine
 * Berechtigung, die niemand braucht, ein Symbol in der falschen Groesse, ein
 * Name, der drei Zeichen zu lang ist.
 *
 * Diese Datei prueft nur, was fuer die ERWEITERUNG gilt. Alles, was fuer jedes
 * Artefakt gilt (Richtlinie, keine fremden Ressourcen), steht in
 * check-artifact.mjs und laeuft davor auf demselben Verzeichnis.
 *
 *   node scripts/check-extension.mjs [dist-extension]
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const paket = process.argv[2] ?? "dist-extension";
const fehler = [];
const ok = [];

const pfad = (...teile) => join(paket, ...teile);

/* ------------------------------------------------------------ 1. Manifest */

if (!existsSync(pfad("manifest.json"))) {
  console.error(`FEHLER: ${pfad("manifest.json")} fehlt. Wurde mit VITE_TARGET=extension gebaut?`);
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(readFileSync(pfad("manifest.json"), "utf8"));
} catch (ursache) {
  console.error(`FEHLER: manifest.json ist kein gueltiges JSON — ${ursache.message}`);
  process.exit(1);
}

if (manifest.manifest_version === 3) ok.push("Manifest Version 3");
else fehler.push(`manifest_version ist ${manifest.manifest_version}, der Store nimmt nur 3`);

/**
 * Die Fassung ist EINS BIS VIER durch Punkte getrennte Zahlen von 0 bis 65535.
 * Ein "1.0.0-rc1" laedt Chrome nicht einmal lokal.
 */
const fassung = String(manifest.version ?? "");
const teile = fassung.split(".");
const fassungOk =
  teile.length >= 1 &&
  teile.length <= 4 &&
  teile.every((t) => /^\d+$/.test(t) && Number(t) <= 65535);
if (fassungOk) ok.push(`Fassung ${fassung}`);
else fehler.push(`version "${fassung}" ist unzulaessig (1 bis 4 Zahlen 0-65535, durch Punkte)`);

/* -------------------------------------------------- 2. Keine Berechtigungen */

/**
 * Das ist die eigentliche Zusage dieser Erweiterung, in Manifestform.
 *
 * Jede Berechtigung erscheint bei der Installation als Satz, den der Nutzer
 * lesen muss ("Ihre Daten auf allen Websites lesen und aendern"). Ein
 * Werkzeug, das damit wirbt, dass die Datei den Rechner nicht verlaesst, und
 * dabei nach Zugriff auf alle Seiten fragt, widerlegt sich beim Einschalten
 * selbst. Wer hier etwas hinzufuegt, aendert die Aussage des Produkts und
 * nicht nur eine Zeile.
 */
for (const feld of ["permissions", "host_permissions", "optional_permissions", "content_scripts"]) {
  const wert = manifest[feld];
  if (wert && (!Array.isArray(wert) || wert.length > 0)) {
    fehler.push(`${feld} ist gesetzt (${JSON.stringify(wert)}) — die Erweiterung kommt ohne aus`);
  }
}
if (!fehler.some((f) => f.includes("ist gesetzt"))) {
  ok.push("Keine Berechtigungen, kein Zugriff auf fremde Seiten");
}

/* ------------------------------------------------------- 3. Richtlinie */

/**
 * Chrome erlaubt fuer Erweiterungsseiten nur eine ENGERE Richtlinie als die
 * Vorgabe, mit genau einer Ausnahme: 'wasm-unsafe-eval'. Die braucht der
 * STEP-Import (OpenCascade als WebAssembly, ADR-013). Alles Weitere lehnt der
 * Store ab — und zwar erst nach dem Hochladen.
 */
const csp = manifest.content_security_policy?.extension_pages ?? "";
if (csp.includes("'wasm-unsafe-eval'")) ok.push("Richtlinie erlaubt WebAssembly");
else fehler.push("extension_pages fehlt 'wasm-unsafe-eval' — STEP und IGES bleiben unlesbar");

for (const verboten of ["'unsafe-eval'", "'unsafe-inline'", "http://", "https://", "*"]) {
  // 'wasm-unsafe-eval' enthaelt 'unsafe-eval' als Zeichenfolge; nur der
  // alleinstehende Ausdruck ist gemeint.
  const treffer =
    verboten === "'unsafe-eval'" ? /(^|[\s;])'unsafe-eval'/.test(csp) : csp.includes(verboten);
  if (treffer) fehler.push(`Richtlinie der Erweiterung zu weit geoeffnet: ${verboten}`);
}

/* ------------------------------------------------------------- 4. Symbole */

const groessen = ["16", "32", "48", "128"];
for (const groesse of groessen) {
  const datei = manifest.icons?.[groesse];
  if (!datei) {
    fehler.push(`icons.${groesse} fehlt im Manifest`);
    continue;
  }
  if (!existsSync(pfad(datei))) {
    fehler.push(`${datei} fehlt im Paket`);
    continue;
  }

  // PNG-Kopf: 8 Byte Signatur, dann IHDR mit Breite und Hoehe als 32-Bit-Zahlen.
  const bild = readFileSync(pfad(datei));
  if (bild.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    fehler.push(`${datei} ist keine PNG-Datei (der Store nimmt kein SVG)`);
    continue;
  }
  const breite = bild.readUInt32BE(16);
  const hoehe = bild.readUInt32BE(20);
  if (breite !== Number(groesse) || hoehe !== Number(groesse)) {
    fehler.push(`${datei} ist ${breite}x${hoehe}, erwartet ${groesse}x${groesse}`);
  }
}
if (!fehler.some((f) => f.includes("icon"))) ok.push(`Symbole vollstaendig (${groessen.join(", ")} px)`);

/* --------------------------------------------------- 5. Uebersetzungen */

/**
 * Zwei Sprachen sind hier kein Beiwerk: Der Store zeigt jedem Besucher die
 * Fassung seiner Sprache, und der Eintrag wird in beiden gefunden. Fehlt eine
 * Zeichenkette in einer Sprache, faellt Chrome NICHT auf die andere zurueck —
 * es zeigt den Platzhalter roh an.
 */
const LAENGEN = { extName: 45, extShortName: 12, extDescription: 132 };
const platzhalter = new Set(
  [...JSON.stringify(manifest).matchAll(/__MSG_(\w+)__/g)].map((treffer) => treffer[1]),
);

const sprachen = existsSync(pfad("_locales")) ? readdirSync(pfad("_locales")) : [];
if (sprachen.length === 0) fehler.push("_locales fehlt im Paket");
if (!sprachen.includes(manifest.default_locale)) {
  fehler.push(`default_locale "${manifest.default_locale}" hat kein Verzeichnis unter _locales`);
}

for (const sprache of sprachen) {
  const datei = pfad("_locales", sprache, "messages.json");
  if (!existsSync(datei)) {
    fehler.push(`_locales/${sprache}/messages.json fehlt`);
    continue;
  }

  let texte;
  try {
    texte = JSON.parse(readFileSync(datei, "utf8"));
  } catch (ursache) {
    fehler.push(`_locales/${sprache}/messages.json ist kein gueltiges JSON — ${ursache.message}`);
    continue;
  }

  for (const schluessel of platzhalter) {
    const eintrag = texte[schluessel];
    if (!eintrag?.message) {
      fehler.push(`_locales/${sprache}: "${schluessel}" fehlt, wird sonst als __MSG_ angezeigt`);
      continue;
    }
    const grenze = LAENGEN[schluessel];
    if (grenze && [...eintrag.message].length > grenze) {
      fehler.push(
        `_locales/${sprache}: "${schluessel}" hat ${[...eintrag.message].length} Zeichen, erlaubt sind ${grenze}`,
      );
    }
  }
}
if (!fehler.some((f) => f.startsWith("_locales"))) {
  ok.push(`Uebersetzungen vollstaendig und in Laenge (${sprachen.join(", ")})`);
}

/* ------------------------------------------------ 6. Dienst und Restmuell */

const dienst = manifest.background?.service_worker;
if (!dienst) fehler.push("background.service_worker fehlt");
else if (!existsSync(pfad(dienst))) fehler.push(`${dienst} fehlt im Paket`);
else ok.push(`Dienstprogramm vorhanden (${dienst})`);

if (!existsSync(pfad("index.html"))) fehler.push("index.html fehlt im Paket");

/**
 * Reste aus dem Webbau. Sie funktionieren nicht falsch — sie gehoeren nur
 * nicht in ein Erweiterungspaket und erzeugen bei der Pruefung Rueckfragen.
 */
for (const rest of ["CNAME", "manifest.webmanifest"]) {
  if (existsSync(pfad(rest))) fehler.push(`${rest} liegt noch im Paket (gehoert zum Webbau)`);
}
const html = readFileSync(pfad("index.html"), "utf8");
if (/<link rel="manifest"/.test(html)) {
  fehler.push('index.html verweist noch auf manifest.webmanifest (<link rel="manifest">)');
}

/* ------------------------------------------------------------- 7. Groesse */

let bytes = 0;
const sammle = (verzeichnis) => {
  for (const eintrag of readdirSync(verzeichnis)) {
    const p = join(verzeichnis, eintrag);
    if (statSync(p).isDirectory()) sammle(p);
    else bytes += statSync(p).size;
  }
};
sammle(paket);
const mb = bytes / 1024 / 1024;
ok.push(`Paketgroesse ${mb.toFixed(1)} MB`);

/* ------------------------------------------------------------- Ergebnis */

for (const zeile of ok) console.log(`  OK   ${zeile}`);
if (fehler.length > 0) {
  console.error("\nFEHLER:");
  for (const zeile of fehler) console.error(`  ${zeile}`);
  process.exit(1);
}
console.log("\nErweiterungspaket geprueft.");
