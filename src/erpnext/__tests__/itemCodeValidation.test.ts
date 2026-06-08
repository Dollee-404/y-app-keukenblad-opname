import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  laadGeldigeItemCodes,
  valideerItemCode,
  valideerOpname,
  resetItemCodeCache,
} from '../itemCodeValidation.js';
import type { Opname } from '../../data/seed-types.js';

// Vitest hoist — mockt zowel statische als dynamische imports van erpnextClient.js
vi.mock('../../erpnextClient.js', () => ({
  fetchList: vi.fn(),
}));

async function getBridgeMock() {
  const { fetchList } = await import('../../erpnextClient.js');
  return vi.mocked(fetchList);
}

const GELDIGE_CODES = [
  { item_code: 'COMPOSIET-BLAD-20MM' },
  { item_code: 'COMPOSIET-BLAD-12MM' },
  { item_code: 'DEKTON-BLAD-12MM' },
  { item_code: 'GRANIET-BLAD-20MM' },
];

beforeEach(async () => {
  resetItemCodeCache();
  const fetchList = await getBridgeMock();
  fetchList.mockReset();
  fetchList.mockResolvedValue(GELDIGE_CODES);
});

// ─── valideerItemCode ────────────────────────────────────────────────────────

describe('valideerItemCode', () => {
  it('is no-op als cache nog niet geladen is', () => {
    expect(() => valideerItemCode('ONBEKEND-BLAD-99MM-NIETS')).not.toThrow();
  });

  it('laat geldige code door na laden', async () => {
    await laadGeldigeItemCodes();
    expect(() => valideerItemCode('COMPOSIET-BLAD-20MM')).not.toThrow();
  });

  it('gooit fout voor code die niet in cache zit', async () => {
    await laadGeldigeItemCodes();
    expect(() => valideerItemCode('ONBEKEND-BLAD-20MM'))
      .toThrow('niet geconfigureerd in ERPNext');
  });

  it('foutmelding bevat de ongeldige code', async () => {
    await laadGeldigeItemCodes();
    expect(() => valideerItemCode('MARMER-BLAD-30MM'))
      .toThrow("'MARMER-BLAD-30MM'");
  });
});

// ─── laadGeldigeItemCodes — idempotentie ─────────────────────────────────────

describe('laadGeldigeItemCodes — idempotentie', () => {
  it('tweede aanroep doet geen tweede fetch', async () => {
    const fetchList = await getBridgeMock();
    await laadGeldigeItemCodes();
    await laadGeldigeItemCodes();
    expect(fetchList).toHaveBeenCalledTimes(1);
  });

  it('parallelle aanroepen bundelen op één fetch', async () => {
    const fetchList = await getBridgeMock();
    await Promise.all([
      laadGeldigeItemCodes(),
      laadGeldigeItemCodes(),
      laadGeldigeItemCodes(),
    ]);
    expect(fetchList).toHaveBeenCalledTimes(1);
  });

  it('na fout (bridge 404) wordt validatie overgeslagen en kan opnieuw worden geprobeerd', async () => {
    const fetchList = await getBridgeMock();
    fetchList.mockRejectedValueOnce(new Error('ERPNext API error: 404'));

    // Mag niet gooien — fout wordt geslokt zodat verzenden door kan gaan
    await expect(laadGeldigeItemCodes()).resolves.toBeUndefined();

    // Cache is null → valideerItemCode is no-op
    expect(() => valideerItemCode('ONBEKEND-BLAD-99MM')).not.toThrow();

    // loadingPromise is gereset — tweede poging doet nieuwe fetch
    fetchList.mockResolvedValue(GELDIGE_CODES);
    await laadGeldigeItemCodes();

    expect(fetchList).toHaveBeenCalledTimes(2);
    expect(() => valideerItemCode('COMPOSIET-BLAD-20MM')).not.toThrow();
  });

  it('na resetItemCodeCache() kan cache opnieuw geladen worden', async () => {
    const fetchList = await getBridgeMock();
    await laadGeldigeItemCodes();
    resetItemCodeCache();
    await laadGeldigeItemCodes();
    expect(fetchList).toHaveBeenCalledTimes(2);
  });
});

// ─── valideerOpname ──────────────────────────────────────────────────────────

describe('valideerOpname', () => {
  function maakOpname(kleur_code: string): Opname {
    return {
      ordernummer: 'TEST',
      datum: '2026-05-19',
      type: 'OFFERTE',
      status: 'CONCEPT',
      verkoper: { naam: '', email: '', telefoon: '' },
      opdrachtgever: { naam: 'Test', straat: '', postcodePlaats: '' },
      afleveradres: { naam: '', straat: '', postcodePlaats: '', gelijkAanOpdrachtgever: true, etage: '', klantRegeltLift: false },
      materiaal: { soort: 'COMPOSIET', producent: 'CAESARSTONE', afwerking: 'GEPOLIJST', kleur: '' },
      materiaalKeuze: { soort: 'COMPOSIET', dikte_mm: 20, kleur_code, kleur_label: kleur_code },
      bladen: [{ id: 'P1', label: 'BLAD A', werkstukType: 'Bladdeel A', categorie: 'WB', lengte: 2000, breedte: 600, dikte: 20, randen: [] }],
      sparingen: [],
      accessoires: [],
      meting: {} as never,
      levering: {} as never,
      plaatsing: {} as never,
      bijzonderheden: '',
      geactiveerdeClausules: [],
    } as unknown as Opname;
  }

  it('is no-op als cache niet geladen is', () => {
    expect(() => valideerOpname(maakOpname('GLENCOE'))).not.toThrow();
  });

  it('laat geldige opname door', async () => {
    await laadGeldigeItemCodes();
    // item_code = COMPOSIET-BLAD-20MM — kleur zit niet meer in item_code
    expect(() => valideerOpname(maakOpname('GLENCOE'))).not.toThrow();
  });

  it('laat opname door ongeacht kleur — kleur staat niet meer in item_code', async () => {
    await laadGeldigeItemCodes();
    // COMPOSIET-BLAD-20MM is geldig ongeacht welke kleur_code wordt meegegeven
    expect(() => valideerOpname(maakOpname('ONBEKENDEKLEUR'))).not.toThrow();
  });

  it('gooit specifieke fout als cache geladen maar leeg is', async () => {
    const fetchList = await getBridgeMock();
    fetchList.mockResolvedValue([]); // ERPNext geeft lege lijst terug
    await laadGeldigeItemCodes();
    expect(() => valideerOpname(maakOpname('GLENCOE')))
      .toThrow('nog geen keukenblad-items geconfigureerd');
  });
});
