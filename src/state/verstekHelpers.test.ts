import { describe, it, expect } from "vitest";
import {
  relatiesVoorBlad,
  zijdeIsGekoppeld,
  gekoppeldeZijde,
  ongekoppeldeVerstekzijden,
  verstekConflicten,
} from "./verstekHelpers";
import type { Opname, Blad, VerstekRelatie } from "../data/seed-types";

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

function maakBlad(id: string, overrides?: Partial<Blad>): Blad {
  return {
    id,
    label: `Blad ${id}`,
    werkstukType: "Bladdeel A",
    categorie: "WB",
    lengte: 1000,
    breedte: 600,
    dikte: 20,
    randen: [],
    ...overrides,
  };
}

function maakOpname(overrides?: Partial<Opname>): Opname {
  return {
    ordernummer: "",
    datum: "2026-05-13",
    type: "OPDRACHTBEVESTIGING",
    status: "CONCEPT",
    verkoper: { naam: "", email: "", telefoon: "" },
    opdrachtgever: { naam: "", straat: "", postcodePlaats: "" },
    afleveradres: {
      naam: "",
      straat: "",
      postcodePlaats: "",
      gelijkAanOpdrachtgever: true,
      etage: "BEGANE GROND",
      klantRegeltLift: false,
    },
    materiaal: { soort: "COMPOSIET", producent: "VASTO", afwerking: "GEPOLIJST", kleur: "" },
    bladen: [],
    sparingen: [],
    accessoires: [],
    meting: { uitvoeren: false },
    levering: { uitvoeren: false },
    plaatsing: { uitvoeren: false },
    bijzonderheden: "",
    geactiveerdeClausules: [],
    ...overrides,
  } as Opname;
}

