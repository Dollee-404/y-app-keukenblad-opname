import type { jsPDF } from 'jspdf';
import type { Blad } from '../data/seed-types';

export type ProfielType = 'verstek' | 'facet' | 'recht';

export function getMateriaalcode(blad: Blad): string {
  // TODO: opdrachtgever-regel afwachten voor automatische afleiding
  // uit blad.dikte + blad.randafwerkingen codes.
  return blad.materiaalcodeOverride ?? `${blad.dikte}DV40`;
}

export function getRandcode(blad: Blad): string {
  const mc = getMateriaalcode(blad);
  return mc.slice(String(blad.dikte).length);  // "20DV40" → "DV40"
}

export function profielType(code: string): ProfielType {
  if (/^DV\d+$/.test(code)) return 'verstek';
  if (code.endsWith('-EF') || /^A\d+/.test(code)) return 'facet';
  return 'recht';
}

export function verstekHoogte(code: string): number | null {
  const m = code.match(/^DV(\d+)$/);
  return m ? parseInt(m[1], 10) : null;
}

/**
 * Tekent doorsneeprofiel-icoon in bounding box (x, y, bw, bh).
 * Iteratie 1: alleen verstek-variant (DV*).
 * Iteratie 2+3: recht en facet — TODO.
 */
export function tekenDoorsneeprofiel(
  doc: jsPDF,
  x: number,
  y: number,
  bw: number,
  bh: number,
  dikte: number,
  code: string,
): void {
  if (profielType(code) === 'verstek') {
    tekenVerstekProfiel(doc, x, y, bw, bh, dikte, code);
  }
  // 'facet' en 'recht' volgen in iteratie 2 en 3
}

/**
 * Vasto DV-anatomie (breed liggend):
 *
 *  ──────────────────────╲         ← blad bovenrand (open links)
 *            20MM         ╲        ← label op/boven blad
 *  ───────────────────  ▓▓▓│  40MM ← blad onderrand + hatched blokje rechts
 *                       ▓▓▓│
 *                       ───┘
 *
 * Elementen:
 *  1. Blad bovenrand  (x, y) → (x+bladW, y)            — geen linker-sluitlijn
 *  2. Blad onderrand  (x, y+bladH) → (x+bladW-diagW, y+bladH)
 *  3. Verstek-schuinte (x+bladW-diagW, y+bladH) → (x+bladW, y+bladH+blokH)
 *  4. Rechterrand      (x+bladW, y) → (x+bladW, y+bladH+blokH)
 *  5. Blokje linkerrand, onderrand
 *  6. Arcering in blokje
 *  7. Labels "20MM" (boven blad) en "40MM" (rechts)
 */
function tekenVerstekProfiel(
  doc: jsPDF,
  x: number, y: number, bw: number, bh: number,
  dikte: number, code: string,
): void {
  const vh = verstekHoogte(code) ?? 40;

  // --- afmetingen (schaal naar bounding box) ---
  // bladW neemt 82% van bw; 18% resteert rechts voor "40MM" label
  const bladW = bw * 0.82;
  // bladH = blokH = elk ~30% van bh; 40% is voor labels boven/onder
  const bladH  = bh * 0.30;
  const blokH  = bh * 0.30;
  // diagW en blokW: resp. 17% en 22% van bladW (45°-verhouding)
  const diagW  = bladW * 0.17;
  const blokW  = bladW * 0.22;

  // body-top: 20% van bh vrij boven voor "20MM" label
  const by     = y + bh * 0.20;
  const blokX  = x + bladW - blokW;  // linkerrand gearceerd blokje

  doc.setLineWidth(0.3);
  doc.setDrawColor(0);

  // 1. Blad bovenrand (links open — geen vertikale sluitlijn)
  doc.line(x, by, x + bladW, by);

  // 2. Blad onderrand
  doc.line(x, by + bladH, x + bladW - diagW, by + bladH);

  // 3. Verstek-schuinte  (onderrand-einde → rechterrand-onderkant)
  doc.line(x + bladW - diagW, by + bladH, x + bladW, by + bladH + blokH);

  // 4. Rechterrand (van blad-top tot blokje-onderkant)
  doc.line(x + bladW, by, x + bladW, by + bladH + blokH);

  // 5a. Blokje linkerrand
  doc.line(blokX, by + bladH, blokX, by + bladH + blokH);
  // 5b. Blokje onderrand
  doc.line(blokX, by + bladH + blokH, x + bladW, by + bladH + blokH);

  // 6. Arcering (45°) binnen blokje
  drawHatching45(doc, blokX, by + bladH, blokW, blokH);

  // 7. Labels
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.setTextColor(0);
  // "20MM" gecentreerd op het blad, net boven bovenrand
  doc.text(`${dikte}MM`, x + bladW * 0.44, by - 0.8, { align: 'center' });
  // "40MM" rechts van het blokje, op halve hoogte van (bladH + blokH)
  doc.text(`${vh}MM`, x + bladW + 1.5, by + bladH + blokH * 0.55, { align: 'left' });
}

function drawHatching45(doc: jsPDF, rx: number, ry: number, rw: number, rh: number): void {
  const spacing = 0.5;
  doc.setLineWidth(0.2);
  doc.setDrawColor(0);
  for (let t = spacing; t < rw + rh; t += spacing) {
    const sx = rx + Math.max(0, t - rh);
    const sy = ry + Math.min(rh, t);
    const ex = rx + Math.min(rw, t);
    const ey = ry + Math.max(0, t - rw);
    doc.line(sx, sy, ex, ey);
  }
}
