import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { checkExtension } from "../../scripts/lib/extension-check.ts";

const SOURCE = fileURLToPath(new URL("../../extension/", import.meta.url));
const temps: string[] = [];

/** Kopie des Quellordners, an der ein Test etwas kaputtmachen darf. */
function copyOfSource(): string {
  const dir = mkdtempSync(join(tmpdir(), "ext-check-"));
  temps.push(dir);
  cpSync(SOURCE, dir, { recursive: true });
  return dir;
}

function editJson(file: string, edit: (json: Record<string, unknown>) => Record<string, unknown>): void {
  writeFileSync(file, JSON.stringify(edit(JSON.parse(readFileSync(file, "utf8")))));
}

afterEach(() => {
  for (const dir of temps.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("checkExtension", () => {
  it("findet am Quellordner extension/ nichts auszusetzen", () => {
    expect(checkExtension(SOURCE)).toEqual([]);
  });

  it("meldet ein beschaedigtes Icon mit Dateinamen", () => {
    const dir = copyOfSource();
    const icon = join(dir, "icons", "icon-48.png");
    const bytes = readFileSync(icon);
    bytes[bytes.indexOf("IDAT", 8, "latin1") + 14] ^= 0xff;
    writeFileSync(icon, bytes);
    expect(checkExtension(dir).join("\n")).toMatch(/icon-48\.png.*CRC/);
  });

  it("meldet ein Icon, dessen Groesse nicht zum Schluessel passt", () => {
    const dir = copyOfSource();
    cpSync(join(dir, "icons", "icon-32.png"), join(dir, "icons", "icon-48.png"));
    expect(checkExtension(dir).join("\n")).toMatch(/icon-48\.png.*32 x 32.*48/);
  });

  it("meldet eine fehlende Datei aus dem Manifest", () => {
    const dir = copyOfSource();
    rmSync(join(dir, "background.js"));
    expect(checkExtension(dir).join("\n")).toMatch(/background\.js fehlt/);
  });

  it("meldet einen Platzhalter, der in einer Sprache fehlt", () => {
    const dir = copyOfSource();
    editJson(join(dir, "_locales", "en", "messages.json"), ({ actionTitle: _, ...rest }) => rest);
    expect(checkExtension(dir).join("\n")).toMatch(/en.*actionTitle/);
  });

  it("meldet einen zu langen Namen", () => {
    const dir = copyOfSource();
    editJson(join(dir, "_locales", "de", "messages.json"), (json) => ({
      ...json,
      extName: { message: "X".repeat(46) },
    }));
    expect(checkExtension(dir).join("\n")).toMatch(/extName.*46.*45/);
  });

  it("meldet jede Berechtigung — die Erweiterung kommt ohne aus", () => {
    const dir = copyOfSource();
    editJson(join(dir, "manifest.json"), (json) => ({ ...json, permissions: ["tabs"] }));
    expect(checkExtension(dir).join("\n")).toMatch(/permissions/);
  });

  it("meldet eine Richtlinie, die eval zulaesst", () => {
    const dir = copyOfSource();
    editJson(join(dir, "manifest.json"), (json) => ({
      ...json,
      content_security_policy: { extension_pages: "script-src 'self' 'unsafe-eval'; object-src 'self'" },
    }));
    expect(checkExtension(dir).join("\n")).toMatch(/Richtlinie/);
  });

  it.each(["1.0.1-beta", "1.0.70000", "1.01.0"])(
    "meldet die Versionsnummer %s, die der Store nicht annimmt",
    (version) => {
      const dir = copyOfSource();
      editJson(join(dir, "manifest.json"), (json) => ({ ...json, version }));
      expect(checkExtension(dir).join("\n")).toMatch(/Version/);
    },
  );

  it("meldet Platzhalter ohne default_locale — Chrome laedt das nicht", () => {
    const dir = copyOfSource();
    editJson(join(dir, "manifest.json"), ({ default_locale: _, ...rest }) => rest);
    expect(checkExtension(dir).join("\n")).toMatch(/default_locale/);
  });
});
