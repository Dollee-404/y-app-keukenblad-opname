# Sprint 2 — Step1 Klant & Project

## Status na sprint 1

- Extensie live: https://dollee-404.github.io/y-app-keukenblad-opname/
- In Y-App developer-mode getest tegen Drechtsteden Bouw B.V. ERPNext-instance
- Bridge verbonden — URL-params (`host`, `instance`, `erpUrl`, `lang`) komen
  door
- Seed-data laadt correct (11 materialen, 561 kleuren, etc.)
- `docs/bridge-api.md` beschrijft alle gevonden bridge-methodes
- Open vragen voor file-upload en custom fields blijven liggen tot sprint 8

## Doel van deze sprint

Bouw **Step1** van de wizard: de eerste echte data-invoer. Aan het eind van
deze sprint:

- De inmeter ziet bij opstart een keuze: nieuwe opname óf concept hervatten
- Bij nieuwe opname: een formulier voor klant, afleveradres, verkoper,
  meetdatum, inmeter
- Bestaande klanten worden via `bridge.fetchList('Customer')` opgehaald met
  een zoekveld (debounced)
- Nieuwe klanten kunnen handmatig ingevoerd worden
- De gegevens worden vastgehouden in een `useReducer`-state, nog niet
  opgeslagen — alleen zichtbaar als JSON-preview onderaan voor verificatie
- Step2/3/4 zijn nog placeholder-pagina's die enkel zeggen "Volgende sprint"

Géén navigatie tussen stappen nog (komt in sprint 5). Géén localStorage
(komt in sprint 9). Géén ERPNext-schrijven (komt in sprint 8).

## Werkomgeving

- Werk uitsluitend in deze repo (`y-app-keukenblad-opname/`)
- Branch: `feat/sprint-2-klant` (vanaf `main`)
- Referentie `../bouwmeester/` is **read-only** — niets in schrijven
- Vergeet niet: `docs/bridge-api.md` bestaat al; gebruik wat daarin gedocumenteerd
  staat in plaats van opnieuw te gokken hoe `fetchList` werkt

## Stap-voor-stap

### 1. Lees referentiemateriaal

In deze volgorde:

1. `docs/bridge-api.md` — wat hebben we vorige sprint vastgesteld over `fetchList`?
2. `src/data/seed-types.ts` — specifiek de types `Opname`, `Adres`, `Verkoper`
3. `src/App.tsx` — wat staat er nu, hoe is bridge geïnitialiseerd?
4. **`../bouwmeester/src/`** — zoek naar een bestaand customer-search-pattern.
   Heel waarschijnlijk heeft Bouwmeester al iets soortgelijks (lijst+detail
   voor ERPNext-records). Niet wiel opnieuw uitvinden.

Maak een korte samenvatting in chat:
- Welke methode in onze bridge gebruiken we voor `fetchList('Customer', ...)`?
- Welke filters/limit/fields-opties zijn er?
- Wat is de exacte return-shape?
- Heeft Bouwmeester een customer-search component dat we kunnen herschrijven?

### 2. State-management — `useReducer`

Maak `src/state/opnameReducer.ts`:

- Initial state via `legeOpname()` uit `seed-types.ts`
- Actions die in deze sprint nodig zijn:
  - `SET_VERKOPER` — verkoper object setten
  - `SET_INMETER` — naam (string)
  - `SET_MEETDATUM` — ISO date string
  - `SET_OPDRACHTGEVER` — partial van `Adres`
  - `SET_AFLEVERADRES` — partial van afleveradres + `gelijkAanOpdrachtgever`
  - `SET_AFLEVER_GELIJK_AAN_OPDRACHTGEVER` — boolean (kopieert opdrachtgever
    naar afleveradres als true)
  - `SET_ETAGE` — string
  - `SET_KLANT_REGELT_LIFT` — boolean
  - `SET_UW_REFERENTIE` — string

- Type-safe action discriminated union — geen `any`
- Pure functie (geen side-effects)
- Unit test in `src/state/opnameReducer.test.ts` (Vitest) voor minimaal:
  - Initial state laden
  - `SET_AFLEVER_GELIJK_AAN_OPDRACHTGEVER true` kopieert opdrachtgever
  - `SET_OPDRACHTGEVER` met `gelijkAanOpdrachtgever=true` synct ook afleveradres

### 3. App-layout met wizard-skelet

Vervang de huidige `App.tsx` content met:

- Header: "Keukenblad Opname" + extensie-versie
- Stappen-indicator: 4 bolletjes met labels (`1. Klant`, `2. Tekening`,
  `3. Specificaties`, `4. Overzicht`). Stap 1 actief, rest grijs.
  Nog geen klikbare navigatie — visueel alleen.
- Hoofd-content: switch op `currentStep` state (default: 1). Render
  Step1Klant voor stap 1, placeholder-divs ("Volgt in sprint 3/4/5") voor
  de rest.
- Onderaan (debug-mode, alleen tijdens dev): collapsible JSON-preview van
  de huidige `Opname`-state

De stappen-indicator is een eigen component `src/components/StepIndicator.tsx`.

### 4. Step1Klant component

`src/pages/Step1Klant.tsx`. Drie secties:

#### Sectie A — Project & verkoper

- **Verkoper**: dropdown met `seed.verkopers`. Default geselecteerd: degene
  waarvan `default: true`. Verkoper wijzigen vult ook telefoon vanuit
  `seed.bedrijf.telefoon` (alle verkopers delen dat nummer).
- **Inmeter**: text input. Default: leeg. Placeholder: "Naam inmeter".
- **Meetdatum**: date input. Default: vandaag.
- **Uw referentie**: text input, optioneel. Placeholder bv.
  "ZIJLMANS - VAN VLIMMEREN".

