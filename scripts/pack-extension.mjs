#!/usr/bin/env node
/**
 * Schnuert aus dem geprueften Paket das ZIP fuer den Chrome Web Store.
 *
 *   node scripts/pack-extension.mjs [dist-extension] [reents3d-stl-betrachter.zip]
 *
 * WARUM HIER EIN ZIP-SCHREIBER STEHT UND KEINE ABHAENGIGKEIT
 * Das Repository hat bewusst keine Werkzeuge im Bau, die nicht gebraucht
 * werden — jede Abhaengigkeit steht spaeter in THIRD-PARTY.md und will
 * gepflegt werden. Die Alternativen taugen hier nicht: `zip` fehlt unter
 * Windows, `Compress-Archive` aus PowerShell schreibt je nach Fassung
 * Backslashes als Pfadtrenner, und ein Archiv mit Backslashes packt Chrome
 * falsch aus. Das Format selbst ist alt und festgelegt; die 90 Zeilen unten
 * aendern sich nie wieder.
 *
 * WARUM DAS ARCHIV BEI JEDEM LAUF BYTEGLEICH IST
 * Die Zeitstempel sind fest verdrahtet statt aus dem Dateisystem gelesen.
 * Damit hat dasselbe Paket immer dieselbe Pruefsumme, und die Frage "ist das
 * hochgeladene Archiv wirklich das gebaute" laesst sich beantworten, statt sie
 * zu glauben.
 */

import { createHash } from "node:crypto";
import { deflateRawSync } from "node:zlib";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

// Dieselbe Pruefsumme braucht das PNG-Format (scripts/lib/png.mjs). Zwei
// Tabellen fuer denselben Algorithmus waeren eine zu viel.
import { crc32 } from "./lib/png.mjs";

const quelle = process.argv[2] ?? "dist-extension";
const ziel = process.argv[3] ?? "reents3d-stl-betrachter.zip";

/* ------------------------------------------------------------ Zeitstempel */

// 2020-01-01, 12:00 Uhr im MS-DOS-Format. Fest, siehe Kopfkommentar.
const DOS_ZEIT = 12 << 11;
const DOS_DATUM = ((2020 - 1980) << 9) | (1 << 5) | 1;

/* ------------------------------------------------------------- Sammeln */

function dateien(verzeichnis) {
  const gefunden = [];
  for (const eintrag of readdirSync(verzeichnis)) {
    const pfad = join(verzeichnis, eintrag);
    if (statSync(pfad).isDirectory()) gefunden.push(...dateien(pfad));
    else gefunden.push(pfad);
  }
  return gefunden;
}

const eintraege = dateien(quelle)
  // Im Archiv IMMER Schraegstriche, auch wenn Windows Backslashes liefert.
  .map((pfad) => ({ name: relative(quelle, pfad).split(sep).join("/"), pfad }))
  // Feste Reihenfolge, sonst haengt die Pruefsumme an der Laune des Dateisystems.
  .sort((a, b) => (a.name < b.name ? -1 : 1));

if (!eintraege.some((e) => e.name === "manifest.json")) {
  console.error(`FEHLER: ${quelle} enthaelt keine manifest.json in der Wurzel.`);
  process.exit(1);
}

/* -------------------------------------------------------------- Schreiben */

const lokal = [];
const zentral = [];
let versatz = 0;

for (const eintrag of eintraege) {
  const roh = readFileSync(eintrag.pfad);
  const gepackt = deflateRawSync(roh, { level: 9 });
  // Wenn das Packen nichts bringt (bereits gepackte PNG), roh ablegen.
  const nutzt = gepackt.length < roh.length;
  const inhalt = nutzt ? gepackt : roh;
  const methode = nutzt ? 8 : 0;
  const name = Buffer.from(eintrag.name, "utf8");
  const summe = crc32(roh);

  const kopf = Buffer.alloc(30);
  kopf.writeUInt32LE(0x04034b50, 0);
  kopf.writeUInt16LE(20, 4); // benoetigte Fassung
  kopf.writeUInt16LE(0x0800, 6); // Bit 11: Dateiname ist UTF-8
  kopf.writeUInt16LE(methode, 8);
  kopf.writeUInt16LE(DOS_ZEIT, 10);
  kopf.writeUInt16LE(DOS_DATUM, 12);
  kopf.writeUInt32LE(summe, 14);
  kopf.writeUInt32LE(inhalt.length, 18);
  kopf.writeUInt32LE(roh.length, 22);
  kopf.writeUInt16LE(name.length, 26);
  kopf.writeUInt16LE(0, 28); // kein Zusatzfeld
  lokal.push(kopf, name, inhalt);

  const verzeichnis = Buffer.alloc(46);
  verzeichnis.writeUInt32LE(0x02014b50, 0);
  verzeichnis.writeUInt16LE(20, 4); // erzeugende Fassung
  verzeichnis.writeUInt16LE(20, 6); // benoetigte Fassung
  verzeichnis.writeUInt16LE(0x0800, 8);
  verzeichnis.writeUInt16LE(methode, 10);
  verzeichnis.writeUInt16LE(DOS_ZEIT, 12);
  verzeichnis.writeUInt16LE(DOS_DATUM, 14);
  verzeichnis.writeUInt32LE(summe, 16);
  verzeichnis.writeUInt32LE(inhalt.length, 20);
  verzeichnis.writeUInt32LE(roh.length, 24);
  verzeichnis.writeUInt16LE(name.length, 28);
  verzeichnis.writeUInt16LE(0, 30); // kein Zusatzfeld
  verzeichnis.writeUInt16LE(0, 32); // keine Bemerkung
  verzeichnis.writeUInt16LE(0, 34); // Datentraeger 0
  verzeichnis.writeUInt16LE(0, 36); // interne Merkmale
  verzeichnis.writeUInt32LE(0, 38); // externe Merkmale
  verzeichnis.writeUInt32LE(versatz, 42);
  zentral.push(verzeichnis, name);

  versatz += kopf.length + name.length + inhalt.length;
}

const verzeichnisTeil = Buffer.concat(zentral);
const schluss = Buffer.alloc(22);
schluss.writeUInt32LE(0x06054b50, 0);
schluss.writeUInt16LE(0, 4); // Datentraeger
schluss.writeUInt16LE(0, 6); // Datentraeger mit Zentralverzeichnis
schluss.writeUInt16LE(eintraege.length, 8);
schluss.writeUInt16LE(eintraege.length, 10);
schluss.writeUInt32LE(verzeichnisTeil.length, 12);
schluss.writeUInt32LE(versatz, 16);
schluss.writeUInt16LE(0, 20); // keine Bemerkung

const archiv = Buffer.concat([...lokal, verzeichnisTeil, schluss]);
writeFileSync(ziel, archiv);

console.log(`  ${ziel}`);
console.log(`  ${eintraege.length} Dateien, ${(archiv.length / 1024 / 1024).toFixed(2)} MB`);
// Die Pruefsumme gehoert in die Einreichungsnotiz: Sie beantwortet spaeter die
// Frage, welcher Bau hinter einer Fassung im Store steckt.
console.log(`  SHA-256 ${createHash("sha256").update(archiv).digest("hex")}`);
