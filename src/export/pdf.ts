/**
 * PDF-Dokumentation aus dem, was im Betrachter zu sehen ist.
 *
 * WARUM HELVETICA UND NICHT MONTSERRAT/SORA
 * Das Corporate Design steht auf zwei Schriften, die als variable woff2-Dateien im
 * Projekt liegen. jsPDF kann nur TTF einbetten — eine Umwandlung waere ein
 * zusaetzlicher Bauschritt, und eingebettet haetten die beiden Schnitte rund 300 KB
 * an JEDES erzeugte PDF gehaengt. Dagegen steht der Gewinn: eine andere Grotesk.
 * Helvetica ist eine der 14 Standardschriften, die jeder PDF-Betrachter mitbringt;
 * das Dokument bleibt klein, der Text bleibt durchsuchbar und kopierbar. Die Marke
 * traegt hier die Bildmarke, die Farbe und der Aufbau — nicht die Schriftmischung.
 *
 * WARUM JPEG FUER DIE AUFNAHMEN
 * Ein Rundumsatz mit 30 Bildern in PNG ergibt ein PDF jenseits von 40 MB, das per
 * E-Mail nicht mehr durchgeht. Dieselben Bilder als JPEG mit Qualitaet 0,92 liegen
 * bei rund 4 MB und sind auf Papier nicht unterscheidbar.
 */

import { jsPDF } from "jspdf";

import { MATERIALS, type MaterialDensity } from "../config/materials";
import { SITE, type BuildVolume } from "../config/site";
import type { Lang, T } from "../i18n";
import { compactness, estimateMass, FILIGREE_THRESHOLD } from "../lib/estimate";
import * as fmt from "../lib/format";
import type { LoadedModel } from "../stl/load";
import type { FitResult } from "../stl/geometry";
import { ANNOTATION_CATEGORIES, type Annotation, type Axis, type StandardView } from "../viewer/types";
import { placeImages } from "./pdf-layout";

/* ------------------------------------------------------------------- Farben */

const PETROL: [number, number, number] = [12, 66, 81];
const ACCENT: [number, number, number] = [136, 187, 215];
const INK: [number, number, number] = [11, 18, 32];
const MUTED: [number, number, number] = [75, 85, 99];
const HAIRLINE: [number, number, number] = [214, 219, 224];

/* ------------------------------------------------------------------- Massse */

const PAGE = { width: 210, height: 297 };
const MARGIN = { left: 15, right: 15, top: 14, bottom: 18 };
const CONTENT_WIDTH = PAGE.width - MARGIN.left - MARGIN.right;
/** Bildseitenverhaeltnis aller Aufnahmen — muss zur Aufnahmegroesse passen. */
export const SHOT_ASPECT = 4 / 3;

/** Zeilenhoehe in mm zu einer Schriftgroesse in Punkt. */
const lh = (pt: number, factor = 1.35): number => (pt * 25.4 * factor) / 72;

export interface PdfTurntable {
  axis: Axis;
  images: string[];
}

export interface PdfInput {
  lang: Lang;
  t: T;
  model: LoadedModel;
  /** Grosses Aufmacherbild auf dem Deckblatt. */
  heroImage: string | null;
  standardViews: ReadonlyArray<{ view: StandardView; image: string }> | null;
  turntables: ReadonlyArray<PdfTurntable>;
  annotations: ReadonlyArray<Annotation>;
  /** Anmerkungs-Id auf Bild aus dem gespeicherten Blickwinkel, mit eigener Marke. */
  annotationImages: ReadonlyMap<string, string>;
  /** Ein Bild mit ALLEN Marken — steht vor den Einzelseiten. */
  annotationOverview: string | null;
  material: MaterialDensity;
  infill: number;
  buildVolume: BuildVolume;
  fit: FitResult;
  /** Bildmarke als PNG-Daten-URI, oder null. */
  logo: string | null;
  now: Date;
}

export function buildPdf(input: PdfInput): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  const ctx = new Layout(doc, input);

  ctx.coverPage();
  ctx.statsPage();
  if (input.standardViews && input.standardViews.length > 0) ctx.standardViewsPage(input.standardViews);
  for (const turntable of input.turntables) ctx.turntablePages(turntable);
  if (input.annotations.length > 0) ctx.annotationPages();

  ctx.stampPageNumbers();
  return doc;
}

