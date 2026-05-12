import { describe, it, expect } from "vitest";
import { sparingPath, sparingPastInBlad, pasProductToe } from "./sparingHelpers";
import type { Sparing, Blad, KookplaatProduct } from "../data/seed-types";

const bladBase: Blad = {
  id: "b1",
  label: "Werkblad",
  werkstukType: "Bladdeel A",
  categorie: "WB",
  lengte: 1958,
  breedte: 1001,
  dikte: 20,
  randen: [],
};

const sparingVlakbouw: Sparing = {
  id: "s1",
  type: "KOOKPLAAT",
  bladId: "b1",
  inbouwwijze: "VLAKBOUW",
  positie: { x: 925, y: 500 },
  breedte: 764,
  hoogte: 519,
  vlakbouw: { breedteOnder: 740, hoogteOnder: 495, radiusMm: 5, tredeMm: 7 },
};

const sparingOnderbouw: Sparing = {
  id: "s2",
  type: "SPOELBAK",
  bladId: "b1",
  inbouwwijze: "ONDERBOUW",
  positie: { x: 500, y: 500 },
  breedte: 500,
  hoogte: 400,
  radiusMm: 10,
};

describe("sparingPath", () => {
  it("vlakbouw boven: bevat correcte breedte", () => {
    const path = sparingPath(sparingVlakbouw, "boven");
    // Path geeft een rechthoek van 764×519 gecentreerd op (925, 500)
    // Linkerrand = 925 - 382 = 543
    expect(path).toContain("543");
  });

  it("vlakbouw onder: gebruikt vlakbouw.breedteOnder", () => {
    const path = sparingPath(sparingVlakbouw, "onder");
    // breedteOnder 740, centreer op x=925 → linker = 925 - 370 = 555
    expect(path).toContain("555");
  });

  it("onderbouw boven: gebruikt radiusMm", () => {
    const path = sparingPath(sparingOnderbouw, "boven");
    expect(path).toContain("Q"); // bevat quadratic Bezier voor radius
  });

  it("geen vlakbouw + laag onder: gebruikt boven-maten", () => {
    const path = sparingPath(sparingOnderbouw, "onder");
    // Geen vlakbouw → zelfde als boven
    const pathBoven = sparingPath(sparingOnderbouw, "boven");
    expect(path).toBe(pathBoven);
  });
});

describe("sparingPastInBlad", () => {
  it("sparing midden van blad past", () => {
    const result = sparingPastInBlad(sparingVlakbouw, bladBase);
    expect(result.past).toBe(true);
  });

  it("sparing half buiten linkerrand", () => {
    const te_links: Sparing = { ...sparingVlakbouw, positie: { x: 50, y: 500 } };
    // breedte 764/2 = 382 → minX = 50 - 382 = -332 < 0
    const result = sparingPastInBlad(te_links, bladBase);
    expect(result.past).toBe(false);
    expect(result.reden).toContain("links");
  });

  it("sparing half buiten rechterrand", () => {
    const te_rechts: Sparing = { ...sparingVlakbouw, positie: { x: 1900, y: 500 } };
    const result = sparingPastInBlad(te_rechts, bladBase);
    expect(result.past).toBe(false);
    expect(result.reden).toContain("rechts");
  });

  it("kleine sparing in hoek past ook", () => {
    const klein: Sparing = { ...sparingOnderbouw, breedte: 100, hoogte: 100, positie: { x: 100, y: 100 } };
    expect(sparingPastInBlad(klein, bladBase).past).toBe(true);
  });
});

describe("pasProductToe", () => {
  const boraCatalogus: KookplaatProduct = {
    merk: "Bora",
    model: "C75",
    inbouwwijze: "VLAKBOUW",
    sparing_boven_mm: [764, 519],
    sparing_onder_mm: [740, 495],
    radius_mm: 5,
    trede_mm: 7,
  };

  it("vult breedte/hoogte in vanuit catalogus", () => {
    const basis: Sparing = { ...sparingOnderbouw, type: "KOOKPLAAT" };
    const result = pasProductToe(basis, boraCatalogus);
    expect(result.breedte).toBe(764);
    expect(result.hoogte).toBe(519);
  });

  it("vlakbouw-product zet vlakbouw-subobject", () => {
    const basis: Sparing = { ...sparingOnderbouw, type: "KOOKPLAAT" };
    const result = pasProductToe(basis, boraCatalogus);
    expect(result.vlakbouw).toBeDefined();
    expect(result.vlakbouw?.breedteOnder).toBe(740);
    expect(result.vlakbouw?.tredeMm).toBe(7);
  });

  it("onderbouw-product heeft geen vlakbouw-subobject", () => {
    const onderbouwProduct: KookplaatProduct = {
      ...boraCatalogus,
      inbouwwijze: "ONDERBOUW",
      sparing_onder_mm: [764, 519],
      trede_mm: 0,
    };
    const basis: Sparing = { ...sparingVlakbouw };
    const result = pasProductToe(basis, onderbouwProduct);
    expect(result.vlakbouw).toBeUndefined();
  });
});
