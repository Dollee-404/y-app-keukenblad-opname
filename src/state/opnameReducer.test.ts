import { describe, it, expect } from "vitest";
import { legeInitialState as initialState, opnameReducer } from "./opnameReducer";
import type { MateriaalKeuze, Randafwerking, AccessoireRegel, Blad } from "../data/seed-types";

describe("opnameReducer", () => {
  it("initial state heeft lege opname", () => {
    expect(initialState.bladen).toEqual([]);
    expect(initialState.status).toBe("CONCEPT");
    expect(initialState.afleveradres.gelijkAanOpdrachtgever).toBe(true);
  });

  it("SET_AFLEVER_GELIJK_AAN_OPDRACHTGEVER true kopieert opdrachtgever", () => {
    const metOpdrachtgever = opnameReducer(initialState, {
      type: "SET_OPDRACHTGEVER",
      payload: { naam: "Test BV", straat: "Teststraat 1", postcodePlaats: "1234 AB Teststad" },
    });
    const result = opnameReducer(
      { ...metOpdrachtgever, afleveradres: { ...metOpdrachtgever.afleveradres, gelijkAanOpdrachtgever: false } },
      { type: "SET_AFLEVER_GELIJK_AAN_OPDRACHTGEVER", payload: true }
    );
    expect(result.afleveradres.naam).toBe("Test BV");
    expect(result.afleveradres.straat).toBe("Teststraat 1");
    expect(result.afleveradres.gelijkAanOpdrachtgever).toBe(true);
  });

  it("SET_OPDRACHTGEVER synct afleveradres als gelijkAanOpdrachtgever true is", () => {
    const result = opnameReducer(initialState, {
      type: "SET_OPDRACHTGEVER",
      payload: { naam: "Janssen & Zn", straat: "Dorpstraat 5", postcodePlaats: "5678 CD Dorp" },
    });
    expect(result.opdrachtgever.naam).toBe("Janssen & Zn");
    expect(result.afleveradres.naam).toBe("Janssen & Zn");
    expect(result.afleveradres.straat).toBe("Dorpstraat 5");
  });

  it("SET_OPDRACHTGEVER synct NIET als gelijkAanOpdrachtgever false is", () => {
    const metLoosAflevering = {
      ...initialState,
      afleveradres: { ...initialState.afleveradres, gelijkAanOpdrachtgever: false, naam: "Apart adres" },
    };
    const result = opnameReducer(metLoosAflevering, {
      type: "SET_OPDRACHTGEVER",
      payload: { naam: "Andere klant" },
    });
    expect(result.opdrachtgever.naam).toBe("Andere klant");
    expect(result.afleveradres.naam).toBe("Apart adres");
  });

  it("SET_VERKOPER werkt", () => {
    const result = opnameReducer(initialState, {
      type: "SET_VERKOPER",
      payload: { naam: "Rob", email: "rob@kbf.nl", telefoon: "0123456789" },
    });
    expect(result.verkoper.naam).toBe("Rob");
  });

  it("SET_UW_REFERENTIE werkt", () => {
    const result = opnameReducer(initialState, {
      type: "SET_UW_REFERENTIE",
      payload: "ZIJLMANS - VAN VLIMMEREN",
    });
    expect(result.uwReferentie).toBe("ZIJLMANS - VAN VLIMMEREN");
  });
});

