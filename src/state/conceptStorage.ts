import type { Opname } from "../data/seed-types";

type ConceptMeta = {
  key: string;
  savedAt: string;
  customerName: string;
};

export function saveConcept(state: Opname): string {
  const key = `kbf-concept-${Date.now()}`;
  const customerName =
    state.opdrachtgever?.naam ||
    state.afleveradres?.naam ||
    "Nog geen klant";
  const data = JSON.stringify({
    version: 1,
    savedAt: new Date().toISOString(),
    customerName,
    state,
  });
  localStorage.setItem(key, data);
  return key;
}

export function loadConcept(key: string): Opname | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (data.version === 1) return data.state as Opname;
    return null;
  } catch {
    return null;
  }
}

export function listConcepts(): ConceptMeta[] {
  const concepts: ConceptMeta[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith("kbf-concept-")) continue;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const data = JSON.parse(raw);
      if (data.version === 1) {
        concepts.push({ key, savedAt: data.savedAt, customerName: data.customerName });
      }
    } catch {
      // skip corrupted entries
    }
  }
  return concepts.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}
