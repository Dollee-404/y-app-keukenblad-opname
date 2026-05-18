/**
 * Test-script voor V2 redesign: A4 liggend + headerV2 + footerV2.
 *
 * Uitvoeren: npx tsx scripts/gen-test-redesign.ts
 * Output:    /tmp/kbf-pdf-test/test-redesign-landscape.pdf
 *
 * Vergelijk side-by-side met /tmp/kbf-pdf-test/test-taak9a-header-footer.pdf
 */
import { jsPDF } from 'jspdf';
import { writeFileSync, mkdirSync } from 'node:fs';
import { computeViewportLandscape } from '../src/pdf/coordinateTransform.js';
import { renderBladContour, renderHoekSymbolen } from '../src/pdf/renderBlad.js';
import { renderSparingen } from '../src/pdf/renderSparingen.js';
import { renderBoorgaten } from '../src/pdf/renderBoorgaten.js';
import {
  renderBuitenmaten,
  renderSparingMaten,
  renderBoorgatMaten,
  renderRandafwerkingLabels,
} from '../src/pdf/renderMaatvoering.js';
import { renderPaginaHeaderV2 } from '../src/pdf/renderHeaderV2.js';
import { renderPaginaFooterV2 } from '../src/pdf/renderFooterV2.js';
import type { Blad, Sparing, Boorgat, Opname } from '../src/data/seed-types.js';

const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

// Zelfde blad als taak 9a — voor directe vergelijking
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
    { zijdeId: '0', code: 'DV40',  label: 'DV40',  type: 'FACET' as const },
    { zijdeId: '2', code: 'DV40',  label: 'DV40',  type: 'FACET' as const },
    { zijdeId: '3', code: 'T1-EF', label: 'T1-EF', type: 'FACET' as const },
    { zijdeId: '1', code: 'KF',    label: 'KF',    type: 'FACET' as const, verstek: true },
  ],
  materiaalcodeOverride: '20DV40',
} as unknown as Blad;

const state = {
  ordernummer: '2600376',
  datum: '2026-02-16',
  type: 'OFFERTE',
  status: 'CONCEPT',
  opdrachtgever: { naam: 'Zijlmans Interieur op maat B.V.', straat: '', postcodePlaats: '' },
  uwReferentie: 'ZIJLMANS - VAN VLIMMEREN',
  materiaalKeuze: { kleur_label: 'Glencoe Gepolijst', soort: '', dikte_mm: 20, kleur_code: '' },
  materiaal: { soort: '', producent: '', afwerking: '', kleur: 'Glencoe Gepolijst' },
  bladen: [blad],
  sparingen: [],
  accessoires: [],
  verstekRelaties: [],
} as unknown as Opname;

const vp = computeViewportLandscape(blad);
const paginaInfo = { paginaNr: 1, totaalPaginas: 1 };

// ── Header ────────────────────────────────────────────────────────────────────
renderPaginaHeaderV2(doc, [blad], paginaInfo, state);

// ── Tekening-zone ─────────────────────────────────────────────────────────────
renderBladContour(doc, blad, vp);
renderHoekSymbolen(doc, blad, vp);

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

renderBuitenmaten(doc, blad, vp);
renderSparingMaten(doc, blad, vp, sparingen);
renderBoorgatMaten(doc, boorgaten, blad, vp);
renderRandafwerkingLabels(doc, blad, vp);

// ── Footer ────────────────────────────────────────────────────────────────────
renderPaginaFooterV2(doc, state, blad, paginaInfo);

// ── Output ────────────────────────────────────────────────────────────────────
mkdirSync('/tmp/kbf-pdf-test', { recursive: true });
const buf = Buffer.from(doc.output('arraybuffer'));
writeFileSync('/tmp/kbf-pdf-test/test-redesign-landscape.pdf', buf);
console.log('✓ /tmp/kbf-pdf-test/test-redesign-landscape.pdf geschreven');