/** Dateiname des Exports — datiert und ohne Sonderzeichen. */
export function pdfFileName(model: LoadedModel, now: Date): string {
  return `${fmt.isoDate(now)}-${fmt.safeFileName(model.fileName)}-dokumentation.pdf`;
}

/* -------------------------------------------------------------------------- */

class Layout {
  private y = MARGIN.top;

  constructor(
    private readonly doc: jsPDF,
    private readonly input: PdfInput,
  ) {}

  private get t(): T {
    return this.input.t;
  }
  private get lang(): Lang {
    return this.input.lang;
  }

  /* ------------------------------------------------------------- Grundgeruest */

  private newPage(withHeader = true): void {
    this.doc.addPage();
    this.y = MARGIN.top;
    if (withHeader) this.pageHeader();
  }

  /** Schmale Petrol-Linie mit dem Modellnamen — auf jeder Folgeseite. */
  private pageHeader(): void {
    const d = this.doc;
    d.setDrawColor(...PETROL);
    d.setLineWidth(0.8);
    d.line(MARGIN.left, MARGIN.top, PAGE.width - MARGIN.right, MARGIN.top);

    d.setFont("helvetica", "bold");
    d.setFontSize(7.5);
    d.setTextColor(...PETROL);
    d.text(this.t("pdf.docTitle").toUpperCase(), MARGIN.left, MARGIN.top + 4);

    d.setFont("helvetica", "normal");
    d.setTextColor(...MUTED);
    d.text(this.modelTitle(), PAGE.width - MARGIN.right, MARGIN.top + 4, { align: "right" });

    this.y = MARGIN.top + 12;
  }

  private modelTitle(): string {
    const { model } = this.input;
    return model.solidName ?? model.fileName;
  }

  private sectionTitle(text: string): void {
    const d = this.doc;
    this.ensureSpace(14);
    d.setFont("helvetica", "bold");
    d.setFontSize(11);
    d.setTextColor(...PETROL);
    d.text(text, MARGIN.left, this.y);
    this.y += 2;
    d.setDrawColor(...HAIRLINE);
    d.setLineWidth(0.2);
    d.line(MARGIN.left, this.y, PAGE.width - MARGIN.right, this.y);
    this.y += 5;
  }

  /** Beschriftung links, Wert rechts, Haarlinie darunter. */
  private row(label: string, value: string, options: { strong?: boolean; note?: string } = {}): void {
    const d = this.doc;
    this.ensureSpace(options.note ? 11 : 7);

    d.setFontSize(9);
    d.setFont("helvetica", "normal");
    d.setTextColor(...MUTED);
    d.text(label, MARGIN.left, this.y);

    d.setFont("helvetica", options.strong ? "bold" : "normal");
    d.setTextColor(...INK);
    d.text(value, PAGE.width - MARGIN.right, this.y, { align: "right" });
    this.y += 2;

    if (options.note) {
      d.setFont("helvetica", "normal");
      d.setFontSize(7.5);
      d.setTextColor(...MUTED);
      const lines = d.splitTextToSize(options.note, CONTENT_WIDTH);
      d.text(lines, MARGIN.left, this.y + 1.5);
      this.y += lines.length * lh(7.5) + 1;
    }

    d.setDrawColor(...HAIRLINE);
    d.setLineWidth(0.15);
    d.line(MARGIN.left, this.y, PAGE.width - MARGIN.right, this.y);
    this.y += 4;
  }

  private paragraph(text: string, size = 8.5, color = MUTED): void {
    const d = this.doc;
    d.setFont("helvetica", "normal");
    d.setFontSize(size);
    d.setTextColor(...color);
    const lines = d.splitTextToSize(text, CONTENT_WIDTH);
    this.ensureSpace(lines.length * lh(size) + 2);
    d.text(lines, MARGIN.left, this.y);
    this.y += lines.length * lh(size) + 2;
  }

  /** Reicht der Platz noch? Sonst umblaettern — statt ueber den Rand zu schreiben. */
  private ensureSpace(needed: number): void {
    if (this.y + needed > PAGE.height - MARGIN.bottom) this.newPage();
  }

