import { describe, it, expect } from 'vitest';
import {
  materiaalPrefix,
  effectiefKleurCode,
  bladItemCode,
  sparingItemCode,
  boorgatItemCode,
  randItemCode,
} from '../itemCodeMapping.js';
import type { Blad, Opname, Sparing, Boorgat, Randafwerking } from '../../data/seed-types.js';

// ─── Minimale fixture-helpers ────────────────────────────────────────────────

function maakBlad(overrides: Partial<Blad> = {}): Blad {
  return {
    id: 'P1',
    label: 'BLAD A',
    werkstukType: 'Bladdeel A',
    categorie: 'WB',
    lengte: 2000,
    breedte: 600,
    dikte: 20,
    randen: [],
    ...overrides,
  } as Blad;
}

function maakOpname(overrides: Partial<Opname> = {}): Opname {
  return {
    ordernummer: 'TEST-001',
    datum: '2026-05-19',
    type: 'OFFERTE',
    status: 'CONCEPT',
    verkoper: { naam: 'Test', email: '', telefoon: '' },
    opdrachtgever: { naam: '', straat: '', postcodePlaats: '' },
    afleveradres: { naam: '', straat: '', postcodePlaats: '', gelijkAanOpdrachtgever: true, etage: '', klantRegeltLift: false },
    materiaal: { soort: 'COMPOSIET', producent: 'CAESARSTONE', afwerking: 'GEPOLIJST', kleur: '' },
    bladen: [],
    sparingen: [],
    accessoires: [],
    meting: { datum: '', tijdstip: '' } as never,
    levering: { datum: '', tijdstip: '' } as never,
    plaatsing: { datum: '', tijdstip: '' } as never,
    bijzonderheden: '',
    geactiveerdeClausules: [],
    ...overrides,
  } as unknown as Opname;
}

// ─── materiaalPrefix ─────────────────────────────────────────────────────────

describe('materiaalPrefix', () => {
  it.each([
    ['COMPOSIET', 'COMPOSIET'],
    ['SILESTONE', 'COMPOSIET'],
    ['KWARTSCOMPOSIET', 'COMPOSIET'],
    ['DEKTON', 'DEKTON'],
    ['KERAMIEK', 'KERAMIEK'],
    ['NEOLITH', 'KERAMIEK'],
    ['GRANIET', 'GRANIET'],
    ['MARMER', 'MARMER'],
    ['KWARTSIET', 'KWARTSIET'],
    ['SOFT_KWARTSIET', 'KWARTSIET'],
    ['NATUURSTEEN', 'NATUURSTEEN'],
  ])('%s → %s', (soort, expected) => {
    expect(materiaalPrefix(soort)).toBe(expected);
  });

  it('gooit fout bij onbekend materiaal', () => {
    expect(() => materiaalPrefix('ONBEKEND')).toThrow("Onbekend materiaal 'ONBEKEND'");
  });
});

// ─── effectiefKleurCode ──────────────────────────────────────────────────────

describe('effectiefKleurCode', () => {
  it('blad.materiaalKeuze.kleur_code heeft prioriteit', () => {
    const blad = maakBlad({ materiaalKeuze: { soort: 'COMPOSIET', dikte_mm: 20, kleur_code: 'GLENCOE', kleur_label: 'Glencoe' } });
    const opname = maakOpname({ materiaalKeuze: { soort: 'COMPOSIET', dikte_mm: 20, kleur_code: 'AERIS', kleur_label: 'Aeris' } });
    expect(effectiefKleurCode(blad, opname)).toBe('GLENCOE');
  });

  it('valt terug op opname.materiaalKeuze.kleur_code', () => {
    const blad = maakBlad();
    const opname = maakOpname({ materiaalKeuze: { soort: 'COMPOSIET', dikte_mm: 20, kleur_code: 'AERIS', kleur_label: 'Aeris' } });
    expect(effectiefKleurCode(blad, opname)).toBe('AERIS');
  });

  it('geeft lege string als geen kleur', () => {
    expect(effectiefKleurCode(maakBlad(), maakOpname())).toBe('');
  });
});

// ─── bladItemCode ────────────────────────────────────────────────────────────

describe('bladItemCode', () => {
  it('bouwt correcte item code voor composiet zonder kleur-suffix', () => {
    const blad = maakBlad({ dikte: 20 });
    const opname = maakOpname({ materiaalKeuze: { soort: 'COMPOSIET', dikte_mm: 20, kleur_code: 'GLENCOE', kleur_label: 'Glencoe' } });
    expect(bladItemCode(blad, opname)).toBe('COMPOSIET-BLAD-20MM');
  });

  it('Silestone wordt als COMPOSIET prefix gemapped', () => {
    const blad = maakBlad({
      dikte: 12,
      materiaalKeuze: { soort: 'SILESTONE', dikte_mm: 12, kleur_code: 'AERIS', kleur_label: 'Aeris' },
    });
    expect(bladItemCode(blad, maakOpname())).toBe('COMPOSIET-BLAD-12MM');
  });

  it('gebruikt blad.dikte als beschikbaar', () => {
    const blad = maakBlad({ dikte: 30, materiaalKeuze: { soort: 'GRANIET', dikte_mm: 30, kleur_code: 'STARGALAXY', kleur_label: 'Star Galaxy' } });
    expect(bladItemCode(blad, maakOpname())).toBe('GRANIET-BLAD-30MM');
  });
});

