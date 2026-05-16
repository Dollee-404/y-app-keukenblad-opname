import type { Blad, Point } from '../data/seed-types';
import type { PdfViewport } from './types';

// A4 staand layout (alle maten in mm)
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_X = 15;    // links en rechts
const HEADER_H = 30;    // gereserveerd voor pagina-header
const FOOTER_H = 90;    // gereserveerd voor footer-tabel
const LABEL_MARGE = 40; // ruimte per kant voor maatvoering-labels

const ZONE_W = PAGE_W - 2 * MARGIN_X;         // 180mm beschikbaar voor tekening + labels
const ZONE_H = PAGE_H - HEADER_H - FOOTER_H;  // 177mm

/**
 * Berekent schaalfactor en positie zodat het blad gecentreerd past
 * binnen de tekening-zone, met LABEL_MARGE aan elke kant voor labels.
 */
export function computeViewport(blad: Blad): PdfViewport {
  const maxBladW = ZONE_W - 2 * LABEL_MARGE; // 100mm max blad-breedte in PDF
  const maxBladH = ZONE_H - 2 * LABEL_MARGE; // 97mm max blad-hoogte in PDF

  const scaleX = maxBladW / blad.lengte;
  const scaleY = maxBladH / blad.breedte;
  const scaleFactor = Math.min(scaleX, scaleY);

  const bladW = blad.lengte * scaleFactor;
  const bladH = blad.breedte * scaleFactor;

  // Centreer blad in de tekening-zone
  const drawingAreaX = MARGIN_X + (ZONE_W - bladW) / 2;
  const drawingAreaY = HEADER_H + (ZONE_H - bladH) / 2;

  return {
    pageWidthMm: PAGE_W,
    pageHeightMm: PAGE_H,
    drawingAreaX,
    drawingAreaY,
    drawingAreaWidth: bladW,
    drawingAreaHeight: bladH,
    scaleFactor,
  };
}

/**
 * Converteert een punt in blad-coördinaten (Y=0 = voorkant/onder, fysiek)
 * naar PDF-coördinaten in mm (Y=0 = bovenkant pagina).
 *
 * Gebruik voor: sparing-posities, boorgat-posities.
 * Dezelfde Y-flip als Canvas.tsx `fy = (y) => blad.breedte - y`.
 */
export function bladToPdf(point: Point, blad: Blad, viewport: PdfViewport): Point {
  return {
    x: viewport.drawingAreaX + point.x * viewport.scaleFactor,
    y: viewport.drawingAreaY + (blad.breedte - point.y) * viewport.scaleFactor,
  };
}

/**
 * Converteert een punt in SVG/outline-coördinaten (Y=0 = boven = achterkant)
 * naar PDF-coördinaten. Geen Y-flip — Canvas.tsx gebruikt de outline ook
 * zonder fy-flip, alleen sparingen/boorgaten krijgen fy toegepast.
 */
export function outlineToPdf(point: Point, viewport: PdfViewport): Point {
  return {
    x: viewport.drawingAreaX + point.x * viewport.scaleFactor,
    y: viewport.drawingAreaY + point.y * viewport.scaleFactor,
  };
}
