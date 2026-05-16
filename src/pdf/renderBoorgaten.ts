import type { jsPDF } from 'jspdf';
import type { Blad, Boorgat } from '../data/seed-types';
import type { PdfViewport } from './types';
import { bladToPdf } from './coordinateTransform';

const LABEL_GAP_MM = 2; // mm tussen bovenkant cirkel en label-baseline

export function renderBoorgaten(
  doc: jsPDF,
  blad: Blad,
  viewport: PdfViewport,
  boorgaten: Boorgat[],
): void {
  const forBlad = boorgaten.filter(b => b.bladId === blad.id);

  // Splits in enkelvoudig en groepen
  const groepen = new Map<string, Boorgat[]>();
  const enkelvoudig: Boorgat[] = [];

  for (const bg of forBlad) {
    if (bg.groepId) {
      const list = groepen.get(bg.groepId) ?? [];
      list.push(bg);
      groepen.set(bg.groepId, list);
    } else {
      enkelvoudig.push(bg);
    }
  }

  // Enkelvoudige boorgaten: cirkel + eigen label
  for (const bg of enkelvoudig) {
    drawBoorgatCircel(doc, blad, viewport, bg);
    drawEnkelvoudigLabel(doc, blad, viewport, bg);
  }

  // Groepen: alle cirkels + één samengevoegd label
  for (const [, gaten] of groepen) {
    for (const bg of gaten) {
      drawBoorgatCircel(doc, blad, viewport, bg);
    }
    drawGroepLabel(doc, blad, viewport, gaten);
  }
}

// ── Privé helpers ─────────────────────────────────────────────────────────────

function drawBoorgatCircel(
  doc: jsPDF,
  blad: Blad,
  viewport: PdfViewport,
  bg: Boorgat,
): void {
  const c = bladToPdf(bg.positie, blad, viewport);
  const r = (bg.diameter / 2) * viewport.scaleFactor;

  doc.setDrawColor(0);

  if (bg.doorboring) {
    // Doorboring = volle lijn
    doc.setLineWidth(0.3);
    doc.setLineDashPattern([], 0);
  } else {
    // Blind gat = gestippeld
    doc.setLineWidth(0.2);
    doc.setLineDashPattern([0.5, 0.5], 0);
  }

  doc.circle(c.x, c.y, r, 'S');
  doc.setLineDashPattern([], 0);
}

function drawEnkelvoudigLabel(
  doc: jsPDF,
  blad: Blad,
  viewport: PdfViewport,
  bg: Boorgat,
): void {
  const c = bladToPdf(bg.positie, blad, viewport);
  const r = (bg.diameter / 2) * viewport.scaleFactor;
  const label = `D${bg.diameter}`;

  // Label boven cirkel, gecentreerd op cirkel-middelpunt
  const topEdge = c.y - r;
  const labelY  = topEdge - LABEL_GAP_MM;

  // Leader-lijn van bovenkant cirkel naar label
  doc.setLineWidth(0.15);
  doc.setDrawColor(0);
  doc.line(c.x, topEdge, c.x, labelY + 1);

  doc.setFontSize(6);
  doc.setTextColor(0);
  doc.text(label, c.x, labelY, { align: 'center' });
}

function drawGroepLabel(
  doc: jsPDF,
  blad: Blad,
  viewport: PdfViewport,
  gaten: Boorgat[],
): void {
  // Centroid in PDF (X-richting)
  const centers = gaten.map(bg => bladToPdf(bg.positie, blad, viewport));
  const radii   = gaten.map(bg => (bg.diameter / 2) * viewport.scaleFactor);

  const cx = centers.reduce((s, p) => s + p.x, 0) / centers.length;

  // Hoogste punt van welke cirkel dan ook (laagste Y in PDF)
  const topEdge = Math.min(...centers.map((p, i) => p.y - radii[i]));
  const labelY  = topEdge - LABEL_GAP_MM;

  // Label: diameters gesorteerd klein→groot, aaneengesloten "D7D70"
  const label = [...gaten]
    .sort((a, b) => a.diameter - b.diameter)
    .map(bg => `D${bg.diameter}`)
    .join('');

  // Leader-lijn van hoogste cirkelrand naar label
  doc.setLineWidth(0.15);
  doc.setDrawColor(0);
  doc.line(cx, topEdge, cx, labelY + 1);

  doc.setFontSize(6);
  doc.setTextColor(0);
  doc.text(label, cx, labelY, { align: 'center' });
}
