import type { Blad, Sparing, Randafwerking } from '../data/seed-types';
import { bladZijden } from '../drawing/bladZijdenHelpers';

export function omschrijvingVoorCode(code: string): string {
  const dvMatch = code.match(/^DV(\d+)$/);
  if (dvMatch) return `Randafwerking verstek ${dvMatch[1]}mm hoog`;
  if (code === 'T1' || code === 'T1-EF') return 'Randafwerking enkel facet';
  if (code === 'KF') return 'Randafwerking kanten-facet';
  return code;
}

export function omschrijvingVoorSparing(sparing: Sparing): string | null {
  if (sparing.type === 'BOORGAT') return null;
  if (sparing.type === 'SPOELBAK') {
    return sparing.inbouwwijze === 'ONDERBOUW'
      ? 'Uitsparing onderbouw spoelbak'
      : 'Uitsparing vlakinbouw vierkante spoelbak';
  }
  if (sparing.type === 'KOOKPLAAT') {
    return sparing.inbouwwijze === 'OPBOUW'
      ? 'Uitsparing opbouw kookplaat'
      : 'Uitsparing vlakinbouw kookplaat';
  }
  if (sparing.type === 'KOOF' || sparing.type === 'KOLOM' || sparing.type === 'HOEK') {
    return `Uitsparing ${sparing.type.toLowerCase()}`;
  }
  return null;
}

export function berekenM2VoorRand(blad: Blad, rand: Randafwerking): number {
  const zijden = bladZijden(blad);
  const zijde  = zijden.find(z => z.id === rand.zijdeId);
  if (!zijde) return 0;
  return Math.round((zijde.lengte_mm / 1000) * 100) / 100;
}
