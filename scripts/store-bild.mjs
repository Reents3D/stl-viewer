#!/usr/bin/env node
/**
 * Macht aus Bildschirmaufnahmen Bilder, die der Chrome Web Store annimmt:
 * 24 Bit RGB, kein Alphakanal, geprüfte Maße.
 *
 *   node scripts/store-bild.mjs aufnahme.png bildschirmfoto-1.png --masse 1280x800
 *   node scripts/store-bild.mjs aufnahmen/ docs/store-assets/ --masse 1280x800
 *   node scripts/store-bild.mjs mark.png symbol.png --masse 128x128 --hintergrund 204B63
 *
 * WOFÜR
 * Jede Zeichenfläche im Browser und jede Aufnahme aus den Entwicklerwerkzeugen
 * liefert RGBA. Der Store lehnt das bei Bildschirmfotos und Werbekacheln ab,
 * auch wenn das Bild vollständig deckend ist. Diese Umrechnung ist der letzte
 * Schritt vor dem Hochladen.
 *
 * Zu groß aufgenommene Bilder werden um ganzzahlige Faktoren heruntergerechnet
 * (siehe verkleinere() in lib/png.mjs). Das ist der Normalfall und kein
 * Notbehelf: Die Entwicklerwerkzeuge nehmen bei Geräteskalierung 2 in
 * doppelter Größe auf, und aus vier gemessenen Punkten je Zielpunkt wird das
 * Ergebnis SAUBERER als bei einer Aufnahme in Zielgröße.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

import { aufHintergrund, einpassen, leseRgba, schreibeRgb, verkleinere } from "./lib/png.mjs";

const [quelle, ziel, ...rest] = process.argv.slice(2);

const AUFRUF =
  "Aufruf: node scripts/store-bild.mjs <quelle> <ziel> [--masse BxH] [--praefix name]\n" +
  "                                    [--einpassen] [--hintergrund RRGGBB]\n" +
  "        Quelle und Ziel duerfen beide Ordner sein.\n" +
  "        --praefix benennt die Ergebnisse durch (name-1.png, name-2.png ...), damit sie\n" +
  "                  im Dateidialog nicht mit den Rohaufnahmen zu verwechseln sind.\n" +
  "        --einpassen nimmt Aufnahmen beliebiger Groesse an: verkleinern, mittig setzen,\n" +
  "                  Raender fuellen. Fuer Programmoberflaechen ungeeignet, siehe Anleitung.";

if (!quelle || !ziel) {
  console.error(AUFRUF);
  process.exit(1);
}

if (!existsSync(quelle)) {
  console.error(`Es gibt weder die Datei noch den Ordner "${quelle}".`);
  if (/^(aufnahme|screenshot|bild)\.png$/i.test(basename(quelle))) {
    // Genau dieser Fall ist aufgetreten: der Platzhalter aus der Anleitung
    // wurde woertlich uebernommen.
    console.error("");
    console.error('"aufnahme.png" ist ein Platzhalter aus der Anleitung, keine echte Datei.');
    console.error("Setze dort den Pfad deiner Aufnahme ein, zum Beispiel:");
    console.error('  node scripts/store-bild.mjs "$env:USERPROFILE\\Downloads\\localhost_1280x800.png" bildschirmfoto-1.png --masse 1280x800');
    console.error("");
    console.error("Oder gleich der ganze Ordner:");
    console.error('  node scripts/store-bild.mjs "$env:USERPROFILE\\Downloads\\aufnahmen" docs/store-assets --masse 1280x800');
  }
  process.exit(1);
}

function option(name) {
  const i = rest.indexOf(`--${name}`);
  return i === -1 ? null : rest[i + 1];
}

const masseOption = option("masse");
const farbe = option("hintergrund") ?? "FFFFFF";
const fit = rest.includes("--einpassen");

if (!/^[0-9a-fA-F]{6}$/.test(farbe)) {
  console.error(`--hintergrund erwartet sechs Hexziffern ohne Raute, bekommen: ${farbe}`);
  process.exit(1);
}
const hintergrund = [0, 2, 4].map((i) => parseInt(farbe.slice(i, i + 2), 16));

let erwartet = null;
if (masseOption) {
  const [b, h] = masseOption.toLowerCase().split("x").map(Number);
  if (!Number.isInteger(b) || !Number.isInteger(h) || b < 1 || h < 1) {
    console.error(`--masse erwartet BreitexHoehe, zum Beispiel 1280x800. Bekommen: ${masseOption}`);
    process.exit(1);
  }
  erwartet = { b, h };
}

/**
 * Vom Store erwartete Maße. Andere sind kein Fehler dieses Skripts, aber fast
 * immer ein Versehen — deshalb ein Hinweis statt einer Sperre.
 */
