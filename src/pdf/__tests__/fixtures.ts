import type { Opname, Blad, Sparing } from '../../data/seed-types.js';
import { rechthoekOutline, knipHoekUit } from '../../drawing/bladHelpers.js';

const BASE_ADRES = { naam: 'Test Klant B.V.', straat: 'Teststraat 1', postcodePlaats: '1234 AB Teststad' };

function baseOpname(overrides: Partial<Opname> = {}): Opname {
  return {
    ordernummer: 'TEST-001',
    datum: '2026-05-18',
    type: 'OFFERTE',
    status: 'CONCEPT',
    verkoper: { naam: 'Test Verkoper', email: 'test@test.nl', telefoon: '0612345678' },
    opdrachtgever: BASE_ADRES,
    afleveradres: { ...BASE_ADRES, gelijkAanOpdrachtgever: true, etage: 'Begane grond', klantRegeltLift: false },
    materiaal: { soort: 'COMPOSIET', producent: 'VASTO', afwerking: 'GEPOLIJST', kleur: 'Glencoe Gepolijst' },
    materiaalKeuze: { soort: 'COMPOSIET', dikte_mm: 20, kleur_code: 'GG', kleur_label: 'Glencoe Gepolijst' },
    bladen: [],
    sparingen: [],
    accessoires: [],
    meting: { uitvoeren: true },
    levering: { uitvoeren: true },
    plaatsing: { uitvoeren: false },
    bijzonderheden: '',
    geactiveerdeClausules: [],
    ...overrides,
  } as unknown as Opname;
}

export function maakRechthoekBlad(overrides: Partial<Blad> = {}): Blad {
  return {
    id: 'blad-rechthoek',
    label: 'Bladdeel A',
    werkstukType: 'Bladdeel A',
    categorie: 'WB',
    lengte: 1958,
    breedte: 1001,
    dikte: 20,
    randen: [],
    randafwerkingen: [
      { zijdeId: '0', code: 'DV40', label: 'DV40', type: 'GEEN' },
      { zijdeId: '1', code: 'DV40', label: 'DV40', type: 'GEEN' },
      { zijdeId: '2', code: 'DV40', label: 'DV40', type: 'GEEN' },
      { zijdeId: '3', code: 'DV40', label: 'DV40', type: 'GEEN' },
    ],
    boorgaten: [
      { id: 'bg1', diameter: 7,  positie: { x: 200, y: 500 }, doel: 'KRAAN' },
      { id: 'bg2', diameter: 70, positie: { x: 250, y: 500 }, doel: 'KRAAN' },
    ],
    ...overrides,
  } as unknown as Blad;
}

export function maakKookplaatSparing(bladId: string): Sparing {
  return {
    id: 'sp-kookplaat',
    type: 'KOOKPLAAT',
    bladId,
    inbouwwijze: 'VLAKBOUW',
    productMerk: 'Bora',
    productModel: 'C75',
    positie: { x: 900, y: 500 },
    breedte: 760,
    hoogte: 460,
    vlakbouw: { breedteOnder: 790, hoogteOnder: 490, radiusMm: 3, tredeMm: 5 },
  };
}

export function maakLVormBlad(): Blad {
  const outline = knipHoekUit(rechthoekOutline(1958, 800), 1, 400, 800);
  return {
    id: 'blad-lvorm',
    label: 'Bladdeel A',
    werkstukType: 'Bladdeel A',
    categorie: 'WB',
    lengte: 1958,
    breedte: 800,
    dikte: 20,
    outline,
    randen: [],
    randafwerkingen: [
      { zijdeId: '0', code: 'DV40',  label: 'DV40',  type: 'GEEN' },
      { zijdeId: '1', code: 'T1-EF', label: 'T1-EF', type: 'GEEN' },
      { zijdeId: '2', code: 'A1-20', label: 'A1',    type: 'GEEN' },
    ],
    boorgaten: [],
  } as unknown as Blad;
}

export function maakRechthoekOpname(): Opname {
  const blad = maakRechthoekBlad();
  return baseOpname({
    ordernummer: 'TEST-RECHTHOEK',
    bladen: [blad],
    sparingen: [maakKookplaatSparing(blad.id)],
  });
}

export function maakLVormOpname(): Opname {
  return baseOpname({
    ordernummer: 'TEST-LVORM',
    bladen: [maakLVormBlad()],
  });
}

export function maakMultiBladOpname(): Opname {
  return baseOpname({
    ordernummer: 'TEST-MULTI',
    bladen: [
      maakRechthoekBlad({ id: 'blad-1', lengte: 1958, breedte: 1001, dikte: 20 }),
      maakRechthoekBlad({ id: 'blad-2', lengte: 630,  breedte: 604,  dikte: 20 }),
      maakRechthoekBlad({ id: 'blad-3', lengte: 2760, breedte: 600,  dikte: 20 }),
    ],
  });
}

export function maakLegeOpname(): Opname {
  return baseOpname({ ordernummer: 'TEST-LEEG', bladen: [] });
}

export async function pdfTekst(blob: Blob): Promise<string> {
  return new TextDecoder('latin1').decode(await blob.arrayBuffer());
}

export async function isPdf(blob: Blob): Promise<boolean> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46; // %PDF
}
