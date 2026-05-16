/**
 * Test-script voor taak 6: buitenmaten in Vasto-stijl.
 * Combineert contour + sparing (taak 4) + boorgaten (taak 5) + buitenmaten.
 *
 * Uitvoeren: npx tsx scripts/gen-test-taak6.ts
 * Output:    /tmp/kbf-pdf-test/test-taak6-maatvoering.pdf
 */
import { jsPDF } from 'jspdf';
import { writeFileSync, mkdirSync } from 'node:fs';
import { computeViewport } from '../src/pdf/coordinateTransform.js';
import { renderBladContour, renderHoekSymbolen } from '../src/pdf/renderBlad.js';
import { renderSparingen } from '../src/pdf/renderSparingen.js';
import { renderBoorgaten } from '../src/pdf/renderBoorgaten.js';
import { renderBuitenmaten } from '../src/pdf/renderMaatvoering.js';
import type { Blad, Sparing, Boorgat } from '../src/data/seed-types.js';

function makeBladStub(id: string, lengte: number, breedte: number): Blad {
  return {
    id,
    label: id,
    werkstukType: 'Bladdeel A' as Blad['werkstukType'],
    categorie: 'WB' as Blad['categorie'],
    lengte,
    breedte,
    dikte: 20 as Blad['dikte'],
    randen: [],
  } as unknown as Blad;
}

function drawDebugGrid(doc: jsPDF): void {
  doc.setDrawColor(220);
  doc.setLineWidth(0.08);
  doc.line(15, 0, 15, 297);
  doc.line(195, 0, 195, 297);
  doc.line(0, 30, 210, 30);
  doc.line(0, 207, 210, 207);
}

const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

// ── Blad 1958×1001 ────────────────────────────────────────────────────────────
const blad = makeBladStub('P1', 1958, 1001);
const vp   = computeViewport(blad);

drawDebugGrid(doc);

doc.setDrawColor(210);
doc.setLineWidth(0.1);
doc.setLineDashPattern([1, 1], 0);
doc.rect(vp.drawingAreaX, vp.drawingAreaY, vp.drawingAreaWidth, vp.drawingAreaHeight);
doc.setLineDashPattern([], 0);

renderBladContour(doc, blad, vp);
renderHoekSymbolen(doc, blad, vp);

// Bora C75 sparing (taak 4)
const sparingen: Sparing[] = [
  {
    id: 'sp-1', type: 'KOOKPLAAT' as Sparing['type'],
    bladId: 'P1', inbouwwijze: 'VLAKBOUW' as Sparing['inbouwwijze'],
    productMerk: 'Bora', productModel: 'C75',
    positie: { x: 1307, y: 500 },
    breedte: 764, hoogte: 519,
    vlakbouw: { breedteOnder: 740, hoogteOnder: 495, radiusMm: 5, tredeMm: 7 },
  } as unknown as Sparing,
];
renderSparingen(doc, blad, vp, sparingen);

// Kraangat D35 (taak 5)
const boorgaten: Boorgat[] = [
  {
    id: 'bg-1', bladId: 'P1',
    doel: 'KRAAN' as Boorgat['doel'],
    diameter: 35, doorboring: true,
    positie: { x: 979, y: 700 },
  } as unknown as Boorgat,
];
renderBoorgaten(doc, blad, vp, boorgaten);

// Buitenmaten (taak 6)
renderBuitenmaten(doc, blad, vp);

doc.setFontSize(7);
doc.setTextColor(120);
doc.text('Taak 6 — Buitenmaten 1958 (boven) + 1001 (links), Vasto-stijl pijltjes', 15, 8);

// ── Output ────────────────────────────────────────────────────────────────────
mkdirSync('/tmp/kbf-pdf-test', { recursive: true });
const buf = Buffer.from(doc.output('arraybuffer'));
writeFileSync('/tmp/kbf-pdf-test/test-taak6-maatvoering.pdf', buf);
console.log('✓ /tmp/kbf-pdf-test/test-taak6-maatvoering.pdf geschreven');
