import type { jsPDF } from 'jspdf';
import type { Blad } from '../data/seed-types';
import type { PdfViewport } from './types';
import { outlineToPdf } from './coordinateTransform';
import { rechthoekOutline } from '../drawing/bladHelpers';

// Hoek-symbool maten (in PDF mm — niet geschaald met blad)
const SYMBOL_OFFSET = 3; // mm van hoekpunt tot begin van arm
const SYMBOL_SIZE = 2;   // mm armlengte

function normalize(x: number, y: number): { x: number; y: number } {
  const len = Math.hypot(x, y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: x / len, y: y / len };
}

/**
 * Tekent de bladcontour als aaneengesloten lijnen.
 *
 * Outline-punten zijn in SVG-coördinaten (Y=0=boven=achterkant).
 * Canvas.tsx past fy alleen toe op sparingen/boorgaten, niet op de outline —
 * hier ook geen Y-flip (outlineToPdf).
 */
export function renderBladContour(doc: jsPDF, blad: Blad, viewport: PdfViewport): void {
  const outline = blad.outline ?? rechthoekOutline(blad.lengte, blad.breedte);
  const n = outline.length;

  doc.setLineWidth(0.4);
  doc.setDrawColor(0);

  for (let i = 0; i < n; i++) {
    const p = outlineToPdf(outline[i], viewport);
    const q = outlineToPdf(outline[(i + 1) % n], viewport);
    doc.line(p.x, p.y, q.x, q.y);
  }
}

/**
 * Tekent Vasto-stijl hoeksymbolen ("⌐") bij elke buitenhoek.
 * Binnenhoeken (concaaf, zoals in L-vormen) worden overgeslagen.
 *
 * Algoritme: cross-product van opeenvolgende randvectoren.
 *   z > 0 → buitenhoek (convex)  → symbool tekenen
 *   z ≤ 0 → binnenhoek / rechte lijn → overslaan
 *
 * Symbool: anker SYMBOL_OFFSET mm langs beide aangrenzende randen,
 * twee armen van SYMBOL_SIZE mm elk die de "⌐" vorm vormen.
 */
export function renderHoekSymbolen(doc: jsPDF, blad: Blad, viewport: PdfViewport): void {
  const outline = blad.outline ?? rechthoekOutline(blad.lengte, blad.breedte);
  const n = outline.length;

  doc.setLineWidth(0.25);
  doc.setDrawColor(0);

  for (let i = 0; i < n; i++) {
    const prev = outline[(i - 1 + n) % n];
    const curr = outline[i];
    const next = outline[(i + 1) % n];

    // Eenheidsvectoren in outline-ruimte (schaal-invariant voor richting)
    const v_in  = normalize(curr.x - prev.x, curr.y - prev.y);
    const v_out = normalize(next.x - curr.x, next.y - curr.y);

    // Cross-product: z > 0 = buitenhoek bij CW-gewonde outline in SVG
    const z = v_in.x * v_out.y - v_in.y * v_out.x;
    if (z <= 0) continue;

    // Hoekpunt in PDF-coördinaten
    const cp = outlineToPdf(curr, viewport);

    // Anker: SYMBOL_OFFSET mm inwaarts langs beide randen
    const ax = cp.x + SYMBOL_OFFSET * v_out.x - SYMBOL_OFFSET * v_in.x;
    const ay = cp.y + SYMBOL_OFFSET * v_out.y - SYMBOL_OFFSET * v_in.y;

    // Arm 1: langs outgoing rand
    doc.line(ax, ay, ax + SYMBOL_SIZE * v_out.x, ay + SYMBOL_SIZE * v_out.y);
    // Arm 2: langs reversed incoming rand
    doc.line(ax, ay, ax - SYMBOL_SIZE * v_in.x, ay - SYMBOL_SIZE * v_in.y);
  }
}
