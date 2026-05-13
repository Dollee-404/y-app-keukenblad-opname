import type { Blad, Opname } from "../data/seed-types";
import { rechthoekOutline } from "../drawing/bladHelpers";
import { bladZijden } from "../drawing/bladZijdenHelpers";
import { ongekoppeldeVerstekzijden, verstekConflicten } from "./verstekHelpers";

/**
 * Returns the effective materiaalsoort for a blad, respecting sprint-4 and
 * sprint-3 fields in priority order:
 *   1. blad.materiaalKeuze.soort   (sprint-4 per-blad override)
 *   2. blad.materiaalOverride.soort (sprint-3 per-blad override)
 *   3. state.materiaalKeuze.soort  (sprint-4 project-level)
 *   4. state.materiaal.soort       (sprint-3 project-level, always set)
 *   5. 'COMPOSIET'                 (absolute fallback for legacy data)
 */
export function effectiefMateriaalSoort(blad: Blad, state: Opname): string {
  return (
    blad.materiaalKeuze?.soort
    ?? blad.materiaalOverride?.soort
    ?? state.materiaalKeuze?.soort
    ?? state.materiaal?.soort
    ?? "COMPOSIET"
  );
}

/** Oppervlakte van één blad in m² via shoelace-formule (werkt voor rechthoek en L-vorm). */
export function oppervlakteM2(blad: Blad): number {
  const outline = blad.outline ?? rechthoekOutline(blad.lengte, blad.breedte);
  const n = outline.length;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += outline[i].x * outline[j].y;
    area -= outline[j].x * outline[i].y;
  }
  return Math.abs(area) / 2 / 1_000_000;
}

/** Totaal oppervlak in m² van alle bladen. */
export function totaalM2(state: Opname): number {
  return state.bladen.reduce((s, b) => s + oppervlakteM2(b), 0);
}

/** Totaal aantal accessoires (som van alle aantallen). */
export function totaalAccessoires(state: Opname): number {
  return (state.accessoires ?? []).reduce((s, a) => s + a.aantal, 0);
}

/** Bladen waar minder randafwerkingen zijn ingesteld dan het aantal zijden. */
export function bladenMetIncompleteRandafwerking(state: Opname): Blad[] {
  return state.bladen.filter(
    (b) => (b.randafwerkingen ?? []).length < bladZijden(b).length
  );
}

/** Lijst van globale waarschuwingsteksten voor het overzicht. */
export function globaleWaarschuwingen(state: Opname): string[] {
  const warnings: string[] = [];

  const incompleet = bladenMetIncompleteRandafwerking(state);
  if (incompleet.length > 0) {
    const x = incompleet.length;
    warnings.push(x === 1 ? "1 blad incomplete randafwerking" : `${x} bladen incomplete randafwerking`);
  }

  if (!state.materiaalKeuze?.kleur_code) {
    warnings.push("Geen kleur gekozen");
  }

  const ongekoppeld = ongekoppeldeVerstekzijden(state);
  if (ongekoppeld.length > 0) {
    const n = ongekoppeld.length;
    warnings.push(`${n} verstek-${n === 1 ? "zijde" : "zijden"} niet gekoppeld`);
  }

  const conflicten = verstekConflicten(state);
  if (conflicten.length > 0) {
    const n = conflicten.length;
    warnings.push(`${n} DV-${n === 1 ? "code" : "codes"} met verstek-conflict`);
  }

  return warnings;
}
