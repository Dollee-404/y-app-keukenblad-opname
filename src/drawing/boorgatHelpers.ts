import type { Boorgat, Sparing, Blad, Point, MaatReferentie } from "../data/seed-types";
import { rechthoekOutline } from "./bladHelpers";

const RAND_RISICO_MM = 60;

/**
 * Minimum afstand van de rand van het boorgat tot de bladrand.
 * risico = true wanneer die afstand < 60mm.
 */
export function randAfstand(
  positie: Point,
  diameter: number,
  blad: Blad
): { minAfstand: number; risico: boolean } {
  const outline = blad.outline ?? rechthoekOutline(blad.lengte, blad.breedte);
  const xs = outline.map(p => p.x);
  const ys = outline.map(p => p.y);
  const bladMinX = Math.min(...xs);
  const bladMaxX = Math.max(...xs);
  const bladMinY = Math.min(...ys);
  const bladMaxY = Math.max(...ys);

  const r = diameter / 2;
  const afstandLinks  = (positie.x - r) - bladMinX;
  const afstandRechts = bladMaxX - (positie.x + r);
  const afstandOnder  = (positie.y - r) - bladMinY;
  const afstandBoven  = bladMaxY - (positie.y + r);

  const minAfstand = Math.min(afstandLinks, afstandRechts, afstandOnder, afstandBoven);
  return { minAfstand: Math.round(minAfstand), risico: minAfstand < RAND_RISICO_MM };
}

/**
 * Genereer het volgende boorgat in een groep (D7 D70 patroon).
 * De positie wordt verschoven met hartAfstand in de opgegeven richting.
 */
export function volgendBoorgatInGroep(
  basis: Boorgat,
  richting: "rechts" | "links" | "boven" | "onder",
  hartAfstand: number
): Omit<Boorgat, "id"> {
  const delta: Point =
    richting === "rechts" ? { x: hartAfstand, y: 0 } :
    richting === "links"  ? { x: -hartAfstand, y: 0 } :
    richting === "boven"  ? { x: 0, y: hartAfstand } :
                            { x: 0, y: -hartAfstand };

  const groepId = basis.groepId ?? basis.id;
  const huidigVolgnummer = basis.groepVolgnummer ?? 1;

  return {
    bladId: basis.bladId,
    doel: basis.doel,
    diameter: basis.diameter,
    doorboring: basis.doorboring,
    positie: { x: basis.positie.x + delta.x, y: basis.positie.y + delta.y },
    groepId,
    groepVolgnummer: huidigVolgnummer + 1,
  };
}

/**
 * Bereken de absolute positie (mm vanaf linksonder blad) vanuit een maat-referentie.
 * Positie is altijd absoluut opgeslagen — referentie is alleen UI-invoer-conventie.
 */
export function absolutePositie(
  positie: Point,
  referentie: MaatReferentie,
  blad: Blad,
  context: { sparingen: Sparing[]; boorgaten: Boorgat[] }
): Point {
  const outline = blad.outline ?? rechthoekOutline(blad.lengte, blad.breedte);
  const xs = outline.map(p => p.x);
  const ys = outline.map(p => p.y);
  const bladMinX = Math.min(...xs);
  const bladMaxX = Math.max(...xs);
  const bladMinY = Math.min(...ys);
  const bladMaxY = Math.max(...ys);

  switch (referentie.type) {
    case "LINKSONDER":
      return { x: bladMinX + positie.x, y: bladMinY + positie.y };

    case "LINKERRAND":
      return referentie.offsetVanaf === "boven"
        ? { x: bladMinX + positie.x, y: bladMaxY - positie.y }
        : { x: bladMinX + positie.x, y: bladMinY + positie.y };

    case "RECHTERRAND":
      return referentie.offsetVanaf === "boven"
        ? { x: bladMaxX - positie.x, y: bladMaxY - positie.y }
        : { x: bladMaxX - positie.x, y: bladMinY + positie.y };

    case "MIDDEN_BLAD":
      return {
        x: (bladMinX + bladMaxX) / 2 + positie.x,
        y: (bladMinY + bladMaxY) / 2 + positie.y,
      };

    case "VORIGE_SPARING": {
      const ref = context.sparingen.find(s => s.id === referentie.sparingId);
      if (!ref) return positie;
      return { x: ref.positie.x + positie.x, y: ref.positie.y + positie.y };
    }

    case "VORIG_BOORGAT": {
      const ref = context.boorgaten.find(bg => bg.id === referentie.boorgatId);
      if (!ref) return positie;
      return { x: ref.positie.x + positie.x, y: ref.positie.y + positie.y };
    }
  }
}
