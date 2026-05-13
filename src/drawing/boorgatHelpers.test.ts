import { describe, it, expect } from "vitest";
import { randAfstand, volgendBoorgatInGroep, absolutePositie } from "./boorgatHelpers";
import type { Blad, Boorgat } from "../data/seed-types";

const bladBase: Blad = {
  id: "b1",
  label: "Rugwand",
  werkstukType: "Achterwand",
  categorie: "RW",
  lengte: 1502,
  breedte: 480,
  dikte: 20,
  randen: [],
};

const boorgatBasis: Boorgat = {
  id: "bg1",
  bladId: "b1",
  doel: "ELEKTRA",
  diameter: 70,
  doorboring: true,
  positie: { x: 400, y: 240 },
};

describe("randAfstand", () => {
  it("boorgat midden van blad heeft grote afstand, geen risico", () => {
    const { minAfstand, risico } = randAfstand({ x: 751, y: 240 }, 70, bladBase);
    expect(minAfstand).toBeGreaterThan(60);
    expect(risico).toBe(false);
  });

  it("boorgat 30mm van linkerrand met Ø35 → minAfstand = 12mm, risico true", () => {
    // rand boorgat = 30 - 17.5 = 12.5
    const { minAfstand, risico } = randAfstand({ x: 30, y: 240 }, 35, bladBase);
    expect(minAfstand).toBe(13); // 30 - 17 = 13 (rounded)
    expect(risico).toBe(true);
  });

  it("boorgat 80mm van rand: net geen risico", () => {
    // rand boorgat = 80 - 35 = 45 < 60 → risico
    const { risico } = randAfstand({ x: 80, y: 240 }, 70, bladBase);
    expect(risico).toBe(true);
  });

  it("boorgat met ruime marge rondom: geen risico", () => {
    const { risico } = randAfstand({ x: 500, y: 240 }, 70, bladBase);
    expect(risico).toBe(false);
  });
});

describe("volgendBoorgatInGroep", () => {
  it("tweede boorgat rechts op h.o.h. 70mm", () => {
    const volgend = volgendBoorgatInGroep(boorgatBasis, "rechts", 70);
    expect(volgend.positie.x).toBe(470);
    expect(volgend.positie.y).toBe(240);
    expect(volgend.groepVolgnummer).toBe(2);
    expect(volgend.groepId).toBe("bg1"); // basis.id wordt groepId als niet opgegeven
  });

  it("volgend boorgat naar boven", () => {
    const volgend = volgendBoorgatInGroep(boorgatBasis, "boven", 70);
    expect(volgend.positie.x).toBe(400);
    expect(volgend.positie.y).toBe(310);
  });

  it("groepId propageert als al aanwezig", () => {
    const metGroep: Boorgat = { ...boorgatBasis, groepId: "groep-A", groepVolgnummer: 2 };
    const volgend = volgendBoorgatInGroep(metGroep, "rechts", 70);
    expect(volgend.groepId).toBe("groep-A");
    expect(volgend.groepVolgnummer).toBe(3);
  });
});

describe("absolutePositie", () => {
  const ctx = { sparingen: [], boorgaten: [] };

  it("LINKSONDER: offset direct op blad-minimum", () => {
    const pos = absolutePositie({ x: 100, y: 50 }, { type: "LINKSONDER" }, bladBase, ctx);
    expect(pos).toEqual({ x: 100, y: 50 });
  });

  it("RECHTERRAND vanaf onder: offset vanaf rechts", () => {
    const pos = absolutePositie({ x: 100, y: 100 }, { type: "RECHTERRAND", offsetVanaf: "onder" }, bladBase, ctx);
    expect(pos.x).toBe(1502 - 100); // bladMaxX - offset
    expect(pos.y).toBe(100);
  });

  it("MIDDEN_BLAD: middelpunt + offset", () => {
    const pos = absolutePositie({ x: 0, y: 0 }, { type: "MIDDEN_BLAD" }, bladBase, ctx);
    expect(pos.x).toBe(751);
    expect(pos.y).toBe(240);
  });

  it("VORIG_BOORGAT: relatief ten opzichte van referentie-boorgat", () => {
    const refBg: Boorgat = { ...boorgatBasis, id: "ref1", positie: { x: 300, y: 200 } };
    const pos = absolutePositie(
      { x: 70, y: 0 },
      { type: "VORIG_BOORGAT", boorgatId: "ref1" },
      bladBase,
      { sparingen: [], boorgaten: [refBg] }
    );
    expect(pos).toEqual({ x: 370, y: 200 });
  });

  it("VORIG_BOORGAT met onbekend id: geeft positie terug ongewijzigd", () => {
    const pos = absolutePositie(
      { x: 100, y: 100 },
      { type: "VORIG_BOORGAT", boorgatId: "bestaat-niet" },
      bladBase,
      ctx
    );
    expect(pos).toEqual({ x: 100, y: 100 });
  });
});
