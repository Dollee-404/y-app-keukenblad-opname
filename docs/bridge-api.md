# Bridge API — Keukenblad Opname

Dit document is het contract tussen de extensie en de Y-App host.
Alle ERPNext-communicatie verloopt via deze bridge.

Bron: bestudeerd in `ExtensionHost.tsx` (Y-App) en `../bouwmeester/src/bridge/index.ts`.

---

## Hoe de bridge werkt

De extensie draait in een sandboxed `<iframe>`. De browser geeft de iframe
geen toegang tot de Y-App cookies of sessie. Alle ERPNext-aanroepen worden
doorgegeven aan de Y-App parent via `postMessage`.

### Wire protocol

```
extensie → parent   { id, type: "yapp-ext.rpc",       method, args[] }
parent → extensie   { id, type: "yapp-ext.rpc.reply", ok: true,  result }
                  | { id, type: "yapp-ext.rpc.reply", ok: false, error }
```

- `id` is een oplopend integer, uniek per call.
- Timeout: **30 seconden**. Daarna reject de Promise.
- Origin-check: inkomende berichten worden alleen geaccepteerd als
  `event.origin === HOST_ORIGIN` (de `host` URL-param).

### URL-params

Y-App injecteert bij iframe-load:

| Param | Waarde | Geëxporteerd als |
|---|---|---|
| `host` | `https://y-app.impertio.app` | `HOST_ORIGIN` |
| `instance` | `"42"` (instance-ID) | `INSTANCE_ID` |
| `erpUrl` | `https://mijn-erp.cloud` | `ERPNEXT_URL` |
| `lang` | `"nl"` of `"en"` | `LANG` |

Geen Y-App context (directe browsernavigatie): alle params zijn leeg,
`IN_YAPP_CONTEXT === false`, alle RPC-calls geven een fout.

---

## Beschikbare methodes

### `fetchList<T>(doctype, params?)`

```ts
fetchList<T>(doctype: string, params?: {
  fields?: string[];
  filters?: unknown[][];
  limit_page_length?: number;
  limit_start?: number;
  order_by?: string;
}): Promise<T[]>
```

**Voorbeeld:**
```ts
const klanten = await fetchList<{ name: string; customer_name: string }>('Customer', {
  fields: ['name', 'customer_name'],
  limit_page_length: 100,
})
```

---

### `fetchDocument<T>(doctype, name)`

```ts
fetchDocument<T>(doctype: string, name: string): Promise<T>
```

**Voorbeeld:**
```ts
const offerte = await fetchDocument<Quotation>('Quotation', 'SAL-QTN-2026-0001')
```

---

### `updateDocument<T>(doctype, name, data)`

```ts
updateDocument<T>(doctype: string, name: string, data: Record<string, unknown>): Promise<T>
```

**Voorbeeld:**
```ts
await updateDocument('Quotation', 'SAL-QTN-2026-0001', {
  kbf_meetdatum: '2026-05-11',
})
```

---

### `callMethod<T>(method, args)`

```ts
callMethod<T>(method: string, args?: Record<string, unknown>): Promise<T>
```

Directe Frappe/ERPNext API-methode aanroep. Gebruik dit voor alles wat
niet via de standaardmethodes kan.

**Voorbeeld:**
```ts
const result = await callMethod('frappe.client.get_list', {
  doctype: 'Customer',
  filters: [['disabled', '=', 0]],
  fields: ['name'],
  limit_page_length: 500,
})
```

---

### `createDocument<T>(doctype, doc)` — nieuw document aanmaken

```ts
createDocument<T>(doctype: string, doc: Record<string, unknown>): Promise<T>
```

Intern: `callMethod("frappe.client.insert", { doc: { doctype, ...doc } })`.

**Voorbeeld — Quotation aanmaken:**
```ts
const quotation = await createDocument<{ name: string }>('Quotation', {
  quotation_to: 'Customer',
  party_name: 'BAKKER',
  transaction_date: '2026-05-11',
  kbf_meetdatum: '2026-05-11',
  kbf_inmeter: 'rob@keukenbladenfabriek.nl',
  kbf_opname_json: JSON.stringify(opname),
  items: [
    {
      item_code: 'AANRECHTBLAD',
      item_name: 'Aanrechtblad COMPOSIET GLENCOE 20mm',
      qty: 1.44,   // m²
      rate: 0,
    },
  ],
})
```

> **Let op:** `rate: 0` op alle regels — prijs wordt door kantoor ingevuld.

---

### `fetchPrivateFile(filePath)`

```ts
fetchPrivateFile(filePath: string): Promise<{ contentType: string; base64: string }>
```

Haalt een privé ERPNext-bestand op als base64. Bruikbaar voor foto-preview.

**Voorbeeld:**
```ts
const { contentType, base64 } = await fetchPrivateFile('/private/files/foto.jpg')
const src = `data:${contentType};base64,${base64}`
```

---

### `fetchAll<T>(...)` — lokale helper

```ts
fetchAll<T>(
  doctype: string,
  fields: string[],
  filters?: unknown[][],
  orderBy?: string,
  pageSize?: number,
): Promise<T[]>
```

Paginerende wrapper om `fetchList`. Haalt alle records op ongeacht totaal.
Geen RPC per se — roept intern fetchList herhaaldelijk aan.

---

### Lokale getters (geen RPC)

```ts
getActiveInstanceId(): string  // → INSTANCE_ID
getErpNextAppUrl(): string     // → ERPNEXT_URL
```

---

## File upload — OPEN VRAAG

**Probleem:** De Y-App bridge bevat geen `uploadFile`-methode in de
`DISPATCH`-tabel van `ExtensionHost.tsx`. `fetchPrivateFile` haalt bestanden
op (base64), maar er is geen omgekeerde richting.

**Gevolg voor dit project:** PDF's en foto's kunnen nog niet rechtstreeks
worden geüpload naar ERPNext via de bridge.

**Mogelijke opties (ter bespreking met Eelke):**

1. **`callMethod` naar ERPNext upload-endpoint** — ERPNext heeft
   `frappe.client.attach_file` of vergelijkbaar. Of via base64 direct in
   een custom field (`kbf_opname_json`). Checken of dit via `callMethod`
   werkt.

2. **Y-App uitbreiden** — een `uploadFile`-methode toevoegen aan
   `ExtensionHost.tsx` DISPATCH. Vereist PR naar Y-App repo.

3. **Opname-JSON in custom field opslaan, PDF later** — sla `kbf_opname_json`
   op bij het aanmaken van de Quotation. PDF genereer je later apart
   (buiten de extensie, of via een aparte workflow).

---

## Foutafhandeling

Alle methodes returnen een `Promise`. Fouten zijn:

| Fout | Oorzaak |
|---|---|
| `Geen Y-App context` | Extensie buiten iframe geopend |
| `timeout: <method> (30s)` | Y-App reageerde niet binnen 30 seconden |
| `Unknown method: <x>` | Methode bestaat niet in DISPATCH |
| ERPNext-fout | `{ exc_type, message }` uit ERPNext — terug als `Error` |

**Patroon:**
```ts
try {
  const result = await fetchList('Customer', { fields: ['name'] })
  // ...
} catch (err) {
  console.error('[bridge]', err)
  // toon foutmelding aan gebruiker
}
```

---

## Versie

- Protocol versie: 1 (conform `ExtensionHost.tsx`)
- Gedocumenteerd: 2026-05-11
- Bestudeerde bron: `Y-App/packages/frontend/src/components/ExtensionHost.tsx`