  /* ---------------------------------------------------------------- Deckblatt */

  coverPage(): void {
    const d = this.doc;
    const { logo, heroImage, model, now } = this.input;

    d.setDrawColor(...PETROL);
    d.setLineWidth(1.6);
    d.line(MARGIN.left, MARGIN.top, PAGE.width - MARGIN.right, MARGIN.top);
    this.y = MARGIN.top + 8;

    if (logo) {
      // Seitenverhaeltnis der Wortmarke: 200 zu 36 aus der SVG-Datei.
      d.addImage(logo, "PNG", MARGIN.left, this.y, 42, 7.56);
    }
    d.setFont("helvetica", "normal");
    d.setFontSize(7.5);
    d.setTextColor(...MUTED);
    d.text(SITE.urls.live, PAGE.width - MARGIN.right, this.y + 5, { align: "right" });
    this.y += 16;

    d.setFont("helvetica", "bold");
    d.setFontSize(8);
    d.setTextColor(...PETROL);
    d.text(this.t("pdf.docTitle").toUpperCase(), MARGIN.left, this.y);
    this.y += 8;

    d.setFontSize(20);
    d.setTextColor(...INK);
    const title = d.splitTextToSize(this.modelTitle(), CONTENT_WIDTH);
    d.text(title, MARGIN.left, this.y);
    this.y += title.length * lh(20, 1.15) + 2;

    d.setFont("helvetica", "normal");
    d.setFontSize(9);
    d.setTextColor(...MUTED);
    d.text(
      `${this.t("pdf.file")}: ${model.fileName}  ·  ${fmt.fileSize(model.fileSize, this.lang)}  ·  ${this.t("pdf.created")} ${fmt.dateTime(now, this.lang)}`,
      MARGIN.left,
      this.y,
    );
    this.y += 8;

    if (heroImage) {
      const width = CONTENT_WIDTH;
      const height = width / SHOT_ASPECT;
      d.addImage(heroImage, "JPEG", MARGIN.left, this.y, width, height);
      d.setDrawColor(...HAIRLINE);
      d.setLineWidth(0.2);
      d.rect(MARGIN.left, this.y, width, height);
      this.y += height + 8;
    }

    this.keyFigures();

    // Datenschutzhinweis unten auf dem Deckblatt — dort, wo er gelesen wird.
    const noteY = PAGE.height - MARGIN.bottom - 10;
    d.setDrawColor(...ACCENT);
    d.setLineWidth(0.8);
    d.line(MARGIN.left, noteY - 4, MARGIN.left + 22, noteY - 4);
    d.setFont("helvetica", "normal");
    d.setFontSize(7.5);
    d.setTextColor(...MUTED);
    d.text(d.splitTextToSize(this.t("pdf.privacyNote"), CONTENT_WIDTH), MARGIN.left, noteY);
  }

  /** Die vier Zahlen, die auf dem Deckblatt stehen muessen. */
  private keyFigures(): void {
    const d = this.doc;
    const { stats } = this.input.model;
    const size = stats.bbox.size;

    const cells: ReadonlyArray<[string, string]> = [
      [
        this.t("stats.dimensions"),
        `${fmt.num(size.x, this.lang, 1)} × ${fmt.num(size.y, this.lang, 1)} × ${fmt.num(size.z, this.lang, 1)} mm`,
      ],
      [this.t("stats.volume"), fmt.volume(stats.volumeMm3, this.lang)],
      [this.t("stats.triangles"), fmt.integer(stats.triangles, this.lang)],
      [this.t("check.watertight"), this.watertightShort()],
    ];

    const columnWidth = CONTENT_WIDTH / cells.length;
    cells.forEach(([label, value], i) => {
      const x = MARGIN.left + i * columnWidth;
      d.setFont("helvetica", "normal");
      d.setFontSize(7);
      d.setTextColor(...MUTED);
      d.text(label.toUpperCase(), x, this.y);
      d.setFont("helvetica", "bold");
      d.setFontSize(10);
      d.setTextColor(...INK);
      d.text(d.splitTextToSize(value, columnWidth - 3), x, this.y + 5);
    });
    this.y += 16;
  }

