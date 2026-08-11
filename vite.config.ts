import { cpSync, rmSync } from "node:fs";
import { resolve } from "node:path";

import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * Zwei Bauziele aus einer Quelle.
 *
 *   npm run build      Webseite fuer viewer.reents3d.de   -> dist/
 *   npm run build:ext  Chrome-Erweiterung fuer den Store  -> dist-extension/
 *
 * WARUM DIE ERWEITERUNG KEIN ZWEITES PROJEKT IST
 * Sie ist dieselbe Anwendung. Ein eigenes Repository oder auch nur eine zweite
 * Konfigurationsdatei haette zur Folge, dass die Inhaltssicherheitsrichtlinie
 * an zwei Stellen steht — und die Zusage "die Datei verlaesst Ihren Rechner
 * nicht" haengt an genau dieser Richtlinie. Zwei Fassungen davon laufen
 * auseinander, ohne dass es jemandem auffaellt, denn die Anwendung
 * funktioniert danach genauso gut. Deshalb: ein Bau, ein Regelwerk, ein
 * Schalter.
 */
const isExtension = process.env.VITE_TARGET === "extension";

/**
 * Inhaltssicherheitsrichtlinie — NUR im Build, nicht im Entwicklungsserver.
 *
 * WARUM SIE NICHT IN index.html STEHT
 * Wie im Materialberater: Vite spielt im Entwicklungsbetrieb ein Inline-Modul fuer
 * React Refresh ein, und `script-src 'self'` erlaubt kein Inline-Skript — die Seite
 * bliebe unter `npm run dev` leer. Der Build liefert externe Moduldateien aus; dort
 * greift dieselbe Richtlinie ohne Nebenwirkung.
 *
 * WARUM SIE HIER MEHR IST ALS VORSORGE
 * Dieses Werkzeug bekommt Konstruktionsdaten von Kunden in die Hand — Prototypen,
 * Bauteile unter Geheimhaltung. Die Zusage "die Datei verlaesst Ihren Rechner
 * nicht" darf keine Behauptung sein, die man glauben muss.
 *
 *   connect-src 'self'   Der Browser laesst aus dieser Seite heraus nur Anfragen
 *                        an die EIGENE Herkunft zu. Nach draussen geht nichts —
 *                        kein fremder Server, kein Zaehlpixel, kein Abtransport
 *                        einer geoeffneten Datei. Die eigene Herkunft ist ein
 *                        statischer Dateiserver; er liefert aus und nimmt nichts
 *                        entgegen.
 *
 *                        Bis 2026-08-04 stand hier 'none' — der Browser liess
 *                        ueberhaupt keine Anfrage zu. Das war die staerkere
 *                        Zusage und ist mit dem STEP-Import gefallen: Die
 *                        7,4-MB-WebAssembly von OpenCascade wird per fetch
 *                        geholt, und fetch faellt unter diese Richtung. Die
 *                        Abwaegung steht in ADR-013.
 *
 *                        Was gleich bleibt: Beim Oeffnen einer STL passiert im
 *                        Netzwerk-Reiter nach wie vor nichts. Erst eine
 *                        STEP-Datei loest genau eine Anfrage aus, an die eigene
 *                        Herkunft, fuer eine statische Datei.
 *   script-src           braucht 'wasm-unsafe-eval': Ohne diese Angabe lehnt der
 *                        Browser das Uebersetzen von WebAssembly ab
 *                        ("Compiling or instantiating WebAssembly module
 *                        violates CSP"). Die Freigabe ist eng — sie erlaubt
 *                        WebAssembly, aber weiterhin kein eval() und kein
 *                        Inline-Skript.
 *   worker-src 'self'    Beide Parser laufen in Web Workern, damit grosse Dateien
 *                        die Oberflaeche nicht einfrieren. Vite legt sie als
 *                        eigene Dateien neben das Buendel — gleiche Herkunft,
 *                        kein blob:.
 *   img-src ... blob:    Die Aufnahmen fuer das PDF entstehen als Blob aus dem
 *                        Zeichenbereich; ohne blob: bleibt die Vorschau leer.
 *   style-src            braucht 'unsafe-inline': React setzt Stilattribute direkt am
 *                        Element (Fortschrittsbalken, Markerpositionen).
 *   frame-ancestors      fehlt bewusst: wirkt laut Spezifikation NUR als echte
 *                        Kopfzeile und ist im Meta-Tag wirkungslos. GitHub Pages
 *                        laesst keine eigenen Kopfzeilen zu.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join("; ");

function securityHeaders(): Plugin {
  return {
    name: "reents-security-headers",
    apply: "build",
    transformIndexHtml(html) {
      return html.replace(
        "<head>",
        `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />\n` +
          `    <meta name="referrer" content="no-referrer" />`,
      );
    },
  };
}

/**
 * Macht aus dem gebauten Artefakt ein ladbares Erweiterungspaket.
 *
 * WAS RAUS MUSS UND WARUM
 *   CNAME                  weist GitHub Pages die eigene Domain zu. In einem
 *                          Erweiterungspaket ist die Datei sinnlos, und was
 *                          sinnlos im Paket liegt, faellt bei der Pruefung als
 *                          Frage auf.
 *   manifest.webmanifest   ist das Manifest einer WEBSEITE. Neben dem
 *                          manifest.json der Erweiterung stehen dann zwei
 *                          Dateien mit demselben Zweck und verschiedenem
 *                          Inhalt nebeneinander. Der Verweis darauf faellt
 *                          weiter unten aus dem HTML.
 *
 * WAS DAZUKOMMT
 *   manifest.json, background.js, _locales/, icons/ aus `extension/`.
 *   Die liegen im Git und werden nicht erzeugt — Symbole sind Rasterbilder
 *   (siehe scripts/icons/render.html), und ein Manifest, das bei jedem Bau neu
 *   entsteht, kann man nicht in einem Diff lesen.
 */
