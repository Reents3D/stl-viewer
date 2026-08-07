/**
 * Bildmarke im Aufnahmebild.
 *
 * Ein exportiertes Bild verlaesst das Werkzeug und wandert danach durch Mails,
 * Angebotsmappen und Chatverlaeufe. Ohne Marke ist nach dem zweiten
 * Weiterleiten nicht mehr erkennbar, woher es stammt — genau dann, wenn es
 * kommerziell etwas wert waere.
 *
 * Zwei Fassungen statt einer: Der Hintergrund des Betrachters ist wahlweise
 * hell, dunkel oder ein Verlauf, und unten rechts kann statt des Hintergrunds
 * auch das Bauteil stehen. Eine feste Farbe waere in einem der Faelle
 * unsichtbar. Deshalb wird die Helligkeit an der Stelle gemessen, an der die
 * Marke landet, und danach entschieden.
 */

/** Seitenverhaeltnis der Wortmarke, aus dem viewBox der SVG-Dateien. */
export const LOGO_ASPECT = 695.85 / 283.41;

/** Anteil der Bildbreite, den die Wortmarke einnimmt. */
const WIDTH_SHARE = 0.14;

/** Abstand zum Bildrand, ebenfalls als Anteil der Bildbreite. */
const MARGIN_SHARE = 0.025;

/**
 * Deckkraft der Marke.
 *
 * Kein blasses Schleier-Wasserzeichen: Die Marke soll gelesen werden koennen,
 * ohne dass sie das Bauteil ueberdeckt. Voll deckend wirkt sie wie ein
 * aufgeklebter Fremdkoerper, unter 0,7 verschwindet sie auf dem Verlauf.
 */
const OPACITY = 0.85;

/**
 * Ab dieser mittleren Helligkeit (0 bis 255) gilt der Untergrund als hell.
 *
 * Deutlich unter der Mitte, weil eine dunkle Wortmarke auf mittelgrauem Grund
 * schlechter steht als eine helle: Der Betrachterhintergrund "hell" liegt bei
 * 244, "dunkel" bei 16, das Bauteilgrau bei rund 184.
 */
const LIGHT_THRESHOLD = 120;

/** Jedes n-te Bildpunkt-Paar wird geprueft — die Marke ist gross, das reicht. */
const SAMPLE_STEP = 4;

export interface WatermarkLogos {
  /** Helle Fassung, fuer dunklen Untergrund. */
  light: CanvasImageSource;
  /** Dunkle Fassung, fuer hellen Untergrund. */
  dark: CanvasImageSource;
}

export interface WatermarkBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Wohin die Marke gehoert.
 *
 * Unten rechts und nicht mittig: Das Bauteil steht im Bild in der Mitte, weil
 * die Kamera darauf ausgerichtet ist. Eine mittige Marke laege darauf.
 */
export function watermarkBox(width: number, height: number): WatermarkBox {
  const logoWidth = width * WIDTH_SHARE;
  const logoHeight = logoWidth / LOGO_ASPECT;
  const margin = width * MARGIN_SHARE;
  return {
    x: width - margin - logoWidth,
    y: height - margin - logoHeight,
    width: logoWidth,
    height: logoHeight,
  };
}

/**
 * Mittlere Helligkeit eines Bildpunktfeldes (0 bis 255).
 *
 * Gewichtet nach Wahrnehmung, nicht als schlichter Mittelwert der drei Kanaele:
 * Gruen macht den groessten Teil des Helligkeitseindrucks aus. Ein saftiges
 * Blau und ein saftiges Gelb haetten sonst denselben Wert, obwohl das eine
 * dunkel und das andere hell wirkt.
 */
export function meanLuminance(data: Uint8ClampedArray): number {
  let sum = 0;
  let count = 0;
  const stride = 4 * SAMPLE_STEP;
  for (let i = 0; i < data.length; i += stride) {
    sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    count++;
  }
  return count > 0 ? sum / count : 0;
}

/**
 * Marke in eine bereits gefuellte Zeichenflaeche setzen.
 *
 * Erwartet, dass das Bauteilbild schon darin steht — die Helligkeitsmessung
 * liest genau diese Bildpunkte.
 */
export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  logos: WatermarkLogos,
  width: number,
  height: number,
): void {
  const box = watermarkBox(width, height);
  const logo = isLightBackdrop(ctx, box) ? logos.dark : logos.light;

  const previousAlpha = ctx.globalAlpha;
  ctx.globalAlpha = OPACITY;
  ctx.drawImage(logo, box.x, box.y, box.width, box.height);
  ctx.globalAlpha = previousAlpha;
}

/**
 * Steht die Marke auf hellem Grund?
 *
 * Bei durchsichtigem Hintergrund (PNG-Aufnahme) liefert getImageData Alpha 0
 * und damit Schwarz — dort waere die helle Fassung richtig, und genau die
 * kommt heraus.
 */
function isLightBackdrop(ctx: CanvasRenderingContext2D, box: WatermarkBox): boolean {
  try {
    const pixels = ctx.getImageData(
      Math.floor(box.x),
      Math.floor(box.y),
      Math.max(1, Math.floor(box.width)),
      Math.max(1, Math.floor(box.height)),
    );
    return meanLuminance(pixels.data) >= LIGHT_THRESHOLD;
  } catch {
    // getImageData sperrt bei einer "vergifteten" Zeichenflaeche. Das duerfte
    // hier nicht vorkommen — beide Quellen liegen im Projekt —, aber ein
    // fehlendes Wasserzeichen ist besser als ein abgebrochener Export.
    // Zwei der drei Hintergruende sind hell, also ist das die bessere Wette.
    return true;
  }
}

/**
 * Beide Fassungen der Wortmarke laden.
 *
 * Die Dateien liegen im Projekt und nicht auf der Unternehmenswebsite: Ein
 * fremdes Bild wuerde die Zeichenflaeche "vergiften" und toDataURL sperren —
 * der Bildexport waere damit tot. Ausserdem verbietet die Richtlinie ohnehin
 * jede fremde Herkunft.
 *
 * Gibt null zurueck, wenn etwas fehlt. Ein Bild ohne Marke ist immer noch ein
 * brauchbares Bild.
 */
export async function loadWatermarkLogos(baseUrl: string): Promise<WatermarkLogos | null> {
  try {
    const [light, dark] = await Promise.all([
      loadLogo(`${baseUrl}brand/reents-logo-horizontal-white.svg`),
      loadLogo(`${baseUrl}brand/reents-logo-horizontal-black.svg`),
    ]);
    return { light, dark };
  } catch {
    return null;
  }
}

/**
 * SVG als Bild laden.
 *
 * width und height werden gesetzt, obwohl drawImage die Zielgroesse ohnehin
 * bekommt: Die Markendateien haben nur ein viewBox und keine festen Masse.
 * Firefox rastert ein solches SVG sonst in seiner Vorgabegroesse von 300x150
 * und skaliert das Ergebnis hoch — die Marke waere sichtbar ausgefranst.
 */
function loadLogo(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.width = Math.round(695.85);
    image.height = Math.round(283.41);
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Bildmarke ${src} liess sich nicht laden.`));
    image.src = src;
  });
}