const BEKANNT = ["1280x800", "640x400", "440x280", "1400x560", "128x128"];

function verarbeite(quellDatei, zielDatei) {
  let bild;
  try {
    bild = leseRgba(readFileSync(quellDatei));
  } catch (ursache) {
    console.error(`  ${quellDatei}: ${ursache.message}`);
    return false;
  }

  const original = `${bild.breite}x${bild.hoehe}`;
  let hinweis = "";

  if (erwartet) {
    const faktorB = bild.breite / erwartet.b;
    const faktorH = bild.hoehe / erwartet.h;
    const passtGenau = faktorB === 1 && faktorH === 1;
    const ganzerFaktor = faktorB === faktorH && Number.isInteger(faktorB) && faktorB > 1;

    if (ganzerFaktor) {
      bild = verkleinere(bild, faktorB);
      hinweis = `  (aus ${original} um Faktor ${faktorB} heruntergerechnet)`;
    } else if (!passtGenau && fit) {
      try {
        const eingepasst = einpassen(bild, erwartet.b, erwartet.h, hintergrund);
        hinweis = `  (aus ${original} auf ${eingepasst.innen} verkleinert, mittig auf ${erwartet.b}x${erwartet.h} gesetzt)`;
        bild = eingepasst;
      } catch (ursache) {
        console.error(`  ${quellDatei}: ${ursache.message}`);
        return false;
      }
    } else if (!passtGenau) {
      console.error(`  ${quellDatei} ist ${original}, gebraucht wird ${erwartet.b}x${erwartet.h}.`);
      console.error("");
      console.error("    Der beste Weg ist, gleich in Zielgroesse aufzunehmen:");
      console.error("    F12, dann Strg+Shift+M fuer die Geraeteleiste, Masse auf");
      console.error(`    ${erwartet.b} x ${erwartet.h}, dann Strg+Shift+P und "Capture screenshot".`);
      console.error("    Ganze Vielfache davon werden ebenfalls angenommen und heruntergerechnet.");
      console.error("");
      console.error("    Vorhandene Aufnahmen lassen sich mit --einpassen verwenden. Sie werden");
      console.error("    dann verkleinert und mittig gesetzt, mit Raendern in der Hintergrundfarbe.");
      return false;
    }
  }

  const masse = `${bild.breite}x${bild.hoehe}`;
  if (!BEKANNT.includes(masse)) {
    console.warn(`  Hinweis: ${masse} ist keines der vom Store erwarteten Masse (${BEKANNT.join(", ")}).`);
  }

  writeFileSync(zielDatei, schreibeRgb(aufHintergrund(bild, hintergrund)));

  // Zurücklesen statt vertrauen: Der Farbtyp im Ergebnis ist genau das, woran
  // der Store sonst scheitert.
  const geprueft = readFileSync(zielDatei);
  console.log(`  ${zielDatei}`);
  console.log(`    ${masse}, Farbtyp ${geprueft[25]} (2 = RGB, kein Alpha), ${(geprueft.length / 1024).toFixed(1)} kB${hinweis}`);
  return true;
}

let fehler = 0;

if (statSync(quelle).isDirectory()) {
  const dateien = readdirSync(quelle).filter((n) => n.toLowerCase().endsWith(".png"));
  if (dateien.length === 0) {
    console.error(`Im Ordner "${quelle}" liegt keine PNG-Datei.`);
    process.exit(1);
  }
  mkdirSync(ziel, { recursive: true });
  console.log(`${dateien.length} Datei(en) aus ${quelle}:`);

  /**
   * Umbenennen ist hier keine Kosmetik.
   *
   * Die Entwicklerwerkzeuge nennen ihre Aufnahmen nach der Seite, also
   * "chrome-extension___ploadeog..._index.html (3).png". Die umgerechnete Datei
   * hiesse genauso, und im Dateidialog des Stores steht die ROHE daneben, die
   * aus demselben Lauf im Downloadordner liegt. Genau so ist die falsche
   * hochgeladen worden, mit "Die Bildgroesse ist falsch" als einzigem Hinweis.
   * Ein Praefix macht die fertigen Dateien unverwechselbar und bringt sie
   * zugleich in die Reihenfolge, in der sie im Store stehen sollen.
   */
  const praefix = option("praefix");
  let nummer = 0;

  for (const name of dateien.sort()) {
    nummer++;
    const zielName = praefix ? `${praefix}-${nummer}.png` : name;
    if (!verarbeite(join(quelle, name), join(ziel, zielName))) fehler++;
  }
} else {
  if (!verarbeite(quelle, ziel)) fehler++;
}

if (fehler > 0) {
  console.error(`\n${fehler} Datei(en) nicht umgerechnet.`);
  process.exit(1);
}
