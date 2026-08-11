/**
 * Alle Marken-, Kontakt- und Adresskonstanten an einer Stelle.
 *
 * Gleiche Regel wie im Materialberater: Der Umzug auf eine eigene Domain muss EIN
 * Commit in EINER Datei sein. Deshalb steht unten nichts, was anderswo noch einmal
 * ausgeschrieben werden darf.
 */

export const SITE = {
  brand: "Reents3D",
  legalEntity: "Reents Technologies GmbH",
  toolName: { de: "STL-Betrachter", en: "STL Viewer" },
  claim: { de: "XXL 3D PRINTING FOR BIG IDEAS", en: "XXL 3D PRINTING FOR BIG IDEAS" },

  urls: {
    primary: "https://reents3d.de",
    contact: "https://reents3d.de/kontakt/",
    services: "https://reents3d.de/leistungen/",
    fdm: "https://reents3d.de/leistungen/3d-druck-service/fdm-3d-druck-service/",
    xxl: "https://reents3d.de/leistungen/xxl-3d-druck/",
    cad: "https://reents3d.de/leistungen/cad-konstruktion/",
    imprint: "https://reents3d.de/impressum/",
    privacy: "https://reents3d.de/datenschutz/",
    repo: "https://github.com/Reents3D/stl-viewer",
    live: "https://viewer.reents3d.de/",
    advisor: "https://reents3d.github.io/fdm-material-advisor/",
  },

  contact: {
    company: "Reents Technologies GmbH",
    street: "Lehmweg 95-97",
    zip: "25488",
    city: "Holm",
    country: "DE",
    phone: "+49 4103 928272-0",
    email: "info@reents3d.de",
  },

  /**
   * Reale Bauraeume der Anlagen (mm).
   *
   * Sie entscheiden darueber, ob ein Modell dem Kunden als "passt" oder "zu
   * gross" ausgewiesen wird. Eine falsche Zahl hier erzeugt eine falsche Zusage,
   * deshalb liegen sie an einer Stelle und nicht verstreut im Viewer.
   *
   * ZU DEN 2.200 mm BEI "XXL HOCH" — BITTE NICHT AUF 2.000 "BERICHTIGEN".
   * Der Hersteller gibt 2.000 mm an. In der Praxis faehrt Reents3D dort 2.200 mm.
   * Der hoehere Wert steht hier bewusst und auf ausdrueckliche Angabe der
   * Fertigung (Riko, 2026-08-04). Wer spaeter das Datenblatt danebenlegt, wird
   * eine Abweichung finden und sie fuer einen Fehler halten — sie ist keiner.
   *
   * Wer die Zahl dennoch aendern will, aendert damit eine Zusage an Kunden:
   * Ein Bauteil zwischen 2.000 und 2.200 mm Hoehe wechselt dadurch von "passt"
   * auf "zu gross" oder umgekehrt. Das ist eine Entscheidung der Fertigung,
   * keine der Entwicklung.
   */
  buildVolumes: [
    { id: "xxl", name: "XXL", x: 1800, y: 2400, z: 1800 },
    { id: "hoch", name: "XXL Hoch", x: 1200, y: 1200, z: 2200 },
    { id: "gross", name: "Großformat", x: 800, y: 800, z: 1000 },
    { id: "fdm", name: "FDM-Standard", x: 350, y: 350, z: 400 },
  ],

  facts: {
    machines: "über 50 Maschinen & Anlagen",
    maxPart: "Bauraum bis 1.800 × 2.400 × 1.800 mm",
    finishing: "Veredelung inhouse",
    location: "Holm bei Hamburg",
    confidentiality: "NDA-fähig, Daten auf lokalem Server",
  },

  /**
   * Herkunftskennung an jedem Verweis auf reents3d.de.
   *
   * Sie ist ueber die Umgebung austauschbar, weil dasselbe Werkzeug aus zwei
   * Quellen kommt: als Seite unter viewer.reents3d.de und als Erweiterung aus
   * dem Chrome Web Store. Ohne diese Trennung landen beide Wege in einem Topf,
   * und die Frage "bringt der Store-Eintrag ueberhaupt Besucher" waere nicht zu
   * beantworten — genau die Frage, wegen der es die Erweiterung gibt.
   *
   * Gesetzt wird sie in vite.config.ts je Bauziel; hier steht der Wert fuer den
   * gewoehnlichen Webbau.
   */
  utm: import.meta.env.VITE_UTM ?? "utm_source=github&utm_medium=tool&utm_campaign=stl-viewer",
} as const;

export type BuildVolume = (typeof SITE.buildVolumes)[number];

/**
 * Seitenverhaeltnis der Wortmarke — Breite geteilt durch Hoehe.
 *
 * Stammt aus dem viewBox der drei Dateien in `public/brand/`
 * (`reents-logo-horizontal-*.svg`, alle 695,85 x 283,41).
 *
 * WARUM DAS HIER STEHT UND NICHT ZWEIMAL IM QUELLTEXT.
 * Genau daran ist ein Fehler ausgeliefert worden: Das PDF setzte die Marke mit
 * 42 x 7,56 mm — ein Verhaeltnis von 5,6 zu 1, das aus einer FRUEHEREN
 * Logo-Datei stammte (der Kommentar sprach von "200 zu 36"). Die Datei wurde
 * spaeter ausgetauscht, die Masse blieben stehen. Auf jedem Deckblatt, das zum
 * Kunden ging, war die Wortmarke seither auf 44 % ihrer Hoehe gestaucht und
 * "TECHNOLOGIES" zusammengedrueckt.
 *
 * Wer die Logo-Dateien austauscht, aendert diesen Wert mit — und nur ihn.
 * `logoBox()` in `export/pdf-layout.ts` und die Bildmarke im Bildexport lesen
 * beide von hier.
 */
export const LOGO_ASPECT = 695.85 / 283.41;

/** UTM anhaengen, damit die kommerzielle Wirkung des Werkzeugs messbar bleibt. */
export function trackedUrl(url: string): string {
  // Ohne Pfad haengt die Query sonst direkt an der Domain: "reents3d.de?utm=..."
  const withPath = /^https?:\/\/[^/?#]+$/.test(url) ? `${url}/` : url;
  const sep = withPath.includes("?") ? "&" : "?";
  return `${withPath}${sep}${SITE.utm}`;
}
