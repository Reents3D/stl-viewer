import { describe, expect, test } from "vitest";

import { LOGO_ASPECT, meanLuminance, watermarkBox } from "../../src/viewer/watermark";

/** Das Format des Bildexports aus App.tsx. */
const SHOT = { width: 2000, height: 1500 };

/** Ein Bildpunktfeld aus lauter gleichen Punkten bauen. */
function fill(r: number, g: number, b: number, pixels = 64): Uint8ClampedArray {
  const data = new Uint8ClampedArray(pixels * 4);
  for (let i = 0; i < pixels; i++) {
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = 255;
  }
  return data;
}

describe("Platzierung", () => {
  test("sitzt vollstaendig im Bild", () => {
    const box = watermarkBox(SHOT.width, SHOT.height);
    expect(box.x).toBeGreaterThan(0);
    expect(box.y).toBeGreaterThan(0);
    expect(box.x + box.width).toBeLessThan(SHOT.width);
    expect(box.y + box.height).toBeLessThan(SHOT.height);
  });

  test("steht unten rechts, nicht in der Bildmitte", () => {
    // Das Bauteil steht mittig — dort darf die Marke nicht liegen.
    const box = watermarkBox(SHOT.width, SHOT.height);
    expect(box.x).toBeGreaterThan(SHOT.width / 2);
    expect(box.y).toBeGreaterThan(SHOT.height / 2);
  });

  test("haelt das Seitenverhaeltnis der Wortmarke ein", () => {
    // Ohne diese Zusicherung wird das Logo gestaucht, und niemand sieht es,
    // bis ein Kunde das Bild in der Hand haelt.
    const box = watermarkBox(SHOT.width, SHOT.height);
    expect(box.width / box.height).toBeCloseTo(LOGO_ASPECT, 5);
  });

  test("waechst mit der Bildbreite statt fester Bildpunktzahl", () => {
    const small = watermarkBox(1000, 750);
    const large = watermarkBox(4000, 3000);
    expect(large.width).toBeCloseTo(small.width * 4, 5);
  });

  test("bleibt auch im Hochformat im Bild", () => {
    const box = watermarkBox(1080, 1920);
    expect(box.x + box.width).toBeLessThan(1080);
    expect(box.y + box.height).toBeLessThan(1920);
  });
});

describe("Helligkeit", () => {
  test("erkennt den hellen Betrachterhintergrund", () => {
    // #f4f6f8 — die Einstellung "hell".
    expect(meanLuminance(fill(0xf4, 0xf6, 0xf8))).toBeGreaterThan(200);
  });

  test("erkennt den dunklen Betrachterhintergrund", () => {
    // #0a121c — die Einstellung "dunkel".
    expect(meanLuminance(fill(0x0a, 0x12, 0x1c))).toBeLessThan(30);
  });

  test("wertet Gruen staerker als Blau", () => {
    // Ein schlichter Kanalmittelwert gaebe beiden denselben Wert. Gruen macht
    // den groessten Teil des Helligkeitseindrucks aus, Blau den kleinsten.
    expect(meanLuminance(fill(0, 255, 0))).toBeGreaterThan(meanLuminance(fill(0, 0, 255)));
  });

  test("liefert bei leerem Feld keine Division durch null", () => {
    expect(meanLuminance(new Uint8ClampedArray(0))).toBe(0);
  });
});