  private watertightShort(): string {
    const { topology, topologySkipped } = this.input.model.stats;
    if (topologySkipped || !topology) return "—";
    return topology.watertight ? this.t("ui.yes") : this.t("ui.no");
  }

  /* --------------------------------------------------------------- Kennwerte */

  statsPage(): void {
    this.newPage();
    const { model, material, infill, buildVolume, fit } = this.input;
    const { stats } = model;
    const size = stats.bbox.size;

    this.sectionTitle(this.t("pdf.sectionStats"));

    this.row(
      this.t("stats.dimensions"),
      `${fmt.num(size.x, this.lang, 2)} × ${fmt.num(size.y, this.lang, 2)} × ${fmt.num(size.z, this.lang, 2)} mm`,
      { strong: true },
    );
    this.row(this.t("stats.longestEdge"), fmt.mm(Math.max(size.x, size.y, size.z), this.lang));
    this.row(this.t("stats.volume"), fmt.volume(stats.volumeMm3, this.lang), { strong: true });
    this.row(this.t("stats.area"), fmt.area(stats.areaMm2, this.lang));
    this.row(this.t("stats.triangles"), fmt.integer(stats.triangles, this.lang));
    if (stats.topology) {
      this.row(this.t("stats.vertices"), fmt.integer(stats.topology.vertices, this.lang));
    }
    if (stats.centroid) {
      this.row(
        this.t("stats.centroid"),
        `${fmt.num(stats.centroid.x, this.lang, 1)} / ${fmt.num(stats.centroid.y, this.lang, 1)} / ${fmt.num(stats.centroid.z, this.lang, 1)} mm`,
      );
    }
    this.row(this.t("stats.format"), fmt.formatLabel(model.format));

    // Die Vorbehalte zu STEP und IGES gehoeren INS DOKUMENT, nicht nur in die
    // Oberflaeche. Das PDF ist das Blatt, das in die Projektakte wandert und
    // spaeter ohne das Werkzeug gelesen wird — dort muss stehen, worauf sich
    // Volumen und Befund beziehen.
    if (fmt.isTessellated(model.format)) {
      this.paragraph(
        this.t("step.approximation", {
          q: this.t(
            model.quality === "grob"
              ? "step.qualityCoarse"
              : model.quality === "fein"
                ? "step.qualityFine"
                : "step.qualityMedium",
          ),
        }),
        7.5,
        PETROL,
      );
      if ((model.parts ?? 1) > 1) {
        this.paragraph(this.t("step.assembly", { n: model.parts ?? 1 }), 7.5, PETROL);
      }
      if (model.format === "iges" && model.stats.topology?.watertight === false) {
        this.paragraph(this.t("iges.openSurfaces"), 7.5, PETROL);
      }
    }
    this.row(this.t("stats.fileSize"), fmt.fileSize(model.fileSize, this.lang));
    if (model.scale !== 1) {
      this.row(this.t("drop.units"), `× ${fmt.num(model.scale, this.lang, 2)}`);
    }

    /* -------------------------------------------------------- Gewicht */

    this.y += 4;
    this.sectionTitle(this.t("mass.title"));
    const estimate = estimateMass(stats.volumeMm3, material.density, material.confidence, infill);
    this.row(
      this.t("mass.material"),
      `${material.name} · ${fmt.num(material.density, this.lang, 2)} g/cm³`,
      { note: `${this.t("mass.densitySource")} — ${this.t(`confidence.${material.confidence}`)}` },
    );
    this.row(
      this.t("mass.between", {
        low: fmt.mass(estimate.filledGrams, this.lang),
        high: fmt.mass(estimate.solidGrams, this.lang),
      }),
      `${this.t("mass.lowLabel", { p: infill })} / ${this.t("mass.highLabel")}`,
      { strong: true },
    );
    this.paragraph(this.t("mass.note"), 7.5);
    // Nur die Form entscheidet. Die frueher hier stehende Bedingung
    // `spreadFactor > 3` haengt allein am Fuellgrad und stand deshalb bei der
    // Voreinstellung von 20 % unter jedem Bauteil.
    const surfaceRatio = compactness(stats.volumeMm3, stats.areaMm2);
    if (surfaceRatio > FILIGREE_THRESHOLD) {
      this.paragraph(
        this.t("mass.filigree", { f: fmt.num(surfaceRatio, this.lang, 1) }),
        7.5,
        PETROL,
      );
    }

    /* -------------------------------------------------------- Bauraum */

    this.y += 4;
    this.sectionTitle(this.t("build.title"));
    this.row(
      this.t("build.machine"),
      `${buildVolume.name} · ${buildVolume.x} × ${buildVolume.y} × ${buildVolume.z} mm`,
    );
    const verdict = !fit.fits
      ? this.t("build.tooBig", { p: Math.floor(fit.requiredScale * 100) })
      : fit.needsRotation
        ? this.t("build.fitsRotated")
        : this.t("build.fits");
    this.paragraph(verdict, 8.5, fit.fits ? INK : PETROL);

    /* --------------------------------------------------------- Befund */

    this.y += 4;
    this.sectionTitle(this.t("pdf.sectionCheck"));
    this.findings();

    this.y += 4;
    this.paragraph(this.t("pdf.disclaimer"), 7);
  }

