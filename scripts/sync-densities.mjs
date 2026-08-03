#!/usr/bin/env node
/**
 * Dichtewerte gegen den FDM-Materialberater abgleichen.
 *
 * Die Werte in src/config/materials.ts sind eine Kopie aus der offenen
 * Materialdatenbank des Materialberaters (ADR-Begruendung steht dort im Kopf der
 * Datei). Eine Kopie laeuft auseinander — dieses Skript sagt, wann.
 *
 * Es AENDERT nichts. Ein Dichtewert, der sich geaendert hat, aendert die
 * Gewichtsschaetzung in jedem Angebot; das gehoert in einen Commit mit Blick
 * darauf, nicht in einen automatischen Lauf.
 *
 *   node scripts/sync-densities.mjs ../fdm-material-advisor/data/materials
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const quelle = process.argv[2];
if (!quelle) {
  console.error("Aufruf: node scripts/sync-densities.mjs <pfad-zu-advisor/data/materials>");
  process.exit(2);
}

/** Rekursiv nach einem Feldnamen suchen — das Schema kann sich umsortieren. */
function suche(objekt, schluessel) {
  if (!objekt || typeof objekt !== "object") return null;
  for (const [k, v] of Object.entries(objekt)) {
    if (k === schluessel) return v;
    const treffer = suche(v, schluessel);
    if (treffer) return treffer;
  }
  return null;
}

const fremd = new Map();
for (const datei of readdirSync(quelle).filter((f) => f.endsWith(".json"))) {
  const material = JSON.parse(readFileSync(join(quelle, datei), "utf8"));
  const dichte = suche(material, "density");
  if (dichte && typeof dichte.value === "number") {
    fremd.set(material.id, { wert: dichte.value, konfidenz: dichte.confidence ?? "medium" });
  }
}

const eigenerText = readFileSync(new URL("../src/config/materials.ts", import.meta.url), "utf8");
const eigen = new Map();
const zeile = /\{ id: "([^"]+)".*?density: ([\d.]+), confidence: "([^"]+)" \}/g;
let m;
while ((m = zeile.exec(eigenerText)) !== null) {
  eigen.set(m[1], { wert: Number.parseFloat(m[2]), konfidenz: m[3] });
}

const abweichungen = [];
for (const [id, dort] of fremd) {
  const hier = eigen.get(id);
  if (!hier) {
    abweichungen.push(`NEU     ${id.padEnd(12)} ${dort.wert} g/cm³ (${dort.konfidenz}) — fehlt hier`);
  } else if (hier.wert !== dort.wert || hier.konfidenz !== dort.konfidenz) {
    abweichungen.push(
      `GEÄNDERT ${id.padEnd(11)} hier ${hier.wert} (${hier.konfidenz})  →  dort ${dort.wert} (${dort.konfidenz})`,
    );
  }
}
for (const id of eigen.keys()) {
  if (!fremd.has(id)) abweichungen.push(`ENTFALLEN ${id.padEnd(10)} — im Materialberater nicht mehr vorhanden`);
}

console.log(`Materialberater: ${fremd.size} Werkstoffe · hier: ${eigen.size}`);
if (abweichungen.length === 0) {
  console.log("Keine Abweichungen.");
  process.exit(0);
}
console.log(`\n${abweichungen.length} Abweichung(en):\n`);
for (const a of abweichungen) console.log("  " + a);
console.log("\nsrc/config/materials.ts von Hand nachziehen und den Commit begründen.");
process.exit(1);
