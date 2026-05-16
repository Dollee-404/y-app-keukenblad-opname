import type { jsPDF } from 'jspdf';
import type { Opname } from '../data/seed-types';

export type PdfViewport = {
  pageWidthMm: number;
  pageHeightMm: number;
  drawingAreaX: number;
  drawingAreaY: number;
  drawingAreaWidth: number;
  drawingAreaHeight: number;
  scaleFactor: number;
};

export type RenderContext = {
  doc: jsPDF;
  viewport: PdfViewport;
  state: Opname;
};