  private findings(): void {
    const { stats } = this.input.model;
    const notes: string[] = [];

    if (stats.topologySkipped) {
      this.paragraph(this.t("check.skipped"), 8.5);
    } else if (stats.topology) {
      const topo = stats.topology;
      this.row(
        this.t("check.watertight"),
        topo.watertight ? this.t("ui.yes") : this.t("ui.no"),
        { strong: true, note: topo.watertight ? this.t("check.watertightYes") : this.t("check.watertightNo") },
      );
      if (topo.boundaryEdges > 0) {
        this.row(this.t("check.boundaryEdges"), fmt.integer(topo.boundaryEdges, this.lang));
      }
      if (topo.nonManifoldEdges > 0) {
        this.row(this.t("check.nonManifold"), fmt.integer(topo.nonManifoldEdges, this.lang), {
          note: this.t("check.nonManifoldHint"),
        });
      }
      if (topo.flippedEdges > 0) {
        this.row(this.t("check.flipped"), fmt.integer(topo.flippedEdges, this.lang), {
          note: this.t("check.flippedHint"),
        });
      }
      if (
        topo.watertight &&
        topo.flippedEdges === 0 &&
        stats.degenerate === 0 &&
        stats.signedVolumeMm3 >= 0
      ) {
        notes.push(this.t("check.allGood"));
      }
    }

    if (stats.degenerate > 0) {
      this.row(this.t("check.degenerate"), fmt.integer(stats.degenerate, this.lang));
    }
    if (stats.signedVolumeMm3 < 0) notes.push(this.t("check.inverted"));
    if (this.input.model.trailingBytes > 0) {
      notes.push(this.t("check.trailing", { n: this.input.model.trailingBytes }));
    }
    for (const note of notes) this.paragraph(note, 8.5);
  }

  /* ---------------------------------------------------------- Normalansichten */

  standardViewsPage(views: ReadonlyArray<{ view: StandardView; image: string }>): void {
    this.newPage();
    this.sectionTitle(this.t("pdf.sectionViews"));

    const areaHeight = PAGE.height - MARGIN.bottom - this.y;
    const grid = {
      count: views.length,
      areaWidth: CONTENT_WIDTH,
      areaHeight,
      aspect: SHOT_ASPECT,
      gap: 5,
      captionHeight: 6,
    };
    const places = placeImages(grid, MARGIN.left, this.y);
    this.drawPlacedImages(
      places,
      views.map((v) => v.image),
      views.map((v) => this.t(`view.${v.view}`)),
    );
  }

  /* --------------------------------------------------------- Rundumansichten */

  turntablePages(turntable: PdfTurntable): void {
    this.newPage();
    this.sectionTitle(this.t("pdf.sectionTurntable", { axis: turntable.axis.toUpperCase() }));

    const areaHeight = PAGE.height - MARGIN.bottom - this.y;
    const grid = {
      count: turntable.images.length,
      areaWidth: CONTENT_WIDTH,
      areaHeight,
      aspect: SHOT_ASPECT,
      gap: 4,
      captionHeight: 5,
    };
    const places = placeImages(grid, MARGIN.left, this.y);
    const captions = turntable.images.map(
      (_, i) => `${Math.round((i / turntable.images.length) * 360)}°`,
    );
    this.drawPlacedImages(places, turntable.images, captions);
  }