describe("opnameReducer — bladen", () => {
  const testBlad = {
    id: "b-1",
    label: "BLAD A",
    werkstukType: "Bladdeel A" as const,
    categorie: "WB" as const,
    lengte: 1958,
    breedte: 1001,
    dikte: 20 as const,
    randen: [],
  };

  it("BLAD_TOEVOEGEN voegt blad toe", () => {
    const result = opnameReducer(initialState, { type: "BLAD_TOEVOEGEN", blad: testBlad });
    expect(result.bladen).toHaveLength(1);
    expect(result.bladen[0].id).toBe("b-1");
  });

  it("BLAD_VERWIJDEREN verwijdert het juiste blad", () => {
    const metBlad = opnameReducer(initialState, { type: "BLAD_TOEVOEGEN", blad: testBlad });
    const result = opnameReducer(metBlad, { type: "BLAD_VERWIJDEREN", id: "b-1" });
    expect(result.bladen).toHaveLength(0);
  });

  it("BLAD_VERWIJDEREN laat andere bladen intact", () => {
    const blad2 = { ...testBlad, id: "b-2", label: "BLAD B" };
    let s = opnameReducer(initialState, { type: "BLAD_TOEVOEGEN", blad: testBlad });
    s = opnameReducer(s, { type: "BLAD_TOEVOEGEN", blad: blad2 });
    s = opnameReducer(s, { type: "BLAD_VERWIJDEREN", id: "b-1" });
    expect(s.bladen).toHaveLength(1);
    expect(s.bladen[0].id).toBe("b-2");
  });

  it("BLAD_BIJWERKEN past alleen het opgegeven blad aan", () => {
    const metBlad = opnameReducer(initialState, { type: "BLAD_TOEVOEGEN", blad: testBlad });
    const result = opnameReducer(metBlad, {
      type: "BLAD_BIJWERKEN",
      id: "b-1",
      patch: { lengte: 2000 },
    });
    expect(result.bladen[0].lengte).toBe(2000);
    expect(result.bladen[0].breedte).toBe(1001);
  });
});

// ---- Sprint 4 actions ----

describe("MATERIAAL_INSTELLEN", () => {
  it("sets project-level materiaalKeuze", () => {
    const keuze: MateriaalKeuze = {
      soort: "DEKTON", dikte_mm: 12, kleur_code: "SIRIUS", kleur_label: "Sirius",
    };
    const result = opnameReducer(initialState, { type: "MATERIAAL_INSTELLEN", keuze });
    expect(result.materiaalKeuze).toEqual(keuze);
  });
});

describe("BLAD_MATERIAAL_OVERRIDE", () => {
  const bladBase: Blad = {
    id: "P1", label: "A", werkstukType: "Bladdeel A", categorie: "WB",
    lengte: 1000, breedte: 600, dikte: 20, randen: [],
  };

  it("sets per-blad materiaalKeuze", () => {
    const state = { ...initialState, bladen: [bladBase] };
    const keuze: MateriaalKeuze = { soort: "COMPOSIET", dikte_mm: 20, kleur_code: "TIPO", kleur_label: "Tipo" };
    const result = opnameReducer(state, { type: "BLAD_MATERIAAL_OVERRIDE", bladId: "P1", keuze });
    expect(result.bladen[0].materiaalKeuze).toEqual(keuze);
  });

  it("clears override when keuze is null", () => {
    const blad = { ...bladBase, materiaalKeuze: { soort: "DEKTON" as const, dikte_mm: 12, kleur_code: "X", kleur_label: "X" } };
    const state = { ...initialState, bladen: [blad] };
    const result = opnameReducer(state, { type: "BLAD_MATERIAAL_OVERRIDE", bladId: "P1", keuze: null });
    expect(result.bladen[0].materiaalKeuze).toBeUndefined();
  });
});

describe("RANDAFWERKING_BIJWERKEN", () => {
  const bladBase: Blad = {
    id: "P1", label: "A", werkstukType: "Bladdeel A", categorie: "WB",
    lengte: 1000, breedte: 600, dikte: 20, randen: [],
  };

  it("adds a randafwerking to a blade side", () => {
    const state = { ...initialState, bladen: [bladBase] };
    const ra: Randafwerking = { zijdeId: "2", code: "DV40", label: "DV40", type: "VERSTEK", hoogte_mm: 40 };
    const result = opnameReducer(state, { type: "RANDAFWERKING_BIJWERKEN", bladId: "P1", randafwerking: ra });
    expect(result.bladen[0].randafwerkingen).toEqual([ra]);
  });

  it("replaces existing randafwerking for same zijdeId", () => {
    const ra1: Randafwerking = { zijdeId: "0", code: "T1-EF", label: "T1 enkel facet", type: "FACET" };
    const ra2: Randafwerking = { zijdeId: "0", code: "DV40", label: "DV40", type: "VERSTEK", hoogte_mm: 40 };
    const blad = { ...bladBase, randafwerkingen: [ra1] };
    const state = { ...initialState, bladen: [blad] };
    const result = opnameReducer(state, { type: "RANDAFWERKING_BIJWERKEN", bladId: "P1", randafwerking: ra2 });
    expect(result.bladen[0].randafwerkingen).toHaveLength(1);
    expect(result.bladen[0].randafwerkingen![0].code).toBe("DV40");
  });
});

