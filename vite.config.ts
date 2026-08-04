import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

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

// Basispfad ueber die Umgebung, damit derselbe Build auf GitHub Pages
// (/stl-viewer/) und spaeter unter einer eigenen Domain (/) funktioniert.
export default defineConfig({
  base: process.env.VITE_BASE ?? "/stl-viewer/",
  plugins: [react(), tailwindcss(), securityHeaders()],
  worker: { format: "es" },
  build: {
    outDir: "dist",
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
