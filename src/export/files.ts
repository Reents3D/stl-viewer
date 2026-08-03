/**
 * Herunterladen und Bildmarke rastern.
 *
 * Alles laeuft ueber Blob-Adressen und einen Anker, den niemand zu sehen bekommt.
 * Ein Formular oder ein Serveraufruf kaeme hier ohnehin nicht durch — die
 * Richtlinie verbietet beides (form-action 'none', connect-src 'none').
 */

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Erst freigeben, wenn der Browser den Download begonnen hat. Sofortiges
  // revokeObjectURL laesst in Firefox gelegentlich eine leere Datei zurueck.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function downloadDataUrl(dataUrl: string, fileName: string): void {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function downloadJson(value: unknown, fileName: string): void {
  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  downloadBlob(blob, fileName);
}

/**
 * SVG-Bildmarke in ein PNG umwandeln.
 *
 * jsPDF kann kein SVG einbetten. Der Umweg ueber ein <img> und eine
 * Zeichenflaeche funktioniert, weil die Datei von derselben Herkunft kommt —
 * ein fremdes SVG wuerde die Zeichenflaeche "vergiften" und toDataURL sperren.
 * Genau deshalb liegt die Bildmarke im Projekt und wird nicht von der
 * Unternehmenswebsite geholt.
 */
export async function rasterizeSvg(url: string, width: number, height: number): Promise<string | null> {
  try {
    const image = await loadImage(url);
    const canvas = document.createElement("canvas");
    // Dreifach fuer den Druck: Eine Wortmarke mit 42 mm Breite braucht bei
    // 300 dpi rund 500 Bildpunkte.
    const factor = 3;
    canvas.width = Math.round(width * factor);
    canvas.height = Math.round(height * factor);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } catch {
    // Ein fehlendes Logo darf den Export nicht verhindern — das Dokument ist
    // auch ohne Wortmarke vollstaendig.
    return null;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Bild ${src} liess sich nicht laden.`));
    image.src = src;
  });
}

/** Datei ueber einen versteckten Dateidialog einlesen. */
export function pickFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.style.display = "none";
    document.body.appendChild(input);
    input.addEventListener("change", () => {
      const file = input.files?.[0] ?? null;
      input.remove();
      resolve(file);
    });
    // Bricht der Nutzer ab, feuert 'change' nie. Das Element bleibt dann liegen —
    // ein leeres input ohne Verweise, das die Speicherbereinigung mitnimmt.
    input.click();
  });
}
