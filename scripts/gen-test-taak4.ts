/**
 * Test-script voor taak 4: sparingen + vlakbouw dual-layer + labels.
 * Genereert één PDF-pagina met Bora C75 vlakbouw kookplaat.
 *
 * Uitvoeren: npx tsx scripts/gen-test-taak4.ts
 * Output:    /tmp/kbf-pdf-test/test-taak4-sparingen.pdf
 */
import { jsPDF } from 'jspdf';
import { writeFileSync, mkdirSync } from 'node:fs';
import { computeViewport } from '../src/pdf/coordinateTransform.js';
import { renderBladContour, renderHoekSymbolen } from '../src/pdf/renderBlad.js';
import { renderSparingen } from '../src/pdf/renderSparingen.js';
import type { Blad, Sparing } from '../src/data/seed-types.js';

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

// ── Blad 1958×1001 — Bora C75 vlakbouw op (1307, 500) ────────────────────────
const blad = makeBladStub('P1', 1958, 1001);
const vp   = computeViewport(blad);

drawDebugGrid(doc);

// Stippelkader tekengebied
doc.setDrawColor(210);
doc.setLineWidth(0.1);
doc.setLineDashPattern([1, 1], 0);
doc.rect(vp.drawingAreaX, vp.drawingAreaY, vp.drawingAreaWidth, vp.drawingAreaHeight);
doc.setLineDashPattern([], 0);

renderBladContour(doc, blad, vp);
renderHoekSymbolen(doc, blad, vp);

// Bora C75 — seed-data waarden
const sparingen: Sparing[] = [
  {
    id:           'sp-1',
    type:         'KOOKPLAAT' as Sparing['type'],
    bladId:       'P1',
    inbouwwijze:  'VLAKBOUW'  as Sparing['inbouwwijze'],
    productMerk:  'Bora',
    productModel: 'C75',
    positie:      { x: 1307, y: 500 },
    breedte:      764,
    hoogte:       519,
    vlakbouw: {
      breedteOnder: 740,
      hoogteOnder:  495,
      radiusMm:     5,
      tredeMm:      7,
    },
  } as unknown as Sparing,
];

renderSparingen(doc, blad, vp, sparingen);

// Debug-tekst
doc.setFontSize(7);
doc.setTextColor(120);
doc.text('Taak 4 — Sparing: Bora C75 vlakbouw op (1307, 500), boven 764x519, onder 740x495', 15, 8);
doc.text(`Blad 1958x1001 mm  scale=${vp.scaleFactor.toFixed(5)}`, 15, 13);

// ── Output ────────────────────────────────────────────────────────────────────
mkdirSync('/tmp/kbf-pdf-test', { recursive: true });
const buf = Buffer.from(doc.output('arraybuffer'));
writeFileSync('/tmp/kbf-pdf-test/test-taak4-sparingen.pdf', buf);
console.log('✓ /tmp/kbf-pdf-test/test-taak4-sparingen.pdf geschreven');
