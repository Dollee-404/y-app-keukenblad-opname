/**
 * Test-script voor taak 10: genereerWerkplaatstekening entrypoint.
 *
 * Uitvoeren: npx tsx scripts/gen-test-taak10.ts
 * Output:    /tmp/kbf-pdf-test/taak10-*.pdf
 *
 * Drie scenario's:
 *  1. single-blad  1958×1001 → 1 pagina landscape
 *  2. multi-blad   3 bladen (landscape, portrait, landscape) → 3 pagina's
 *  3. bladfilter   opname met 3 bladen, filter op 1 blad-id → 1 pagina
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { genereerWerkplaatstekening } from '../src/pdf/index.js';
import type { Blad, Sparing, Boorgat, Opname } from '../src/data/seed-types.js';

mkdirSync('/tmp/kbf-pdf-test', { recursive: true });

function blobToBuffer(blob: Blob): Promise<Buffer> {
  return blob.arrayBuffer().then(ab => Buffer.from(ab));
}

const baseState = {
  ordernummer: '2600376',
  datum: '2026-02-16',
  type: 'OFFERTE',
  status: 'CONCEPT',
  opdrachtgever: { naam: 'Zijlmans Interieur op maat B.V.', straat: '', postcodePlaats: '' },
  uwReferentie: 'ZIJLMANS - VAN VLIMMEREN',
  materiaalKeuze: { kleur_label: 'Glencoe Gepolijst', soort: '', dikte_mm: 20, kleur_code: '' },
  materiaal: { soort: '', producent: '', afwerking: '', kleur: 'Glencoe Gepolijst' },
  accessoires: [],
  verstekRelaties: [],
} as const;

const sparing: Sparing = {
  id: 'sp-1', type: 'KOOKPLAAT' as Sparing['type'],
  bladId: 'P1', inbouwwijze: 'VLAKBOUW' as Sparing['inbouwwijze'],
  productMerk: 'Bora', productModel: 'C75',
  positie: { x: 1307, y: 500 },
  breedte: 764, hoogte: 519,
  vlakbouw: { breedteOnder: 740, hoogteOnder: 495, radiusMm: 5, tredeMm: 7 },
} as unknown as Sparing;

const bladLandscape: Blad = {
  id: 'P1', label: 'BLAD A',
  werkstukType: 'Bladdeel A' as Blad['werkstukType'],
  categorie: 'WB' as Blad['categorie'],
  lengte: 1958, breedte: 1001, dikte: 20 as Blad['dikte'],
  randen: [],
  randafwerkingen: [
    { zijdeId: '0', code: 'DV40',  label: 'DV40',  type: 'FACET' as const },
    { zijdeId: '2', code: 'DV40',  label: 'DV40',  type: 'FACET' as const },
    { zijdeId: '3', code: 'T1-EF', label: 'T1-EF', type: 'FACET' as const },
    { zijdeId: '1', code: 'KF',    label: 'KF',    type: 'FACET' as const, verstek: true },
  ],
  materiaalcodeOverride: '20DV40',
  boorgaten: [
    {
      id: 'bg-1', bladId: 'P1', doel: 'KRAAN' as Boorgat['doel'],
      diameter: 35, doorboring: true, positie: { x: 979, y: 700 },
    } as unknown as Boorgat,
  ],
} as unknown as Blad;

const bladPortrait: Blad = {
  id: 'P2', label: 'ACHTERWAND',
  werkstukType: 'Achterwand' as Blad['werkstukType'],
  categorie: 'RW' as Blad['categorie'],
  lengte: 630, breedte: 604, dikte: 20 as Blad['dikte'],
  randen: [],
  randafwerkingen: [
    { zijdeId: '0', code: 'KF', label: 'KF', type: 'FACET' as const },
  ],
  materiaalcodeOverride: '20DV40',
  boorgaten: [],
} as unknown as Blad;

const bladLandscape2: Blad = {
  id: 'P3', label: 'VENSTERBANK',
  werkstukType: 'Vensterbank' as Blad['werkstukType'],
  categorie: 'VB' as Blad['categorie'],
  lengte: 2760, breedte: 600, dikte: 20 as Blad['dikte'],
  randen: [],
  randafwerkingen: [
    { zijdeId: '0', code: 'DV40', label: 'DV40', type: 'FACET' as const },
    { zijdeId: '2', code: 'DV40', label: 'DV40', type: 'FACET' as const },
  ],
  materiaalcodeOverride: '20DV40',
  boorgaten: [],
} as unknown as Blad;

// ── Scenario 1: single-blad landscape ────────────────────────────────────────
const opname1 = { ...baseState, bladen: [bladLandscape], sparingen: [sparing] } as unknown as Opname;
writeFileSync('/tmp/kbf-pdf-test/taak10-single-landscape.pdf',
  Buffer.from(await genereerWerkplaatstekening(opname1).arrayBuffer()));
console.log('✓ taak10-single-landscape.pdf (1 pagina, landscape)');

// ── Scenario 2: multi-blad (landscape + portrait + landscape) ────────────────
const opname2 = { ...baseState, bladen: [bladLandscape, bladPortrait, bladLandscape2], sparingen: [sparing] } as unknown as Opname;
writeFileSync('/tmp/kbf-pdf-test/taak10-multi-blad.pdf',
  Buffer.from(await genereerWerkplaatstekening(opname2).arrayBuffer()));
console.log("✓ taak10-multi-blad.pdf (3 pagina's: landscape, portrait, landscape)");

// ── Scenario 3: bladfilter — alleen P1 uit 3-bladenopname ────────────────────
writeFileSync('/tmp/kbf-pdf-test/taak10-bladfilter.pdf',
  Buffer.from(await genereerWerkplaatstekening(opname2, { bladIds: ['P1'] }).arrayBuffer()));
console.log('✓ taak10-bladfilter.pdf (1 pagina, alleen P1)');
