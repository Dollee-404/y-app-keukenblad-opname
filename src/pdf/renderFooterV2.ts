import type { jsPDF } from 'jspdf';
import type { Blad, Opname } from '../data/seed-types';
import { getMateriaalcode } from './doorsneeprofiel';

const MARGIN_X  = 12;
const PAGE_W    = 297;
const PAGE_H    = 210;
const FOOTER_H  = 42;
const FOOTER_Y  = PAGE_H - FOOTER_H;  // 168mm

const CONTENT_W = PAGE_W - 2 * MARGIN_X;  // 273mm

// 2-zone split
const LEFT_W  = Math.round(CONTENT_W * 0.6);   // 164mm — info block
const RIGHT_W = CONTENT_W - LEFT_W;             // 109mm — paraaf + branding

const X_LEFT  = MARGIN_X;            // 12mm
const X_RIGHT = MARGIN_X + LEFT_W;   // 176mm

const BRAND_ZONE_H = 15;                        // mm voor branding onderaan
const PARAAF_H     = FOOTER_H - BRAND_ZONE_H;  // 27mm — paraaf-cellen ruimer
const BRAND_Y      = FOOTER_Y + PARAAF_H;       // 195mm — start branding-zone

function isoToDag(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
}

function isoWeekNr(iso: string): number {
  const date = new Date(iso);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 4 - (date.getDay() || 7));
  const yearStart = new Date(date.getFullYear(), 0, 1);
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function renderPaginaFooterV2(
  doc: jsPDF,
  state: Opname,
  blad: Blad,
  paginaInfo: { paginaNr: number; totaalPaginas: number },
): void {
  // Bovenrand footer
  doc.setDrawColor(0);
  doc.setLineWidth(0.4);
  doc.line(X_LEFT, FOOTER_Y, X_LEFT + CONTENT_W, FOOTER_Y);

  // Verticale scheiding links/rechts zone
  doc.setLineWidth(0.25);
  doc.line(X_RIGHT, FOOTER_Y, X_RIGHT, PAGE_H);

  // ── LINKER ZONE — open info-blok, geen interne lijnen ─────────────────
  const lx = X_LEFT + 3;

  // Regel 1: materiaalcode 11pt bold
  const mc = getMateriaalcode(blad);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text(mc, lx, FOOTER_Y + 6);
  // TODO: doorsneeprofiel-icoon — opdrachtgever levert specs in latere sprint
  // Implementatie-skelet bewaard in src/pdf/doorsneeprofiel.ts (uncalled).

  // Overige regels 8mm omlaag geschoven
  const ordernr = state.ordernummer ?? '2600376';
  const week    = `Week ${isoWeekNr(state.datum ?? '2026-02-16')}`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(`${ordernr}  ${week}`, lx, FOOTER_Y + 15);

  const kleur = state.materiaalKeuze?.kleur_label ?? state.materiaal?.kleur ?? '';
  doc.setFontSize(9);
  doc.text(kleur, lx, FOOTER_Y + 22);

  const klant     = state.opdrachtgever?.naam ?? '';
  const eindklant = state.uwReferentie ?? '';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(60);
  doc.text(klant, lx, FOOTER_Y + 29);
  doc.setFont('helvetica', 'bold');
  doc.text(eindklant, lx, FOOTER_Y + 34);

  const datum  = isoToDag(state.datum ?? '2026-02-16');
  const tekNr  = `Tek. ${paginaInfo.paginaNr} / ${paginaInfo.totaalPaginas}`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(120);
  doc.text(`${datum}  ·  ${tekNr}`, lx, FOOTER_Y + 39);

  // ── RECHTER ZONE — paraaf-grid bovenaan ───────────────────────────────
  const procesLabels = ['Zagen', 'Lijmen', 'Schuren', 'Sparen', 'Eindcontrole', 'Bloknr'];
  const colW = RIGHT_W / procesLabels.length;

  // Horizontale lijn tussen paraaf-grid en branding
  doc.setLineWidth(0.15);
  doc.setDrawColor(0);
  doc.line(X_RIGHT, BRAND_Y, X_RIGHT + RIGHT_W, BRAND_Y);

  for (let i = 0; i < procesLabels.length; i++) {
    const xCol = X_RIGHT + i * colW;
    if (i > 0) {
      doc.setLineWidth(0.15);
      doc.line(xCol, FOOTER_Y, xCol, BRAND_Y);
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.setTextColor(80);
    doc.text(procesLabels[i], xCol + 2, FOOTER_Y + 4.5);
  }

  // ── Branding — één regel, brede zone maakt dit mogelijk ───────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0);
  doc.text('DE KEUKENBLADENFABRIEK', X_RIGHT + 3, BRAND_Y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(136);
  doc.text('Vasto Natuursteen', X_RIGHT + 3, BRAND_Y + 14);
}
