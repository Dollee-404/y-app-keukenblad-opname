import type { Opname, VerstekRelatie, ZijdeId } from "../data/seed-types";

export function relatiesVoorBlad(state: Opname, bladId: string): VerstekRelatie[] {
  return (state.verstekRelaties ?? []).filter(
    (r) => r.bladA_id === bladId || r.bladB_id === bladId
  );
}

export function zijdeIsGekoppeld(state: Opname, bladId: string, zijdeId: ZijdeId): boolean {
  return (state.verstekRelaties ?? []).some(
    (r) =>
      (r.bladA_id === bladId && r.zijdeA_id === zijdeId) ||
      (r.bladB_id === bladId && r.zijdeB_id === zijdeId)
  );
}

export function gekoppeldeZijde(
  state: Opname,
  bladId: string,
  zijdeId: ZijdeId
): { bladId: string; zijdeId: ZijdeId; bladNaam: string } | null {
  const relatie = (state.verstekRelaties ?? []).find(
    (r) =>
      (r.bladA_id === bladId && r.zijdeA_id === zijdeId) ||
      (r.bladB_id === bladId && r.zijdeB_id === zijdeId)
  );
  if (!relatie) return null;

  const anderBladId =
    relatie.bladA_id === bladId ? relatie.bladB_id : relatie.bladA_id;
  const anderZijdeId =
    relatie.bladA_id === bladId ? relatie.zijdeB_id : relatie.zijdeA_id;

  const anderBlad = state.bladen.find((b) => b.id === anderBladId);
  if (!anderBlad) return null;

  return { bladId: anderBladId, zijdeId: anderZijdeId, bladNaam: anderBlad.label };
}

export function ongekoppeldeVerstekzijden(
  state: Opname
): Array<{ bladId: string; zijdeId: ZijdeId; bladNaam: string }> {
  const resultaat: Array<{ bladId: string; zijdeId: ZijdeId; bladNaam: string }> = [];
  for (const blad of state.bladen) {
    for (const ra of blad.randafwerkingen ?? []) {
      if (ra.verstek === true && !zijdeIsGekoppeld(state, blad.id, ra.zijdeId)) {
        resultaat.push({ bladId: blad.id, zijdeId: ra.zijdeId, bladNaam: blad.label });
      }
    }
  }
  return resultaat;
}

export function verstekConflicten(
  state: Opname
): Array<{ bladId: string; zijdeId: ZijdeId; code: string }> {
  const resultaat: Array<{ bladId: string; zijdeId: ZijdeId; code: string }> = [];
  for (const blad of state.bladen) {
    for (const ra of blad.randafwerkingen ?? []) {
      if (ra.code.startsWith("DV") && ra.verstek === true) {
        resultaat.push({ bladId: blad.id, zijdeId: ra.zijdeId, code: ra.code });
      }
    }
  }
  return resultaat;
}
