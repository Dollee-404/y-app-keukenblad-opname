# Sprint 8c — UI-knop "Opslaan in ERPNext" in Step4

## Doel

Bestaande placeholder-knop "Verzenden naar ERPNext" in Step4 Overzicht
werkend maken. Inmeter klikt → opname wordt via `quotationMapper`
omgezet naar payload → bridge stuurt naar ERPNext → Quotation verschijnt
in ERPNext met alle opname-data + `kbf_*` custom fields gevuld.

## Bestaande context

- `opnameNaarQuotation()` uit sprint 8b is klaar en getest
- `bridge.createDocument('Quotation', payload)` werkt al
- Item `AANRECHTBLAD` bestaat in de Item-master (gecheckt)
- `kbf_*` custom fields bestaan op Quotation (sprint 8a)

## Functionele flow

```ts
async function handleVerzendNaarERPNext() {
  setBusy('erpnext')
  try {
    // 1. Map opname → payload
    const payload = opnameNaarQuotation(opname)

    // 2. Update of nieuw?
    if (opname.quotationName) {
      // Eerder verzonden — update bestaande Quotation
      await bridge.updateDocument('Quotation', opname.quotationName, payload)
      toonSucces(`Quotation ${opname.quotationName} bijgewerkt`)
    } else {
      // Nieuw — aanmaken
      const result = await bridge.createDocument<{ name: string }>('Quotation', payload)
      // Sla quotation-name op in opname voor toekomstige updates
      updateOpname({ quotationName: result.name })
      toonSucces(`Quotation ${result.name} aangemaakt in ERPNext`)
    }
  } catch (err) {
    console.error('[erpnext-verzenden]', err)
    toonFout(`Verzenden mislukt: ${err.message}`)
  } finally {
    setBusy(null)
  }
}
```

## Datamodel-uitbreiding

`Opname` krijgt een nieuw veld:

```ts
interface Opname {
  // ... bestaande velden
  quotationName?: string  // ERPNext Quotation name na verzending,
                           // bv. "SAL-QTN-2026-0001"
}
```

Wordt gezet na succesvolle eerste createDocument-call. Bij volgende
verzending wordt 'm gebruikt voor update i.p.v. create.

## UI-states

### Knop-tekst

| State | Tekst |
|---|---|
| Nooit verzonden, idle | "Verzenden naar ERPNext" |
| Bezig met verzenden | "Bezig…" |
| Eerder verzonden, idle | "Bijwerken in ERPNext" |
| Disabled (geen klant) | "Verzenden naar ERPNext" (grijs) |

### Disabled-state

Knop disabled als:
- Geen klant geselecteerd in Step1 (`!opname.klant?.customerName`)
- Geen bladen in opname (`opname.bladen.length === 0`)
- Bezig met andere actie (PDF downloaden bv.)

Tooltip op disabled-state:
- Geen klant: "Selecteer eerst een klant in stap 1"
- Geen bladen: "Voeg eerst een blad toe in stap 2"

### Succes-melding

Toast/banner groen, ~5 seconden zichtbaar. Tekst:
- Nieuw aangemaakt: "Quotation {name} aangemaakt in ERPNext"
- Bijgewerkt: "Quotation {name} bijgewerkt in ERPNext"

Bij voorkeur klikbaar zodat de inmeter direct naar de Quotation in
ERPNext kan navigeren:

```tsx
<Toast onClick={() => window.open(`${ERPNEXT_URL}/app/quotation/${quotationName}`, '_blank')}>
  Quotation {quotationName} aangemaakt — klik om te openen
</Toast>
```

`ERPNEXT_URL` komt uit `bridge.getErpNextAppUrl()` (lokaal getter, geen RPC).

### Foutmelding

Toast/banner rood. Tekst is de daadwerkelijke error-message uit
ERPNext of bridge:
- `"Verzenden mislukt: Item not found: AANRECHTBLAD"` (item bestaat niet)
- `"Verzenden mislukt: timeout: createDocument (30s)"` (netwerk-issue)
- `"Verzenden mislukt: Klant moet geselecteerd zijn vóór verzenden"`
  (mapper-error)

