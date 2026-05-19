# Sprint 8 — ERPNext Quotation integratie

## Doel

Opname opslaan als Quotation in ERPNext via de Y-App bridge. De inmeter
drukt op één knop in Stap 4, de data gaat naar ERPNext, de extensie toont
het gegenereerde ordernummer terug.

## Stap 8a — Custom field check + migration

**Voer dit als eerste stap uit, rapporteer, wacht op akkoord.**

### Check via bridge

Controleer of de vier custom fields al bestaan op Quotation:

```ts
const velden = ['kbf_opname_json', 'kbf_tekening_pdf', 'kbf_inmeter', 'kbf_meetdatum'];
```

Gebruik `bridge.fetchDocument('DocType', 'Quotation')` of een equivalent
bridge-call om de fieldnames op de Quotation doctype te lezen.
Als bridge geen DocType-inspectie ondersteunt: probeer
`bridge.fetchDocument('Quotation', 'new-quotation-1')` en kijk of de
`kbf_*` keys in de response zitten.

### Als velden ontbreken — lever migration JSON op

Genereer `docs/erpnext-migration.json` met Custom Field definitions:

```json
[
  {
    "doctype": "Custom Field",
    "dt": "Quotation",
    "fieldname": "kbf_opname_json",
    "fieldtype": "Long Text",
    "label": "KBF Opname JSON",
    "insert_after": "amended_from"
  },
  {
    "doctype": "Custom Field",
    "dt": "Quotation",
    "fieldname": "kbf_tekening_pdf",
    "fieldtype": "Attach",
    "label": "KBF Tekening PDF",
    "insert_after": "kbf_opname_json"
  },
  {
    "doctype": "Custom Field",
    "dt": "Quotation",
    "fieldname": "kbf_inmeter",
    "fieldtype": "Link",
    "options": "User",
    "label": "KBF Inmeter",
    "insert_after": "kbf_tekening_pdf"
  },
  {
    "doctype": "Custom Field",
    "dt": "Quotation",
    "fieldname": "kbf_meetdatum",
    "fieldtype": "Date",
    "label": "KBF Meetdatum",
    "insert_after": "kbf_inmeter"
  }
]
```

Eelke importeert dit handmatig via ERPNext → Fixtures of Customize Form.
Dit is geen code in de extensie — het is eenmalig setup.

**Rapporteer bevindingen en wacht op akkoord vóór je verder gaat.**

---

## Stap 8b — Opname → Quotation mapping

### Datamodel

```ts
// src/erpnext/quotationMapper.ts

export type QuotationPayload = {
  doctype: 'Quotation';
  quotation_to: 'Customer';
  party_name: string;          // bridge klant-id uit opname.klant.erpnextId
  transaction_date: string;    // opname.datum (ISO)
  items: QuotationItem[];
  kbf_opname_json: string;     // JSON.stringify(opname)
  kbf_meetdatum: string;       // opname.datum
  // kbf_tekening_pdf: later (sprint 9)
  // kbf_inmeter: later (sprint 9, bridge geeft logged-in user)
};

export type QuotationItem = {
  item_code: string;    // 'Aanrechtblad' — zorg dat dit item bestaat in ERPNext
  item_name: string;    // bv "Aanrechtblad Glencoe Gepolijst 20mm"
  description: string;
  qty: number;          // 1 per blad (MVP)
  rate: 0;              // prijs vult kantoor in
  uom: 'Nos';
};
```

### Items per blad (MVP — één item per blad)

```ts
function bladNaarItem(blad: Blad, opname: Opname): QuotationItem {
  const kleur = blad.materiaalKeuze?.kleur_label
    ?? opname.materiaalKeuze?.kleur_label
    ?? opname.materiaal.kleur;
  const dikte = blad.dikte ?? 20;

  return {
    item_code: 'Aanrechtblad',
    item_name: `Aanrechtblad ${kleur} ${dikte}mm`,
    description: `${blad.label ?? blad.id} — ${blad.lengte}×${blad.breedte}mm`,
    qty: 1,
    rate: 0,
    uom: 'Nos',
  };
}
```

Sub-items voor randafwerking/sparingen komen in een latere sprint.

### Pure function, gescheiden van React

