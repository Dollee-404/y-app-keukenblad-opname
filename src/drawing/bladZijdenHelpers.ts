import type { Blad, Point } from "../data/seed-types";
import { rechthoekOutline, segmentLengtes } from "./bladHelpers";

export type BladZijde = {
  id: string;
  label: string;
  startPunt: Point;
  eindPunt: Point;
  middenPunt: Point;
  lengte_mm: number;
  normaal: Point; // unit outward normal, SVG coords
};

const RECHTHOEK_LABELS = ["Achterkant", "Rechterkant", "Voorkant", "Linkerkant"];

export function bladZijden(blad: Blad): BladZijde[] {
  const outline = blad.outline ?? rechthoekOutline(blad.lengte, blad.breedte);
  const n = outline.length;
  const lengtes = segmentLengtes(outline);
  const isRechthoek = n === 4;

  return outline.map((p, i) => {
    const q = outline[(i + 1) % n];
    const len = lengtes[i];
    const dx = q.x - p.x;
    const dy = q.y - p.y;
    // Outward normal for CW-wound SVG polygon: right of direction
    const normaal: Point = { x: dy / len, y: -dx / len };

    return {
      id: String(i),
      label: isRechthoek ? RECHTHOEK_LABELS[i] : `Zijde ${i + 1}`,
      startPunt: p,
      eindPunt: q,
      middenPunt: { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 },
      lengte_mm: Math.round(len),
      normaal,
    };
  });
}