  /**
   * Bilder samt Beschriftung setzen und dabei umblaettern.
   *
   * Die Positionen kommen fertig aus placeImages — hier wird nur noch gezeichnet.
   * Der Seitenwechsel haengt an placement.page, nicht an einer eigenen Rechnung:
   * Zwei Stellen, die unabhaengig voneinander ausrechnen, wann die Seite voll ist,
   * driften irgendwann auseinander, und dann fehlt ein Bild.
   */
  private drawPlacedImages(
    places: ReturnType<typeof placeImages>,
    images: readonly string[],
    captions: readonly string[],
  ): void {
    const d = this.doc;
    let currentPage = 0;
    let bottom = this.y;

    for (const place of places) {
      if (place.page !== currentPage) {
        currentPage = place.page;
        this.newPage();
      }
      // place.y ist bereits SEITENRELATIV: placeImages setzt die Reihe innerhalb
      // der Seite an, nicht fortlaufend ueber alle Seiten. Ein zusaetzlicher
      // Versatz waere eine zweite Rechnung fuer dieselbe Sache — und genau daraus
      // entstehen Bilder, die halb ueber dem Seitenrand haengen.
      d.addImage(images[place.index], "JPEG", place.x, place.y, place.width, place.height);
      d.setDrawColor(...HAIRLINE);
      d.setLineWidth(0.15);
      d.rect(place.x, place.y, place.width, place.height);

      d.setFont("helvetica", "normal");
      d.setFontSize(7);
      d.setTextColor(...MUTED);
      d.text(captions[place.index] ?? "", place.x + place.width / 2, place.y + place.height + 3.5, {
        align: "center",
      });

      bottom = Math.max(bottom, place.y + place.height + 6);
    }
    this.y = bottom;
  }

  /* ------------------------------------------------------------- Anmerkungen */

