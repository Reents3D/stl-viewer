import { readFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { checkPng } from "../../scripts/lib/png-check.ts";

/**
 * Anlass: Version 1.0.0 der Chrome-Erweiterung liess sich bei einem Teil der
 * Nutzer nicht installieren. icons/icon-48.png war beschaedigt — CRC des
 * Bilddatenblocks und zlib-Pruefsumme falsch. Chromium: "The source image could
 * not be decoded". Die Datei sah im Explorer trotzdem wie ein Bild aus.
 */

const ICON_DIR = new URL("../../extension/icons/", import.meta.url);

/** Kleinstes gueltiges RGBA-PNG der Groesse w x h, einfarbig. */
function makePng(w: number, h: number): Buffer {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (b: Buffer) => {
    let c = 0xffffffff;
    for (const x of b) c = crcTable[(c ^ x) & 255] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
    const sum = Buffer.alloc(4);
    sum.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, sum]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc((w * 4 + 1) * h, 0x7f);
  for (let y = 0; y < h; y++) raw[y * (w * 4 + 1)] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Byte im ersten IDAT-Block kippen; Kennung steht 4 Byte vor den Daten. */
function corruptIdat(png: Buffer): Buffer {
  const copy = Buffer.from(png);
  const at = copy.indexOf("IDAT", 8, "latin1") + 4 + 10;
  copy[at] ^= 0xff;
  return copy;
}

describe("checkPng", () => {
  it("liefert Breite und Hoehe eines gueltigen PNG", () => {
    expect(checkPng(makePng(48, 48))).toEqual({ width: 48, height: 48 });
  });

  it("lehnt eine Datei ohne PNG-Signatur ab", () => {
    expect(() => checkPng(Buffer.from("GIF89a...."))).toThrow(/Signatur/);
  });

  it("lehnt einen Block mit falscher CRC ab", () => {
    expect(() => checkPng(corruptIdat(makePng(48, 48)))).toThrow(/CRC/);
  });

  it("lehnt eine abgeschnittene Datei ab", () => {
    const png = makePng(48, 48);
    expect(() => checkPng(png.subarray(0, png.length - 20))).toThrow();
  });

  it("lehnt Bilddaten ab, die nicht zur Bildgroesse passen", () => {
    // 48 x 48 im Kopf, aber Daten fuer 16 x 16 — CRCs stimmen trotzdem.
    const small = makePng(16, 16);
    const ihdrOf48 = makePng(48, 48).subarray(8, 8 + 25);
    const mixed = Buffer.concat([small.subarray(0, 8), ihdrOf48, small.subarray(8 + 25)]);
    expect(() => checkPng(mixed)).toThrow(/Bilddaten/);
  });

  it("verhindert genau den Fehler aus 1.0.0: beschaedigtes 48er-Icon", () => {
    const original = readFileSync(new URL("icon-48.png", ICON_DIR));
    expect(() => checkPng(corruptIdat(original))).toThrow();
  });
});

describe("Icons der Erweiterung", () => {
  const manifest = JSON.parse(
    readFileSync(new URL("../../extension/manifest.json", import.meta.url), "utf8"),
  ) as { icons: Record<string, string> };

  for (const [size, file] of Object.entries(manifest.icons)) {
    it(`${file} ist dekodierbar und ${size} x ${size} gross`, () => {
      const png = readFileSync(new URL(`../../extension/${file}`, import.meta.url));
      expect(checkPng(png)).toEqual({ width: Number(size), height: Number(size) });
    });
  }
});
