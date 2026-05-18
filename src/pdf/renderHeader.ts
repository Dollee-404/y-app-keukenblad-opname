import type { jsPDF } from 'jspdf';
import type { Blad, Opname } from '../data/seed-types';

const MARGIN_X = 15;
const HEADER_H = 30;
const PAGE_W   = 210;

export function renderPaginaHeader(
  doc: jsPDF,
  bladen: Blad[],
  _paginaInfo: { paginaNr: number; totaalPaginas: number },
  _state: Opname,
): void {
  const yBase = 10;

  // Linksboven: "Zagen: L x B mm" per blad
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0);
  bladen.forEach((blad, i) => {
    doc.text(`Zagen: ${blad.lengte} x ${blad.breedte} mm`, MARGIN_X, yBase + i * 6);
  });

  // Rechtsboven: Verpakken + leverdag
  const rightX = PAGE_W - MARGIN_X;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Verpakken: Nee', rightX, yBase, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text('Vrijdag', rightX, yBase + 6, { align: 'right' });

  // Scheidingslijn onder header
  doc.setDrawColor(0);
  doc.setLineWidth(0.4);
  doc.line(MARGIN_X, HEADER_H, PAGE_W - MARGIN_X, HEADER_H);
}
