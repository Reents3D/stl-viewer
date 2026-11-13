/**
 * Prueft, ob ein PNG wirklich dekodierbar ist — nicht nur, ob es so aussieht.
 *
 * WARUM ES DAS GIBT
 * Version 1.0.0 der Chrome-Erweiterung liess sich bei einem Teil der Nutzer nicht
 * installieren: icons/icon-48.png war beschaedigt. Signatur und Kopf stimmten,
 * die Datei zeigte im Explorer sogar ein Vorschaubild — aber CRC und
 * zlib-Pruefsumme der Bilddaten waren falsch, und Chromium meldete "The source
 * image could not be decoded". Eine Pruefung auf Dateiendung oder Groesse haette
 * das nicht gefunden. Deshalb wird hier jede Pruefsumme nachgerechnet und die
 * Bildmenge gegen die Kopfangaben gehalten.
 *
 * Bewusst nur das, was die Icons der Erweiterung brauchen: 8 Bit, ohne Interlace.
 */

import { inflateSync } from "node:zlib";

export interface PngSize {
  width: number;
  height: number;
}

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Kanaele je Farbtyp laut PNG-Spezifikation (3 = Palette, ein Index je Pixel). */
const CHANNELS: Readonly<Record<number, number>> = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * Wirft mit einer lesbaren Begruendung, wenn das PNG nicht dekodierbar ist.
 * Liefert sonst die Bildgroesse.
 */
export function checkPng(png: Uint8Array): PngSize {
  const data = Buffer.from(png.buffer, png.byteOffset, png.byteLength);
  if (data.length < SIGNATURE.length || !data.subarray(0, 8).equals(SIGNATURE)) {
    throw new Error("keine PNG-Signatur");
  }

  let offset = 8;
  let header: { width: number; height: number; bitDepth: number; colorType: number; interlace: number } | null = null;
  const idat: Buffer[] = [];
  let ended = false;

  while (offset < data.length) {
    if (offset + 12 > data.length) throw new Error(`Datei endet mitten in einem Block (Byte ${offset})`);
    const length = data.readUInt32BE(offset);
    const type = data.toString("latin1", offset + 4, offset + 8);
    const end = offset + 8 + length;
    if (end + 4 > data.length) throw new Error(`Block ${type} reicht ueber das Dateiende hinaus`);

    const stored = data.readUInt32BE(end);
    if (crc32(data.subarray(offset + 4, end)) !== stored) {
      throw new Error(`CRC des Blocks ${type} stimmt nicht (Byte ${offset})`);
    }

    const body = data.subarray(offset + 8, end);
    if (type === "IHDR") {
      header = {
        width: body.readUInt32BE(0),
        height: body.readUInt32BE(4),
        bitDepth: body[8],
        colorType: body[9],
        interlace: body[12],
      };
    } else if (type === "IDAT") {
      idat.push(body);
    } else if (type === "IEND") {
      ended = true;
      break;
    }
    offset = end + 4;
  }

  if (!header) throw new Error("IHDR fehlt");
  if (!ended) throw new Error("IEND fehlt — Datei abgeschnitten");
  if (idat.length === 0) throw new Error("keine Bilddaten (IDAT fehlt)");

  const channels = CHANNELS[header.colorType];
  if (channels === undefined) throw new Error(`unbekannter Farbtyp ${header.colorType}`);
  if (header.bitDepth !== 8 || header.interlace !== 0) {
    throw new Error(`nur 8 Bit ohne Interlace vorgesehen (hier ${header.bitDepth} Bit, Interlace ${header.interlace})`);
  }

  let raw: Buffer;
  try {
    // inflateSync prueft die Adler-32-Summe am Ende des zlib-Stroms mit.
    raw = inflateSync(Buffer.concat(idat));
  } catch (err) {
    throw new Error(`Bilddaten lassen sich nicht entpacken: ${(err as Error).message}`);
  }

  const stride = header.width * channels + 1;
  if (raw.length !== stride * header.height) {
    throw new Error(
      `Bilddaten passen nicht zur Bildgroesse: ${raw.length} Byte statt ${stride * header.height}`,
    );
  }
  for (let y = 0; y < header.height; y++) {
    const filter = raw[y * stride];
    if (filter > 4) throw new Error(`ungueltiger Zeilenfilter ${filter} in Zeile ${y}`);
  }

  return { width: header.width, height: header.height };
}
