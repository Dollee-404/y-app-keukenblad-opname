import { jsPDF } from 'jspdf';
import type { Opname } from '../data/seed-types';
import { omschrijvingVoorCode, omschrijvingVoorSparing, berekenM2VoorRand } from './zaagbrief-helpers';

const PAGE_W    = 210;
const MARGIN_X  = 15;
const CONTENT_W = PAGE_W - 2 * MARGIN_X;
const BOTTOM_Y  = 280;
const LINE_H    = 5.5;
const LABEL_W   = 30;
const M2_X      = 110;  // direct achter langste omschrijving (~nét achter "vlakinbouw vierkante spoelbak")

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

export function genereerZaagbrief(opname: Opname): Blob {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ── Zone 1: Titel ─────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(0);
  doc.text('ZAAGBRIEF', PAGE_W / 2, 18, { align: 'center' });

  doc.setLineWidth(0.5);
  doc.setDrawColor(0);
  doc.line(MARGIN_X, 24, MARGIN_X + CONTENT_W, 24);

  // ── Zone 2: Order-header ──────────────────────────────────────────────────
  const LEFT_VAL_X  = MARGIN_X + 35;
  const RIGHT_COL_X = MARGIN_X + 80;

  let y = 32;

  const leftRows: [string, string][] = [
    ['Ordernr',       opname.ordernummer ?? ''],
    ['Datum',         isoToDag(opname.datum ?? '')],
    ['Uw referentie', opname.uwReferentie ?? ''],
    ['',              ''],
    ['Leverweek',     `${isoWeekNr(opname.datum ?? '')}  Vrijdag`],
  ];

  const adres = [opname.opdrachtgever?.straat, opname.opdrachtgever?.postcodePlaats]
    .filter(Boolean).join(' ');

  const rightRows = [
    opname.opdrachtgever?.naam ?? '',
    opname.uwReferentie ?? '',
    adres,
    'Onderhoudsset: Nee',
    'Verpakken: Nee',
  ];

  for (let i = 0; i < leftRows.length; i++) {
    const [label, val] = leftRows[i];
    if (label) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(0);
      doc.text(label, MARGIN_X, y + i * LINE_H);
      doc.setFont('helvetica', 'normal');
      doc.text(val, LEFT_VAL_X, y + i * LINE_H);
    }
    if (rightRows[i]) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0);
      doc.text(rightRows[i], RIGHT_COL_X, y + i * LINE_H);
    }
  }

  y += leftRows.length * LINE_H + 5;
  doc.setLineWidth(0.5);
  doc.line(MARGIN_X, y, MARGIN_X + CONTENT_W, y);
  y += 8;

  // ── Zone 3: Bladen-lijst ──────────────────────────────────────────────────
  for (const blad of opname.bladen) {
    const mat    = { ...opname.materiaal, ...blad.materiaalOverride };
    const keuze  = blad.materiaalKeuze ?? opname.materiaalKeuze;
    const kleur  = keuze?.kleur_label ?? mat.kleur ?? '';
    const soort  = keuze?.soort ?? mat.soort ?? '';
    const dikte  = keuze?.dikte_mm ?? blad.dikte ?? '';
    const matStr = [kleur, soort, dikte ? `${dikte}mm` : ''].filter(s => s?.trim()).join('  ');

    const randafwerkingen = blad.randafwerkingen ?? [];
    const sparingen       = blad.sparingen ?? [];
    const sparingRegels   = sparingen
      .map(s => omschrijvingVoorSparing(s))
      .filter((s): s is string => s !== null);

    const blokH = (3 + randafwerkingen.length + sparingRegels.length + 1) * LINE_H;
    if (y + blokH > BOTTOM_Y) {
      doc.addPage('a4', 'portrait');
      y = 15;
    }

    // Blad-label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.text(blad.label ?? blad.werkstukType ?? 'Blad', MARGIN_X, y);
    y += LINE_H;

    // Materiaal
    doc.text('Materiaal:', MARGIN_X, y);
    doc.setFont('helvetica', 'normal');
    doc.text(matStr, MARGIN_X + LABEL_W, y);
    y += LINE_H;

    // Afmetingen
    doc.setFont('helvetica', 'bold');
    doc.text(`Lengte: ${blad.lengte}  Breedte: ${blad.breedte}`, MARGIN_X + LABEL_W, y);
    y += LINE_H;

    // Randafwerkingen
    for (const ra of randafwerkingen) {
      const omschrijving = omschrijvingVoorCode(ra.code);
      const m2 = berekenM2VoorRand(blad, ra).toFixed(2).replace('.', ',');
      doc.setFont('helvetica', 'bold');
      doc.text('Afwerking:', MARGIN_X, y);
      doc.setFont('helvetica', 'normal');
      doc.text(omschrijving, MARGIN_X + LABEL_W, y);
      doc.text(m2, M2_X, y, { align: 'left' });
      y += LINE_H;
    }

    // Sparingen (BOORGATen uitgesloten)
    for (const omschrijving of sparingRegels) {
      doc.setFont('helvetica', 'bold');
      doc.text('Uitsparing:', MARGIN_X, y);
      doc.setFont('helvetica', 'normal');
      doc.text(omschrijving, MARGIN_X + LABEL_W, y);
      y += LINE_H;
    }

    y += LINE_H; // lege scheiding-regel
  }

  return doc.output('blob');
}
