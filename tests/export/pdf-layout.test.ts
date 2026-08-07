import { describe, expect, test } from "vitest";

import { LOGO_ASPECT } from "../../src/config/site";
import {
  columnsFor,
  countShots,
  imageGrid,
  logoBox,
  placeImages,
  LOGO_BLOCK_HEIGHT,
} from "../../src/export/pdf-layout";

const A4_CONTENT = { areaWidth: 180, areaHeight: 215, aspect: 4 / 3, gap: 4, captionHeight: 5 };

describe("Spaltenwahl", () => {
  test("bleibt bei wenigen Bildern zweispaltig", () => {
    expect(columnsFor(2)).toBe(2);
    expect(columnsFor(4)).toBe(2);
  });

  test("nutzt drei Spalten fuer die uebliche Zehnerstrecke", () => {
    expect(columnsFor(10)).toBe(3);
  });

  test("weitet sich bei grossen Mengen", () => {
    expect(columnsFor(20)).toBe(4);
    expect(columnsFor(36)).toBe(5);
  });
});

describe("Raster", () => {
  test("bringt zehn Bilder auf eine Seite", () => {
    // Der Regelfall aus der Oberflaeche: 10 Aufnahmen je Achse sollen genau eine
    // Seite je Achse ergeben. Sonst wird aus einem 3-Seiten-Anhang ein 6-seitiger.
    const grid = imageGrid({ ...A4_CONTENT, count: 10 });
    expect(grid.columns).toBe(3);
    expect(grid.pages).toBe(1);
    expect(grid.perPage).toBeGreaterThanOrEqual(10);
  });

  test("bricht um, wenn die Seite voll ist", () => {
    const grid = imageGrid({ ...A4_CONTENT, count: 40 });
    expect(grid.pages).toBeGreaterThan(1);
  });

  test("liefert immer mindestens eine Reihe und eine Seite", () => {
    // Ein absurd flacher Bereich darf nicht null Reihen ergeben — daraus wuerde
    // eine Division durch null und ein PDF ganz ohne Bilder.
    const grid = imageGrid({ ...A4_CONTENT, areaHeight: 2, count: 6 });
    expect(grid.rowsPerPage).toBe(1);
    expect(grid.pages).toBe(6 / grid.columns);
  });
});

describe("Bildplatzierung", () => {
  test("vergibt fuer JEDES Bild genau eine Position", () => {
    // Das ist der Test, der das eigentliche Risiko abdeckt: ein Bild, das im
    // Umbruch verlorengeht, faellt im fertigen PDF niemandem auf.
    const places = placeImages({ ...A4_CONTENT, count: 23 }, 15, 40);
    expect(places).toHaveLength(23);
    expect(new Set(places.map((p) => p.index)).size).toBe(23);
  });

  test("setzt die erste Position auf den Ursprung", () => {
    const [first] = placeImages({ ...A4_CONTENT, count: 9 }, 15, 40);
    expect(first.x).toBe(15);
    expect(first.y).toBe(40);
    expect(first.page).toBe(0);
  });

  test("beginnt auf jeder neuen Seite wieder oben links", () => {
    const grid = imageGrid({ ...A4_CONTENT, count: 40 });
    const places = placeImages({ ...A4_CONTENT, count: 40 }, 15, 40);
    const firstOfSecondPage = places[grid.perPage];
    expect(firstOfSecondPage.page).toBe(1);
    expect(firstOfSecondPage.x).toBe(15);
    expect(firstOfSecondPage.y).toBe(40);
  });

  test("laesst zwischen den Spalten den vorgesehenen Abstand", () => {
    const places = placeImages({ ...A4_CONTENT, count: 6 }, 0, 0);
    expect(places[1].x - (places[0].x + places[0].width)).toBeCloseTo(A4_CONTENT.gap, 6);
  });
});

describe("Aufnahmezahl", () => {
  test("rechnet die uebliche Voreinstellung zusammen", () => {
    expect(countShots({ axes: 3, perAxis: 10, standardViews: true, annotations: 0 })).toBe(36);
  });

  test("zaehlt Anmerkungsbilder mit", () => {
    expect(countShots({ axes: 3, perAxis: 20, standardViews: true, annotations: 12 })).toBe(78);
  });

  test("kommt ohne jede Bilderstrecke aus", () => {
    expect(countShots({ axes: 0, perAxis: 10, standardViews: false, annotations: 0 })).toBe(0);
  });
});

describe("Wortmarke auf dem Deckblatt", () => {
  test("haelt das Seitenverhaeltnis der Logo-Datei ein", () => {
    // Der Fehler, den dieser Test verhindert: 42 x 7,56 mm standen jahrelang
    // fest verdrahtet im Deckblatt und stammten aus einer laengst
    // ausgetauschten Logo-Datei. Die Marke war damit auf 44 % ihrer Hoehe
    // gestaucht — auf jedem Dokument, das zum Kunden ging.
    const box = logoBox(7.5);
    expect(box.width / box.height).toBeCloseTo(LOGO_ASPECT, 6);
  });

  test("stauchtes Verhaeltnis von frueher wird nicht mehr erzeugt", () => {
    const box = logoBox(7.5);
    expect(box.width / box.height).not.toBeCloseTo(42 / 7.56, 1);
  });

  test("laesst Luft zur Zeile darunter", () => {
    // Dort steht "MODELLDOKUMENTATION". Beim Berichtigen des
    // Seitenverhaeltnisses wuchs die Marke von 7,56 auf 12,2 mm und klebte an
    // dieser Zeile, weil der Block bei 16 mm stehengeblieben war.
    const box = logoBox(7.5);
    expect(LOGO_BLOCK_HEIGHT - box.height).toBeGreaterThanOrEqual(5);
  });

  test("Grundlinie des Nebentextes liegt auf der Mitte der Marke", () => {
    const box = logoBox(7.5);
    expect(box.textBaseline).toBeGreaterThan(box.height / 2);
    expect(box.textBaseline).toBeLessThan(box.height);
  });

  test("skaliert die Hoehe mit der Breite", () => {
    const schmal = logoBox(7.5, 20);
    const breit = logoBox(7.5, 40);
    expect(breit.height).toBeCloseTo(schmal.height * 2, 6);
  });
});
