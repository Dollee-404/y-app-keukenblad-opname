import { describe, it, expect } from "vitest";
import {
  effectiefMateriaalSoort,
  oppervlakteM2,
  totaalM2,
  totaalAccessoires,
  bladenMetIncompleteRandafwerking,
  globaleWaarschuwingen,
} from "./helpers";
import type { Blad, Opname } from "../data/seed-types";

function maakBlad(overrides?: Partial<Blad>): Blad {
  return {
    id: "b1", label: "Test", werkstukType: "Bladdeel A", categorie: "WB",
    lengte: 1000, breedte: 600, dikte: 20, randen: [],
    ...overrides,
  };
}

function maakState(overrides?: Partial<Opname>): Pick<Opname, "materiaal" | "materiaalKeuze"> {
  return {
    materiaal: undefined as unknown as Opname["materiaal"],
    materiaalKeuze: undefined,
    ...overrides,
  };
}

describe("effectiefMateriaalSoort", () => {
  it("falls back to COMPOSIET when blad and state have no materiaal", () => {
    const blad = maakBlad();
    const state = maakState();
    expect(effectiefMateriaalSoort(blad, state as Opname)).toBe("COMPOSIET");
  });

  it("uses state.materiaalKeuze.soort when no override is set", () => {
    const blad = maakBlad();
    const state = maakState({ materiaalKeuze: { soort: "DEKTON", dikte_mm: 20, kleur_code: "X", kleur_label: "X" } });
    expect(effectiefMateriaalSoort(blad, state as Opname)).toBe("DEKTON");
  });

  it("blad.materiaalKeuze overrides state.materiaalKeuze", () => {
    const blad = maakBlad({ materiaalKeuze: { soort: "DEKTON", dikte_mm: 12, kleur_code: "SIRIUS", kleur_label: "Sirius" } });
    const state = maakState({ materiaalKeuze: { soort: "COMPOSIET", dikte_mm: 20, kleur_code: "X", kleur_label: "X" } });
    expect(effectiefMateriaalSoort(blad, state as Opname)).toBe("DEKTON");
  });

  it("returns blad.materiaalKeuze.soort regardless of state", () => {
    const blad = maakBlad({ materiaalKeuze: { soort: "KERAMIEK", dikte_mm: 6, kleur_code: "Y", kleur_label: "Y" } });
    const state = maakState();
    expect(effectiefMateriaalSoort(blad, state as Opname)).toBe("KERAMIEK");
  });

  it("falls back to state.materiaal.soort (sprint-3 field) when materiaalKeuze absent", () => {
    const blad = maakBlad();
    const state = maakState({ materiaal: { soort: "GRANIET" } as Opname["materiaal"] });
    expect(effectiefMateriaalSoort(blad, state as Opname)).toBe("GRANIET");
  });

  it("uses blad.materiaalOverride.soort (sprint-3 field) ahead of state fields", () => {
    const blad = maakBlad({ materiaalOverride: { soort: "MARMER" } });
    const state = maakState({ materiaalKeuze: { soort: "COMPOSIET", dikte_mm: 20, kleur_code: "X", kleur_label: "X" } });
    expect(effectiefMateriaalSoort(blad, state as Opname)).toBe("MARMER");
  });
});

// L-vorm outline: 6 punten CW, SVG-coördinaten
// Totale bounding box 1958×800 = 1.5664 m², minus cutout (1958-1200)×400 = 0.3032 m²
// Netto oppervlak = 1.5664 - 0.3032 = 1.2632 m²
const L_OUTLINE = [
  { x: 0, y: 0 }, { x: 1200, y: 0 }, { x: 1200, y: 400 },
  { x: 1958, y: 400 }, { x: 1958, y: 800 }, { x: 0, y: 800 },
];

function maakVolledigeOpname(overrides?: Partial<Opname>): Opname {
  return {
    bladen: [],
    accessoires: [],
    materiaalKeuze: { soort: "COMPOSIET", dikte_mm: 20, kleur_code: "WIT", kleur_label: "Wit" },
    materiaal: undefined as unknown as Opname["materiaal"],
    ...overrides,
  } as Opname;
}

describe("oppervlakteM2", () => {
  it("rechthoek 1000×600 = 0.6 m²", () => {
    const blad = maakBlad({ lengte: 1000, breedte: 600 });
    expect(oppervlakteM2(blad)).toBeCloseTo(0.6, 6);
  });

  it("L-vorm met bekende outline = 1.2632 m²", () => {
    const blad = maakBlad({ outline: L_OUTLINE });
    expect(oppervlakteM2(blad)).toBeCloseTo(1.2632, 4);
  });
});