`src/erpnext/quotationMapper.ts` exporteert `opnameNaarQuotation(opname)`.
Vitest-testbaar zonder bridge of DOM.

---

## Stap 8c — Bridge-calls + state

### Bridge API (zie docs/bridge-api.md)

```ts
// Nieuw aanmaken
const result = await bridge.createDocument('Quotation', payload);
// result.name bevat het ERPNext-gegenereerde ordernummer, bv "QTN-2026-00042"

// Bestaande updaten
await bridge.updateDocument('Quotation', opname.erpnextName!, partialPayload);
```

### Opname state uitbreiden

In `src/data/seed-types.ts`, voeg optioneel veld toe aan `Opname`:

```ts
erpnextName?: string;   // ERPNext Quotation name na eerste opslaan, bv "QTN-2026-00042"
```

Na succesvol `createDocument`: sla `result.name` op via de opname-reducer
zodat een volgende klik "Opnieuw verzenden" een update doet i.p.v. een
nieuw document.

### Logica opslaan/updaten

```ts
if (opname.erpnextName) {
  await bridge.updateDocument('Quotation', opname.erpnextName, payload);
} else {
  const result = await bridge.createDocument('Quotation', payload);
  dispatch({ type: 'SET_ERPNEXT_NAME', name: result.name });
}
```

---

## Stap 8d — UI in Stap 4

### Bestaande knop uitbreiden

`src/pages/step4/Step4Overzicht.tsx` heeft al download-knoppen (taak 12).
Voeg een derde actie-knop toe:

```
[ Werkplaatstekening ]  [ Zaagbrief ]  [ Opslaan in ERPNext ]
```

### Knop-gedrag

- **Uitgeschakeld** als `opname.klant?.erpnextId` ontbreekt (klant niet
  geselecteerd in Stap 1)
- **Label**: "Opslaan in ERPNext" bij eerste keer, "Bijwerken in ERPNext"
  als `opname.erpnextName` al gezet is
- **Bezig-state**: spinner + tekst "Bezig..." tijdens bridge-call
- **Succes**: toon `result.name` in een groen bericht,
  bv "Opgeslagen als QTN-2026-00042"
- **Fout**: toon foutmelding in rood, knop weer klikbaar

### Klant-check

De klant-picker in Stap 1 slaat al `erpnextId` op (sprint 2). Controleer
bij opslaan dat dit veld gevuld is. Zo niet: toon uitleg
"Selecteer eerst een klant in Stap 1".

---

## Stap 8e — Tests

`src/erpnext/__tests__/quotationMapper.test.ts`:

- `opnameNaarQuotation` met rechthoekig blad → items.length === 1
- item_name bevat kleur en dikte
- description bevat bladafmetingen
- kbf_opname_json is geldige JSON van de opname
- Opname met 3 bladen → 3 items
- payload bevat transaction_date en quotation_to

Geen bridge-mocking — mapper is pure function.

---

## Niet meenemen in sprint 8

- Bestandsupload (PDF werkplaatstekening, foto's) — wacht op bridge-uitbreiding
- `kbf_inmeter` vullen — wacht op bridge `getCurrentUser()`
- Sub-items per randafwerking/sparing — latere sprint
- Handtekening klant — sprint 9
- Prijs-velden — vult kantoor in

---

## Workflow

1. **Stap 8a** — custom field check via bridge, rapporteer, akkoord
2. **Stap 8b** — `quotationMapper.ts` + tests, akkoord
3. **Stap 8c** — bridge-calls + state, akkoord
4. **Stap 8d** — UI uitbreiden, akkoord
5. Alle tests groen, build verificatie, commit + push

Commit per stap. Screenshot van succesvol opgeslagen Quotation in ERPNext
naar Eelke voor akkoord vóór merge.

## Verificatie eindresultaat

- [ ] Knop "Opslaan in ERPNext" zichtbaar in Stap 4
- [ ] Klik → Quotation aangemaakt in ERPNext test-instance
- [ ] Ordernummer zichtbaar in UI na opslaan
- [ ] `kbf_opname_json` gevuld in ERPNext record
- [ ] Tweede klik → update i.p.v. nieuw document
- [ ] Klant-check: knop uitgeschakeld zonder geselecteerde klant
- [ ] Alle tests groen, build geslaagd
