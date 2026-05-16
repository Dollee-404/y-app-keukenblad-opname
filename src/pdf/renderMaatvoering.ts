import type { jsPDF } from 'jspdf';
import type { Blad, Sparing } from '../data/seed-types';
import type { PdfViewport } from './types';

const MAAT_OFFSET = 15;  // mm van bladrand naar buitenmaat-lijn

// Sparing-maat constanten
const SP_MAAT_OFFSET = 15; // mm onder bladrand naar eerste horizontale sparing-maat
const SP_MAAT_STACK  = 7;  // mm stapeling tussen horizontale sparing-maten
const SP_VERT_OFFSET = 8;  // mm links van bladrand voor verticale sparing-maat
const ARROW_LEN  = 2.5;  // mm pijl-arm
const ARROW_H    = 0.9;  // mm half-hoogte pijl
const HULP_GAP   = 1;    // mm gap aan bladrand-zijde
const HULP_PAST  = 2;    // mm uitsteek voorbij maatlijn

/**
 * Tekent buitenmaten (lengte boven + breedte links) in Vasto-stijl:
 * dunne hulplijnen, maatlijn met open driehoekpijltjes, getal gecentreerd.
 *
 * Gebruikt de 40mm label-marge die computeViewport aan elke kant reserveert.
 */
export function renderBuitenmaten(doc: jsPDF, blad: Blad, viewport: PdfViewport): void {
  const { drawingAreaX: x0, drawingAreaY: y0, drawingAreaWidth: bW, drawingAreaHeight: bH } = viewport;

  // ── Lengte boven blad ──────────────────────────────────────────────────────
  const yMaat = y0 - MAAT_OFFSET;

  drawHulplijn(doc, x0, y0 - HULP_GAP, x0, yMaat - HULP_PAST);
  drawHulplijn(doc, x0 + bW, y0 - HULP_GAP, x0 + bW, yMaat - HULP_PAST);
  drawMaatlijn(doc, x0, yMaat, x0 + bW, yMaat, `${blad.lengte}`, 'horizontal');

  // ── Breedte links blad ─────────────────────────────────────────────────────
  const xMaat = x0 - MAAT_OFFSET;

  drawHulplijn(doc, x0 - HULP_GAP, y0, xMaat - HULP_PAST, y0);
  drawHulplijn(doc, x0 - HULP_GAP, y0 + bH, xMaat - HULP_PAST, y0 + bH);
  drawMaatlijn(doc, xMaat, y0, xMaat, y0 + bH, `${blad.breedte}`, 'vertical');
}

/**
 * Tekent sparing-positie-maten in Vasto-stijl (telescopisch gestapeld):
 *   1. Horizontaal: linkerrand → sparing-center (bovenste, kortste)
 *   2. Horizontaal: linkerrand → blad.lengte - 2mm (onderste, langste)
 *   3. Verticaal:   voorrand   → sparing-center (links van blad, genest binnen buitenmaat)
 *
 * Noot: Vasto's 1861-maat (bladstap/rabat voor verstek-aansluiting) is NIET
 * geïmplementeerd — hoort bij blad-feature, niet sparing-maatvoering (sprint 11).
 */
export function renderSparingMaten(
  doc: jsPDF,
  blad: Blad,
  viewport: PdfViewport,
  sparingen: Sparing[],
): void {
  for (const sp of sparingen) {
    if (sp.bladId !== blad.id) continue;
    renderEenSparingMaat(doc, blad, viewport, sp);
  }
}

