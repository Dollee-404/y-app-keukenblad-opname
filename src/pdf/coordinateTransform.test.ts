import { describe, it, expect } from 'vitest';
import { computeViewport, bladToPdf } from './coordinateTransform';
import type { Blad } from '../data/seed-types';

// Minimale Blad-stub — alleen de velden die coordinateTransform gebruikt
function makeBladStub(lengte: number, breedte: number, outline?: Blad['outline']): Blad {
  return {
    id: 'P1',
    label: 'BLAD A',
    werkstukType: 'Bladdeel A' as Blad['werkstukType'],
    categorie: 'WB' as Blad['categorie'],
    lengte,
    breedte,
    dikte: 20 as Blad['dikte'],
    randen: [],
    outline,
  } as unknown as Blad;
}

// Constanten die overeenkomen met coordinateTransform.ts
const MARGIN_X = 15;
const HEADER_H = 30;
const FOOTER_H = 90;
const PAGE_W = 210;
const PAGE_H = 297;
const ZONE_W = PAGE_W - 2 * MARGIN_X;         // 180
const ZONE_H = PAGE_H - HEADER_H - FOOTER_H;  // 177
const LABEL_MARGE = 40;
const MAX_BLAD_W = ZONE_W - 2 * LABEL_MARGE;  // 100
const MAX_BLAD_H = ZONE_H - 2 * LABEL_MARGE;  // 97

describe('computeViewport', () => {
  it('1 — 1958×1001: past in A4 staand, lengte-bepalend', () => {
    const blad = makeBladStub(1958, 1001);
    const vp = computeViewport(blad);

    // Lengte-bepalend: ratio 1958/1001 = 1.956 > 100/97 = 1.031
    const expectedScale = MAX_BLAD_W / 1958;
    expect(vp.scaleFactor).toBeCloseTo(expectedScale, 6);

    const expectedBladW = 1958 * expectedScale;
    const expectedBladH = 1001 * expectedScale;
    expect(vp.drawingAreaWidth).toBeCloseTo(expectedBladW, 4);
    expect(vp.drawingAreaHeight).toBeCloseTo(expectedBladH, 4);

    // Gecentreerd: label-marge links ≈ LABEL_MARGE (lengte vult max, dus exact 40mm)
    const labelLeft = vp.drawingAreaX - MARGIN_X;
    expect(labelLeft).toBeCloseTo(LABEL_MARGE, 4);

    // Blad past volledig op pagina binnen tekening-zone + label-marge
    expect(vp.drawingAreaX).toBeGreaterThanOrEqual(MARGIN_X + LABEL_MARGE - 0.01);
    expect(vp.drawingAreaY).toBeGreaterThanOrEqual(HEADER_H);
    expect(vp.drawingAreaX + vp.drawingAreaWidth).toBeLessThanOrEqual(PAGE_W - MARGIN_X - LABEL_MARGE + 0.01);
    expect(vp.drawingAreaY + vp.drawingAreaHeight).toBeLessThanOrEqual(PAGE_H - FOOTER_H - LABEL_MARGE + 0.01);

    expect(vp.pageWidthMm).toBe(210);
    expect(vp.pageHeightMm).toBe(297);
  });

  it('2 — 600×600: vierkant blad past, grotere schaalfactor', () => {
    const blad = makeBladStub(600, 600);
    const vp = computeViewport(blad);

    // Hoogte-bepalend: 97/600 < 100/600
    const expectedScale = MAX_BLAD_H / 600;
    expect(vp.scaleFactor).toBeCloseTo(expectedScale, 6);

    // Groter dan voor 1958-blad
    expect(vp.scaleFactor).toBeGreaterThan(MAX_BLAD_W / 1958);

    // Blad gecentreerd in zone
    const centerX = MARGIN_X + ZONE_W / 2;
    const centerY = HEADER_H + ZONE_H / 2;
    expect(vp.drawingAreaX + vp.drawingAreaWidth / 2).toBeCloseTo(centerX, 2);
    expect(vp.drawingAreaY + vp.drawingAreaHeight / 2).toBeCloseTo(centerY, 2);
  });

  it('3 — 2760×600: lang blad past, kleinere schaalfactor (lengte-bepalend)', () => {
    const blad = makeBladStub(2760, 600);
    const vp = computeViewport(blad);

    // Lengte-bepalend: 100/2760 < 97/600
    const expectedScale = MAX_BLAD_W / 2760;
    expect(vp.scaleFactor).toBeCloseTo(expectedScale, 6);

    // Kleiner dan voor 1958-blad
    expect(vp.scaleFactor).toBeLessThan(MAX_BLAD_W / 1958);

    // Breedte van blad-in-PDF ≈ MAX_BLAD_W (lengte-bepalend)
    expect(vp.drawingAreaWidth).toBeCloseTo(MAX_BLAD_W, 2);

    // Hoogte veel kleiner dan breedte
    expect(vp.drawingAreaHeight).toBeLessThan(vp.drawingAreaWidth);
  });
});