#### Sectie B — Opdrachtgever (zoek of nieuw)

Tabs of segmented control: **Bestaande klant** vs **Nieuwe klant**.

**Bestaande klant**:
- Text input met debounced search (300ms). Bij ≥2 karakters:
  `bridge.fetchList('Customer', { filters: ..., limit: 20, fields: [...] })`
- Lijst-onder-input met match-resultaten (max 20)
- Klik op resultaat → vult opdrachtgever-velden vanuit Customer-record
  (`customer_name`, `customer_primary_address`, etc.)
- Lege staat tonen tot er getypt wordt
- Loading-spinner tijdens fetch
- Error-state als bridge-call faalt

**Nieuwe klant**:
- Form-velden: naam, straat + huisnummer, postcode + plaats, e-mail, telefoon
- Alle in `useReducer` via `SET_OPDRACHTGEVER`

#### Sectie C — Afleveradres

- Checkbox: "Afleveradres is gelijk aan opdrachtgever" (default: aan)
- Bij aan: velden zijn read-only en synced met opdrachtgever
- Bij uit: zelfde form-velden, eigen invoer mogelijk
- Plus: etage-dropdown (uit `seed.etages`) en checkbox
  "Klant regelt lift indien nodig"

### 5. ERPNext customer-fetch via bridge

Maak `src/erpnext/customerSearch.ts`:

```typescript
export async function searchCustomers(query: string): Promise<CustomerSummary[]>
```

- Roept onze eigen `bridge.fetchList('Customer', {...})` aan
- Filters: `customer_name like %query%` (let op de Frappe-filter-syntax —
  check `docs/bridge-api.md` of zonodig Bouwmeester voor exacte vorm)
- Fields: zo min mogelijk om response klein te houden — minstens:
  `name`, `customer_name`, `customer_primary_address`, `email_id`,
  `mobile_no`
- Returnt een lichtgewicht `CustomerSummary` type, geen rauwe ERPNext-doc

Test handmatig in Y-App developer-mode tegen de echte
Drechtsteden Bouw-instance. Schrijf in `docs/sprint-2-klant.md` (eind van
sessie) wat je hebt geleerd over hoe deze instance ingericht is — zijn er
bijvoorbeeld custom Customer-velden waar we later iets mee moeten?

### 6. Touch-first styling

- Alle inputs en knoppen min 44×44px hoog
- Labels boven inputs (niet ernaast — werkt beter op smal touch-scherm)
- Tussen secties duidelijk wit-witruimte (16px+)
- Gebruik dezelfde Tailwind-conventies als Bouwmeester (controleer eerst hoe
  daar form-elementen eruit zien — niet je eigen smaak doordrukken)

### 7. Test in Y-App developer-mode

Voordat je commit en pushed:
- `npm run dev` lokaal
- In Y-App: open de extensie
- Doorloop het scherm: tab tussen "Bestaande klant" en "Nieuwe klant"
- Doe een echte search — kies een bestaande klant uit Drechtsteden Bouw
- Switch afleveradres aan/uit
- Check de JSON-preview onderaan — bevat alle ingevoerde data
- Geen TypeScript errors, geen console-errors

### 8. Commit & push

Atomic commits:
- `feat: add opname state reducer with tests`
- `feat: add step indicator component`
- `feat: add customer search via bridge.fetchList`
- `feat: add Step1Klant with opdrachtgever and afleveradres`
- `feat: wire up wizard skeleton in App.tsx`

Push naar `feat/sprint-2-klant`, open PR, merge na visuele check.

## Definition of done

- [ ] Samenvatting bridge + Bouwmeester-pattern gepost
- [ ] `opnameReducer.ts` met tests die slagen
- [ ] StepIndicator component werkt visueel
- [ ] Step1Klant met alle drie secties (project, opdrachtgever, afleveradres)
- [ ] Bestaande-klant-zoek werkt tegen Drechtsteden Bouw ERPNext
- [ ] Nieuwe-klant invoer werkt
- [ ] Afleveradres-checkbox synct correct
- [ ] JSON-preview onderaan toont actuele state
- [ ] Getest in Y-App developer-mode, screenshot in chat
- [ ] `npm run build` slaagt zonder errors
- [ ] Branch gemerged naar main, GitHub Pages deploy succesvol
- [ ] Open vragen voor mij genoteerd

## Wat NIET doen

- Geen wizard-navigatie tussen stappen (Volgende/Vorige knoppen) — komt
  in sprint 5
- Geen localStorage / concept-opslag — komt in sprint 9
- Geen ERPNext-schrijven — komt in sprint 8
- Geen Step2/3/4 inhoud
- Geen styling-frameworks toevoegen — wat Bouwmeester gebruikt is wat wij
  gebruiken
- Niets schrijven in `../bouwmeester/`

## Open vragen om mee af te sluiten

Eindig met een lijst voor mij. Verwachte onderwerpen:

- Welke Customer-velden gebruiken jullie in deze ERPNext-instance die we niet
  in de standaard-mapping gebruiken? (kijk eens naar een bestaande klant)
- Default-verkoper logica — moet de ingelogde Y-App user automatisch matched
  worden met `seed.verkopers` op e-mail, of altijd de seed-default tonen?
- Etages — in seed staat "BEGANE GROND" t/m "22e ETAGE", maar offerten in
  Drechtsteden Bouw gebruiken misschien andere notatie. Check één voorbeeld
  en vraag mij om bevestiging.

## Vooruitblik sprint 3

Sprint 3 wordt **Step2 Tekening** — SVG-canvas met vrij tekenen + foto
importeren. Begin daar pas mee als deze sprint volledig groen is en de
open vragen beantwoord.