function extensionPackage(): Plugin {
  return {
    name: "reents-extension-package",
    apply: "build",
    enforce: "post",

    transformIndexHtml(html) {
      if (!isExtension) return html;
      return (
        html
          // Der Verweis zeigt sonst auf eine Datei, die gleich geloescht wird.
          .replace(/\s*<link rel="manifest"[^>]*>/, "")
          // Der Webtitel ist fuer die Google-Suche geschrieben und entsprechend
          // lang. In einem Reiter, der neben anderen steht, zaehlt nur, was vor
          // dem Abschneiden lesbar bleibt.
          .replace(/<title>[^<]*<\/title>/, "<title>STL-, STEP- und IGES-Betrachter</title>")
      );
    },

    /**
     * closeBundle und nicht writeBundle: Vite kopiert `public/` ausserhalb des
     * Rollup-Bundles. Wer in writeBundle aufraeumt, loescht CNAME, bevor es
     * geschrieben wird — und findet es hinterher wieder im Paket.
     */
    closeBundle() {
      if (!isExtension) return;
      const out = resolve(import.meta.dirname, "dist-extension");

      for (const datei of ["CNAME", "manifest.webmanifest"]) {
        rmSync(resolve(out, datei), { force: true });
      }

      for (const eintrag of ["manifest.json", "background.js", "_locales", "icons"]) {
        cpSync(resolve(import.meta.dirname, "extension", eintrag), resolve(out, eintrag), {
          recursive: true,
        });
      }
    },
  };
}

// Basispfad. Seit dem Umzug auf viewer.reents3d.de liegt die Anwendung in der
// Wurzel — deshalb "/" als Vorgabe.
//
// VITE_BASE bleibt als Notausgang: Wer das Repository forkt und ohne eigene
// Domain auf GitHub Pages veroeffentlicht, liegt wieder unter einem Unterpfad
// (/stl-viewer/) und setzt ihn darueber. Steht die Basis falsch, laedt die Seite
// weiss — die Dateiverweise zeigen dann ins Leere.
//
// Die Erweiterung bleibt bei "/": Eine Seite unter chrome-extension://<kennung>/
// hat die Paketwurzel als Herkunftswurzel, absolute Verweise treffen also genau.
// Das gilt auch fuer die Arbeiter, die Vite ueber `new URL(..., import.meta.url)`
// aufloest — bei einer relativen Basis zeigten die aus dem Arbeiter heraus
// woandershin als aus der Seite.
export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  plugins: [react(), tailwindcss(), securityHeaders(), extensionPackage()],
  worker: { format: "es" },
  define: {
    // Herkunftskennung je Bauziel, siehe SITE.utm in src/config/site.ts.
    "import.meta.env.VITE_UTM": JSON.stringify(
      isExtension
        ? "utm_source=chrome-web-store&utm_medium=extension&utm_campaign=stl-viewer"
        : "utm_source=github&utm_medium=tool&utm_campaign=stl-viewer",
    ),
  },
  build: {
    outDir: isExtension ? "dist-extension" : "dist",
    sourcemap: false,
    target: "es2022",
    // three.js ist der mit Abstand groesste Brocken. Als eigener Chunk bleibt er
    // ueber Aenderungen an der Oberflaeche hinweg im Cache des Besuchers.
    rollupOptions: {
      output: {
        manualChunks: { three: ["three"], jspdf: ["jspdf"] },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
});