describe("RANDAFWERKING_VERWIJDEREN", () => {
  it("removes randafwerking for zijdeId", () => {
    const ra: Randafwerking = { zijdeId: "1", code: "KF", label: "Klein facet", type: "FACET" };
    const blad: Blad = {
      id: "P1", label: "A", werkstukType: "Bladdeel A", categorie: "WB",
      lengte: 1000, breedte: 600, dikte: 20, randen: [], randafwerkingen: [ra],
    };
    const state = { ...initialState, bladen: [blad] };
    const result = opnameReducer(state, { type: "RANDAFWERKING_VERWIJDEREN", bladId: "P1", zijdeId: "1" });
    expect(result.bladen[0].randafwerkingen).toEqual([]);
  });
});

describe("ACCESSOIRE_TOEVOEGEN", () => {
  it("adds an accessoire to opname", () => {
    const regel: AccessoireRegel = { id: "acc-1", sku: "AFDEK30", naam: "Afdekprofiel 30mm", aantal: 2 };
    const result = opnameReducer(initialState, { type: "ACCESSOIRE_TOEVOEGEN", regel });
    expect(result.accessoires).toHaveLength(1);
    expect(result.accessoires[0].naam).toBe("Afdekprofiel 30mm");
  });

  it("merges catalog items with same SKU instead of adding a second row", () => {
    const r1: AccessoireRegel = { id: "acc-1", sku: "AFDEK30", naam: "Afdekprofiel 30mm", aantal: 1 };
    const state = { ...initialState, accessoires: [r1] };
    const r2: AccessoireRegel = { id: "acc-2", sku: "AFDEK30", naam: "Afdekprofiel 30mm", aantal: 1 };
    const result = opnameReducer(state, { type: "ACCESSOIRE_TOEVOEGEN", regel: r2 });
    expect(result.accessoires).toHaveLength(1);
    expect(result.accessoires[0].aantal).toBe(2);
  });

  it("always adds a new row for manual items (no SKU) even with same name", () => {
    const r1: AccessoireRegel = { id: "acc-1", naam: "Speciaal anker", aantal: 1 };
    const state = { ...initialState, accessoires: [r1] };
    const r2: AccessoireRegel = { id: "acc-2", naam: "Speciaal anker", aantal: 1 };
    const result = opnameReducer(state, { type: "ACCESSOIRE_TOEVOEGEN", regel: r2 });
    expect(result.accessoires).toHaveLength(2);
  });
});

describe("ACCESSOIRE_BIJWERKEN", () => {
  it("patches accessoire by id", () => {
    const regel: AccessoireRegel = { id: "acc-1", naam: "X", aantal: 1 };
    const state = { ...initialState, accessoires: [regel] };
    const result = opnameReducer(state, { type: "ACCESSOIRE_BIJWERKEN", id: "acc-1", patch: { aantal: 3 } });
    expect(result.accessoires[0].aantal).toBe(3);
  });
});

describe("ACCESSOIRE_VERWIJDEREN", () => {
  it("removes accessoire by id", () => {
    const regel: AccessoireRegel = { id: "acc-1", naam: "X", aantal: 1 };
    const state = { ...initialState, accessoires: [regel] };
    const result = opnameReducer(state, { type: "ACCESSOIRE_VERWIJDEREN", id: "acc-1" });
    expect(result.accessoires).toHaveLength(0);
  });
});
