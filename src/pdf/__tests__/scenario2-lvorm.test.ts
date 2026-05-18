import { describe, it, expect } from 'vitest';
import { genereerWerkplaatstekening } from '../index.js';
import { maakLVormOpname, pdfTekst } from './fixtures.js';

describe('Scenario 2 — L-vorm blad', () => {
  const opname = maakLVormOpname();

  it('PDF heeft 1 pagina', async () => {
    const tekst = await pdfTekst(genereerWerkplaatstekening(opname));
    expect(tekst).toContain('Tek. Nr: 1 - 1');
  });

  it('PDF bevat alle 6 maten (totaal + deelmaten)', async () => {
    const tekst = await pdfTekst(genereerWerkplaatstekening(opname));
    // Totaalmaten
    expect(tekst).toContain('1958');
    expect(tekst).toContain('800');
    // Horizontale deelmaat boven
    expect(tekst).toContain('1158');
    // Verticale deelmaten rechts — beide "400"
    expect(tekst).toContain('400');
  });

  it('materiaalcode bevat geen "undefined" (regressie-check)', async () => {
    const tekst = await pdfTekst(genereerWerkplaatstekening(opname));
    expect(tekst).not.toContain('undefined');
    expect(tekst).toContain('20DV40');
  });

  it('PDF bevat randafwerking-codes DV40 en T1-EF', async () => {
    const tekst = await pdfTekst(genereerWerkplaatstekening(opname));
    expect(tekst).toContain('DV40');
    expect(tekst).toContain('T1-EF');
  });
});
