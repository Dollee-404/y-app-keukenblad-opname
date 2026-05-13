import { describe, it, expect } from "vitest";
import { bladZijden } from "./bladZijdenHelpers";
import { knipHoekUit, rechthoekOutline } from "./bladHelpers";
import type { Blad } from "../data/seed-types";

function makeBladRechthoek(lengte: number, breedte: number): Blad {
  return {
    id: "T1", label: "Test", werkstukType: "Bladdeel A", categorie: "WB",
    lengte, breedte, dikte: 20, randen: [],
  };
}

function makeBladLvorm(lengte: number, breedte: number, uithapBreedte: number, uithapHoogte: number): Blad {
  const outline = knipHoekUit(
    rechthoekOutline(lengte, breedte),
    1,
    uithapBreedte,
    uithapHoogte,
  );
  return {
    id: "T2", label: "L-vorm", werkstukType: "Bladdeel A", categorie: "WB",
    lengte, breedte, dikte: 20, randen: [], outline,
  };
}

describe("bladZijden — rechthoek", () => {
  it("geeft 4 zijden terug", () => {
    const blad = makeBladRechthoek(1958, 600);
    expect(bladZijden(blad)).toHaveLength(4);
  });

  it("segment 0 heeft lengte gelijk aan blad.lengte (achterkant)", () => {
    const blad = makeBladRechthoek(1958, 600);
    expect(bladZijden(blad)[0].lengte_mm).toBe(1958);
    expect(bladZijden(blad)[0].id).toBe("0");
  });

  it("segment 2 heeft lengte gelijk aan blad.lengte (voorkant)", () => {
    const blad = makeBladRechthoek(1958, 600);
    expect(bladZijden(blad)[2].lengte_mm).toBe(1958);
  });

  it("segment 1 heeft lengte gelijk aan blad.breedte (rechts)", () => {
    const blad = makeBladRechthoek(1958, 600);
    expect(bladZijden(blad)[1].lengte_mm).toBe(600);
  });

  it("alle 4 zijden hebben uniek id", () => {
    const blad = makeBladRechthoek(1958, 600);
    const ids = bladZijden(blad).map(z => z.id);
    expect(new Set(ids).size).toBe(4);
  });

  it("startPunt[i] === eindPunt[i-1] (aaneengesloten keten)", () => {
    const blad = makeBladRechthoek(1958, 600);
    const zijden = bladZijden(blad);
    for (let i = 1; i < zijden.length; i++) {
      expect(zijden[i].startPunt).toEqual(zijden[i - 1].eindPunt);
    }
  });

  it("middenPunt is gemiddelde van start en eindpunt", () => {
    const blad = makeBladRechthoek(1958, 600);
    for (const z of bladZijden(blad)) {
      expect(z.middenPunt.x).toBeCloseTo((z.startPunt.x + z.eindPunt.x) / 2, 5);
      expect(z.middenPunt.y).toBeCloseTo((z.startPunt.y + z.eindPunt.y) / 2, 5);
    }
  });

  it("normaal heeft lengte 1 (eenheidsvector)", () => {
    const blad = makeBladRechthoek(1958, 600);
    for (const z of bladZijden(blad)) {
      const len = Math.hypot(z.normaal.x, z.normaal.y);
      expect(len).toBeCloseTo(1, 5);
    }
  });

  it("segment 0 label is 'Achterkant'", () => {
    const blad = makeBladRechthoek(1958, 600);
    expect(bladZijden(blad)[0].label).toBe("Achterkant");
  });

  it("segment 2 label is 'Voorkant'", () => {
    const blad = makeBladRechthoek(1958, 600);
    expect(bladZijden(blad)[2].label).toBe("Voorkant");
  });
});

describe("bladZijden — L-vorm", () => {
  it("geeft 6 zijden terug", () => {
    const blad = makeBladLvorm(1958, 600, 400, 300);
    expect(bladZijden(blad)).toHaveLength(6);
  });

  it("alle 6 zijden hebben positieve lengte", () => {
    const blad = makeBladLvorm(1958, 600, 400, 300);
    for (const z of bladZijden(blad)) {
      expect(z.lengte_mm).toBeGreaterThan(0);
    }
  });

  it("alle 6 zijden hebben unieke ids", () => {
    const blad = makeBladLvorm(1958, 600, 400, 300);
    const ids = bladZijden(blad).map(z => z.id);
    expect(new Set(ids).size).toBe(6);
  });

  it("middenPunt is gemiddelde van start en eindpunt (L-vorm)", () => {
    const blad = makeBladLvorm(1958, 600, 400, 300);
    for (const z of bladZijden(blad)) {
      expect(z.middenPunt.x).toBeCloseTo((z.startPunt.x + z.eindPunt.x) / 2, 5);
      expect(z.middenPunt.y).toBeCloseTo((z.startPunt.y + z.eindPunt.y) / 2, 5);
    }
  });

  it("normalen hebben lengte 1 (L-vorm)", () => {
    const blad = makeBladLvorm(1958, 600, 400, 300);
    for (const z of bladZijden(blad)) {
      const len = Math.hypot(z.normaal.x, z.normaal.y);
      expect(len).toBeCloseTo(1, 5);
    }
  });
});
