#!/usr/bin/env node
/**
 * Macht aus einer beliebigen PNG-Aufnahme ein Bild, das der Chrome Web Store
 * annimmt: 24 Bit RGB, kein Alphakanal, geprüfte Abmessungen.
 *
 *   node scripts/store-bild.mjs aufnahme.png bildschirmfoto-1.png
 *   node scripts/store-bild.mjs mark.png haendlersymbol-128.png --masse 128x128
 *   node scripts/store-bild.mjs hell.png kachel.png --hintergrund 204B63
 *
 * WOFÜR
 * Jede Zeichenfläche im Browser und jede Aufnahme aus den Entwicklerwerkzeugen
 * liefert RGBA. Der Store lehnt das bei Bildschirmfotos und Werbekacheln ab,
 * auch wenn das Bild vollständig deckend ist. Diese Umrechnung ist der letzte
 * Schritt vor dem Hochladen.
 *
 * Die Maße prüft das Skript nur, es rechnet sie nicht um. Ein hochskaliertes
 * Bildschirmfoto sieht man sofort, und die Aufnahme in der richtigen Größe
 * kostet in den Entwicklerwerkzeugen keine Sekunde mehr (siehe
 * docs/chrome-web-store.md).
 */

import { readFileSync, writeFileSync } from "node:fs";

import { aufHintergrund, leseRgba, schreibeRgb } from "./lib/png.mjs";

const [quelle, ziel, ...rest] = process.argv.slice(2);

if (!quelle || !ziel) {
  console.error("Aufruf: node scripts/store-bild.mjs <quelle.png> <ziel.png> [--masse BxH] [--hintergrund RRGGBB]");
  process.exit(1);
}

function option(name) {
  const i = rest.indexOf(`--${name}`);
  return i === -1 ? null : rest[i + 1];
}

const erwartet = option("masse");
const farbe = option("hintergrund") ?? "FFFFFF";

if (!/^[0-9a-fA-F]{6}$/.test(farbe)) {
  console.error(`--hintergrund erwartet sechs Hexziffern ohne Raute, bekommen: ${farbe}`);
  process.exit(1);
}
const hintergrund = [0, 2, 4].map((i) => parseInt(farbe.slice(i, i + 2), 16));

let bild;
try {
  bild = leseRgba(readFileSync(quelle));
} catch (ursache) {
  console.error(`${quelle}: ${ursache.message}`);
  process.exit(1);
}

if (erwartet) {
  const [b, h] = erwartet.toLowerCase().split("x").map(Number);
  if (bild.breite !== b || bild.hoehe !== h) {
    console.error(
      `${quelle} ist ${bild.breite}x${bild.hoehe}, erwartet wurde ${b}x${h}.\n` +
        "Nicht skalieren: neu aufnehmen. In den Entwicklerwerkzeugen die Geraeteleiste\n" +
        "auf die Zielgroesse stellen und erneut aufnehmen.",
    );
    process.exit(1);
  }
}

/**
 * Ein Hinweis statt einer Vorgabe: Der Store nimmt 1280x800 und 640x400 für
 * Bildschirmfotos, 440x280 und 1400x560 für die Kacheln, 128x128 für das
 * Händlersymbol. Andere Maße sind kein Fehler dieses Skripts, aber fast immer
 * ein Versehen.
 */
const BEKANNT = ["1280x800", "640x400", "440x280", "1400x560", "128x128"];
const masse = `${bild.breite}x${bild.hoehe}`;
if (!BEKANNT.includes(masse)) {
  console.warn(`  Hinweis: ${masse} ist keines der vom Store erwarteten Masse (${BEKANNT.join(", ")}).`);
}

writeFileSync(ziel, schreibeRgb(aufHintergrund(bild, hintergrund)));

// Zurücklesen statt vertrauen: Der Farbtyp im Ergebnis ist genau das, woran
// der Store sonst scheitert.
const geprueft = readFileSync(ziel);
console.log(`  ${ziel}`);
console.log(`  ${masse}, 24 Bit RGB ohne Alpha, ${(geprueft.length / 1024).toFixed(1)} kB`);
console.log(`  Farbtyp im Ergebnis: ${geprueft[25]} (2 = RGB, kein Alpha)`);