describe('bladItemCode — geen kleur-suffix', () => {
  it('genereert template code zonder kleur voor DEKTON blad', () => {
    const blad = maakBlad({
      dikte: 30,
      materiaalKeuze: { soort: 'DEKTON', dikte_mm: 30, kleur_code: 'KEON', kleur_label: 'Keon' },
    });
    const opname = maakOpname({ materiaalKeuze: undefined });
    expect(bladItemCode(blad, opname)).toBe('DEKTON-BLAD-30MM');
  });

  it('genereert template code zonder kleur voor COMPOSIET blad', () => {
    const blad = maakBlad({ dikte: 20 });
    const opname = maakOpname({
      materiaalKeuze: { soort: 'COMPOSIET', dikte_mm: 20, kleur_code: 'ADAMINA', kleur_label: 'Adamina' },
    });
    expect(bladItemCode(blad, opname)).toBe('COMPOSIET-BLAD-20MM');
  });

  it('gooit niet bij ontbrekende kleur — kleur is niet meer vereist voor item_code', () => {
    const blad = maakBlad({ dikte: 20 });
    const opname = maakOpname({
      materiaalKeuze: { soort: 'GRANIET', dikte_mm: 20 } as never,
    });
    expect(() => bladItemCode(blad, opname)).not.toThrow();
    expect(bladItemCode(blad, opname)).toBe('GRANIET-BLAD-20MM');
  });
});

// ─── sparingItemCode ─────────────────────────────────────────────────────────

describe('sparingItemCode', () => {
  function sparing(type: Sparing['type'], inbouwwijze: Sparing['inbouwwijze']): Sparing {
    return { id: 's1', type, inbouwwijze, bladId: 'P1', positie: { x: 0, y: 0 } } as Sparing;
  }

  it.each([
    ['SPOELBAK', 'ONDERBOUW', 'TOESLAG-SPARING-ONDERBOUW'],
    ['SPOELBAK', 'VLAKBOUW', 'TOESLAG-SPARING-VLAKBOUW'],
    ['SPOELBAK', 'OPBOUW', 'TOESLAG-SPARING-OPBOUW'],
    ['KOOKPLAAT', 'VLAKBOUW', 'TOESLAG-SPARING-KOOKPLAAT-VLAKBOUW'],
    ['KOOKPLAAT', 'OPBOUW', 'TOESLAG-SPARING-KOOKPLAAT-OPBOUW'],
  ] as const)('%s/%s → %s', (type, inbouw, expected) => {
    expect(sparingItemCode(sparing(type, inbouw))).toBe(expected);
  });

  it('HOEK → TOESLAG-SPARING-HOEK', () => {
    expect(sparingItemCode(sparing('HOEK', 'VLAKBOUW'))).toBe('TOESLAG-SPARING-HOEK');
  });

  it('KOLOM → TOESLAG-SPARING-KOLOM', () => {
    expect(sparingItemCode(sparing('KOLOM', 'VLAKBOUW'))).toBe('TOESLAG-SPARING-KOLOM');
  });

  it('KOOF → TOESLAG-SPARING-KOOF', () => {
    expect(sparingItemCode(sparing('KOOF', 'VLAKBOUW'))).toBe('TOESLAG-SPARING-KOOF');
  });

  it('onbekende combinatie geeft null', () => {
    expect(sparingItemCode(sparing('KOOKPLAAT', 'NIS'))).toBeNull();
  });
});

// ─── boorgatItemCode ─────────────────────────────────────────────────────────

describe('boorgatItemCode', () => {
  function boorgat(doel: Boorgat['doel']): Boorgat {
    return { id: 'b1', bladId: 'P1', doel, diameter: 35, doorboring: false, positie: { x: 0, y: 0 } };
  }

  it.each([
    ['KRAAN', 'TOESLAG-BOORGAT-KRAAN'],
    ['QUOOKER', 'TOESLAG-BOORGAT-QUOOKER'],
    ['ELEKTRA', 'TOESLAG-BOORGAT-ELEKTRA'],
    ['DUBBELE_WCD', 'TOESLAG-BOORGAT-WCD'],
  ] as const)('%s → %s', (doel, expected) => {
    expect(boorgatItemCode(boorgat(doel))).toBe(expected);
  });

  it.each(['ZEEPPOMP', 'DOWNDRAFT', 'DOORVOER', 'OVERIG'] as const)(
    '%s → null (niet in ERPNext)',
    (doel) => {
      expect(boorgatItemCode(boorgat(doel))).toBeNull();
    }
  );
});

// ─── randItemCode ─────────────────────────────────────────────────────────────

describe('randItemCode', () => {
  function rand(code: string, type: Randafwerking['type'] = 'FACET'): Randafwerking {
    return { zijdeId: '0', code, label: code, type };
  }

  it.each([
    ['DV20', 'TOESLAG-RAND-DV20'],
    ['DV30', 'TOESLAG-RAND-DV30'],
    ['DV40', 'TOESLAG-RAND-DV40'],
    ['DV38', 'TOESLAG-RAND-DV40'],
    ['DV42', 'TOESLAG-RAND-DV40'],
    ['T1-EF', 'TOESLAG-RAND-T1'],
    ['A1-12', 'TOESLAG-RAND-T1'],
    ['KF', 'TOESLAG-RAND-KF'],
  ])('%s → %s', (code, expected) => {
    expect(randItemCode(rand(code))).toBe(expected);
  });

  it('GEEN type → null', () => {
    expect(randItemCode(rand('DV20', 'GEEN'))).toBeNull();
  });

  it('VERSTEK type → null (apart afgerekend)', () => {
    expect(randItemCode(rand('VERSTEK', 'VERSTEK'))).toBeNull();
  });

  it('onbekende code → null', () => {
    expect(randItemCode(rand('ONBEKEND'))).toBeNull();
  });
});
