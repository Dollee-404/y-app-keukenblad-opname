/**
 * Test-script voor taak 5: boorgaten + groep-labels.
 *
 * Uitvoeren: npx tsx scripts/gen-test-taak5.ts
 * Output:    /tmp/kbf-pdf-test/test-taak5-boorgaten.pdf
 */
import { jsPDF } from 'jspdf';
import { writeFileSync, mkdirSync } from 'node:fs';
import { computeViewport } from '../src/pdf/coordinateTransform.js';
import { renderBladContour, renderHoekSymbolen } from '../src/pdf/renderBlad.js';
import { renderBoorgaten } from '../src/pdf/renderBoorgaten.js';
import type { Blad, Boorgat } from '../src/data/seed-types.js';

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

const boorgaten: Boorgat[] = [
  // Enkelvoudig doorboring Ø35 — kraangat boven midden blad
  {
    id:         'bg-1',
    bladId:     'P1',
    doel:       'KRAAN' as Boorgat['doel'],
    diameter:   35,
    doorboring: true,
    positie:    { x: 979, y: 700 },
  } as unknown as Boorgat,

  // Enkelvoudig blind Ø8 — rechts-onder
  {
    id:         'bg-2',
    bladId:     'P1',
    doel:       'OVERIG' as Boorgat['doel'],
    diameter:   8,
    doorboring: false,
    positie:    { x: 1500, y: 200 },
  } as unknown as Boorgat,

  // Groep: Ø7 + Ø70 — zoals Vasto pagina 3 D7D70
  {
    id:              'bg-3',
    bladId:          'P1',
    doel:            'DOWNDRAFT' as Boorgat['doel'],
    diameter:        7,
    doorboring:      true,
    positie:         { x: 200, y: 300 },
    groepId:         'g1',
    groepVolgnummer: 1,
  } as unknown as Boorgat,
  {
    id:              'bg-4',
    bladId:          'P1',
    doel:            'DOWNDRAFT' as Boorgat['doel'],
    diameter:        70,
    doorboring:      true,
    positie:         { x: 270, y: 300 },
    groepId:         'g1',
    groepVolgnummer: 2,
  } as unknown as Boorgat,
];

renderBoorgaten(doc, blad, vp, boorgaten);

doc.setFontSize(7);
doc.setTextColor(120);
doc.text('Taak 5 — Boorgaten: D35 doorboring (979,700) | D8 blind (1500,200) | D7D70 groep (200,300)+(270,300)', 15, 8);
doc.text(`Blad 1958x1001 mm  scale=${vp.scaleFactor.toFixed(5)}`, 15, 13);

// ── Output ────────────────────────────────────────────────────────────────────
mkdirSync('/tmp/kbf-pdf-test', { recursive: true });
const buf = Buffer.from(doc.output('arraybuffer'));
writeFileSync('/tmp/kbf-pdf-test/test-taak5-boorgaten.pdf', buf);
console.log('✓ /tmp/kbf-pdf-test/test-taak5-boorgaten.pdf geschreven');
