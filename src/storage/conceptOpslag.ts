import type { Opname } from '../data/seed-types.js';

const CONCEPT_KEY = 'kbf-opname-concept-v1';
const HUIDIGE_VERSIE = 1;

interface OpgeslagenConcept {
  opname: Opname;
  laatstGewijzigd: string;
  versie: number;
  verzonden: boolean;
}

export interface ConceptInfo {
  opname: Opname;
  verzonden: boolean;
  laatstGewijzigd: string;
}

export function opslaanConcept(opname: Opname): void {
  try {
    const concept: OpgeslagenConcept = {
      opname,
      laatstGewijzigd: new Date().toISOString(),
      versie: HUIDIGE_VERSIE,
      verzonden: false,
    };
    localStorage.setItem(CONCEPT_KEY, JSON.stringify(concept));
  } catch (err) {
    console.warn('[concept-opslag] Kan concept niet opslaan:', err);
  }
}

export function laadConcept(): Opname | null {
  return laadConceptInfo()?.opname ?? null;
}

export function laadConceptInfo(): ConceptInfo | null {
  try {
    const raw = localStorage.getItem(CONCEPT_KEY);
    if (!raw) return null;
    const concept = JSON.parse(raw) as OpgeslagenConcept;
    if (concept.versie !== HUIDIGE_VERSIE) {
      console.warn('[concept-opslag] Incompatibele versie, concept verwijderd');
      localStorage.removeItem(CONCEPT_KEY);
      return null;
    }
    return {
      opname: concept.opname,
      verzonden: concept.verzonden ?? false,
      laatstGewijzigd: concept.laatstGewijzigd,
    };
  } catch (err) {
    console.warn('[concept-opslag] Kan concept niet laden:', err);
    return null;
  }
}

export function markeerVerzonden(): void {
  try {
    const raw = localStorage.getItem(CONCEPT_KEY);
    if (!raw) return;
    const concept = JSON.parse(raw) as OpgeslagenConcept;
    if (concept.versie !== HUIDIGE_VERSIE) return;
    concept.verzonden = true;
    localStorage.setItem(CONCEPT_KEY, JSON.stringify(concept));
  } catch {
    // silent — niet fataal
  }
}

export function wisConcept(): void {
  localStorage.removeItem(CONCEPT_KEY);
}

export function bestaatConcept(): boolean {
  return localStorage.getItem(CONCEPT_KEY) !== null;
}
