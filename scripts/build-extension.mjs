#!/usr/bin/env node
/**
 * Baut die Chrome-Erweiterung nach dist-extension/.
 *
 * WARUM NICHT EINFACH `VITE_TARGET=extension vite build` IM SKRIPT
 * Diese Schreibweise setzt eine POSIX-Shell voraus. npm ruft Skripte unter
 * Windows ueber cmd.exe auf, und dort ist `VITE_TARGET=extension vite build`
 * kein Befehl mit gesetzter Umgebung, sondern ein Fehler. Die uebliche Abhilfe
 * waere cross-env — eine Abhaengigkeit fuer eine Zuweisung. Vite bringt eine
 * JavaScript-Schnittstelle mit, also geht es ohne.
 */

process.env.VITE_TARGET = "extension";

const { build } = await import("vite");
await build();
