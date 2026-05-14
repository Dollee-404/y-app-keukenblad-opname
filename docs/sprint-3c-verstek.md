# Sprint 3c — Verstek-relaties tussen bladen

## Waarom deze sprint vóór sprint 6

Tijdens de voorbereiding van sprint 6 (PDF werkplaatstekening) bleek
dat de Vasto-zaagtekeningen veel "verstek"-aanduidingen tonen op zijden
van bladen. Pagina 3 van Zaagtekeningen.pdf laat dit het duidelijkst
zien: drie rugwand-onderdelen (1502/1352/507) staan naast elkaar met
"verstek" labels op de zijden waar ze aan elkaar koppelen. Plus "T1"
als afwerking-code op de top. Pagina 4 toont "IN VERSTEK MET ACHTERWAND"
als notitie op aparte bladen.

Zonder verstek-data in het datamodel kunnen we sprint 6 niet correct
genereren. Daarom eerst sprint 3c.

## Doel van deze sprint

Verstek-relaties toevoegen aan datamodel + UI zodat:

1. Per zijde van een blad kan worden aangegeven of 'ie verstek is
   (= 45° schuine snede waar 'm aan ander blad koppelt)
2. Verstek-zijden kunnen worden gekoppeld aan een verstek-zijde van
   een ander blad (relatie-niveau)
3. Validatie waarschuwt bij ongekoppelde verstek-zijden
4. Sprint 6 kan deze data gebruiken om correcte zaagtekeningen te
   maken met "verstek"-labels op de juiste zijden

Foto/PDF-import (oorspronkelijk in sprint 3c roadmap) verschuift naar
een eigen sprint later.

## Werkomgeving

- Repo: `Dollee-404/y-app-keukenblad-opname` (geen wijziging)
- Branch: `feat/sprint-3c-verstek` vanaf `main` ná merge sprint 5
- Test in Y-App developer-mode

## Datamodel: twee niveaus

### Niveau 1 — Zijde-niveau (binnen Blad)

Uitbreiding van bestaande `Randafwerking` type uit sprint 4:

```typescript
export type Randafwerking = {
  zijdeId: ZijdeId;
  code: string;        // 'T1-EF', 'A1', 'KF', 'DV40', 'recht'
  label: string;
  hoogte_mm?: number;  // alleen voor DV-codes
  // NIEUW:
  verstek?: boolean;   // true = zijde is verstek-gesneden
};
```

**Regel**: DV-codes (`'DV20'`, `'DV40'`, `'DV60'`, `'DV80'`) zijn zelf
al verstek-werk. Combineren met `verstek=true` geeft warning ("DV-code
is al verstek; aparte verstek-vlag overbodig"). Niet blokkerend maar
wel zichtbaar.

### Niveau 2 — Relatie-niveau (binnen Opname)

Nieuwe type voor koppelingen tussen bladen:

```typescript
export type VerstekRelatie = {
  id: string;
  bladA_id: string;
  zijdeA_id: ZijdeId;
  bladB_id: string;
  zijdeB_id: ZijdeId;
  hoek_graden: number;  // default 45, soms anders
  notitie?: string;
};

export type Opname = {
  // ... bestaande velden ...
  verstekRelaties?: VerstekRelatie[];
};
```

**Conventie**: een relatie verbindt twee zijden. Beide zijden moeten
`verstek=true` hebben. Bij aanmaken van de relatie wordt dat automatisch
gezet op beide zijden.

**Bij verwijderen** van een relatie: de `verstek=true` blijft staan op
beide zijden (de zijden zijn nog steeds verstek-gesneden, ze hebben
alleen geen koppeling meer). Inmeter kan dat handmatig wijzigen.

**Bij verwijderen** van een heel blad: alle relaties die naar dat blad
verwijzen worden ook verwijderd.

## Stap-voor-stap

### 1. Types uitbreiden — `src/data/seed-types.ts`

Voeg `verstek?: boolean` toe aan `Randafwerking`.
Voeg `VerstekRelatie` type toe.
Voeg `verstekRelaties?: VerstekRelatie[]` toe aan `Opname`.

### 2. Reducer-acties — `src/state/opnameReducer.ts`

```typescript
| { type: 'VERSTEK_RELATIE_TOEVOEGEN'; relatie: VerstekRelatie }
| { type: 'VERSTEK_RELATIE_VERWIJDEREN'; id: string }
| { type: 'VERSTEK_RELATIE_BIJWERKEN'; id: string; patch: Partial<VerstekRelatie> }
```

Bij `VERSTEK_RELATIE_TOEVOEGEN`:
- Set `verstek=true` op `randafwerkingen[zijdeA_id]` en
  `randafwerkingen[zijdeB_id]`
- Maak randafwerking-records aan als ze nog niet bestaan voor die zijden

Bij `BLAD_VERWIJDEREN` (bestaand): cascade-delete van alle
`verstekRelaties` waarvan `bladA_id === id` of `bladB_id === id`.

### 3. Helpers — `src/state/verstekHelpers.ts` (nieuw)

```typescript
// Vind alle relaties waarin een blad voorkomt
export function relatiesVoorBlad(state: Opname, bladId: string): VerstekRelatie[]

// Check of een zijde gekoppeld is
export function zijdeIsGekoppeld(state: Opname, bladId: string, zijdeId: ZijdeId): boolean

// Vind de andere zijde van een gekoppelde zijde
export function gekoppeldeZijde(state: Opname, bladId: string, zijdeId: ZijdeId): {
  bladId: string;
  zijdeId: ZijdeId;
  bladNaam: string;
} | null

// Validatie: verstek-zijden zonder relatie
export function ongekoppeldeVerstekzijden(state: Opname): Array<{
  bladId: string;
  zijdeId: ZijdeId;
  bladNaam: string;
}>

// Validatie: DV-code + verstek conflict
export function verstekConflicten(state: Opname): Array<{
  bladId: string;
  zijdeId: ZijdeId;
  code: string;
}>
```

Tests voor elke helper.

### 4. Verstek-keuze in stap 3 randafwerking

In RandafwerkingSectie (sprint 4): bij klik op een zijde opent ZijdePopup
met segmented control "Recht • Facet • Verstek (hoogte) • Verstek (koppeling)".

De vierde optie is nieuw:
- Label: "Verstek (koppeling)"
- Bij keuze: zet `randafwerking.code = 'verstek'`, `verstek = true`,
  `hoogte_mm` blijft leeg
- Tonen op canvas: zelfde lijn-styling als andere randafwerkingen, plus
  klein verstek-symbool (driehoekje of "↗") naast de code-label

De code-label op de zijde wordt dan iets als:
- "T1-EF verstek" (als zowel afwerking als verstek)
- "verstek" (alleen verstek, geen apart afwerkings-code)
- "DV40" (verstek-hoogte, al verstek-werk)

### 5. VerstekRelatieDialog — `src/pages/step2/VerstekRelatieDialog.tsx` (nieuw)

Wordt geopend vanuit BladInfoPanel via knop "+ Verstek-relatie".

3-staps dialog (zelfde patroon als SparingDialog):

**Stap 1 — Selecteer zijde van huidig blad**
- Mini-canvas van huidige blad
- Klikbare zijden (alleen verstek-zijden of zijden zonder randafwerking)
- Bij klik: zijde markeren

**Stap 2 — Selecteer ander blad**
- Lijst van andere bladen in opname (exclude huidig blad)
- Per blad: naam + mini-canvas
- Bij klik: blad selecteren

**Stap 3 — Selecteer zijde van ander blad + hoek**
- Mini-canvas van gekozen ander blad
- Klikbare zijden
- Onderaan: hoek-invoer (default 45°, dropdown 22.5° / 30° / 45° / 60°)
- Optioneel: notitie-veld
- Toepassen-knop

Bij Toepassen:
- Dispatch `VERSTEK_RELATIE_TOEVOEGEN`
- Beide zijden krijgen `verstek=true`
- Dialog sluit, terug naar canvas

### 6. BladInfoPanel uitbreiden

Onder bestaande secties (Sparingen, Boorgaten) nieuwe sectie:

```
┌─ VERSTEK-RELATIES ────────────────┐
│ Voorzijde ↔ Bladdeel B achterzijde│
│ Rechterzijde ↔ Bladdeel C linker  │
│                                    │
│ [+ Verstek-relatie toevoegen]     │
└────────────────────────────────────┘
```

Lege staat: "Geen verstek-relaties".

Per regel:
- Klein verstek-icoon
- Tekst: "{eigen zijde} ↔ {ander blad} {andere zijde}" + "({hoek}°)"
  als hoek ≠ 45°
- Verwijder-knop (✕) bij hover

### 7. Canvas-rendering: verstek-aanduidingen

Op canvas in stap 2:

**Per zijde met `verstek=true`:**
- Zelfde lijn als andere randafwerkingen (kleur per code-type)
- Plus klein driehoekje (3-4mm) aan beide uiteinden van de zijde naar
  buiten gericht — dit imiteert Vasto's verstek-aanduiding
- Code-label krijgt "verstek" als suffix

**Per zijde met `verstek=true` ÉN gekoppeld:**
- Idem als boven
- Plus "↔ {ander bladnaam}" als sub-label kleiner onder de code-label
- Voor leesbaarheid: positioneer dit label in label-zone buiten blad
  (zelfde patroon als boorgat-labels uit sprint 3b-2)

### 8. Validatie-warnings

In Step3Specs SamenvattingPanel:
- Nieuwe rij "Verstek-relaties: X / Y compleet" (X = gekoppelde
  zijden, Y = totaal verstek-zijden)
- Amber waarschuwing als Y > X

In Step4Overzicht globaleWaarschuwingen:
- "{N} verstek-zijden niet gekoppeld" → amber pill
- "{N} DV-codes met verstek-conflict" → amber pill

### 9. Test scenarios voor screenshots

**Scenario A — Twee bladen met eenvoudige verstek-relatie**

1. Bladdeel A 1000×600 (rechthoek)
2. Bladdeel B 600×600 (vierkant)
3. Bladdeel A randafwerking: rechterzijde = verstek
4. Bladdeel B randafwerking: linkerzijde = verstek
5. Vanuit BladInfoPanel op Bladdeel A: klik "+ Verstek-relatie"
6. Stap 1: kies rechterzijde van A
7. Stap 2: kies Bladdeel B
8. Stap 3: kies linkerzijde van B, hoek 45°
9. Toepassen
10. **Verwacht**: relatie zichtbaar in BladInfoPanel van A én B,
    canvas toont verstek-aanduiding op betreffende zijden, geen
    warnings

**Scenario B — Verstek zonder koppeling (warning)**

1. Bladdeel A: zet voorzijde op `verstek=true` via stap 3 zonder
   relatie aan te maken
2. **Verwacht**: SamenvattingPanel toont "0/1 compleet" amber,
   Step4 overzicht toont "1 verstek-zijde niet gekoppeld" pill

**Scenario C — DV40 + verstek conflict**

1. Bladdeel A: zet rechterzijde op DV40 én probeer verstek=true
2. **Verwacht**: amber waarschuwing in UI ("DV-code is al verstek"),
   gebruiker mag toch opslaan maar wordt gewaarschuwd

**Scenario D — Cascade-delete**

1. Maak relatie A↔B
2. Verwijder Bladdeel B
3. **Verwacht**: relatie automatisch weg, Bladdeel A behoudt
   verstek=true op zijde maar geen koppeling meer, BladInfoPanel
   toont geen relatie meer

### 10. Commits

Atomic, suggestie:

- `feat: types and seed for verstek per zijde and relations`
- `feat: reducer actions for verstek relaties with cascade delete`
- `feat: verstekHelpers with tests for validation logic`
- `feat: verstek option in RandafwerkingSectie ZijdePopup`
- `feat: VerstekRelatieDialog 3-staps flow`
- `feat: verstek-relaties section in BladInfoPanel`
- `feat: canvas rendering for verstek edges with directional triangles`
- `feat: validation warnings for ongekoppelde verstek and DV-conflict`

## Definition of done

- [ ] `verstek?: boolean` op Randafwerking type
- [ ] `VerstekRelatie` type met cascade-delete-logica
- [ ] Reducer-acties voor toevoegen/verwijderen/bijwerken
- [ ] verstekHelpers met passing tests (5 functies)
- [ ] "Verstek (koppeling)" optie in ZijdePopup in stap 3
- [ ] VerstekRelatieDialog 3-staps werkt
- [ ] BladInfoPanel toont verstek-relaties sectie
- [ ] Canvas toont verstek-driehoekjes op betreffende zijden
- [ ] Gekoppelde zijden tonen "↔ {ander blad}" label
- [ ] SamenvattingPanel toont verstek-compleetheid
- [ ] Step4 globaleWaarschuwingen werkt voor verstek
- [ ] DV-code + verstek conflict wordt gesignaleerd
- [ ] Vier scenario screenshots in chat (A, B, C, D)
- [ ] `npm run build` slaagt
- [ ] PR ready voor merge

## Wat NIET doen

- Geen multi-blad-canvas view (komt apart later)
- Geen visuele preview van hoe bladen verbonden zijn in 3D ruimte
- Geen automatische hoek-validatie tussen gekoppelde zijden (zijden
  hoeven niet dezelfde hoek hebben in datamodel; tekenaar interpreteert)
- Geen foto/PDF-import (eigen sprint later)
- Geen wijziging aan sparingen, boorgaten, accessoires of stap 4
  (alleen toevoegingen op die plekken voor verstek-info)

## Open vragen voor later

- **Multi-blad-canvas view**: weergave waar gekoppelde bladen samen
  worden getekend in correct relatieve positie. Vereist berekening
  van transformatie (rotatie + translatie). Kan polish-sprint na 6.
- **Automatische zijdelengte-validatie**: gekoppelde zijden zouden
  dezelfde lengte moeten hebben. Validatie + amber warning bij
  mismatch. Polish-sprint.
- **3D-preview**: laten zien hoe bladen samen een hoek vormen. Te
  ambitieus voor MVP, mogelijk in eindstadium.

## Vooruitblik

Na sprint 3c kan sprint 6 PDF-werkplaatstekening worden gegenereerd
met correcte verstek-labels op zijden. De Vasto-stijl conventies zijn
dan reproduceerbaar.

## Methode

Subagent-driven development:
- Eén taak per keer
- Screenshot per visuele taak
- Wacht op akkoord per stap
- Geen taken combineren zonder vooraankondiging
- Tests groen voor commit
