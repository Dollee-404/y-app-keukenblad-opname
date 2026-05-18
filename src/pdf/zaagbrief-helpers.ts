import type { Blad, Sparing, Randafwerking } from '../data/seed-types';

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

export function berekenM2VoorRand(_blad: Blad, _rand: Randafwerking): number {
  // TODO: opdrachtgever levert formule
  // Vasto toont 1,86/1,00/1,96 voor randen op 1958×1001×20mm blad — niet te reverse-engineeren.
  return 0;
}
