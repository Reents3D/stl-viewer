import { describe, expect, test } from "vitest";

import { detectFormat, parseAscii, parseBinary, parseStl, StlError } from "../../src/stl/parse";
import { asciiToBuffer, buildAsciiStl, buildBinaryStl, cube } from "../fixtures";

describe("Formaterkennung", () => {
  test("erkennt eine binaere Datei an der Laengenrechnung", () => {
    expect(detectFormat(buildBinaryStl(cube()))).toBe("binary");
  });

  test("erkennt eine ASCII-Datei", () => {
    expect(detectFormat(asciiToBuffer(buildAsciiStl(cube())))).toBe("ascii");
  });

  test("faellt nicht auf einen binaeren Kopf herein, der mit 'solid' beginnt", () => {
    // Das ist der Klassiker: SolidWorks schrieb jahrelang "solid" in den Kopf
    // binaerer Dateien. Wer nur die ersten fuenf Zeichen prueft, liest die Datei
    // als ASCII und bekommt ein leeres Modell statt einer Fehlermeldung.
    const buffer = buildBinaryStl(cube(), "solid Bauteil aus SolidWorks");
    expect(detectFormat(buffer)).toBe("binary");
    expect(parseStl(buffer).triangles).toBe(12);
  });

  test("erkennt binaer auch mit angehaengten Metadaten", () => {
    const clean = buildBinaryStl(cube());
    const padded = new Uint8Array(clean.byteLength + 32);
    padded.set(new Uint8Array(clean));
    expect(detectFormat(padded.buffer as ArrayBuffer)).toBe("binary");
    const parsed = parseBinary(padded.buffer as ArrayBuffer);
    expect(parsed.triangles).toBe(12);
    expect(parsed.trailingBytes).toBe(32);
  });
});

describe("Binaerparser", () => {
  test("liest alle Eckpunkte in der Reihenfolge der Datei", () => {
    const parsed = parseBinary(buildBinaryStl(cube(10)));
    expect(parsed.triangles).toBe(12);
    expect(parsed.positions.length).toBe(12 * 9);
    // Erstes Dreieck des Wuerfels: (0,0,0) (10,10,0) (10,0,0)
    expect(Array.from(parsed.positions.slice(0, 9))).toEqual([0, 0, 0, 10, 10, 0, 10, 0, 0]);
  });

  test("wendet den Skalierungsfaktor auf jede Koordinate an", () => {
    const parsed = parseBinary(buildBinaryStl(cube(1)), 25.4);
    expect(Math.max(...parsed.positions)).toBeCloseTo(25.4, 4);
  });

  test("liest den Modellnamen aus dem Kopf", () => {
    expect(parseBinary(buildBinaryStl(cube(), "Halterung A2")).solidName).toBe("Halterung A2");
  });

  test("verwirft reine Werkzeugsignaturen als Namen", () => {
    expect(parseBinary(buildBinaryStl(cube(), "binary STL")).solidName).toBeNull();
  });

  test("liest eine abgeschnittene Datei so weit, wie sie reicht", () => {
    // Ein halbes Modell mit Hinweis ist brauchbarer als eine Fehlermeldung.
    const clean = buildBinaryStl(cube());
    const cut = clean.slice(0, 84 + 6 * 50);
    const parsed = parseBinary(cut);
    expect(parsed.triangles).toBe(6);
  });

  test("meldet eine Datei ohne Dreiecke", () => {
    expect(() => parseBinary(buildBinaryStl([]))).toThrow(StlError);
  });
});

describe("ASCII-Parser", () => {
  test("liest denselben Wuerfel wie der Binaerzweig", () => {
    const bin = parseBinary(buildBinaryStl(cube(10)));
    const asc = parseAscii(buildAsciiStl(cube(10)));
    expect(asc.triangles).toBe(bin.triangles);
    expect(Array.from(asc.positions)).toEqual(Array.from(bin.positions));
  });

  test("liest den Namen aus der solid-Zeile", () => {
    expect(parseAscii(buildAsciiStl(cube(), "Traeger links")).solidName).toBe("Traeger links");
  });

  test("zaehlt das Wort 'vertex' im Modellnamen nicht als Eckpunkt mit", () => {
    // Ein billiges indexOf("vertex") wuerde hier 13 statt 12 Dreiecke sehen und
    // die Datei faelschlich als abgeschnitten melden.
    const text = buildAsciiStl(cube(), "vertex_pruefkoerper");
    expect(parseAscii(text).triangles).toBe(12);
  });

  test("kommt mit Tabulatoren und CRLF zurecht", () => {
    const text = buildAsciiStl(cube()).replace(/\n/g, "\r\n").replace(/ {6}/g, "\t");
    expect(parseAscii(text).triangles).toBe(12);
  });

  test("meldet eine Datei, die mitten im Dreieck abbricht", () => {
    // Nach der VIERTEN vertex-Zeile abschneiden: ein vollstaendiges Dreieck plus
    // ein einzelner Eckpunkt. Ein Schnitt vor dem ersten `endloop` taugt dafuer
    // nicht — der laesst genau drei Eckpunkte stehen, und drei ist teilbar.
    const text = buildAsciiStl(cube());
    let idx = -1;
    for (let i = 0; i < 4; i++) idx = text.indexOf("vertex", idx + 1);
    const cut = text.slice(0, text.indexOf("\n", idx));
    expect(() => parseAscii(cut)).toThrow(/nicht durch drei teilbar/);
  });
});

describe("Einstiegspunkt", () => {
  test("weist eine leere Datei zurueck", () => {
    expect(() => parseStl(new ArrayBuffer(0))).toThrow(/leer/);
  });

  test("weist eine zu kurze Datei zurueck", () => {
    expect(() => parseStl(new ArrayBuffer(8))).toThrow(StlError);
  });

  test("weist eine Datei zurueck, die gar kein STL ist", () => {
    const junk = new TextEncoder().encode("Das hier ist ein ganz normaler Text ohne Geometrie.");
    expect(() => parseStl(junk.buffer as ArrayBuffer)).toThrow(StlError);
  });
});
