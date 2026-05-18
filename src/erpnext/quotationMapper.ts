import type { Opname, Blad, Sparing, Boorgat } from '../data/seed-types.js';
import { effectiefMateriaalSoort } from '../state/helpers.js';

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

  return {
    quotation_to: 'Customer',
    party_name: klantNaam,
    transaction_date: vandaag,
    kbf_opname: 1,
    kbf_meetdatum: opname.datum ?? vandaag,
    kbf_inmeter: opname.inmeting?.inmeter ?? opname.verkoper?.naam ?? '',
    kbf_opname_json: JSON.stringify(opname),
    items: opname.bladen.map(blad => bladNaarItem(blad, opname)),
  };
}

function bladNaarItem(blad: Blad, opname: Opname): QuotationItem {
  const mat = materiaalOmschrijving(blad, opname);
  const isLVorm = (blad.outline?.length ?? 4) > 4;
  const afmetingen = isLVorm
    ? `${blad.lengte}×${blad.breedte} (L-vorm)`
    : `${blad.lengte}×${blad.breedte}`;

  return {
    item_code: 'AANRECHTBLAD',
    item_name: `Aanrechtblad ${mat} ${blad.lengte}×${blad.breedte}`,
    description: bouwBladDescription(blad, opname, afmetingen),
    qty: 1,
    uom: 'Nos',
    rate: 0,
  };
}

function materiaalOmschrijving(blad: Blad, opname: Opname): string {
  // kleur_label bevat al de afwerking (bv "Glencoe Gepolijst") — niet dubbelen
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