function renderEenSparingMaat(
  doc: jsPDF,
  blad: Blad,
  viewport: PdfViewport,
  sp: Sparing,
): void {
  const { drawingAreaX: x0, drawingAreaY: y0, drawingAreaHeight: bH, scaleFactor: s } = viewport;

  // ── Horizontale maten ONDER blad ─────────────────────────────────────────
  const yMaat1 = y0 + bH + SP_MAAT_OFFSET;
  const yMaat2 = yMaat1 + SP_MAAT_STACK;

  const xSparing = x0 + sp.positie.x * s;             // sparing center in PDF-x
  const xRechts  = x0 + (blad.lengte - 2) * s;        // rechterrand − 2mm

  // Hulplijn bij linkerrand voor beide maten
  drawHulplijn(doc, x0, y0 + bH + HULP_GAP, x0, yMaat2 - HULP_PAST);

  // Maat 1: linkerrand → sparing-center
  drawHulplijn(doc, xSparing, y0 + bH + HULP_GAP, xSparing, yMaat1 - HULP_PAST);
  drawMaatlijn(doc, x0, yMaat1, xSparing, yMaat1, `${sp.positie.x}`, 'horizontal');

  // Maat 2: linkerrand → rechterrand − 2mm (de referentie-maat)
  drawHulplijn(doc, xRechts, y0 + bH + HULP_GAP, xRechts, yMaat2 - HULP_PAST);
  drawMaatlijn(doc, x0, yMaat2, xRechts, yMaat2, `${blad.lengte - 2}`, 'horizontal');

  // ── Verticale maat LINKS van blad ─────────────────────────────────────────
  // Van voorrand (Y=0 fysiek = onderkant in PDF) naar sparing-center Y
  // Genest tussen blad en de buitenmaat (breedte op MAAT_OFFSET=15mm, hier 8mm)
  const xMaatVert  = x0 - SP_VERT_OFFSET;
  const yVoorkant  = y0 + bH;                                           // Y=0 fysiek → onderkant PDF
  const ySparingPdf = y0 + (blad.breedte - sp.positie.y) * s;          // sparing-center in PDF

  drawHulplijn(doc, x0 - HULP_GAP, yVoorkant,   xMaatVert - HULP_PAST, yVoorkant);
  drawHulplijn(doc, x0 - HULP_GAP, ySparingPdf, xMaatVert - HULP_PAST, ySparingPdf);

  // Maatlijn van voorrand omhoog naar sparing-center
  drawMaatlijn(doc, xMaatVert, ySparingPdf, xMaatVert, yVoorkant, `${sp.positie.y}`, 'vertical');
}

// ── Privé helpers ─────────────────────────────────────────────────────────────

function drawHulplijn(
  doc: jsPDF,
  x1: number, y1: number,
  x2: number, y2: number,
): void {
  doc.setLineWidth(0.15);
  doc.setDrawColor(140);
  doc.line(x1, y1, x2, y2);
  doc.setDrawColor(0);
}

/**
 * Maatlijn van (x1,y1) naar (x2,y2) met open pijltjes en gecentreerd label.
 * Pijltip zit aan het eindpunt, armen openen naar binnen (richting maatlijn-midden).
 */
function drawMaatlijn(
  doc: jsPDF,
  x1: number, y1: number,
  x2: number, y2: number,
  label: string,
  orientation: 'horizontal' | 'vertical',
): void {
  doc.setLineWidth(0.25);
  doc.setDrawColor(0);
  doc.line(x1, y1, x2, y2);

  if (orientation === 'horizontal') {
    // Pijl links: punt op (x1, y1), armen naar rechts (inwaarts)
    doc.line(x1, y1, x1 + ARROW_LEN, y1 - ARROW_H);
    doc.line(x1, y1, x1 + ARROW_LEN, y1 + ARROW_H);
    // Pijl rechts: punt op (x2, y1), armen naar links (inwaarts)
    doc.line(x2, y1, x2 - ARROW_LEN, y1 - ARROW_H);
    doc.line(x2, y1, x2 - ARROW_LEN, y1 + ARROW_H);

    // Label boven de maatlijn, horizontaal gecentreerd
    doc.setFontSize(8);
    doc.setTextColor(0);
    doc.text(label, (x1 + x2) / 2, y1 - 1.5, { align: 'center' });

  } else {
    // Pijl boven: punt op (x1, y1), armen omlaag (inwaarts)
    doc.line(x1, y1, x1 - ARROW_H, y1 + ARROW_LEN);
    doc.line(x1, y1, x1 + ARROW_H, y1 + ARROW_LEN);
    // Pijl onder: punt op (x1, y2), armen omhoog (inwaarts)
    doc.line(x1, y2, x1 - ARROW_H, y2 - ARROW_LEN);
    doc.line(x1, y2, x1 + ARROW_H, y2 - ARROW_LEN);

    // Label links van de maatlijn, verticaal gecentreerd, 90° gedraaid (leest van onder→boven)
    doc.setFontSize(8);
    doc.setTextColor(0);
    doc.text(label, x1 - 2, (y1 + y2) / 2, { align: 'center', angle: 90 });
  }
}
