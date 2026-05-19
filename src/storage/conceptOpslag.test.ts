import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  opslaanConcept,
  laadConcept,
  laadConceptInfo,
  markeerVerzonden,
  wisConcept,
  bestaatConcept,
} from './conceptOpslag';
import type { Opname } from '../data/seed-types';

// In-memory localStorage mock voor node-environment
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (k: string): string | null => store[k] ?? null,
  setItem: (k: string, v: string): void => { store[k] = v; },
  removeItem: (k: string): void => { delete store[k]; },
  clear: (): void => { Object.keys(store).forEach(k => delete store[k]); },
  key: (i: number): string | null => Object.keys(store)[i] ?? null,
  get length(): number { return Object.keys(store).length; },
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

const CONCEPT_KEY = 'kbf-opname-concept-v1';

function maakOpname(naam = 'Test Klant'): Opname {
  return {
    ordernummer: 'TEST-001',
    bladen: [],
    sparingen: [],
    accessoires: [],
    opdrachtgever: { naam, straat: '', postcodePlaats: '' },
    afleveradres: { naam: '', straat: '', postcodePlaats: '', gelijkAanOpdrachtgever: true, etage: '', klantRegeltLift: false },
  } as unknown as Opname;
}

beforeEach(() => {
  localStorageMock.clear();
  vi.restoreAllMocks();
});

// ─── opslaanConcept ───────────────────────────────────────────────────────────

describe('opslaanConcept', () => {
  it('slaat op onder vaste key kbf-opname-concept-v1', () => {
    opslaanConcept(maakOpname());
    expect(localStorageMock.getItem(CONCEPT_KEY)).not.toBeNull();
  });

  it('opgeslagen JSON bevat versie=1, opname, verzonden=false, laatstGewijzigd', () => {
    opslaanConcept(maakOpname('Familie Jansen'));
    const raw = localStorageMock.getItem(CONCEPT_KEY)!;
    const data = JSON.parse(raw);
    expect(data.versie).toBe(1);
    expect(data.verzonden).toBe(false);
    expect(typeof data.laatstGewijzigd).toBe('string');
    expect(data.opname.opdrachtgever.naam).toBe('Familie Jansen');
  });

  it('overschrijft vorig concept bij nieuwe aanroep', () => {
    opslaanConcept(maakOpname('Eerste'));
    opslaanConcept(maakOpname('Tweede'));
    const raw = localStorageMock.getItem(CONCEPT_KEY)!;
    const data = JSON.parse(raw);
    expect(data.opname.opdrachtgever.naam).toBe('Tweede');
  });

  it('logt warning maar gooit niet als localStorage blokkeerd', () => {
    const spy = vi.spyOn(localStorageMock, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => opslaanConcept(maakOpname())).not.toThrow();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[concept-opslag]'),
      expect.any(Error),
    );
    spy.mockRestore();
  });
});

// ─── laadConcept ──────────────────────────────────────────────────────────────

describe('laadConcept', () => {
  it('retourneert null als localStorage leeg is', () => {
    expect(laadConcept()).toBeNull();
  });

  it('retourneert de opgeslagen opname', () => {
    opslaanConcept(maakOpname('Fam. De Vries'));
    const result = laadConcept();
    expect(result).not.toBeNull();
    expect(result!.opdrachtgever.naam).toBe('Fam. De Vries');
  });

  it('retourneert null bij corrupt JSON', () => {
    localStorageMock.setItem(CONCEPT_KEY, '{geen json}');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(laadConcept()).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('retourneert null bij incompatibele versie en verwijdert de entry', () => {
    localStorageMock.setItem(CONCEPT_KEY, JSON.stringify({
      versie: 99,
      opname: maakOpname(),
      verzonden: false,
      laatstGewijzigd: '2025-01-01T00:00:00.000Z',
    }));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(laadConcept()).toBeNull();
    expect(localStorageMock.getItem(CONCEPT_KEY)).toBeNull();
  });
});

// ─── laadConceptInfo ──────────────────────────────────────────────────────────

describe('laadConceptInfo', () => {
  it('retourneert null als er niets opgeslagen is', () => {
    expect(laadConceptInfo()).toBeNull();
  });

  it('bevat opname, verzonden=false en laatstGewijzigd na opslaanConcept', () => {
    opslaanConcept(maakOpname('Test'));
    const info = laadConceptInfo();
    expect(info).not.toBeNull();
    expect(info!.verzonden).toBe(false);
    expect(typeof info!.laatstGewijzigd).toBe('string');
    expect(info!.opname.opdrachtgever.naam).toBe('Test');
  });

  it('leest verzonden=true na markeerVerzonden', () => {
    opslaanConcept(maakOpname());
    markeerVerzonden();
    expect(laadConceptInfo()!.verzonden).toBe(true);
  });
});

// ─── markeerVerzonden ─────────────────────────────────────────────────────────

describe('markeerVerzonden', () => {
  it('zet verzonden op true zonder de opname te wissen', () => {
    opslaanConcept(maakOpname('Klant X'));
    markeerVerzonden();
    const info = laadConceptInfo();
    expect(info!.verzonden).toBe(true);
    expect(info!.opname.opdrachtgever.naam).toBe('Klant X');
  });

  it('is no-op als er geen concept in localStorage staat', () => {
    expect(() => markeerVerzonden()).not.toThrow();
  });

  it('is no-op bij incompatibele versie', () => {
    localStorageMock.setItem(CONCEPT_KEY, JSON.stringify({
      versie: 99,
      opname: maakOpname(),
      verzonden: false,
      laatstGewijzigd: '',
    }));
    expect(() => markeerVerzonden()).not.toThrow();
  });
});

// ─── wisConcept ───────────────────────────────────────────────────────────────

describe('wisConcept', () => {
  it('verwijdert het opgeslagen concept', () => {
    opslaanConcept(maakOpname());
    wisConcept();
    expect(localStorageMock.getItem(CONCEPT_KEY)).toBeNull();
  });

  it('is no-op als er niets staat', () => {
    expect(() => wisConcept()).not.toThrow();
  });
});

// ─── bestaatConcept ───────────────────────────────────────────────────────────

describe('bestaatConcept', () => {
  it('retourneert false als localStorage leeg is', () => {
    expect(bestaatConcept()).toBe(false);
  });

  it('retourneert true na opslaanConcept', () => {
    opslaanConcept(maakOpname());
    expect(bestaatConcept()).toBe(true);
  });

  it('retourneert false na wisConcept', () => {
    opslaanConcept(maakOpname());
    wisConcept();
    expect(bestaatConcept()).toBe(false);
  });
});
