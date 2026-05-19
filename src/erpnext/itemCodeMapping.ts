import type { Blad, Opname, Sparing, Boorgat, Randafwerking } from '../data/seed-types.js';
import { effectiefMateriaalSoort } from '../state/helpers.js';

const MATERIAAL_NAAR_PREFIX: Record<string, string> = {
  COMPOSIET: 'COMPOSIET',
  SILESTONE: 'COMPOSIET',
  KWARTSCOMPOSIET: 'COMPOSIET',
  DEKTON: 'DEKTON',
  KERAMIEK: 'KERAMIEK',
  NEOLITH: 'KERAMIEK',
  GRANIET: 'GRANIET',
  MARMER: 'MARMER',
  KWARTSIET: 'KWARTSIET',
  SOFT_KWARTSIET: 'KWARTSIET',
  NATUURSTEEN: 'NATUURSTEEN',
};

export function materiaalPrefix(soort: string): string {
  const prefix = MATERIAAL_NAAR_PREFIX[soort.toUpperCase()];
  if (!prefix) throw new Error(`Onbekend materiaal '${soort}' — geen ERPNext prefix gevonden`);
  return prefix;
}

export function effectiefKleurCode(blad: Blad, opname: Opname): string {
  return (
    blad.materiaalKeuze?.kleur_code ??
    opname.materiaalKeuze?.kleur_code ??
    ''
  );
}

export function bladItemCode(blad: Blad, opname: Opname): string {
  const soort = effectiefMateriaalSoort(blad, opname);
  const prefix = materiaalPrefix(soort);
  const dikte = blad.dikte ?? opname.materiaalKeuze?.dikte_mm ?? 20;
  const kleur = effectiefKleurCode(blad, opname);
  if (!kleur) throw new Error(`Blad ${blad.id} heeft geen kleur — stel kleur in vóór verzenden`);
  return `${prefix}-BLAD-${dikte}MM-${kleur}`;
}

const SPARING_ITEM_CODES: Record<string, string> = {
  'SPOELBAK-ONDERBOUW': 'TOESLAG-SPARING-ONDERBOUW',
  'SPOELBAK-VLAKBOUW': 'TOESLAG-SPARING-VLAKBOUW',
  'SPOELBAK-OPBOUW': 'TOESLAG-SPARING-OPBOUW',
  'KOOKPLAAT-VLAKBOUW': 'TOESLAG-SPARING-KOOKPLAAT-VLAKBOUW',
  'KOOKPLAAT-OPBOUW': 'TOESLAG-SPARING-KOOKPLAAT-OPBOUW',
};

export function sparingItemCode(sparing: Sparing): string | null {
  if (sparing.type === 'HOEK') return 'TOESLAG-SPARING-HOEK';
  if (sparing.type === 'KOLOM') return 'TOESLAG-SPARING-KOLOM';
  if (sparing.type === 'KOOF') return 'TOESLAG-SPARING-KOOF';
  return SPARING_ITEM_CODES[`${sparing.type}-${sparing.inbouwwijze}`] ?? null;
}

const BOORGAT_ITEM_CODES: Record<string, string> = {
  KRAAN: 'TOESLAG-BOORGAT-KRAAN',
  QUOOKER: 'TOESLAG-BOORGAT-QUOOKER',
  ELEKTRA: 'TOESLAG-BOORGAT-ELEKTRA',
  DUBBELE_WCD: 'TOESLAG-BOORGAT-WCD',
};

export function boorgatItemCode(boorgat: Boorgat): string | null {
  return BOORGAT_ITEM_CODES[boorgat.doel] ?? null;
}

const RAND_CODE_NAAR_ITEM: Record<string, string> = {
  DV20: 'TOESLAG-RAND-DV20',
  DV30: 'TOESLAG-RAND-DV30',
  DV32: 'TOESLAG-RAND-DV40',
  DV38: 'TOESLAG-RAND-DV40',
  DV40: 'TOESLAG-RAND-DV40',
  DV42: 'TOESLAG-RAND-DV40',
  DV50: 'TOESLAG-RAND-DV40',
  'T1-EF': 'TOESLAG-RAND-T1',
  'A1-12': 'TOESLAG-RAND-T1',
  'A1-20': 'TOESLAG-RAND-T1',
  'A1-DF': 'TOESLAG-RAND-T1',
  'A1-DKF': 'TOESLAG-RAND-T1',
  T1: 'TOESLAG-RAND-T1',
  KF: 'TOESLAG-RAND-KF',
};

export function randItemCode(rand: Randafwerking): string | null {
  if (rand.type === 'GEEN') return null;
  if (rand.type === 'VERSTEK') return null; // verstekverbinding apart via TOESLAG-RAND-VERSTEK
  return RAND_CODE_NAAR_ITEM[rand.code.toUpperCase()] ?? null;
}
