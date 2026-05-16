import type { jsPDF } from 'jspdf';
import type { Blad, Sparing } from '../data/seed-types';
import type { PdfViewport } from './types';
import { bladToPdf } from './coordinateTransform';

const LABEL_OFFSET_MM = 5;  // mm onder onderkant blad
const LABEL_LINE_H   = 2.5; // mm per tekstregel

export function renderSparingen(
  doc: jsPDF,
  blad: Blad,
  viewport: PdfViewport,
  sparingen: Sparing[],
): void {
  for (const sp of sparingen) {
    if (sp.bladId !== blad.id) continue;
    renderSparing(doc, blad, viewport, sp);
  }
}

function renderSparing(
  doc: jsPDF,
  blad: Blad,
  viewport: PdfViewport,
  sp: Sparing,
): void {
  const s  = viewport.scaleFactor;
  const cx = sp.positie.x;
  const cy = sp.positie.y;

  // Buitenrechthoek — solid
  // Fysieke coords (Y=0=onderkant) → bladToPdf past Y-flip toe.
  // linksboven in PDF = center + halve hoogte fysiek → bladToPdf
  const outer = bladToPdf({ x: cx - sp.breedte / 2, y: cy + sp.hoogte / 2 }, blad, viewport);
  const outerW = sp.breedte * s;
  const outerH = sp.hoogte  * s;

  doc.setLineWidth(0.3);
  doc.setDrawColor(0);
  doc.rect(outer.x, outer.y, outerW, outerH);

  // Binnenrechthoek (gestippeld) — alleen bij VLAKBOUW
  if (sp.inbouwwijze === 'VLAKBOUW' && sp.vlakbouw) {
    const vb = sp.vlakbouw;
    const inner = bladToPdf(
      { x: cx - vb.breedteOnder / 2, y: cy + vb.hoogteOnder / 2 },
      blad,
      viewport,
    );
    const innerW = vb.breedteOnder * s;
    const innerH = vb.hoogteOnder  * s;

    doc.setLineWidth(0.2);
    doc.setLineDashPattern([1, 0.5], 0);
    doc.rect(inner.x, inner.y, innerW, innerH);
    doc.setLineDashPattern([], 0);
  }

  renderSparingLabel(doc, viewport, sp);
}

function renderSparingLabel(
  doc: jsPDF,
  viewport: PdfViewport,
  sp: Sparing,
): void {
  // Label ONDER blad, horizontaal gecentreerd op sparing-middelpunt
  const labelX = viewport.drawingAreaX + sp.positie.x * viewport.scaleFactor;
  const labelY = viewport.drawingAreaY + viewport.drawingAreaHeight + LABEL_OFFSET_MM;

  const line1 = [sp.productMerk, sp.productModel].filter(Boolean).join(' ') || sp.type;
  const line2 = sp.inbouwwijze;
  let line3 = `sparingmaat ${sp.breedte} x ${sp.hoogte} mm`;
  if (sp.inbouwwijze === 'VLAKBOUW' && sp.vlakbouw) {
    const vb = sp.vlakbouw;
    line3 = `sparingmaat ${sp.breedte}/${vb.breedteOnder} x ${sp.hoogte}/${vb.hoogteOnder} mm, Radius ${vb.radiusMm} mm, Trede ${vb.tredeMm} mm`;
  }

  doc.setFontSize(6);
  doc.setTextColor(0);
  doc.text(line1, labelX, labelY,                    { align: 'center' });
  doc.text(line2, labelX, labelY + LABEL_LINE_H,     { align: 'center' });
  doc.text(line3, labelX, labelY + 2 * LABEL_LINE_H, { align: 'center' });
}
