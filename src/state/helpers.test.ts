import { describe, it, expect } from "vitest";
import { effectiefMateriaalSoort } from "./helpers";
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
