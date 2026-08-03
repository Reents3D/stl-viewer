import { defineConfig } from "vitest/config";

/**
 * Getrennt von vite.config.ts — wie im Materialberater. Vitest bringt seine eigene
 * Vite-Kopie mit; eine gemeinsame Datei laesst die beiden Plugin-Typwelten kollidieren.
 *
 * Getestet wird, was rechnet: Parser und Geometrie. Der Viewer selbst braucht einen
 * WebGL-Kontext und gehoert damit in die Handpruefung, nicht in die Testsuite —
 * ein gemockter WebGL-Kontext beweist ueber ein gerendertes Bild nichts.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      include: ["src/stl/**", "src/export/pdf-layout.ts", "src/lib/**"],
      thresholds: { lines: 80, functions: 80 },
    },
  },
});
