#!/usr/bin/env node
/**
 * Prueft das GEBAUTE Artefakt, nicht den Quelltext.
 *
 * Die Zusage "kein Upload" haengt an einer einzigen Zeile im ausgelieferten HTML.
 * Faellt sie durch eine Aenderung an der Bauweise weg, merkt das sonst niemand —
 * die Anwendung funktioniert ohne sie genauso gut. Nur der Kunde, der mit offenem
 * Netzwerk-Reiter nachsieht, haette dann recht und wir unrecht.
 *
 *   node scripts/check-artifact.mjs [dist]
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const dist = process.argv[2] ?? "dist";
const html = readFileSync(join(dist, "index.html"), "utf8");
const fehler = [];
const ok = [];

/* ------------------------------------------------ 1. Richtlinie im Artefakt */

for (const richtung of [
  "connect-src 'self'",
  "form-action 'none'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "object-src 'none'",
  "base-uri 'self'",
]) {
  if (html.includes(richtung)) ok.push(`Richtlinie: ${richtung}`);
  else fehler.push(`Richtlinie fehlt im Bau: ${richtung} (siehe ADR-001 und ADR-013)`);
}

/**
 * Die Lockerung darf nicht weiter gehen als beschlossen.
 *
 * `connect-src 'self'` ist der Preis fuer STEP (ADR-013). Ein Platzhalter oder
 * eine fremde Adresse waere etwas anderes — und genau so eine Aenderung rutscht
 * unbemerkt durch, weil die Anwendung danach genauso funktioniert.
 */
for (const verboten of ["connect-src *", "connect-src 'unsafe", "script-src 'unsafe-eval'", "'unsafe-inline'" ]) {
  // 'unsafe-inline' ist bei style-src bewusst gesetzt (React setzt Stilattribute
  // direkt am Element) — nur bei script-src waere es ein Fehler.
  const beiSkript = verboten === "'unsafe-inline'"
    ? /script-src[^;]*'unsafe-inline'/.test(html)
    : html.includes(verboten);
  if (beiSkript) fehler.push(`Richtlinie zu weit geoeffnet: ${verboten}`);
}
if (!fehler.some((f) => f.startsWith("Richtlinie zu weit"))) {
  ok.push("Keine unerlaubte Lockerung der Richtlinie");
}

/* ------------------------------------ 2. Keine LADENDEN Verweise nach aussen */

/**
 * Unterschieden wird zwischen Verweisen, die der Browser VON SELBST abruft, und
 * solchen, die der Besucher anklickt. Ein <link rel="canonical"> auf die eigene
 * Adresse und ein og:url sind Metadaten — sie laden nichts. Eine fruehere Fassung
 * dieser Pruefung schlug genau darauf an und haette dazu verleitet, die Pruefung
 * abzuschwaechen statt sie zu schaerfen.
 */
const ladendeRel = /^(stylesheet|modulepreload|preload|prefetch|icon|apple-touch-icon|manifest)$/i;
const ladend = [];

for (const tag of html.match(/<(script|img|link|iframe|source)\b[^>]*>/gi) ?? []) {
  const name = /^<(\w+)/.exec(tag)?.[1]?.toLowerCase();
  const url = /\b(?:src|href)\s*=\s*"(https?:\/\/[^"]+)"/i.exec(tag)?.[1];
  if (!url) continue;
  if (name === "link") {
    const rel = /\brel\s*=\s*"([^"]+)"/i.exec(tag)?.[1] ?? "";
    if (!rel.split(/\s+/).some((r) => ladendeRel.test(r))) continue; // Metadatum
  }
  ladend.push(`${name}: ${url}`);
}

if (ladend.length > 0) fehler.push(`Externe Ressource im Artefakt:\n    ${ladend.join("\n    ")}`);
else ok.push("Keine ladenden Verweise auf fremde Herkunft");

/* ---------------------------------------- 3. Keine fremden Adressen im Code */

/**
 * Zweite Ebene: Eine Abhaengigkeit koennte eine Adresse im Buendel mitbringen und
 * sie zur Laufzeit abrufen. Die Richtlinie wuerde das blockieren — aber ein Fund
 * hier heisst, dass jemand es versucht, und das gehoert angesehen.
 */
const erlaubt = /reents3d\.de|reents3d\.github\.io|github\.com|schema\.org|www\.w3\.org|creativecommons\.org/;
const verdaechtig = new Set();

const dateien = [];
const sammle = (verzeichnis) => {
  for (const eintrag of readdirSync(verzeichnis)) {
    const pfad = join(verzeichnis, eintrag);
    if (statSync(pfad).isDirectory()) sammle(pfad);
    else if (/\.(js|css)$/.test(eintrag)) dateien.push(pfad);
  }
};
sammle(dist);

for (const datei of dateien) {
  const inhalt = readFileSync(datei, "utf8");
  for (const treffer of inhalt.match(/https?:\/\/[a-z0-9.-]+\.[a-z]{2,}/gi) ?? []) {
    if (!erlaubt.test(treffer)) verdaechtig.add(treffer);
  }
}

if (verdaechtig.size > 0) {
  console.log(`\nHinweis — fremde Adressen im Buendel (${verdaechtig.size}):`);
  for (const adresse of [...verdaechtig].sort().slice(0, 20)) console.log(`    ${adresse}`);
  console.log("  Kein Fehler: die Richtlinie unterbindet den Abruf. Trotzdem ansehen.");
}

/* ------------------------------------------------------------------ Ergebnis */

for (const zeile of ok) console.log(`  OK   ${zeile}`);
if (fehler.length > 0) {
  console.error("\nFEHLER:");
  for (const zeile of fehler) console.error(`  ${zeile}`);
  process.exit(1);
}
console.log("\nArtefakt geprueft.");
