import { describe, it, expect, beforeEach } from "vitest";
import { saveConcept, loadConcept, listConcepts } from "./conceptStorage";
import type { Opname } from "../data/seed-types";

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

// Patch global localStorage voor alle tests
Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

// Minimale Opname voor tests
function maakOpname(overrides?: Partial<Opname>): Opname {
  return {
    bladen: [], sparingen: [], accessoires: [],
    opdrachtgever: { naam: "", straat: "", postcodePlaats: "" },
    afleveradres: { naam: "", straat: "", postcodePlaats: "", gelijkAanOpdrachtgever: false, etage: "", klantRegeltLift: false },
    ...overrides,
  } as unknown as Opname;
}

beforeEach(() => {
  localStorageMock.clear();
});

describe("saveConcept", () => {
  it("slaat op met key-format kbf-concept-{timestamp}", () => {
    const opname = maakOpname();
    const key = saveConcept(opname);
    expect(key).toMatch(/^kbf-concept-\d+$/);
  });

  it("retourneert de key", () => {
    const opname = maakOpname();
    const key = saveConcept(opname);
    expect(typeof key).toBe("string");
    expect(key.startsWith("kbf-concept-")).toBe(true);
  });

  it("JSON bevat version: 1, savedAt, customerName, state", () => {
    const opname = maakOpname();
    const key = saveConcept(opname);
    const raw = localStorage.getItem(key);
    expect(raw).not.toBeNull();
    const data = JSON.parse(raw!);
    expect(data.version).toBe(1);
    expect(typeof data.savedAt).toBe("string");
    expect(typeof data.customerName).toBe("string");
    expect(data.state).toBeDefined();
  });

  it("gebruikt opdrachtgever.naam als customerName", () => {
    const opname = maakOpname({ opdrachtgever: { naam: "Familie Jansen", straat: "", postcodePlaats: "" } });
    const key = saveConcept(opname);
    const raw = localStorage.getItem(key);
    const data = JSON.parse(raw!);
    expect(data.customerName).toBe("Familie Jansen");
  });

  it("valt terug op afleveradres.naam als opdrachtgever.naam leeg is", () => {
    const opname = maakOpname({
      opdrachtgever: { naam: "", straat: "", postcodePlaats: "" },
      afleveradres: { naam: "Bezorgadres BV", straat: "", postcodePlaats: "", gelijkAanOpdrachtgever: false, etage: "", klantRegeltLift: false },
    });
    const key = saveConcept(opname);
    const raw = localStorage.getItem(key);
    const data = JSON.parse(raw!);
    expect(data.customerName).toBe("Bezorgadres BV");
  });

  it("gebruikt 'Nog geen klant' als beide namen ontbreken", () => {
    const opname = maakOpname();
    const key = saveConcept(opname);
    const raw = localStorage.getItem(key);
    const data = JSON.parse(raw!);
    expect(data.customerName).toBe("Nog geen klant");
  });
});

describe("loadConcept", () => {
  it("retourneert de state na save", () => {
    const opname = maakOpname({ opdrachtgever: { naam: "Test Klant", straat: "", postcodePlaats: "" } });
    const key = saveConcept(opname);
    const loaded = loadConcept(key);
    expect(loaded).not.toBeNull();
    expect((loaded as Opname).opdrachtgever?.naam).toBe("Test Klant");
  });

  it("retourneert null voor onbekende key", () => {
    const result = loadConcept("kbf-concept-onbekend");
    expect(result).toBeNull();
  });

  it("retourneert null bij corrupted JSON", () => {
    localStorage.setItem("kbf-concept-corrupt", "{niet json}");
    const result = loadConcept("kbf-concept-corrupt");
    expect(result).toBeNull();
  });

  it("retourneert null bij verkeerde versie", () => {
    localStorage.setItem("kbf-concept-v2", JSON.stringify({ version: 2, state: {}, savedAt: "", customerName: "" }));
    const result = loadConcept("kbf-concept-v2");
    expect(result).toBeNull();
  });
});

describe("listConcepts", () => {
  it("retourneert lege array bij geen entries", () => {
    const result = listConcepts();
    expect(result).toEqual([]);
  });

  it("retourneert entries gesorteerd op savedAt descending", () => {
    localStorage.setItem("kbf-concept-1", JSON.stringify({
      version: 1,
      savedAt: "2024-01-01T10:00:00.000Z",
      customerName: "Vroeg",
      state: {},
    }));
    localStorage.setItem("kbf-concept-2", JSON.stringify({
      version: 1,
      savedAt: "2024-06-15T12:00:00.000Z",
      customerName: "Laat",
      state: {},
    }));
    const result = listConcepts();
    expect(result.length).toBe(2);
    expect(result[0].customerName).toBe("Laat");
    expect(result[1].customerName).toBe("Vroeg");
  });

  it("skipt entries zonder kbf-concept- prefix", () => {
    localStorage.setItem("kbf-concept-1", JSON.stringify({
      version: 1,
      savedAt: "2024-01-01T10:00:00.000Z",
      customerName: "Geldig",
      state: {},
    }));
    localStorage.setItem("andere-key", JSON.stringify({
      version: 1,
      savedAt: "2024-01-02T10:00:00.000Z",
      customerName: "Overgeslagen",
      state: {},
    }));
    const result = listConcepts();
    expect(result.length).toBe(1);
    expect(result[0].customerName).toBe("Geldig");
  });

  it("skipt entries met verkeerde versie", () => {
    localStorage.setItem("kbf-concept-v2", JSON.stringify({
      version: 2,
      savedAt: "2024-01-01T10:00:00.000Z",
      customerName: "Oud formaat",
      state: {},
    }));
    const result = listConcepts();
    expect(result).toEqual([]);
  });

  it("skipt entries met corrupted JSON", () => {
    localStorage.setItem("kbf-concept-kapot", "{geen json}");
    const result = listConcepts();
    expect(result).toEqual([]);
  });
});
