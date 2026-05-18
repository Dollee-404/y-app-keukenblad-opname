/**
 * Test-script voor taak 8: boorgat-maten + randafwerking-codes + verstek-tekst.
 *
 * Uitvoeren: npx tsx scripts/gen-test-taak8.ts
 * Output:    /tmp/kbf-pdf-test/test-taak8-labels.pdf
 */
import { jsPDF } from 'jspdf';
import { writeFileSync, mkdirSync } from 'node:fs';
import { computeViewport } from '../src/pdf/coordinateTransform.js';
import { renderBladContour, renderHoekSymbolen } from '../src/pdf/renderBlad.js';
import { renderSparingen } from '../src/pdf/renderSparingen.js';
import { renderBoorgaten } from '../src/pdf/renderBoorgaten.js';
import {
  renderBuitenmaten,
  renderSparingMaten,
  renderBoorgatMaten,
  renderRandafwerkingLabels,
  renderVerstekLabels,
} from '../src/pdf/renderMaatvoering.js';
import type { Blad, Sparing, Boorgat, Opname } from '../src/data/seed-types.js';

function drawDebugGrid(doc: jsPDF): void {
  doc.setDrawColor(220);
  doc.setLineWidth(0.08);
  doc.line(15, 0, 15, 297);
  doc.line(195, 0, 195, 297);
  doc.line(0, 30, 210, 30);
  doc.line(0, 207, 210, 207);
}

const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

// ── Blad 1958×1001 met randafwerkingen ────────────────────────────────────────
const blad: Blad = {
  id: 'P1',
  label: 'BLAD A',
  werkstukType: 'Bladdeel A' as Blad['werkstukType'],
  categorie: 'WB' as Blad['categorie'],
  lengte: 1958,
  breedte: 1001,
  dikte: 20 as Blad['dikte'],
  randen: [],
  randafwerkingen: [
    { zijdeId: '0', code: 'DV40', label: 'DV40', type: 'FACET' as const },   // achterkant
    { zijdeId: '2', code: 'DV40', label: 'DV40', type: 'FACET' as const },   // voorkant
    { zijdeId: '3', code: 'T1-EF', label: 'T1-EF', type: 'FACET' as const }, // linkerkant
    { zijdeId: '1', code: 'KF', label: 'KF', type: 'FACET' as const, verstek: true }, // rechterkant, verstek
  ],
} as unknown as Blad;

const vp = computeViewport(blad);

drawDebugGrid(doc);

doc.setDrawColor(210);
doc.setLineWidth(0.1);
doc.setLineDashPattern([1, 1], 0);
doc.rect(vp.drawingAreaX, vp.drawingAreaY, vp.drawingAreaWidth, vp.drawingAreaHeight);
doc.setLineDashPattern([], 0);

renderBladContour(doc, blad, vp);
renderHoekSymbolen(doc, blad, vp);

// ── Sparing: Bora C75 vlakbouw op (1307, 500) ────────────────────────────────
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

// ── Boorgaten ─────────────────────────────────────────────────────────────────
const boorgaten: Boorgat[] = [
  {
    id: 'bg-1', bladId: 'P1',
    doel: 'KRAAN' as Boorgat['doel'],
    diameter: 35, doorboring: true,
    positie: { x: 979, y: 700 },
  } as unknown as Boorgat,
  {
    id: 'bg-2', bladId: 'P1',
    doel: 'DOWNDRAFT' as Boorgat['doel'],
    diameter: 7, doorboring: true,
    positie: { x: 200, y: 300 },
    groepId: 'g1', groepVolgnummer: 1,
  } as unknown as Boorgat,
  {
    id: 'bg-3', bladId: 'P1',
    doel: 'DOWNDRAFT' as Boorgat['doel'],
    diameter: 70, doorboring: true,
    positie: { x: 270, y: 300 },
    groepId: 'g1', groepVolgnummer: 2,
  } as unknown as Boorgat,
];
renderBoorgaten(doc, blad, vp, boorgaten);

// ── Maatvoering ───────────────────────────────────────────────────────────────
renderBuitenmaten(doc, blad, vp);
renderSparingMaten(doc, blad, vp, sparingen);
renderBoorgatMaten(doc, boorgaten, blad, vp);

// ── Labels ────────────────────────────────────────────────────────────────────
renderRandafwerkingLabels(doc, blad, vp);

// Opname-stub: geen VerstekRelaties → renderVerstekLabels tekent niets
const opname = {
  id: 'test', bladen: [blad], verstekRelaties: [],
} as unknown as Opname;
renderVerstekLabels(doc, blad, opname, vp);

// ── Paginakop ─────────────────────────────────────────────────────────────────
doc.setFontSize(7);
doc.setTextColor(120);
doc.text('Taak 8 — Boorgat-maten + randafwerking-codes (DV40/T1-EF/KF) + verstek-tekst', 15, 8);
doc.text(`Blad 1958×1001 | D35(979,700) | D7D70(200/270,300) | KF rechts verstek | schaal=${vp.scaleFactor.toFixed(5)}`, 15, 13);

// ── Output ────────────────────────────────────────────────────────────────────
mkdirSync('/tmp/kbf-pdf-test', { recursive: true });
const buf = Buffer.from(doc.output('arraybuffer'));
writeFileSync('/tmp/kbf-pdf-test/test-taak8-labels.pdf', buf);
console.log('✓ /tmp/kbf-pdf-test/test-taak8-labels.pdf geschreven');
