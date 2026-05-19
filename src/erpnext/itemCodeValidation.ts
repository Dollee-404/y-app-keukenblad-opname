let geldigeItemCodes: Set<string> | null = null;

export async function laadGeldigeItemCodes(): Promise<void> {
  // Lazy import om window-referentie in bridge.ts niet te triggeren buiten browser-context
  const { fetchList } = await import('../bridge.js');
  const items = await fetchList<{ item_code: string }>('Item', {
    fields: ['item_code'],
    filters: [['item_code', 'like', '%-BLAD-%']],
    limit_page_length: 500,
  });
  geldigeItemCodes = new Set(items.map(i => i.item_code));
}

export function valideerItemCode(code: string): void {
  if (!geldigeItemCodes) return; // cache niet geladen (buiten Y-App context of nog niet geïnitialiseerd)
  if (!geldigeItemCodes.has(code)) {
    throw new Error(
      `Item code '${code}' is niet geconfigureerd in ERPNext. ` +
      `Controleer de kleur/materiaal/dikte combinatie en voeg het item toe via ERPNext.`
    );
  }
}

export function resetItemCodeCache(): void {
  geldigeItemCodes = null;
}
