import type { Point } from "../data/seed-types";

/** Rechthoek-outline in mm, met P0=(0,0) linksboven in SVG-coördinaten.
 *  Volgorde: linksboven → rechtsboven → rechtsonder → linksonder (CW in SVG). */
export function rechthoekOutline(lengte: number, breedte: number): Point[] {
  return [
    { x: 0, y: 0 },
    { x: lengte, y: 0 },
    { x: lengte, y: breedte },
    { x: 0, y: breedte },
  ];
}

/** Lengte van elk segment (Euclidisch) in mm. */
export function segmentLengtes(outline: Point[]): number[] {
  const n = outline.length;
  return outline.map((p, i) => {
    const q = outline[(i + 1) % n];
    return Math.round(Math.hypot(q.x - p.x, q.y - p.y) * 1000) / 1000;
  });
}

/** Eenheidsvector van P[i] naar P[(i+1)%n]. */
function unitDir(outline: Point[], i: number): Point {
  const n = outline.length;
  const p = outline[i];
  const q = outline[(i + 1) % n];
  const len = Math.hypot(q.x - p.x, q.y - p.y);
  return { x: (q.x - p.x) / len, y: (q.y - p.y) / len };
}

/**
 * Hoek wegknippen: vervang corner i door drie punten die een L-uithap vormen.
 * Werkt op rechthoeken en eenvoudige L-vormen met orthogonale segmenten.
 *
 * breedteUithap = afstand langs de vertrekkende richting
 * hoogteUithap  = afstand langs de aankomende richting
 */
export function knipHoekUit(
  outline: Point[],
  cornerIndex: number,
  breedteUithap: number,
  hoogteUithap: number
): Point[] {
  const n = outline.length;
  const c = outline[cornerIndex];
  const dIn = unitDir(outline, (cornerIndex - 1 + n) % n);
  const dOut = unitDir(outline, cornerIndex);

  const p1: Point = { x: c.x - dIn.x * hoogteUithap, y: c.y - dIn.y * hoogteUithap };
  const p2: Point = { x: p1.x + dOut.x * breedteUithap, y: p1.y + dOut.y * breedteUithap };
  const p3: Point = { x: c.x + dOut.x * breedteUithap, y: c.y + dOut.y * breedteUithap };

  return [
    ...outline.slice(0, cornerIndex),
    p1, p2, p3,
    ...outline.slice(cornerIndex + 1),
  ];
}

/**
 * Update één segment-lengte door alle punten die "voorbij" het einde van
 * het segment liggen (geprojecteerd op de segment-richting) te verschuiven.
 */
export function bewerkSegmentLengte(
  outline: Point[],
  segmentIndex: number,
  nieuweLengte: number
): Point[] {
  const n = outline.length;
  const i = segmentIndex;
  const p = outline[i];
  const q = outline[(i + 1) % n];
  const d = unitDir(outline, i);

  const oudeLengte = Math.hypot(q.x - p.x, q.y - p.y);
  const delta = { x: d.x * (nieuweLengte - oudeLengte), y: d.y * (nieuweLengte - oudeLengte) };

  const threshold = d.x * q.x + d.y * q.y;

  return outline.map((pt) => {
    const proj = d.x * pt.x + d.y * pt.y;
    if (proj >= threshold - 0.001) {
      return { x: pt.x + delta.x, y: pt.y + delta.y };
    }
    return pt;
  });
}

/** Bounding box van een outline. */
export function boundingBox(outline: Point[]): { minX: number; minY: number; maxX: number; maxY: number } {
  const xs = outline.map(p => p.x);
  const ys = outline.map(p => p.y);
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}

/** Uitwaartse normaal voor segment i in een CW-gewonden outline (SVG-coördinaten, y naar beneden).
 *  CW winding in SVG: uitwaarts = 90° rechtsom t.o.v. richting. */
export function uitwaartsNormaal(outline: Point[], i: number): Point {
  const d = unitDir(outline, i);
  return { x: d.y, y: -d.x };
}

/** Midden van segment i. */
export function segmentMidden(outline: Point[], i: number): Point {
  const n = outline.length;
  const p = outline[i];
  const q = outline[(i + 1) % n];
  return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
}
