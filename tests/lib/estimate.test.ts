import { describe, expect, test } from "vitest";

import {
  compactness,
  estimateMass,
  FILIGREE_THRESHOLD,
  isFiligree,
  spreadFactor,
} from "../../src/lib/estimate";

/** Kennwerte einiger Grundkoerper, von Hand gerechnet. */
const KOERPER = {
  wuerfel: (a: number) => ({ v: a ** 3, s: 6 * a * a }),
  platte: (x: number, y: number, z: number) => ({
    v: x * y * z,
    s: 2 * (x * y + x * z + y * z),
  }),
  /** Duennes Gehaeuse: Wandvolumen und beide Oberflaechen. */
  gehaeuse: (a: number, wand: number) => ({
    v: 6 * a * a * wand,
    s: 2 * 6 * a * a,
  }),
};

describe("Kompaktheit", () => {
  test("die Kugel ist der Nullpunkt", () => {
    const r = 50;
    const v = (4 / 3) * Math.PI * r ** 3;
    const s = 4 * Math.PI * r * r;
    expect(compactness(v, s)).toBeCloseTo(1, 6);
  });

  test("ein Wuerfel liegt bei 1,24", () => {
    const { v, s } = KOERPER.wuerfel(60);
    expect(compactness(v, s)).toBeCloseTo(1.24, 2);
  });

  test("haengt nicht von der Groesse ab, nur von der Form", () => {
    // Ein doppelt so grosser Wuerfel ist nicht "kompakter" — sonst waere die
    // Schwelle bei einem Kleinteil und einem XXL-Exponat verschieden streng.
    const klein = KOERPER.wuerfel(10);
    const gross = KOERPER.wuerfel(1000);
    expect(compactness(klein.v, klein.s)).toBeCloseTo(compactness(gross.v, gross.s), 6);
  });

  test("eine duenne Platte liegt deutlich hoeher", () => {
    const { v, s } = KOERPER.platte(100, 100, 2);
    expect(compactness(v, s)).toBeCloseTo(5.8, 1);
  });

  test("ein duennwandiges Gehaeuse noch einmal deutlich hoeher", () => {
    const { v, s } = KOERPER.gehaeuse(100, 1);
    expect(compactness(v, s)).toBeGreaterThan(14);
  });
});

describe("Schwelle fuer die Filigranwarnung", () => {
  test("kompakte Koerper loesen sie NICHT aus", () => {
    const w = KOERPER.wuerfel(60);
    expect(isFiligree(w.v, w.s)).toBe(false);
    const quader = KOERPER.platte(80, 60, 40);
    expect(isFiligree(quader.v, quader.s)).toBe(false);
  });

  test("eine duenne Platte loest sie aus", () => {
    const { v, s } = KOERPER.platte(100, 100, 2);
    expect(isFiligree(v, s)).toBe(true);
  });

  test("die Schwelle liegt zwischen Wuerfel und Platte", () => {
    // Das ist die eigentliche Aussage: Sie trennt "kompakt" von "besteht
    // ueberwiegend aus Rand". Wandert sie unter 1,24, warnt das Werkzeug bei
    // jedem Wuerfel; ueber 5,8 schweigt es bei einem Blech.
    const w = KOERPER.wuerfel(60);
    const p = KOERPER.platte(100, 100, 2);
    expect(compactness(w.v, w.s)).toBeLessThan(FILIGREE_THRESHOLD);
    expect(compactness(p.v, p.s)).toBeGreaterThan(FILIGREE_THRESHOLD);
  });

  test("bleibt bei entarteten Eingaben stumm statt zu raten", () => {
    expect(compactness(0, 100)).toBe(Infinity);
    expect(compactness(100, 0)).toBe(Infinity);
  });
});

describe("Massenschaetzung", () => {
  test("rechnet massiv und gefuellt getrennt", () => {
    // 1.000 cm³ PLA (1,24 g/cm³) = 1.240 g massiv, bei 20 % Fuellung 248 g.
    const e = estimateMass(1_000_000, 1.24, "medium", 20);
    expect(e.solidGrams).toBeCloseTo(1240, 3);
    expect(e.filledGrams).toBeCloseTo(248, 3);
  });

  test("gibt die Konfidenz des Dichtewerts unveraendert weiter", () => {
    expect(estimateMass(1000, 1.24, "estimated", 20).confidence).toBe("estimated");
  });

  test("begrenzt den Fuellgrad auf 0 bis 100", () => {
    expect(estimateMass(1_000_000, 1, "medium", 140).filledGrams).toBeCloseTo(1000, 3);
    expect(estimateMass(1_000_000, 1, "medium", -5).filledGrams).toBe(0);
  });

  test("die Spanne haengt NUR am Fuellgrad, nicht an der Form", () => {
    // Der Beleg fuer den Kommentar an spreadFactor: Bis 2026-08-03 stand dieser
    // Wert in der Bedingung fuer die Filigranwarnung. Da er bei 20 % Fuellung
    // IMMER 5 ergibt, erschien die Warnung unter jedem Bauteil.
    const duenn = estimateMass(20_000, 1.24, "medium", 20);
    const massig = estimateMass(1_000_000, 1.24, "medium", 20);
    expect(spreadFactor(duenn)).toBeCloseTo(5, 6);
    expect(spreadFactor(massig)).toBeCloseTo(5, 6);
    expect(spreadFactor(duenn)).toBeCloseTo(spreadFactor(massig), 6);
  });
});
