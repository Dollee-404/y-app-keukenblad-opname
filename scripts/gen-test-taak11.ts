/**
 * Test-script voor taak 11: zaagbrief PDF.
 *
 * Uitvoeren: npx tsx scripts/gen-test-taak11.ts
 * Output:    /tmp/kbf-pdf-test/taak11-*.pdf
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { genereerZaagbrief } from '../src/pdf/zaagbrief.js';
import type { Blad, Sparing, Opname } from '../src/data/seed-types.js';

mkdirSync('/tmp/kbf-pdf-test', { recursive: true });

const baseState = {
  ordernummer: '2600376',
  datum: '2026-02-16',
  type: 'OFFERTE',
  status: 'CONCEPT',
  opdrachtgever: {
    naam: 'Zijlmans Interieur op maat B.V.',
    straat: 'Zonnebloemlaan 10',
    postcodePlaats: 'Hoeven',
  },
  uwReferentie: 'ZIJLMANS - VAN VLIMMEREN',
  materiaalKeuze: { kleur_label: 'Glencoe Gepolijst', soort: '', dikte_mm: 20, kleur_code: '' },
  materiaal: { soort: 'Composiet', producent: '', afwerking: '', kleur: 'Glencoe Gepolijst' },
  accessoires: [],
  verstekRelaties: [],
} as const;

const bladA: Blad = {
  id: 'P1', label: 'BLAD A',
  werkstukType: 'Bladdeel A' as Blad['werkstukType'],
  categorie: 'WB' as Blad['categorie'],
  lengte: 1958, breedte: 1001, dikte: 20 as Blad['dikte'],
  randen: [],
  randafwerkingen: [
    { zijdeId: '0', code: 'DV40',  label: 'DV40',  type: 'FACET' as const },
    { zijdeId: '2', code: 'DV40',  label: 'DV40',  type: 'FACET' as const },
    { zijdeId: '3', code: 'DV40',  label: 'DV40',  type: 'FACET' as const },
    { zijdeId: '1', code: 'T1-EF', label: 'T1-EF', type: 'FACET' as const },
  ],
  materiaalcodeOverride: '20DV40',
} as unknown as Blad;

const bladB: Blad = {
  id: 'P2', label: 'ACHTERWAND',
  werkstukType: 'Achterwand' as Blad['werkstukType'],
  categorie: 'RW' as Blad['categorie'],
  lengte: 630, breedte: 604, dikte: 20 as Blad['dikte'],
  randen: [],
  randafwerkingen: [
    { zijdeId: '0', code: 'KF', label: 'KF', type: 'FACET' as const },
    { zijdeId: '2', code: 'KF', label: 'KF', type: 'FACET' as const },
  ],
  materiaalcodeOverride: '20DV40',
} as unknown as Blad;

const bladC: Blad = {
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
} as unknown as Blad;

const sparingKookplaat: Sparing = {
  id: 'sp-1', type: 'KOOKPLAAT' as Sparing['type'],
  bladId: 'P1', inbouwwijze: 'VLAKBOUW' as Sparing['inbouwwijze'],
  productMerk: 'Bora', productModel: 'C75',
  positie: { x: 1307, y: 500 },
  breedte: 764, hoogte: 519,
  vlakbouw: { breedteOnder: 740, hoogteOnder: 495, radiusMm: 5, tredeMm: 7 },
} as unknown as Sparing;

// ── Scenario 1: single-blad ───────────────────────────────────────────────────
const opname1 = {
  ...baseState, bladen: [bladA], sparingen: [sparingKookplaat],
} as unknown as Opname;

writeFileSync('/tmp/kbf-pdf-test/taak11-single.pdf',
  Buffer.from(await genereerZaagbrief(opname1).arrayBuffer()));
console.log('✓ taak11-single.pdf (1 pagina, 1 blad)');

// ── Scenario 2: multi-blad ───────────────────────────────────────────────────
const opname2 = {
  ...baseState, bladen: [bladA, bladB, bladC], sparingen: [sparingKookplaat],
} as unknown as Opname;

writeFileSync('/tmp/kbf-pdf-test/taak11-multi.pdf',
  Buffer.from(await genereerZaagbrief(opname2).arrayBuffer()));
console.log('✓ taak11-multi.pdf (multi-blad, auto-paginering)');
