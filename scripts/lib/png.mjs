/**
 * Das Nötigste an PNG, um Store-Bildmaterial zu erzeugen.
 *
 * WARUM DAS HIER STEHT
 * Der Chrome Web Store verlangt für Bildschirmfotos und Werbekacheln
 * ausdrücklich „JPEG oder 24-Bit-PNG (kein Alpha)". Jede Zeichenfläche im
 * Browser liefert aber RGBA, und die Aufnahme aus den Entwicklerwerkzeugen
 * ebenso. Ein 32-Bit-PNG wird abgelehnt, auch wenn jeder Alphawert 255 ist.
 * Umgerechnet wird also nicht wegen des Aussehens, sondern wegen einer
 * Formatprüfung.
 *
 * Bewusst KEIN allgemeiner PNG-Umsetzer: Nur 8 Bit RGBA ohne Verschränkung
 * wird gelesen, denn nur das entsteht hier. Alles andere bricht mit einer
 * klaren Meldung ab, statt ein halb richtiges Ergebnis zu liefern.
 */

import { deflateSync, inflateSync } from "node:zlib";

const SIGNATUR = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const CRC_TABELLE = Uint32Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

export function crc32(daten) {
  let c = 0xffffffff;
  for (const byte of daten) c = CRC_TABELLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Vorhersage nach Paeth: der Nachbar, der der Summe am nächsten liegt. */
function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

/**
 * Liest ein 8-Bit-RGBA-PNG und gibt Breite, Höhe und die rohen Bildpunkte
 * zurück (vier Byte je Punkt, ohne Zeilenfilter).
 */
export function leseRgba(datei) {
  if (!datei.subarray(0, 8).equals(SIGNATUR)) throw new Error("Keine PNG-Datei");

  let breite = 0;
  let hoehe = 0;
  const idat = [];

  // Chunkfolge: Länge (4), Typ (4), Daten, Prüfsumme (4).
  let versatz = 8;
  while (versatz < datei.length) {
    const laenge = datei.readUInt32BE(versatz);
    const typ = datei.subarray(versatz + 4, versatz + 8).toString("ascii");
    const daten = datei.subarray(versatz + 8, versatz + 8 + laenge);

    if (typ === "IHDR") {
      breite = daten.readUInt32BE(0);
      hoehe = daten.readUInt32BE(4);
      const bittiefe = daten[8];
      const farbtyp = daten[9];
      const verschraenkung = daten[12];
      if (bittiefe !== 8 || farbtyp !== 6) {
        throw new Error(
          `Erwartet wird 8 Bit RGBA (Bittiefe 8, Farbtyp 6), gelesen wurde Bittiefe ${bittiefe}, Farbtyp ${farbtyp}`,
        );
      }
      if (verschraenkung !== 0) throw new Error("Verschraenkte PNG werden nicht gelesen");
    } else if (typ === "IDAT") {
      idat.push(daten);
    } else if (typ === "IEND") {
      break;
    }

    versatz += 12 + laenge;
  }

  const roh = inflateSync(Buffer.concat(idat));
  const bpp = 4;
  const zeile = breite * bpp;
  const punkte = Buffer.alloc(hoehe * zeile);

  // Zeilenfilter zurückrechnen. Jede Zeile beginnt mit ihrem Filterbyte.
  for (let y = 0; y < hoehe; y++) {
    const filter = roh[y * (zeile + 1)];
    const quelle = roh.subarray(y * (zeile + 1) + 1, (y + 1) * (zeile + 1));
    const ziel = punkte.subarray(y * zeile, (y + 1) * zeile);
    const oben = y > 0 ? punkte.subarray((y - 1) * zeile, y * zeile) : null;

    for (let x = 0; x < zeile; x++) {
      const a = x >= bpp ? ziel[x - bpp] : 0;
      const b = oben ? oben[x] : 0;
      const c = oben && x >= bpp ? oben[x - bpp] : 0;
      let wert = quelle[x];

      if (filter === 1) wert += a;
      else if (filter === 2) wert += b;
      else if (filter === 3) wert += (a + b) >> 1;
      else if (filter === 4) wert += paeth(a, b, c);
      else if (filter !== 0) throw new Error(`Unbekannter Zeilenfilter ${filter} in Zeile ${y}`);

      ziel[x] = wert & 0xff;
    }
  }

  return { breite, hoehe, punkte };
}

function chunk(typ, daten) {
  const kopf = Buffer.alloc(8);
  kopf.writeUInt32BE(daten.length, 0);
  kopf.write(typ, 4, "ascii");
  const pruefung = Buffer.alloc(4);
  pruefung.writeUInt32BE(crc32(Buffer.concat([kopf.subarray(4), daten])), 0);
  return Buffer.concat([kopf, daten, pruefung]);
}

/**
 * Schreibt ein 24-Bit-RGB-PNG ohne Alphakanal.
 *
 * Zeilenfilter 0 („None") für alle Zeilen: Die Bilder hier sind klein, und
 * eine Filterwahl brächte ein paar Prozent Dateigröße bei deutlich mehr Code,
 * der falsch sein könnte.
 */
export function schreibeRgb({ breite, hoehe, punkte }) {
  const zeile = breite * 3;
  const roh = Buffer.alloc(hoehe * (zeile + 1));
  for (let y = 0; y < hoehe; y++) {
    roh[y * (zeile + 1)] = 0;
    punkte.copy(roh, y * (zeile + 1) + 1, y * zeile, (y + 1) * zeile);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(breite, 0);
  ihdr.writeUInt32BE(hoehe, 4);
  ihdr[8] = 8; // Bittiefe
  ihdr[9] = 2; // Farbtyp 2 = RGB, kein Alpha
  ihdr[10] = 0; // Verfahren
  ihdr[11] = 0; // Filterverfahren
  ihdr[12] = 0; // keine Verschraenkung

  return Buffer.concat([
    SIGNATUR,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(roh, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/**
 * Legt das Bild über eine deckende Farbe und wirft den Alphakanal weg.
 *
 * Das Überlagern ist nicht nur Formsache: Ein halbdurchsichtiger Punkt wird
 * beim blossen Wegwerfen des Alphakanals zu voller Farbe, und aus einem
 * weichen Rand wird ein harter Fleck. Weiss als Vorgabe, weil der Store die
 * Bilder auf hellem Grund zeigt.
 */
export function aufHintergrund({ breite, hoehe, punkte }, hintergrund = [255, 255, 255]) {
  const ziel = Buffer.alloc(breite * hoehe * 3);
  for (let i = 0, j = 0; i < punkte.length; i += 4, j += 3) {
    const alpha = punkte[i + 3] / 255;
    for (let k = 0; k < 3; k++) {
      ziel[j + k] = Math.round(punkte[i + k] * alpha + hintergrund[k] * (1 - alpha));
    }
  }
  return { breite, hoehe, punkte: ziel };
}
