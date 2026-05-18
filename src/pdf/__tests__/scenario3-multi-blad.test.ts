import { describe, it, expect } from 'vitest';
import { genereerWerkplaatstekening } from '../index.js';
import { genereerZaagbrief } from '../zaagbrief.js';
import { maakMultiBladOpname, pdfTekst } from './fixtures.js';

describe('Scenario 3 — multi-blad opname', () => {
  const opname = maakMultiBladOpname();

  describe('werkplaatstekening', () => {
    it('PDF heeft 3 paginas', async () => {
      const tekst = await pdfTekst(genereerWerkplaatstekening(opname));
      expect(tekst).toContain('Tek. Nr: 3 - 3');
    });

    it('elke pagina toont zijn eigen blad-afmeting', async () => {
      const tekst = await pdfTekst(genereerWerkplaatstekening(opname));
      expect(tekst).toContain('1001'); // blad 1: 1958×1001
      expect(tekst).toContain('630');  // blad 2: 630×604
      expect(tekst).toContain('2760'); // blad 3: 2760×600
    });

    it('footer aanwezig op elke pagina (3x "Tek. Nr:")', async () => {
      const tekst = await pdfTekst(genereerWerkplaatstekening(opname));
      const aantalFooters = (tekst.match(/Tek\. Nr:/g) ?? []).length;
      expect(aantalFooters).toBe(3);
    });
  });

  describe('zaagbrief', () => {
    it('genereerZaagbrief returnt een Blob die begint met %PDF', async () => {
      const blob = genereerZaagbrief(opname);
      expect(blob).toBeInstanceOf(Blob);
      const bytes = new Uint8Array(await blob.arrayBuffer());
      expect(String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3])).toBe('%PDF');
    });

    it('PDF bevat titel ZAAGBRIEF', async () => {
      const tekst = await pdfTekst(genereerZaagbrief(opname));
      expect(tekst).toContain('ZAAGBRIEF');
    });

    it('PDF bevat alle 3 blad-afmetingen als "Lengte: X  Breedte: Y"', async () => {
      const tekst = await pdfTekst(genereerZaagbrief(opname));
      expect(tekst).toContain('Lengte: 1958');
      expect(tekst).toContain('Lengte: 630');
      expect(tekst).toContain('Lengte: 2760');
    });

    it('PDF bevat minstens 3x "0,00" als m2-placeholder', async () => {
      const tekst = await pdfTekst(genereerZaagbrief(opname));
      const aantalNul = (tekst.match(/0,00/g) ?? []).length;
      expect(aantalNul).toBeGreaterThanOrEqual(3);
    });
  });
});