describe("totaalM2", () => {
  it("lege state = 0", () => {
    const state = maakVolledigeOpname({ bladen: [] });
    expect(totaalM2(state)).toBe(0);
  });

  it("state met 2 rechthoekbladen = som van oppervlakten", () => {
    const b1 = maakBlad({ id: "b1", lengte: 1000, breedte: 600 }); // 0.6 m²
    const b2 = maakBlad({ id: "b2", lengte: 2000, breedte: 500 }); // 1.0 m²
    const state = maakVolledigeOpname({ bladen: [b1, b2] });
    expect(totaalM2(state)).toBeCloseTo(1.6, 6);
  });
});

describe("totaalAccessoires", () => {
  it("leeg = 0", () => {
    const state = maakVolledigeOpname({ accessoires: [] });
    expect(totaalAccessoires(state)).toBe(0);
  });

  it("3 regels met aantal 2+1+3 = 6", () => {
    const state = maakVolledigeOpname({
      accessoires: [
        { id: "a1", naam: "Rand", aantal: 2 },
        { id: "a2", naam: "Sparing", aantal: 1 },
        { id: "a3", naam: "Boor", aantal: 3 },
      ],
    });
    expect(totaalAccessoires(state)).toBe(6);
  });
});

describe("bladenMetIncompleteRandafwerking", () => {
  it("rechthoek met 0 van 4 randafwerkingen → incompleet", () => {
    const blad = maakBlad({ randafwerkingen: [] });
    const state = maakVolledigeOpname({ bladen: [blad] });
    expect(bladenMetIncompleteRandafwerking(state)).toHaveLength(1);
  });

  it("rechthoek met 4/4 randafwerkingen → compleet", () => {
    const blad = maakBlad({
      randafwerkingen: [
        { zijdeId: "0", code: "DV40", label: "DV40" },
        { zijdeId: "1", code: "DV40", label: "DV40" },
        { zijdeId: "2", code: "DV40", label: "DV40" },
        { zijdeId: "3", code: "DV40", label: "DV40" },
      ],
    });
    const state = maakVolledigeOpname({ bladen: [blad] });
    expect(bladenMetIncompleteRandafwerking(state)).toHaveLength(0);
  });

  it("L-vorm (6 zijden) met 4/6 randafwerkingen → incompleet", () => {
    const blad = maakBlad({
      outline: L_OUTLINE,
      randafwerkingen: [
        { zijdeId: "0", code: "DV40", label: "DV40" },
        { zijdeId: "1", code: "DV40", label: "DV40" },
        { zijdeId: "2", code: "DV40", label: "DV40" },
        { zijdeId: "3", code: "DV40", label: "DV40" },
      ],
    });
    const state = maakVolledigeOpname({ bladen: [blad] });
    expect(bladenMetIncompleteRandafwerking(state)).toHaveLength(1);
  });
});

describe("globaleWaarschuwingen", () => {
  it("lege state (geen kleur) → [\"Geen kleur gekozen\"]", () => {
    const state = maakVolledigeOpname({ bladen: [], materiaalKeuze: undefined });
    expect(globaleWaarschuwingen(state)).toEqual(["Geen kleur gekozen"]);
  });

  it("state met kleur + alle zijden compleet → []", () => {
    const blad = maakBlad({
      randafwerkingen: [
        { zijdeId: "0", code: "DV40", label: "DV40" },
        { zijdeId: "1", code: "DV40", label: "DV40" },
        { zijdeId: "2", code: "DV40", label: "DV40" },
        { zijdeId: "3", code: "DV40", label: "DV40" },
      ],
    });
    const state = maakVolledigeOpname({ bladen: [blad] });
    expect(globaleWaarschuwingen(state)).toEqual([]);
  });

  it("1 incompleet blad + geen kleur → 2 waarschuwingen in volgorde", () => {
    const blad = maakBlad({ randafwerkingen: [] });
    const state = maakVolledigeOpname({ bladen: [blad], materiaalKeuze: undefined });
    const warnings = globaleWaarschuwingen(state);
    expect(warnings).toHaveLength(2);
    expect(warnings[0]).toBe("1 blad incomplete randafwerking");
    expect(warnings[1]).toBe("Geen kleur gekozen");
  });
});
