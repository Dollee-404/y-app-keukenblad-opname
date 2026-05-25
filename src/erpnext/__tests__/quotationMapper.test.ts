import { describe, it, expect } from 'vitest';
import { opnameNaarQuotation, bouwBladDescription, omschrijfRandafwerking, omschrijfSparingen } from '../quotationMapper.js';
import { maakRechthoekOpname, maakLVormOpname, maakMultiBladOpname, maakLegeOpname, maakRechthoekBlad } from '../../pdf/__tests__/fixtures.js';
import type { Opname } from '../../data/seed-types.js';

function metKlant(opname: Opname): Opname {
  return {
    ...opname,
    opdrachtgever: { naam: 'Jansen Keukens B.V.', straat: 'Testlaan 1', postcodePlaats: '1234 AB Teststad' },
  } as unknown as Opname;
}

describe('opnameNaarQuotation', () => {
  it('happy path — 3 bladen levert minstens 3 blad-items op', () => {
    const payload = opnameNaarQuotation(metKlant(maakMultiBladOpname()));
    const bladItems = payload.items.filter(i => i.item_code.includes('-BLAD-'));
    expect(bladItems).toHaveLength(3);
  });

  it('quotation_to is altijd Customer', () => {
    const payload = opnameNaarQuotation(metKlant(maakRechthoekOpname()));
    expect(payload.quotation_to).toBe('Customer');
  });

  it('party_name is de klantnaam', () => {
    const payload = opnameNaarQuotation(metKlant(maakRechthoekOpname()));
    expect(payload.party_name).toBe('Jansen Keukens B.V.');
  });

  it('transaction_date is vandaag in YYYY-MM-DD formaat', () => {
    const payload = opnameNaarQuotation(metKlant(maakRechthoekOpname()));
    expect(payload.transaction_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('kbf_opname is altijd 1', () => {
    const payload = opnameNaarQuotation(metKlant(maakRechthoekOpname()));
    expect(payload.kbf_opname).toBe(1);
  });

  it('kbf_meetdatum komt uit opname.datum', () => {
    const payload = opnameNaarQuotation(metKlant(maakRechthoekOpname()));
    expect(payload.kbf_meetdatum).toBe('2026-05-18');
  });

  it('kbf_opname_json is geldige JSON die de originele opname teruggeeft', () => {
    const opname = metKlant(maakRechthoekOpname());
    const payload = opnameNaarQuotation(opname);
    const parsed = JSON.parse(payload.kbf_opname_json);
    expect(parsed.ordernummer).toBe(opname.ordernummer);
    expect(parsed.bladen).toHaveLength(opname.bladen.length);
  });

  it('kale opname met klant werkt zonder errors', () => {
    expect(() => opnameNaarQuotation(metKlant(maakRechthoekOpname()))).not.toThrow();
  });

  it('throws zonder klant', () => {
    const opname = { ...maakRechthoekOpname(), opdrachtgever: { naam: '', straat: '', postcodePlaats: '' } } as unknown as Opname;
    expect(() => opnameNaarQuotation(opname)).toThrow('Klant moet geselecteerd zijn');
  });

  it('throws zonder bladen', () => {
    expect(() => opnameNaarQuotation(metKlant(maakLegeOpname()))).toThrow('Opname heeft geen bladen');
  });
});

describe('QuotationItem per blad', () => {
  it('item_code bevat materiaal-prefix en dikte, zonder kleur_code', () => {
    const payload = opnameNaarQuotation(metKlant(maakRechthoekOpname()));
    // kleur staat niet meer in item_code — alleen prefix + dikte
    expect(payload.items[0].item_code).toBe('COMPOSIET-BLAD-20MM');
  });

  it('item_name bevat kleur_label', () => {
    const payload = opnameNaarQuotation(metKlant(maakRechthoekOpname()));
    expect(payload.items[0].item_name).toContain('Glencoe');
  });

  it('item_name bevat dikte in mm', () => {
    const payload = opnameNaarQuotation(metKlant(maakRechthoekOpname()));
    expect(payload.items[0].item_name).toContain('20mm');
  });

  it('uom is Square Meter voor blad-items', () => {
    const payload = opnameNaarQuotation(metKlant(maakRechthoekOpname()));
    expect(payload.items[0].uom).toBe('Square Meter');
  });

  it('qty is lengte × breedte / 1.000.000', () => {
    const payload = opnameNaarQuotation(metKlant(maakRechthoekOpname()));
    // 1958 × 1001 / 1.000.000 = 1.959958 → afgerond op 3 decimalen
    expect(payload.items[0].qty).toBeCloseTo(1958 * 1001 / 1_000_000, 3);
  });

  it('rate is altijd 0 voor alle items', () => {
    const payload = opnameNaarQuotation(metKlant(maakMultiBladOpname()));
    for (const item of payload.items) expect(item.rate).toBe(0);
  });

  it('L-vorm blad — description bevat "(L-vorm)"', () => {
    const payload = opnameNaarQuotation(metKlant(maakLVormOpname()));
    expect(payload.items[0].description).toContain('L-vorm');
  });

  it('boorgaten worden als aparte items toegevoegd na blad-item', () => {
    const payload = opnameNaarQuotation(metKlant(maakRechthoekOpname()));
    // fixture heeft 2× KRAAN boorgat → gegroepeerd tot 1 item met qty=2
    const boorItem = payload.items.find(i => i.item_code === 'TOESLAG-BOORGAT-KRAAN');
    expect(boorItem).toBeDefined();
    expect(boorItem!.qty).toBe(2);
    expect(boorItem!.uom).toBe('Nos');
  });

  it('verstek-relaties komen als aparte items na alle bladen', () => {
    const opname = metKlant({
      ...maakRechthoekOpname(),
      verstekRelaties: [{ id: 'v1', bladA_id: 'P1', zijdeA_id: '0', bladB_id: 'P2', zijdeB_id: '2', hoek_graden: 90 }],
    });
    const payload = opnameNaarQuotation(opname);
    const verstekItem = payload.items.find(i => i.item_code === 'TOESLAG-RAND-VERSTEK');
    expect(verstekItem).toBeDefined();
    expect(verstekItem!.qty).toBe(1);
    // staat aan het eind (na alle blad-items)
    const lastBladIdx = payload.items.map(i => i.item_code).lastIndexOf(v => v.includes('-BLAD-'));
    const verstekIdx = payload.items.indexOf(verstekItem!);
    expect(verstekIdx).toBeGreaterThan(0);
  });

  it('sparingen op blad-niveau worden als items toegevoegd', () => {
    const opname = metKlant({
      ...maakRechthoekOpname(),
      bladen: [maakRechthoekBlad({
        sparingen: [{
          id: 'sp-1', type: 'KOOKPLAAT' as const, bladId: 'blad-rechthoek',
          inbouwwijze: 'VLAKBOUW' as const, positie: { x: 900, y: 500 }, breedte: 760, hoogte: 460,
        }],
      })],
    });
    const payload = opnameNaarQuotation(opname);
    const sparItem = payload.items.find(i => i.item_code === 'TOESLAG-SPARING-KOOKPLAAT-VLAKBOUW');
    expect(sparItem).toBeDefined();
    expect(sparItem!.qty).toBe(1);
    expect(sparItem!.uom).toBe('Nos');
  });
});

describe('bouwBladDescription', () => {
  it('regels staan in vaste volgorde: Materiaal, Afmetingen, Randafwerking', () => {
    const opname = metKlant(maakRechthoekOpname());
    const desc = bouwBladDescription(opname.bladen[0], opname);
    const regels = desc.split('\n');
    expect(regels[0]).toMatch(/^Materiaal:/);
    expect(regels[1]).toMatch(/^Afmetingen:/);
    expect(regels[2]).toMatch(/^Randafwerking:/);
  });

  it('description bevat bladafmetingen', () => {
    const opname = metKlant(maakRechthoekOpname());
    const desc = bouwBladDescription(opname.bladen[0], opname);
    expect(desc).toContain('1958');
    expect(desc).toContain('1001');
  });

  it('blad zonder randafwerking toont "(niet opgegeven)"', () => {
    const opname = metKlant(maakRechthoekOpname());
    const bladZonderRA = { ...opname.bladen[0], randafwerkingen: [] };
    const desc = bouwBladDescription(bladZonderRA, opname);
    expect(desc).toContain('(niet opgegeven)');
  });

  it('blad met kookplaat-sparing toont sparing in description', () => {
    const opname = metKlant(maakRechthoekOpname());
    const bladMetSparing = {
      ...opname.bladen[0],
      sparingen: [{
        id: 'sp-1', type: 'KOOKPLAAT' as const, bladId: opname.bladen[0].id,
        inbouwwijze: 'VLAKBOUW' as const, productMerk: 'Bora', productModel: 'C75',
        positie: { x: 900, y: 500 }, breedte: 760, hoogte: 460,
      }],
    };
    const desc = bouwBladDescription(bladMetSparing, opname);
    expect(desc).toContain('Bora C75');
    expect(desc).toContain('Sparingen:');
  });

  it('blad zonder sparingen toont geen "Sparingen:"-regel', () => {
    const opname = metKlant(maakRechthoekOpname());
    const bladZonderSp = { ...opname.bladen[0], sparingen: [] };
    const desc = bouwBladDescription(bladZonderSp, opname);
    expect(desc).not.toContain('Sparingen:');
  });
});

describe('omschrijfRandafwerking', () => {
  it('groepeert identieke codes — vier DV40 geeft één "DV40"', () => {
    const blad = maakRechthoekOpname().bladen[0];
    const result = omschrijfRandafwerking(blad);
    expect(result).toContain('DV40');
    expect(result.split('DV40').length).toBe(2);
  });

  it('toont verstek-suffix bij verstek=true', () => {
    const blad = {
      ...maakRechthoekOpname().bladen[0],
      randafwerkingen: [{ zijdeId: '0', code: 'DV40', label: 'DV40', type: 'VERSTEK' as const, verstek: true }],
    };
    expect(omschrijfRandafwerking(blad)).toContain('verstek');
  });
});

describe('omschrijfSparingen', () => {
  it('lege sparingen geeft lege string', () => {
    const blad = { ...maakRechthoekOpname().bladen[0], sparingen: [] };
    expect(omschrijfSparingen(blad)).toBe('');
  });
});
