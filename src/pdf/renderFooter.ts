import type { jsPDF } from 'jspdf';
import type { Blad, Opname } from '../data/seed-types';
import { getMateriaalcode } from './doorsneeprofiel';

const MARGIN_X  = 15;
const PAGE_W    = 210;
const PAGE_H    = 297;
const FOOTER_H  = 52;
const FOOTER_Y  = PAGE_H - FOOTER_H;   // 245
const CONTENT_W = PAGE_W - 2 * MARGIN_X;  // 180

const ROW1_H = 25;
const ROW2_Y = FOOTER_Y + ROW1_H;      // 270
const SUB_H  = (FOOTER_H - ROW1_H) / 3;  // 9mm per sub-rij

// Kolom-breedtes rij 2 (totaal 180mm) — Vasto-verhoudingen
const K1_W  = 22;   // materiaalcode
const K23_W = 56;   // kleur + ordernr (merged)
const K4_W  = 38;   // klant / eindklant
const K5_W  = 32;   // datum / route / getekend
const K6_W  = 32;   // leeg / tek.nr / branding

// X-startposities
const X1  = MARGIN_X;
const X23 = X1  + K1_W;   // 37
const X4  = X23 + K23_W;  // 93
const X5  = X4  + K4_W;   // 131
const X6  = X5  + K5_W;   // 163

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

export function renderPaginaFooter(
  doc: jsPDF,
  state: Opname,
  blad: Blad,
  paginaInfo: { paginaNr: number; totaalPaginas: number },
): void {
  // ── Buitenrand ────────────────────────────────────────────────────────
  doc.setDrawColor(0);
  doc.setLineWidth(0.4);
  doc.rect(MARGIN_X, FOOTER_Y, CONTENT_W, FOOTER_H);

  // ── Rij 1: Procesregistratie (6 × 30mm, 25mm hoog) ───────────────────
  const colW = CONTENT_W / 6;
  const procesLabels = ['Zagen', 'Lijmen', 'Schuren', 'Sparen', 'Eindcontrole', 'Bloknr'];

  doc.setLineWidth(0.3);
  doc.line(MARGIN_X, ROW2_Y, MARGIN_X + CONTENT_W, ROW2_Y);

  for (let i = 0; i < 6; i++) {
    const xCol = MARGIN_X + i * colW;
    if (i > 0) {
      doc.setLineWidth(0.2);
      doc.line(xCol, FOOTER_Y, xCol, ROW2_Y);
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(80);
    doc.text(procesLabels[i], xCol + 2, FOOTER_Y + 4.5);
  }

  // ── Rij 2: verticale kolomscheidingen ─────────────────────────────────
  doc.setLineWidth(0.25);
  doc.setDrawColor(0);
  for (const x of [X23, X4, X5, X6]) {
    doc.line(x, ROW2_Y, x, PAGE_H);
  }

  // ── Rij 2: horizontale sub-rij scheidingslijnen ───────────────────────
  doc.setLineWidth(0.15);
  // K4: 1 lijn (klant | eindklant)
  doc.line(X4, ROW2_Y + SUB_H, X4 + K4_W, ROW2_Y + SUB_H);
  // K5: 2 lijnen (datum | Route: | Getekend:)
  doc.line(X5, ROW2_Y + SUB_H,     X5 + K5_W, ROW2_Y + SUB_H);
  doc.line(X5, ROW2_Y + 2 * SUB_H, X5 + K5_W, ROW2_Y + 2 * SUB_H);
  // K6: 2 lijnen (leeg | Tek.Nr | branding)
  doc.line(X6, ROW2_Y + SUB_H,     X6 + K6_W, ROW2_Y + SUB_H);
  doc.line(X6, ROW2_Y + 2 * SUB_H, X6 + K6_W, ROW2_Y + 2 * SUB_H);

  // ── K1: materiaalcode ─────────────────────────────────────────────────
  const mc = getMateriaalcode(blad);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text(mc, X1 + 1.5, ROW2_Y + 6);

  // TODO: doorsneeprofiel-icoon — opdrachtgever levert specs in latere sprint
  // Implementatie-skelet bewaard in src/pdf/doorsneeprofiel.ts (uncalled).

  // ── K2-3 merged: kleur (boven) + ordernr week (onder) ────────────────
  const kleur = state.materiaalKeuze?.kleur_label ?? state.materiaal?.kleur ?? 'Glencoe Gepolijst';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0);
  const kleurRegels = doc.splitTextToSize(kleur, K23_W - 3);
  doc.text(kleurRegels, X23 + 1.5, ROW2_Y + 6);

  const ordernr = state.ordernummer ?? '2600376';
  const week    = `Week ${isoWeekNr(state.datum ?? '2026-02-16')}`;
  doc.setFontSize(9);
  doc.text(`${ordernr} ${week}`, X23 + 1.5, ROW2_Y + 20);

  // ── K4 sub1: klant ────────────────────────────────────────────────────
  const klant = state.opdrachtgever?.naam ?? 'Zijlmans Interieur op maat B.V.';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(0);
  const klantRegels = doc.splitTextToSize(klant, K4_W - 3);
  doc.text(klantRegels, X4 + 1.5, ROW2_Y + 5);

  // ── K4 sub2: eindklant ────────────────────────────────────────────────
  const eindklant = state.uwReferentie ?? 'ZIJLMANS - VAN VLIMMEREN';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  const eindklantRegels = doc.splitTextToSize(eindklant, K4_W - 3);
  doc.text(eindklantRegels, X4 + 1.5, ROW2_Y + SUB_H + 5);

  // ── K5 sub1 / sub2 / sub3 ────────────────────────────────────────────
  const datumTekst = isoToDag(state.datum ?? '2026-02-16');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(0);
  doc.text(datumTekst,   X5 + 1.5, ROW2_Y + 5.5);
  doc.text('Route:',     X5 + 1.5, ROW2_Y + SUB_H + 5.5);
  doc.text('Getekend:',  X5 + 1.5, ROW2_Y + 2 * SUB_H + 5.5);

  // ── K6 sub1 (leeg) / sub2 (Tek.Nr) / sub3 (branding) ─────────────────
  const tekNr = `Tek. Nr: ${paginaInfo.paginaNr} - ${paginaInfo.totaalPaginas}`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(0);
  doc.text(tekNr, X6 + 1.5, ROW2_Y + SUB_H + 5.5);

  // Branding: twee expliciete regels op woordgrens (optie B — geen mid-word-break)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(0);
  doc.text('DE KEUKEN-',    X6 + 1.5, ROW2_Y + 2 * SUB_H + 2.5);
  doc.text('BLADENFABRIEK', X6 + 1.5, ROW2_Y + 2 * SUB_H + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(136);
  doc.text('Vasto Natuursteen', X6 + 1.5, ROW2_Y + 2 * SUB_H + 8);
}
