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
 * Der Materialberater rechnet mit oeffentlichen Datenblattwerten. Dieses Werkzeug
 * bekommt Konstruktionsdaten von Kunden in die Hand — Prototypen, Bauteile unter
 * Geheimhaltung. Die Zusage "die Datei verlaesst Ihren Rechner nicht" darf keine
 * Behauptung sein, die man glauben muss.
 *
 *   connect-src 'none'   Der Browser LAESST keine Netzwerkanfrage aus dieser Seite
 *                        heraus zu — kein fetch, kein XHR, kein WebSocket, kein
 *                        sendBeacon. Nicht "wir tun es nicht", sondern "es geht
 *                        nicht". Genau das ist der Unterschied, den ein Kunde mit
 *                        offenem Netzwerk-Reiter in zehn Sekunden selbst nachprueft.
 *                        Folge fuer die Entwicklung: In diesem Projekt darf nie ein
 *                        fetch() entstehen. Es wuerde erst im Build auffallen.
 *   worker-src 'self'    Der STL-Parser laeuft in einem Web Worker, damit grosse
 *                        Dateien die Oberflaeche nicht einfrieren. Vite legt ihn als
 *                        eigene Datei neben das Buendel — gleiche Herkunft, kein blob:.
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
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'none'",
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
