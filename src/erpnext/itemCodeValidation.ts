import type { Opname } from '../data/seed-types.js';
import { bladItemCode } from './itemCodeMapping.js';

let geldigeItemCodes: Set<string> | null = null;
let loadingPromise: Promise<void> | null = null;

export async function laadGeldigeItemCodes(): Promise<void> {
  if (geldigeItemCodes !== null) return; // al geladen → no-op
  if (loadingPromise) return loadingPromise; // al bezig → bundel op bestaande call

  loadingPromise = (async () => {
    try {
      // Lazy import zodat window-referentie in bridge.ts niet triggert buiten browser
      const { fetchList } = await import('../bridge.js');
      const items = await fetchList<{ item_code: string }>('Item', {
        fields: ['item_code'],
        filters: [['item_code', 'like', '%-BLAD-%']],
        limit_page_length: 1000,
      });
      geldigeItemCodes = new Set(items.map(i => i.item_code));
    } finally {
      loadingPromise = null; // reset zodat retry mogelijk is na fout
    }
  })();

  return loadingPromise;
}

export function valideerItemCode(code: string): void {
  if (!geldigeItemCodes) return; // cache nog niet geladen — no-op
  if (!geldigeItemCodes.has(code)) {
    throw new Error(
      `Item code '${code}' is niet geconfigureerd in ERPNext. ` +
      `Controleer de kleur/materiaal/dikte combinatie en voeg het item toe via ERPNext.`
    );
  }
}

/** Valideert alle bladen in één opname. Gooit bij de eerste ongeldige item code. */
export function valideerOpname(opname: Opname): void {
  if (geldigeItemCodes !== null && geldigeItemCodes.size === 0) {
    throw new Error(
      'ERPNext heeft nog geen keukenblad-items geconfigureerd. ' +
      'Vraag de beheerder om de prijsstructuur aan te maken (sprint 9 setup).'
    );
  }
  for (const blad of opname.bladen) {
    const code = bladItemCode(blad, opname);
    valideerItemCode(code);
  }
}

export function resetItemCodeCache(): void {
  geldigeItemCodes = null;
  loadingPromise = null;
}
