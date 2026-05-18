import type { jsPDF } from 'jspdf';
import type { Blad, Opname } from '../data/seed-types';

const MARGIN_X = 12;
const HEADER_H = 22;
const PAGE_W   = 297;  // A4 landschap

export function renderPaginaHeaderV2(
  doc: jsPDF,
  bladen: Blad[],
  _paginaInfo: { paginaNr: number; totaalPaginas: number },
  _state: Opname,
): void {
  const yBase  = 9;
  const rightX = PAGE_W - MARGIN_X;

  // Zaagmaat dominant: 12pt bold
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0);
  bladen.forEach((blad, i) => {
    doc.text(`Zagen: ${blad.lengte} × ${blad.breedte} mm`, MARGIN_X, yBase + i * 8);
  });

  // Verpakken + leverdag rechts, subtiel grijs 9pt
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text('Verpakken: Nee', rightX, yBase, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('Vrijdag', rightX, yBase + 7, { align: 'right' });

  // Scheidingslijn
  doc.setDrawColor(0);
  doc.setLineWidth(0.4);
  doc.line(MARGIN_X, HEADER_H, PAGE_W - MARGIN_X, HEADER_H);
}
