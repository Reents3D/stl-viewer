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
    live: "https://reents3d.github.io/stl-viewer/",
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
   * Reale Bauraeume der Anlagen (mm). Dieselben Werte wie im Materialberater —
   * sie entscheiden hier darueber, ob ein Modell als "passt" oder "zu gross"
   * ausgewiesen wird. Eine falsche Zahl an dieser Stelle erzeugt eine falsche
   * Zusage gegenueber dem Kunden, deshalb liegen sie hier und nicht im Viewer.
   */
  buildVolumes: [
    { id: "xxl", name: "XXL", x: 1800, y: 2400, z: 1800 },
    { id: "hoch", name: "XXL Hoch", x: 1200, y: 1200, z: 2000 },
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

  utm: "utm_source=github&utm_medium=tool&utm_campaign=stl-viewer",
} as const;

export type BuildVolume = (typeof SITE.buildVolumes)[number];

/** UTM anhaengen, damit die kommerzielle Wirkung des Werkzeugs messbar bleibt. */
export function trackedUrl(url: string): string {
  // Ohne Pfad haengt die Query sonst direkt an der Domain: "reents3d.de?utm=..."
  const withPath = /^https?:\/\/[^/?#]+$/.test(url) ? `${url}/` : url;
  const sep = withPath.includes("?") ? "&" : "?";
  return `${withPath}${sep}${SITE.utm}`;
}
