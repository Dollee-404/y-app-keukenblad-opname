import { describe, it, expect } from "vitest";
import { initialState, opnameReducer } from "./opnameReducer";

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
