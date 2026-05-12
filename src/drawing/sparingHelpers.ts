import type { Sparing, Blad, KookplaatProduct, SpoelbakProduct } from "../data/seed-types";
import { rechthoekOutline } from "./bladHelpers";

/**
 * SVG path-string voor een afgeronde rechthoek, gecentreerd op (cx, cy).
 * breedte/hoogte in mm, radius in mm.
 */
export function afgerondRechthoekPath(
  cx: number,
  cy: number,
  breedte: number,
  hoogte: number,
  radius: number
): string {
  const r = Math.min(radius, breedte / 2, hoogte / 2);
  const x = cx - breedte / 2;
  const y = cy - hoogte / 2;
  const w = breedte;
  const h = hoogte;
  return [
    `M ${x + r} ${y}`,
    `H ${x + w - r}`,
    `Q ${x + w} ${y} ${x + w} ${y + r}`,
    `V ${y + h - r}`,
    `Q ${x + w} ${y + h} ${x + w - r} ${y + h}`,
    `H ${x + r}`,
    `Q ${x} ${y + h} ${x} ${y + h - r}`,
    `V ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    "Z",
  ].join(" ");
}

/**
 * SVG path voor een sparing — laag 'boven' (zichtbare opening) of 'onder'
 * (alleen bij vlakbouw: de kleinere zaagsnede aan de onderkant van het blad).
 * Coördinaten zijn in mm, gecentreerd op sparing.positie.
 */
export function sparingPath(sparing: Sparing, laag: "boven" | "onder"): string {
  const { positie, breedte, hoogte, vlakbouw, radiusMm = 0 } = sparing;

  if (laag === "onder" && vlakbouw) {
    return afgerondRechthoekPath(
      positie.x,
      positie.y,
      vlakbouw.breedteOnder,
      vlakbouw.hoogteOnder,
      vlakbouw.radiusMm
    );
  }

  const r = vlakbouw ? vlakbouw.radiusMm : radiusMm;
  return afgerondRechthoekPath(positie.x, positie.y, breedte, hoogte, r);
}

/**
 * Controleer of een sparing volledig binnen de blad-outline valt.
 * Vergelijkt de bounding box van de sparing met de bounding box van het blad.
 * (Conservatieve check — geen exacte polygoon-intersectie voor sprint 3b.)
 */
export function sparingPastInBlad(
  sparing: Sparing,
  blad: Blad
): { past: boolean; reden?: string } {
  const outline = blad.outline ?? rechthoekOutline(blad.lengte, blad.breedte);
  const xs = outline.map(p => p.x);
  const ys = outline.map(p => p.y);
  const bladMinX = Math.min(...xs);
  const bladMaxX = Math.max(...xs);
  const bladMinY = Math.min(...ys);
  const bladMaxY = Math.max(...ys);

  const halfB = sparing.breedte / 2;
  const halfH = sparing.hoogte / 2;
  const sMinX = sparing.positie.x - halfB;
  const sMaxX = sparing.positie.x + halfB;
  const sMinY = sparing.positie.y - halfH;
  const sMaxY = sparing.positie.y + halfH;

  if (sMinX < bladMinX) return { past: false, reden: "Sparing steekt links buiten het blad" };
  if (sMaxX > bladMaxX) return { past: false, reden: "Sparing steekt rechts buiten het blad" };
  if (sMinY < bladMinY) return { past: false, reden: "Sparing steekt onder buiten het blad" };
  if (sMaxY > bladMaxY) return { past: false, reden: "Sparing steekt boven buiten het blad" };

  return { past: true };
}

/**
 * Pas product-maten toe op een bestaande sparing.
 * Vult breedte, hoogte, inbouwwijze en vlakbouw-subobject in vanuit catalogus.
 */
export function pasProductToe(
  sparing: Sparing,
  product: KookplaatProduct | SpoelbakProduct
): Sparing {
  const isVlakbouw = product.inbouwwijze === "VLAKBOUW";
  const [breedteBoven, hoogteBoven] = product.sparing_boven_mm;
  const [breedteOnder, hoogteOnder] = product.sparing_onder_mm;

  return {
    ...sparing,
    inbouwwijze: product.inbouwwijze,
    breedte: breedteBoven,
    hoogte: hoogteBoven,
    radiusMm: product.radius_mm,
    vlakbouw: isVlakbouw
      ? {
          breedteOnder,
          hoogteOnder,
          radiusMm: product.radius_mm,
          tredeMm: product.trede_mm,
        }
      : undefined,
  };
}
