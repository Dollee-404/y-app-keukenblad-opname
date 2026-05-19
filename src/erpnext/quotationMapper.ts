import type { Opname, Blad, Sparing, Boorgat } from '../data/seed-types.js';
import { effectiefMateriaalSoort } from '../state/helpers.js';
import { bladZijden } from '../drawing/bladZijdenHelpers.js';
import { bladItemCode, sparingItemCode, boorgatItemCode, randItemCode } from './itemCodeMapping.js';
import { valideerItemCode } from './itemCodeValidation.js';

export interface QuotationPayload {
  quotation_to: 'Customer';
  party_name: string;
  transaction_date: string;
  kbf_opname: 1;
  kbf_meetdatum: string;
  kbf_inmeter: string;
  kbf_opname_json: string;
  items: QuotationItem[];
}

export interface QuotationItem {
  item_code: string;
  item_name: string;
  description: string;
  qty: number;
  uom: string;
  rate: 0;
}

export function opnameNaarQuotation(opname: Opname): QuotationPayload {
  const klantNaam = opname.opdrachtgever?.naam?.trim();
  if (!klantNaam) throw new Error('Klant moet geselecteerd zijn vóór verzenden');
  if (!opname.bladen || opname.bladen.length === 0) throw new Error('Opname heeft geen bladen');

  const vandaag = new Date().toISOString().slice(0, 10);

  const bladItems = opname.bladen.flatMap(blad => bladNaarItems(blad, opname));
  const verstekItems = verstekNaarItems(opname);

  return {
    quotation_to: 'Customer',
    party_name: klantNaam,
    transaction_date: vandaag,
    kbf_opname: 1,
    kbf_meetdatum: opname.datum ?? vandaag,
    kbf_inmeter: opname.inmeting?.inmeter ?? opname.verkoper?.naam ?? '',
    kbf_opname_json: JSON.stringify(opname),
    items: [...bladItems, ...verstekItems],
  };
}

function bladNaarItems(blad: Blad, opname: Opname): QuotationItem[] {
  const items: QuotationItem[] = [];

  // Hoofditem: blad (m² = lengte × breedte, inclusief materiaalverlies)
  const code = bladItemCode(blad, opname);
  valideerItemCode(code);
  const m2 = Math.round((blad.lengte * blad.breedte) / 1_000_000 * 1000) / 1000;
  const mat = materiaalOmschrijving(blad, opname);
  const dikte = blad.dikte ?? opname.materiaalKeuze?.dikte_mm ?? 20;
  const isLVorm = (blad.outline?.length ?? 4) > 4;
  const afmetingenLabel = isLVorm ? `${blad.lengte}×${blad.breedte} (L-vorm)` : undefined;

  items.push({
    item_code: code,
    item_name: `Keukenblad ${mat} ${dikte}mm`,
    description: bouwBladDescription(blad, opname, afmetingenLabel),
    qty: m2,
    uom: 'Square Meter',
    rate: 0,
  });

  // Sparingen
  for (const sparing of blad.sparingen ?? []) {
    const sparCode = sparingItemCode(sparing);
    if (!sparCode) continue;
    const product = [sparing.productMerk, sparing.productModel].filter(Boolean).join(' ');
    items.push({
      item_code: sparCode,
      item_name: sparingNaam(sparing),
      description: `${sparing.type.charAt(0) + sparing.type.slice(1).toLowerCase()} ${sparing.inbouwwijze.toLowerCase()}${product ? ` — ${product}` : ''}`,
      qty: 1,
      uom: 'Nos',
      rate: 0,
    });
  }

  // Boorgaten — gegroepeerd per item_code
  const boorgatGroepen = new Map<string, number>();
  for (const bg of blad.boorgaten ?? []) {
    const bgCode = boorgatItemCode(bg);
    if (!bgCode) continue;
    boorgatGroepen.set(bgCode, (boorgatGroepen.get(bgCode) ?? 0) + 1);
  }
  for (const [bgCode, qty] of boorgatGroepen) {
    items.push({
      item_code: bgCode,
      item_name: BOORGAT_NAMEN[bgCode] ?? 'Boorgat',
      description: `Boorgat — ${(BOORGAT_NAMEN[bgCode] ?? 'boorgat').replace('Boorgat ', '')}`,
      qty,
      uom: 'Nos',
      rate: 0,
    });
  }

  // Randen — gegroepeerd per item_code, in strekkende meter
  const randGroepen = new Map<string, number>(); // item_code → totaal mm
  const zijden = bladZijden(blad);
  for (const rand of blad.randafwerkingen ?? []) {
    const randCode = randItemCode(rand);
    if (!randCode) continue;
    const zijde = zijden.find(z => z.id === rand.zijdeId);
    randGroepen.set(randCode, (randGroepen.get(randCode) ?? 0) + (zijde?.lengte_mm ?? 0));
  }
  for (const [randCode, totaalMm] of randGroepen) {
    const meter = Math.round((totaalMm / 1000) * 100) / 100;
    items.push({
      item_code: randCode,
      item_name: RAND_NAMEN[randCode] ?? 'Randafwerking',
      description: `Randafwerking ${randCode.replace('TOESLAG-RAND-', '')}`,
      qty: meter,
      uom: 'Meter',
      rate: 0,
    });
  }

  return items;
}

