/**
 * Test-script: uithap-maten voor L-vormig blad.
 *
 * Uitvoeren: npx tsx scripts/gen-test-lvorm.ts
 * Output:    /tmp/kbf-pdf-test/lvorm-*.pdf
 *
 * Blad 1958×800 met uithap aan rechts-boven:
 *   knipHoekUit(rechthoekOutline(1958,800), 1, 400, 800)
 *   → outline: [(0,0),(1158,0),(1158,400),(1958,400),(1958,800),(0,800)]
 *   → binnenhoek (1158,400): breedte=800, diepte=400
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { genereerWerkplaatstekening } from '../src/pdf/index.js';
import { rechthoekOutline, knipHoekUit } from '../src/drawing/bladHelpers.js';
import type { Opname } from '../src/data/seed-types.js';

mkdirSync('/tmp/kbf-pdf-test', { recursive: true });

function blobToBuffer(blob: Blob): Promise<Buffer> {
  return blob.arrayBuffer().then(ab => Buffer.from(ab));
}

const outline = knipHoekUit(rechthoekOutline(1958, 800), 1, 400, 800);

const opname: Opname = {
  id: 'test-lvorm',
  ordernummer: '2600376',
  datum: '2026-05-18',
  type: 'OFFERTE',
  status: 'CONCEPT',
  opdrachtgever: { naam: 'Test Klant B.V.', straat: '', postcodePlaats: '' },
  uwReferentie: 'TEST-LVORM',
  materiaalKeuze: { kleur_label: 'Glencoe Gepolijst', soort: '', dikte_mm: 20, kleur_code: '' },
  materiaal: { soort: '', producent: '', afwerking: '', kleur: 'Glencoe Gepolijst' },
  bladen: [
    {
      id: 'blad-lvorm',
      naam: 'Werkblad L-vorm',
      lengte: 1958,
      breedte: 800,
      dikte: 20,
      outline,
      werkstuktype: 'BLADDEEL_A',
      randafwerkingen: [
        { id: 'ra1', zijdeId: 'z0', code: 'DV40', verstek: false },
        { id: 'ra2', zijdeId: 'z4', code: 'DV40', verstek: false },
      ],
      boorgaten: [],
    },
  ],
  sparingen: [],
  accessoires: [],
};

(async () => {
  const blob = genereerWerkplaatstekening(opname);
  const buf  = await blobToBuffer(blob);
  writeFileSync('/tmp/kbf-pdf-test/lvorm-test.pdf', buf);
  console.log('Written: /tmp/kbf-pdf-test/lvorm-test.pdf');
})();
