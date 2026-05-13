import type { Blad, Opname } from "../data/seed-types";

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