function maakRelatie(overrides?: Partial<VerstekRelatie>): VerstekRelatie {
  return {
    id: "rel-1",
    bladA_id: "A",
    zijdeA_id: "1",
    bladB_id: "B",
    zijdeB_id: "3",
    hoek_graden: 45,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1. Lege state — alle helpers returnen lege arrays of null
// ---------------------------------------------------------------------------

describe("Scenario 1 — lege state", () => {
  const state = maakOpname();

  it("relatiesVoorBlad → lege array", () => {
    expect(relatiesVoorBlad(state, "A")).toEqual([]);
  });

  it("zijdeIsGekoppeld → false", () => {
    expect(zijdeIsGekoppeld(state, "A", "0")).toBe(false);
  });

  it("gekoppeldeZijde → null", () => {
    expect(gekoppeldeZijde(state, "A", "0")).toBeNull();
  });

  it("ongekoppeldeVerstekzijden → lege array", () => {
    expect(ongekoppeldeVerstekzijden(state)).toEqual([]);
  });

  it("verstekConflicten → lege array", () => {
    expect(verstekConflicten(state)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 2. Eén relatie A↔B
// ---------------------------------------------------------------------------

describe("Scenario 2 — één relatie A↔B", () => {
  const bladA = maakBlad("A", {
    randafwerkingen: [{ zijdeId: "1", code: "verstek", label: "Verstek (koppeling)", type: "VERSTEK", verstek: true }],
  });
  const bladB = maakBlad("B", {
    randafwerkingen: [{ zijdeId: "3", code: "verstek", label: "Verstek (koppeling)", type: "VERSTEK", verstek: true }],
  });
  const relatie = maakRelatie();
  const state = maakOpname({ bladen: [bladA, bladB], verstekRelaties: [relatie] });

  it("relatiesVoorBlad(A) bevat de relatie", () => {
    const result = relatiesVoorBlad(state, "A");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("rel-1");
  });

  it("relatiesVoorBlad(B) bevat dezelfde relatie", () => {
    const result = relatiesVoorBlad(state, "B");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("rel-1");
  });

  it("relatiesVoorBlad(C) = lege array (blad niet betrokken)", () => {
    expect(relatiesVoorBlad(state, "C")).toEqual([]);
  });

  it("zijdeIsGekoppeld(A, zijdeA) = true", () => {
    expect(zijdeIsGekoppeld(state, "A", "1")).toBe(true);
  });

  it("zijdeIsGekoppeld(B, zijdeB) = true", () => {
    expect(zijdeIsGekoppeld(state, "B", "3")).toBe(true);
  });

  it("zijdeIsGekoppeld(A, andere zijde) = false", () => {
    expect(zijdeIsGekoppeld(state, "A", "0")).toBe(false);
  });

  it("gekoppeldeZijde(A, zijdeA) retourneert B + zijdeB + naam", () => {
    const result = gekoppeldeZijde(state, "A", "1");
    expect(result).not.toBeNull();
    expect(result!.bladId).toBe("B");
    expect(result!.zijdeId).toBe("3");
    expect(result!.bladNaam).toBe("Blad B");
  });

  it("gekoppeldeZijde(B, zijdeB) retourneert A + zijdeA + naam (symmetrisch)", () => {
    const result = gekoppeldeZijde(state, "B", "3");
    expect(result).not.toBeNull();
    expect(result!.bladId).toBe("A");
    expect(result!.zijdeId).toBe("1");
    expect(result!.bladNaam).toBe("Blad A");
  });

  it("ongekoppeldeVerstekzijden = lege array (beide zijden gekoppeld)", () => {
    expect(ongekoppeldeVerstekzijden(state)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 3. Cascade-delete aftermath: B verwijderd, relatie weg, verstek=true blijft
// ---------------------------------------------------------------------------

describe("Scenario 3 — cascade-delete aftermath", () => {
  const bladA = maakBlad("A", {
    randafwerkingen: [{ zijdeId: "1", code: "verstek", label: "Verstek (koppeling)", type: "VERSTEK", verstek: true }],
  });
  // Blad B is verwijderd; relatie is ook weg (cascade)
  const state = maakOpname({ bladen: [bladA], verstekRelaties: [] });

  it("zijdeIsGekoppeld(A, 1) = false na cascade-delete", () => {
    expect(zijdeIsGekoppeld(state, "A", "1")).toBe(false);
  });

  it("ongekoppeldeVerstekzijden bevat zijde A/1", () => {
    const result = ongekoppeldeVerstekzijden(state);
    expect(result).toHaveLength(1);
    expect(result[0].bladId).toBe("A");
    expect(result[0].zijdeId).toBe("1");
    expect(result[0].bladNaam).toBe("Blad A");
  });

  it("gekoppeldeZijde → null (geen relatie meer)", () => {
    expect(gekoppeldeZijde(state, "A", "1")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 3b. Dangling reference: relatie verwijst naar blad dat niet meer bestaat
// ---------------------------------------------------------------------------

describe("Scenario 3b — dangling reference (blad niet meer in state)", () => {
  const bladA = maakBlad("A");
  // Relatie verwijst naar bladB dat niet in state.bladen zit
  const relatie = maakRelatie({ bladA_id: "A", zijdeA_id: "1", bladB_id: "GHOST", zijdeB_id: "0" });
  const state = maakOpname({ bladen: [bladA], verstekRelaties: [relatie] });

  it("gekoppeldeZijde → null (ander blad bestaat niet meer)", () => {
    expect(gekoppeldeZijde(state, "A", "1")).toBeNull();
  });

  it("zijdeIsGekoppeld → true (relatie staat nog in state)", () => {
    // Relatie is nog aanwezig, ook al bestaat het blad niet meer
    expect(zijdeIsGekoppeld(state, "A", "1")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. DV+verstek conflict
// ---------------------------------------------------------------------------

describe("Scenario 4 — DV-code + verstek=true = conflict", () => {
  const blad = maakBlad("A", {
    randafwerkingen: [
      { zijdeId: "0", code: "DV40", label: "DV40", type: "VERSTEK", hoogte_mm: 40, verstek: true },
      { zijdeId: "1", code: "DV20", label: "DV20", type: "VERSTEK", hoogte_mm: 20, verstek: true },
    ],
  });
  const state = maakOpname({ bladen: [blad] });

  it("verstekConflicten bevat DV40 en DV20", () => {
    const result = verstekConflicten(state);
    expect(result).toHaveLength(2);
    expect(result.map(c => c.code)).toContain("DV40");
    expect(result.map(c => c.code)).toContain("DV20");
  });

  it("conflict bevat bladId en zijdeId", () => {
    const result = verstekConflicten(state);
    expect(result[0].bladId).toBe("A");
  });
});

// ---------------------------------------------------------------------------
// 5. T1+verstek = geen conflict
// ---------------------------------------------------------------------------

describe("Scenario 5 — T1-EF + verstek=true is GEEN conflict", () => {
  const blad = maakBlad("A", {
    randafwerkingen: [
      { zijdeId: "0", code: "T1-EF", label: "T1 enkel facet", type: "FACET", verstek: true },
      { zijdeId: "1", code: "KF", label: "Klein facet", type: "FACET", verstek: true },
    ],
  });
  const state = maakOpname({ bladen: [blad] });

  it("verstekConflicten = lege array (T1 en KF zijn geen DV-codes)", () => {
    expect(verstekConflicten(state)).toEqual([]);
  });

  it("ongekoppeldeVerstekzijden bevat beide zijden (verstek=true, niet gekoppeld)", () => {
    const result = ongekoppeldeVerstekzijden(state);
    expect(result).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// 6. verstek=false maar code='verstek' — helpers gebruiken alleen de vlag
// ---------------------------------------------------------------------------

describe("Scenario 6 — verstek=false maar code='verstek' telt NIET mee", () => {
  const blad = maakBlad("A", {
    randafwerkingen: [
      { zijdeId: "0", code: "verstek", label: "Verstek (koppeling)", type: "VERSTEK", verstek: false },
    ],
  });
  const state = maakOpname({ bladen: [blad] });

  it("ongekoppeldeVerstekzijden = lege array (verstek=false)", () => {
    expect(ongekoppeldeVerstekzijden(state)).toEqual([]);
  });

  it("verstekConflicten = lege array (code='verstek' begint niet met 'DV')", () => {
    expect(verstekConflicten(state)).toEqual([]);
  });
});