Geen succes-redirect bij fout. Inmeter blijft op Step4 zodat hij kan
corrigeren en opnieuw proberen.

## Knop-positie

In de bestaande "acties"-zone van Step4, naast de PDF-knoppen:

```
[ 📄 Werkplaatstekening ]  [ 📋 Zaagbrief ]  [ 📤 Verzenden naar ERPNext ]
```

Drie knoppen op één rij. Visueel onderscheid: PDF-knoppen secondary-stijl,
"Verzenden naar ERPNext" als **primary** want dit is de hoofdactie van
Step4.

## Niet meenemen

- Foto-/PDF-attachment naar de Quotation (wacht op bridge-uitbreiding,
  open vraag uit sprint 1)
- Status-detectie of Quotation al gesubmit/cancelled is — voor MVP
  kunnen we elke "bijwerken" gewoon proberen, ERPNext geeft fout als
  het niet mag (docstatus locked etc)
- Concept-opname opslaan zodat `quotationName` persistent is over
  sessies — komt in sprint 9 (offline + sync)
- Validatie van complete opname vóór verzenden — voor nu vertrouwen
  we op de bestaande validaties uit Step4 (globale waarschuwingen).
  Mapper gooit error als kritieke velden ontbreken.

## Verificatie — handmatig

### Scenario 1 — Nieuwe Quotation aanmaken

1. Open extensie in Y-App, doe een complete opname (klant + 1 blad)
2. Ga naar Step4, klik "Verzenden naar ERPNext"
3. Knop toont "Bezig…", daarna succes-toast met Quotation-naam
4. Open ERPNext: Quotation bestaat, alle kbf_* velden gevuld:
   - `kbf_opname = 1` (gecheckt)
   - `kbf_meetdatum` = datum van opname
   - `kbf_inmeter` = verkoper-naam
   - `kbf_opname_json` = JSON-parseerbaar, bevat opname-data
5. Items-sectie: één item per blad, `rate = 0`, description bevat
   afwerkingen + sparingen

### Scenario 2 — Bestaande Quotation bijwerken

1. Voortbouwend op scenario 1: pas iets aan in de opname (extra blad,
   andere kleur)
2. Klik opnieuw "Bijwerken in ERPNext" (knop-tekst is nu anders!)
3. Verifieer in ERPNext: zelfde Quotation, geüpdate velden

### Scenario 3 — Foutafhandeling

1. Verbreek netwerk (devtools → throttling → offline) of stop ERPNext
2. Klik "Verzenden naar ERPNext"
3. Na ~30s timeout: foutmelding zichtbaar, knop terug naar idle
4. Geen quotationName op opname (omdat verzending faalde)

### Scenario 4 — Disabled-state

1. Verwijder klant uit Step1
2. Ga naar Step4: knop is disabled, tooltip "Selecteer eerst een klant
   in stap 1"

## Niet automatiseren (voor nu)

Geen unit tests of integration tests voor deze knop — de mapper is al
goed getest in 8b, en bridge-calls testen zonder echte ERPNext-instance
heeft beperkte waarde. Handmatige verificatie van 4 scenario's
volstaat voor MVP.

Eventueel later: E2E-test via Playwright + ERPNext-test-instance.
Buiten scope sprint 8.

## Workflow

1. **Stap 8c.1** — Knop-stijl + disabled-state + handler-skelet zonder
   echte bridge-call. Klik logs `console.log('zou verzenden:', payload)`.
2. **Stap 8c.2** — Bridge-call werkend, succes-pad
3. **Stap 8c.3** — Foutafhandeling + update-detectie + Toast-clickable
4. **Stap 8c.4** — Handmatig de 4 scenario's testen, screenshot ERPNext
   naar Eelke

Bij stap 8c.1 expliciet akkoord vragen op de UI-positie en knop-tekst
vóór door naar de bridge-integratie.