function verstekNaarItems(opname: Opname): QuotationItem[] {
  return (opname.verstekRelaties ?? []).map(rel => ({
    item_code: 'TOESLAG-RAND-VERSTEK',
    item_name: 'Verstekverbinding',
    description: `Verstek blad ${rel.bladA_id} zijde ${rel.zijdeA_id} ↔ blad ${rel.bladB_id} zijde ${rel.zijdeB_id}`,
    qty: 1,
    uom: 'Nos',
    rate: 0,
  }));
}

const BOORGAT_NAMEN: Record<string, string> = {
  'TOESLAG-BOORGAT-KRAAN': 'Boorgat kraan',
  'TOESLAG-BOORGAT-QUOOKER': 'Boorgat Quooker',
  'TOESLAG-BOORGAT-ELEKTRA': 'Boorgat elektra',
  'TOESLAG-BOORGAT-WCD': 'Boorgat dubbele WCD',
};

const RAND_NAMEN: Record<string, string> = {
  'TOESLAG-RAND-DV20': 'Verstek 20mm hoog',
  'TOESLAG-RAND-DV30': 'Verstek 30mm hoog',
  'TOESLAG-RAND-DV40': 'Verstek 40mm hoog',
  'TOESLAG-RAND-T1': 'Enkel facet',
  'TOESLAG-RAND-KF': 'Kanten-facet',
};

function sparingNaam(sparing: Sparing): string {
  const typeLabel: Record<string, string> = { SPOELBAK: 'Spoelbak', KOOKPLAAT: 'Kookplaat', HOEK: 'Hoekuitsparing', KOLOM: 'Kolomuitsparing', KOOF: 'Koofuitsparing', BOORGAT: 'Boorgat' };
  const inbouwLabel: Record<string, string> = { VLAKBOUW: 'vlakbouw', ONDERBOUW: 'onderbouw', OPBOUW: 'opbouw' };
  const t = typeLabel[sparing.type] ?? sparing.type;
  const i = inbouwLabel[sparing.inbouwwijze] ?? '';
  return i ? `${t} ${i}` : t;
}

function materiaalOmschrijving(blad: Blad, opname: Opname): string {
  const kleurLabel =
    blad.materiaalKeuze?.kleur_label ??
    opname.materiaalKeuze?.kleur_label;

  const kleurRuw = kleurLabel ?? opname.materiaal?.kleur ?? '';
  const afwerking = kleurLabel
    ? ''
    : (blad.materiaalOverride?.afwerking ?? opname.materiaal?.afwerking ?? '');

  const soort = effectiefMateriaalSoort(blad, opname);
  return [kleurRuw, afwerking, soort].filter(Boolean).join(' ');
}

export function bouwBladDescription(blad: Blad, opname: Opname, afmetingenLabel?: string): string {
  const regels: string[] = [];

  const mat = materiaalOmschrijving(blad, opname);
  const dikte = blad.dikte ?? opname.materiaalKeuze?.dikte_mm ?? '';
  regels.push(`Materiaal: ${mat || '(niet opgegeven)'}${dikte ? ` ${dikte}mm` : ''}`);

  const afm = afmetingenLabel ?? `${blad.lengte}×${blad.breedte}`;
  regels.push(`Afmetingen: ${afm} mm`);

  const raRegel = omschrijfRandafwerking(blad);
  regels.push(`Randafwerking: ${raRegel}`);

  const sparRegel = omschrijfSparingen(blad);
  if (sparRegel) regels.push(`Sparingen:\n${sparRegel}`);

  const boorRegel = omschrijfBoorgaten(blad);
  if (boorRegel) regels.push(`Boorgaten:\n${boorRegel}`);

  return regels.join('\n');
}

export function omschrijfRandafwerking(blad: Blad): string {
  const ras = blad.randafwerkingen ?? [];
  if (ras.length === 0) return '(niet opgegeven)';

  const perCode = new Map<string, string[]>();
  for (const ra of ras) {
    const label = ra.verstek ? `${ra.code} verstek` : ra.code;
    if (!perCode.has(label)) perCode.set(label, []);
    perCode.get(label)!.push(ra.zijdeId);
  }

  return Array.from(perCode.keys()).join(', ');
}

export function omschrijfSparingen(blad: Blad): string {
  const sparingen = blad.sparingen ?? [];
  if (sparingen.length === 0) return '';
  return sparingen.map(s => omschrijfSparing(s)).join('\n');
}

function omschrijfSparing(s: Sparing): string {
  const product = [s.productMerk, s.productModel].filter(Boolean).join(' ') || s.type;
  const inbouw = s.inbouwwijze !== 'VLAKBOUW' ? ` ${s.inbouwwijze.toLowerCase()}` : ' vlakbouw';
  return `  - ${product}${inbouw} (${s.breedte}×${s.hoogte})`;
}

function omschrijfBoorgaten(blad: Blad): string {
  const boorgaten = blad.boorgaten ?? [];
  if (boorgaten.length === 0) return '';

  const perDoel = new Map<string, Boorgat[]>();
  for (const bg of boorgaten) {
    const doel = bg.doel ?? 'OVERIG';
    if (!perDoel.has(doel)) perDoel.set(doel, []);
    perDoel.get(doel)!.push(bg);
  }

  return Array.from(perDoel.entries())
    .map(([doel, gaten]) => {
      const diameters = [...new Set(gaten.map(g => g.diameter))].sort((a, b) => a - b);
      const label = diameters.map(d => `D${d}`).join('');
      return `  - ${label} (${doel.toLowerCase()})`;
    })
    .join('\n');
}