  annotationPages(): void {
    this.newPage();
    this.sectionTitle(this.t("pdf.sectionAnnotations"));

    const { annotations, annotationImages, annotationOverview } = this.input;
    const d = this.doc;

    // Uebersicht zuerst: welche Stellen sind betroffen. Ohne sie muesste der
    // Leser sich aus einzelnen Nahaufnahmen zusammensetzen, wo am Bauteil er
    // sich gerade befindet.
    if (annotationOverview) {
      const width = CONTENT_WIDTH * 0.72;
      const height = width / SHOT_ASPECT;
      const x = MARGIN.left + (CONTENT_WIDTH - width) / 2;
      d.addImage(annotationOverview, "JPEG", x, this.y, width, height);
      d.setDrawColor(...HAIRLINE);
      d.setLineWidth(0.2);
      d.rect(x, this.y, width, height);
      this.y += height + 3;

      d.setFont("helvetica", "normal");
      d.setFontSize(7.5);
      d.setTextColor(...MUTED);
      d.text(this.t("pdf.annotationOverview", { n: annotations.length }), PAGE.width / 2, this.y, {
        align: "center",
      });
      this.y += 8;
    }

    for (const annotation of annotations) {
      const image = annotationImages.get(annotation.id) ?? null;
      const imageWidth = 78;
      const imageHeight = imageWidth / SHOT_ASPECT;
      const captionHeight = image ? 4.5 : 0;
      const blockHeight = Math.max(imageHeight + captionHeight, 34) + 8;
      this.ensureSpace(blockHeight);

      const top = this.y;

      if (image) {
        d.addImage(image, "JPEG", MARGIN.left, top, imageWidth, imageHeight);
        d.setDrawColor(...HAIRLINE);
        d.setLineWidth(0.15);
        d.rect(MARGIN.left, top, imageWidth, imageHeight);

        // Ausdruecklich dazuschreiben, WELCHE Ansicht das ist. Das Bild zeigt
        // den Blickwinkel, aus dem die Markierung gesetzt wurde — nicht eine
        // beliebige Ansicht des Bauteils. Ohne diesen Satz muss der Leser es
        // erraten, und bei zwei aehnlichen Ansichten raet er falsch.
        d.setFont("helvetica", "normal");
        d.setFontSize(6.5);
        d.setTextColor(...MUTED);
        d.text(this.t("pdf.annotationView"), MARGIN.left + imageWidth / 2, top + imageHeight + 3, {
          align: "center",
        });
      }

      const textX = MARGIN.left + imageWidth + 6;
      const textWidth = CONTENT_WIDTH - imageWidth - 6;
      let textY = top + 4;

      // Nummernmarke wie am Modell — die Zuordnung Bild zu Text muss ohne
      // Nachdenken funktionieren.
      const category =
        ANNOTATION_CATEGORIES.find((c) => c.id === annotation.category) ?? ANNOTATION_CATEGORIES[0];
      const rgb = hexToRgb(category.color);
      d.setFillColor(...rgb);
      d.circle(textX + 3, textY - 1.2, 3.1, "F");
      d.setFont("helvetica", "bold");
      d.setFontSize(8);
      d.setTextColor(255, 255, 255);
      d.text(String(annotation.number), textX + 3, textY + 0.6, { align: "center" });

      d.setFontSize(10);
      d.setTextColor(...INK);
      const heading = d.splitTextToSize(annotation.title || "—", textWidth - 9);
      d.text(heading, textX + 9, textY);
      textY += heading.length * lh(10) + 1;

      d.setFont("helvetica", "normal");
      d.setFontSize(7.5);
      d.setTextColor(...PETROL);
      d.text(this.lang === "de" ? category.de : category.en, textX + 9, textY);
      textY += lh(7.5) + 1.5;

      if (annotation.text) {
        d.setFontSize(8.5);
        d.setTextColor(...MUTED);
        const body = d.splitTextToSize(annotation.text, textWidth);
        d.text(body, textX, textY);
        textY += body.length * lh(8.5) + 1;
      }

      d.setFontSize(7);
      d.setTextColor(...MUTED);
      d.text(
        `${this.t("ann.position")}: ${fmt.num(annotation.point.x, this.lang, 1)} / ${fmt.num(annotation.point.y, this.lang, 1)} / ${fmt.num(annotation.point.z, this.lang, 1)} mm`,
        textX,
        Math.max(textY, top + imageHeight - 1),
      );

      this.y = top + blockHeight;
      d.setDrawColor(...HAIRLINE);
      d.setLineWidth(0.15);
      d.line(MARGIN.left, this.y - 4, PAGE.width - MARGIN.right, this.y - 4);
    }
  }

  /* ------------------------------------------------------------- Seitenzahlen */

  /**
   * Erst am Schluss stempeln — vorher ist die Gesamtzahl nicht bekannt.
   * "Seite 3 von 7" auf Seite 3 zu schreiben, bevor Seite 7 existiert, geht nicht.
   */
  stampPageNumbers(): void {
    const d = this.doc;
    const total = d.getNumberOfPages();
    const footerY = PAGE.height - MARGIN.bottom + 8;

    for (let page = 1; page <= total; page++) {
      d.setPage(page);
      d.setDrawColor(...HAIRLINE);
      d.setLineWidth(0.15);
      d.line(MARGIN.left, footerY - 4, PAGE.width - MARGIN.right, footerY - 4);

      d.setFont("helvetica", "normal");
      d.setFontSize(7);
      d.setTextColor(...MUTED);
      d.text(
        `${SITE.legalEntity} · ${SITE.contact.street} · ${SITE.contact.zip} ${SITE.contact.city} · ${SITE.contact.phone}`,
        MARGIN.left,
        footerY,
      );
      d.text(this.t("pdf.page", { i: page, n: total }), PAGE.width - MARGIN.right, footerY, {
        align: "right",
      });
    }
  }
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  return [
    Number.parseInt(clean.slice(0, 2), 16),
    Number.parseInt(clean.slice(2, 4), 16),
    Number.parseInt(clean.slice(4, 6), 16),
  ];
}

/** Alle bekannten Werkstoffe — fuer die Auswahl in der Oberflaeche. */
export const PDF_MATERIALS = MATERIALS;