describe('bladToPdf', () => {
  it('4 — (0,0) gaat naar linksonder van het tekengebied (Y-flip)', () => {
    const blad = makeBladStub(1958, 1001);
    const vp = computeViewport(blad);
    const pt = bladToPdf({ x: 0, y: 0 }, blad, vp);

    // x = drawingAreaX (linkerrand)
    expect(pt.x).toBeCloseTo(vp.drawingAreaX, 4);
    // y = drawingAreaY + bladH (onderrand — fysiek y=0 = voorkant = onderaan PDF)
    expect(pt.y).toBeCloseTo(vp.drawingAreaY + vp.drawingAreaHeight, 4);
  });

  it('5 — middenpunt van 1958×1001 is centraal in tekengebied', () => {
    const blad = makeBladStub(1958, 1001);
    const vp = computeViewport(blad);
    const pt = bladToPdf({ x: 979, y: 500 }, blad, vp);

    // X: halve lengte → midden
    expect(pt.x).toBeCloseTo(vp.drawingAreaX + vp.drawingAreaWidth / 2, 1);
    // Y: (1001 - 500) = 501 ≈ 1001/2 → midden (één mm rounding door oneven breedte)
    expect(pt.y).toBeCloseTo(vp.drawingAreaY + vp.drawingAreaHeight / 2, 1);
  });

  it('6 — L-vorm blad: alle zes hoekpunten liggen binnen tekengebied', () => {
    // L-vorm: bounding box 1200×800, inham rechtsboven 400×400
    // Outline in fysieke coördinaten (0,0 = linksonder)
    const blad = makeBladStub(1200, 800, [
      { x: 0,    y: 0   }, // linksonder (voorkant-links)
      { x: 1200, y: 0   }, // rechtsonder (voorkant-rechts)
      { x: 1200, y: 400 }, // rechts-midden (inham-onderhoek)
      { x: 800,  y: 400 }, // binnenhoek
      { x: 800,  y: 800 }, // rechtsboven van kort deel
      { x: 0,    y: 800 }, // linksboven (achterkant-links)
    ]);

    const vp = computeViewport(blad);
    expect(vp.scaleFactor).toBeGreaterThan(0);

    for (const corner of blad.outline!) {
      const pt = bladToPdf(corner, blad, vp);

      // Alle punten liggen binnen drawingArea (floating-point marge 0.01mm)
      expect(pt.x).toBeGreaterThanOrEqual(vp.drawingAreaX - 0.01);
      expect(pt.x).toBeLessThanOrEqual(vp.drawingAreaX + vp.drawingAreaWidth + 0.01);
      expect(pt.y).toBeGreaterThanOrEqual(vp.drawingAreaY - 0.01);
      expect(pt.y).toBeLessThanOrEqual(vp.drawingAreaY + vp.drawingAreaHeight + 0.01);
    }

    // Y-flip controle: voorkant (y=0) → onderaan PDF, achterkant (y=breedte) → bovenaan PDF
    const frontLeft = bladToPdf({ x: 0, y: 0 },   blad, vp);
    const backLeft  = bladToPdf({ x: 0, y: 800 }, blad, vp);
    expect(frontLeft.y).toBeGreaterThan(backLeft.y);
    expect(frontLeft.x).toBeCloseTo(backLeft.x, 4);
  });
});
