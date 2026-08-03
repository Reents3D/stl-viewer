/**
 * Testmodelle, im Speicher erzeugt.
 *
 * Bewusst keine .stl-Dateien im Repo: Ein Wuerfel bekannter Kantenlaenge ist als
 * Code nachvollziehbar (jeder kann die erwarteten 1.000 mm³ nachrechnen), waehrend
 * eine Binaerdatei im Verzeichnis nur behauptet, ein Wuerfel zu sein.
 */

/** Ein Dreieck: neun Zahlen, drei Eckpunkte. */
export type Triangle = readonly number[];

/**
 * Achsparalleler Wuerfel von (0,0,0) bis (s,s,s), 12 Dreiecke.
 * Drehrichtung durchgaengig gegen den Uhrzeigersinn von aussen gesehen —
 * das Volumen kommt damit positiv heraus.
 */
export function cube(s = 10): Triangle[] {
  const v: Record<number, readonly [number, number, number]> = {
    0: [0, 0, 0],
    1: [s, 0, 0],
    2: [s, s, 0],
    3: [0, s, 0],
    4: [0, 0, s],
    5: [s, 0, s],
    6: [s, s, s],
    7: [0, s, s],
  };
  const faces: ReadonlyArray<readonly [number, number, number]> = [
    [0, 2, 1], [0, 3, 2], // unten  (-z)
    [4, 5, 6], [4, 6, 7], // oben   (+z)
    [0, 1, 5], [0, 5, 4], // vorn   (-y)
    [3, 7, 6], [3, 6, 2], // hinten (+y)
    [0, 4, 7], [0, 7, 3], // links  (-x)
    [1, 2, 6], [1, 6, 5], // rechts (+x)
  ];
  return faces.map((f) => [...v[f[0]], ...v[f[1]], ...v[f[2]]]);
}

/** Wuerfel mit einer fehlenden Deckflaeche — zwei Dreiecke weniger, also ein Loch. */
export function openCube(s = 10): Triangle[] {
  const all = cube(s);
  return [...all.slice(0, 2), ...all.slice(4)];
}

/** Wuerfel, bei dem ein Dreieck verkehrt herum gewickelt ist. */
export function flippedCube(s = 10): Triangle[] {
  const all = cube(s).map((t) => [...t]);
  const t = all[0];
  // Zwei Eckpunkte tauschen kehrt die Drehrichtung um.
  const swapped = [t[0], t[1], t[2], t[6], t[7], t[8], t[3], t[4], t[5]];
  all[0] = swapped;
  return all;
}

export function buildBinaryStl(triangles: readonly Triangle[], header = "Reents3D Testwuerfel"): ArrayBuffer {
  const buffer = new ArrayBuffer(84 + triangles.length * 50);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  for (let i = 0; i < Math.min(header.length, 79); i++) {
    bytes[i] = header.charCodeAt(i) & 0xff;
  }
  view.setUint32(80, triangles.length, true);

  triangles.forEach((t, i) => {
    let o = 84 + i * 50;
    // Normale bewusst auf null — der Parser muss ohne sie auskommen.
    view.setFloat32(o, 0, true);
    view.setFloat32(o + 4, 0, true);
    view.setFloat32(o + 8, 0, true);
    o += 12;
    for (let k = 0; k < 9; k++, o += 4) view.setFloat32(o, t[k], true);
    view.setUint16(o, 0, true);
  });

  return buffer;
}

export function buildAsciiStl(triangles: readonly Triangle[], name = "wuerfel"): string {
  const lines: string[] = [`solid ${name}`];
  for (const t of triangles) {
    lines.push("  facet normal 0 0 0", "    outer loop");
    for (let k = 0; k < 9; k += 3) {
      lines.push(`      vertex ${t[k]} ${t[k + 1]} ${t[k + 2]}`);
    }
    lines.push("    endloop", "  endfacet");
  }
  lines.push(`endsolid ${name}`);
  return lines.join("\n");
}

export function asciiToBuffer(text: string): ArrayBuffer {
  const bytes = new TextEncoder().encode(text);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
