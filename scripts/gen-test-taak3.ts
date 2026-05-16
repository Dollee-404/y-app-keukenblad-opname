/**
 * Test-script voor taak 3: bladcontour + hoeksymbolen.
 * Genereert twee PDF-pagina's voor visuele verificatie.
 *
 * Uitvoeren: npx tsx scripts/gen-test-taak3.ts
 * Output:    dist/test-taak3-bladcontour.pdf
 */
import { jsPDF } from 'jspdf';
import { writeFileSync, mkdirSync } from 'node:fs';
import { computeViewport } from '../src/pdf/coordinateTransform.js';
import { renderBladContour, renderHoekSymbolen } from '../src/pdf/renderBlad.js';
import { rechthoekOutline, knipHoekUit } from '../src/drawing/bladHelpers.js';
import type { Blad } from '../src/data/seed-types.js';

function makeBladStub(
  id: string,
  lengte: number,
  breedte: number,
  outline?: Blad['outline'],
): Blad {
  return {
    id,
    label: id,
    werkstukType: 'Bladdeel A' as Blad['werkstukType'],
    categorie: 'WB' as Blad['categorie'],
    lengte,
    breedte,
    dikte: 20 as Blad['dikte'],
    randen: [],
    outline,
  } as unknown as Blad;
}

function drawDebugGrid(doc: jsPDF): void {
  // Lichtgrijze hulplijnen voor tekengebied-grenzen
  doc.setDrawColor(220);
  doc.setLineWidth(0.08);
  doc.line(15, 0, 15, 297);    // linker marge
  doc.line(195, 0, 195, 297);  // rechter marge
  doc.line(0, 30, 210, 30);    // header-grens
  doc.line(0, 207, 210, 207);  // footer-grens
}

const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

// ── Pagina 1: rechthoek 1958×1001 (Vasto scenario A) ──────────────────────
const bladA = makeBladStub('P1', 1958, 1001);
const vpA = computeViewport(bladA);

drawDebugGrid(doc);

// Stippelkader tekengebied
doc.setDrawColor(210);
doc.setLineWidth(0.1);
doc.setLineDashPattern([1, 1], 0);
doc.rect(vpA.drawingAreaX, vpA.drawingAreaY, vpA.drawingAreaWidth, vpA.drawingAreaHeight);
doc.setLineDashPattern([], 0);

renderBladContour(doc, bladA, vpA);
renderHoekSymbolen(doc, bladA, vpA);

doc.setFontSize(7);
doc.setTextColor(120);
doc.text(`Pagina 1 — Rechthoek ${bladA.lengte}×${bladA.breedte}mm`, 15, 8);
doc.text(`scale=${vpA.scaleFactor.toFixed(5)}  bladW=${vpA.drawingAreaWidth.toFixed(1)}mm  bladH=${vpA.drawingAreaHeight.toFixed(1)}mm`, 15, 13);
doc.text(`drawingAreaX=${vpA.drawingAreaX.toFixed(1)}  drawingAreaY=${vpA.drawingAreaY.toFixed(1)}`, 15, 18);

// ── Pagina 2: L-vorm 2000×800 met uithap 800×400 rechts-boven ─────────────
doc.addPage();
drawDebugGrid(doc);

const base = rechthoekOutline(2000, 800);
// Snijd hoek 1 (rechtsboven in SVG) weg: 800mm langs bovenkant (naar links), 400mm langs rechterkant (omlaag)
const lOutline = knipHoekUit(base, 1, 800, 400);

const bladL = makeBladStub('P2', 2000, 800, lOutline);
const vpL = computeViewport(bladL);

doc.setDrawColor(210);
doc.setLineWidth(0.1);
doc.setLineDashPattern([1, 1], 0);
doc.rect(vpL.drawingAreaX, vpL.drawingAreaY, vpL.drawingAreaWidth, vpL.drawingAreaHeight);
doc.setLineDashPattern([], 0);

renderBladContour(doc, bladL, vpL);
renderHoekSymbolen(doc, bladL, vpL);

doc.setFontSize(7);
doc.setTextColor(120);
doc.text(`Pagina 2 — L-vorm ${bladL.lengte}×${bladL.breedte}mm, uithap 800×400 rechts-boven`, 15, 8);
doc.text(`scale=${vpL.scaleFactor.toFixed(5)}  ${lOutline.length} hoekpunten  (5 buitenhoeken, 1 binnenhoek)`, 15, 13);

// ── Schrijf output ─────────────────────────────────────────────────────────
mkdirSync('/tmp/kbf-pdf-test', { recursive: true });
const buf = Buffer.from(doc.output('arraybuffer'));
writeFileSync('/tmp/kbf-pdf-test/test-taak3-bladcontour.pdf', buf);
console.log('✓ /tmp/kbf-pdf-test/test-taak3-bladcontour.pdf geschreven');
