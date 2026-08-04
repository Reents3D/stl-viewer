/**
 * Der Formatname im Dokument, das zum Kunden geht.
 *
 * Diese Datei existiert wegen eines ausgelieferten Fehlers: Die Seitenleiste
 * kannte alle vier Faelle, das PDF nur zwei — dort stand unter jedem STEP- und
 * IGES-Modell "ASCII-STL". Ein Dokument, das dem Kunden ein anderes
 * Ausgangsformat unterschiebt als das, was er geschickt hat, ist kein
 * Schoenheitsfehler. Seit der Behebung lesen beide Stellen denselben Aufruf;
 * die Tests hier halten fest, was er liefern muss.
 */

import { describe, expect, it } from "vitest";

import { formatLabel, isTessellated } from "../../src/lib/format";
import type { StlFormat } from "../../src/stl/types";

const ALLE: StlFormat[] = ["binary", "ascii", "step", "iges"];

describe("formatLabel", () => {
  it("nennt STEP beim Namen und nicht ASCII-STL", () => {
    expect(formatLabel("step")).toBe("STEP");
  });

  it("nennt IGES beim Namen und nicht ASCII-STL", () => {
    expect(formatLabel("iges")).toBe("IGES");
  });

  it("unterscheidet die beiden STL-Formen", () => {
    expect(formatLabel("binary")).toBe("Binär-STL");
    expect(formatLabel("ascii")).toBe("ASCII-STL");
  });

  it("gibt fuer jedes Format einen eigenen Namen aus", () => {
    const namen = ALLE.map(formatLabel);
    expect(new Set(namen).size).toBe(ALLE.length);
  });

  it("nennt kein CAD-Format 'STL' — auch nicht als Wortbestandteil", () => {
    // Der ausgelieferte Fehler war genau das: "ASCII-STL" unter einem STEP.
    expect(formatLabel("step")).not.toMatch(/STL/);
    expect(formatLabel("iges")).not.toMatch(/STL/);
  });
});

describe("isTessellated", () => {
  it("verlangt den Vorbehalt fuer STEP und IGES", () => {
    // Beide beschreiben Flaechen exakt; angezeigt und gerechnet wird ein
    // Dreiecksnetz. Ohne diesen Hinweis liest der Kunde Volumen und Oberflaeche
    // als exakte Werte — sie liegen aber systematisch darunter.
    expect(isTessellated("step")).toBe(true);
    expect(isTessellated("iges")).toBe(true);
  });

  it("verlangt ihn nicht fuer STL — dort sind die Dreiecke die Datei", () => {
    expect(isTessellated("binary")).toBe(false);
    expect(isTessellated("ascii")).toBe(false);
  });
});
