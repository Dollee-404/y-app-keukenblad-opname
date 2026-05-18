import { describe, it, expect } from 'vitest';
import { genereerWerkplaatstekening } from '../index.js';
import { genereerZaagbrief } from '../zaagbrief.js';
import { maakLegeOpname, pdfTekst } from './fixtures.js';

describe('Scenario 4 — lege opname (edge case)', () => {
  const opname = maakLegeOpname();

  it('genereerWerkplaatstekening gooit een Error voor lege opname', () => {
    expect(() => genereerWerkplaatstekening(opname)).toThrow();
  });

  it('Error-message is beschrijvend', () => {
    expect(() => genereerWerkplaatstekening(opname)).toThrow(/bladen/i);
  });

  // genereerZaagbrief gooit geen Error — returnt PDF met alleen header/orderblok,
  // zonder bladen-sectie. Dat is het gewenste gedrag voor een lege opname.
  it('genereerZaagbrief returnt een Blob (geen Error) voor lege opname', async () => {
    const blob = genereerZaagbrief(opname);
    expect(blob).toBeInstanceOf(Blob);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3])).toBe('%PDF');
  });

  it('zaagbrief bevat ZAAGBRIEF-titel maar geen blad-afmetingen', async () => {
    const tekst = await pdfTekst(genereerZaagbrief(opname));
    expect(tekst).toContain('ZAAGBRIEF');
    expect(tekst).not.toContain('Lengte:');
  });
});
