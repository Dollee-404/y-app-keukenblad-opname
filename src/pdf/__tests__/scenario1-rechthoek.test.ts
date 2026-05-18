import { describe, it, expect } from 'vitest';
import { genereerWerkplaatstekening } from '../index.js';
import { maakRechthoekOpname, pdfTekst, isPdf } from './fixtures.js';

describe('Scenario 1 — rechthoekig blad met sparingen', () => {
  const opname = maakRechthoekOpname();

  it('genereerWerkplaatstekening returnt een Blob', () => {
    const blob = genereerWerkplaatstekening(opname);
    expect(blob).toBeInstanceOf(Blob);
  });

  it('Blob is een geldig PDF-bestand', async () => {
    const blob = genereerWerkplaatstekening(opname);
    expect(await isPdf(blob)).toBe(true);
  });

  it('PDF heeft 1 pagina', async () => {
    const tekst = await pdfTekst(genereerWerkplaatstekening(opname));
    expect(tekst).toContain('Tek. Nr: 1 - 1');
  });

  it('PDF bevat totaalmaten 1958 en 1001', async () => {
    const tekst = await pdfTekst(genereerWerkplaatstekening(opname));
    expect(tekst).toContain('1958');
    expect(tekst).toContain('1001');
  });

  it('PDF bevat sparing-label "Bora C75"', async () => {
    const tekst = await pdfTekst(genereerWerkplaatstekening(opname));
    expect(tekst).toContain('Bora C75');
  });

  it('PDF bevat materiaalcode "20DV40"', async () => {
    const tekst = await pdfTekst(genereerWerkplaatstekening(opname));
    expect(tekst).toContain('20DV40');
  });

  it('PDF bevat branding "BLADENFABRIEK"', async () => {
    const tekst = await pdfTekst(genereerWerkplaatstekening(opname));
    expect(tekst).toContain('BLADENFABRIEK');
  });
});
