import { describe, it, expect } from "vitest";
import { berekenViewBox, heeftVlakbouwWarning } from "./miniCanvasBlad";
import type { Point, Blad, Sparing, Opname } from "../data/seed-types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rechthoek(lengte: number, breedte: number): Point[] {
  return [
    { x: 0, y: 0 },
    { x: lengte, y: 0 },
    { x: lengte, y: breedte },
    { x: 0, y: breedte },
  ];
}

function lVorm(): Point[] {
  // L-vorm: 2000 breed × 1000 hoog, met linksboven kwadrant weggenomen (1000×500)
  return [
    { x: 0, y: 0 },
    { x: 2000, y: 0 },
    { x: 2000, y: 1000 },
    { x: 1000, y: 1000 },
    { x: 1000, y: 500 },
    { x: 0, y: 500 },
  ];
}

function maakBlad(soort: string, outline?: Point[]): Blad {
  return {
    id: "P1",
    label: "BLAD A",
    werkstukType: "Bladdeel A",
    categorie: "WB",
    lengte: 1958,
    breedte: 800,
    dikte: 20,
    randen: [],
    materiaalOverride: { soort } as unknown as Blad["materiaalOverride"],
    ...(outline ? { outline } : {}),
  };
}

function maakOpname(_soort: string): Opname {
  return {
    ordernummer: "TEST-001",
    datum: "2026-05-13",
    type: "OPDRACHTBEVESTIGING",
    status: "CONCEPT",
    verkoper: { naam: "Test", email: "test@test.nl", telefoon: "" },
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
  };
}

function maakSparing(inbouwwijze: string): Sparing {
  return {
    id: "S1",
    type: "KOOKPLAAT",
    bladId: "P1",
    inbouwwijze: inbouwwijze as Sparing["inbouwwijze"],
    positie: { x: 500, y: 400 },
    breedte: 560,
    hoogte: 490,
  };
}

// ---------------------------------------------------------------------------
// berekenViewBox
// ---------------------------------------------------------------------------

describe("berekenViewBox", () => {
  it("rechthoek 1958×800: viewBox dekt breedte + padding", () => {
    const outline = rechthoek(1958, 800);
    const vb = berekenViewBox(outline);

    // padding = max(1958, 800) * 0.06 = 1958 * 0.06 ≈ 117.48
    const expectedPadding = 1958 * 0.06;

    expect(vb.x).toBeCloseTo(-expectedPadding, 1);
    expect(vb.y).toBeCloseTo(-expectedPadding, 1);
    expect(vb.w).toBeCloseTo(1958 + expectedPadding * 2, 1);
    expect(vb.h).toBeCloseTo(800 + expectedPadding * 2, 1);
  });

  it("L-vorm: viewBox op basis van bounding box + padding", () => {
    const outline = lVorm();
    const vb = berekenViewBox(outline);

    // bounding box van L-vorm: minX=0, maxX=2000, minY=0, maxY=1000
    // padding = max(2000, 1000) * 0.06 = 120
    const expectedPadding = 2000 * 0.06;

    expect(vb.x).toBeCloseTo(-expectedPadding, 1);
    expect(vb.y).toBeCloseTo(-expectedPadding, 1);
    expect(vb.w).toBeCloseTo(2000 + expectedPadding * 2, 1);
    expect(vb.h).toBeCloseTo(1000 + expectedPadding * 2, 1);
  });
});

// ---------------------------------------------------------------------------
// heeftVlakbouwWarning
// ---------------------------------------------------------------------------

describe("heeftVlakbouwWarning", () => {
  it("vlakbouw + composiet → true", () => {
    const sparing = maakSparing("VLAKBOUW");
    const blad = maakBlad("COMPOSIET");
    const state = maakOpname("COMPOSIET");
    expect(heeftVlakbouwWarning(sparing, blad, state)).toBe(true);
  });

  it("vlakbouw + kwartscomposiet → true", () => {
    const sparing = maakSparing("VLAKBOUW");
    const blad = maakBlad("KWARTSCOMPOSIET");
    const state = maakOpname("KWARTSCOMPOSIET");
    expect(heeftVlakbouwWarning(sparing, blad, state)).toBe(true);
  });

  it("vlakbouw + dekton → false", () => {
    const sparing = maakSparing("VLAKBOUW");
    const blad = maakBlad("DEKTON");
    const state = maakOpname("DEKTON");
    expect(heeftVlakbouwWarning(sparing, blad, state)).toBe(false);
  });

  it("niet-vlakbouw + composiet → false", () => {
    const sparing = maakSparing("ONDERBOUW");
    const blad = maakBlad("COMPOSIET");
    const state = maakOpname("COMPOSIET");
    expect(heeftVlakbouwWarning(sparing, blad, state)).toBe(false);
  });
});
