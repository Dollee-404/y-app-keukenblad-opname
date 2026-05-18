# Sprint 4 — Specificaties

## Status na sprint 3b-2

Stap 1 (klant) + stap 2 (tekening met sparingen + boorgaten) zijn af.
Datamodel bevat al voorbereidingen voor materiaal en randafwerking maar
die zijn hardcoded op defaults. Tijd om stap 3 te bouwen: de echte
specificaties van het project.

## Doel van deze sprint

Een werkende stap 3 die de inmeter doorloopt na het tekenen. Aan het
eind kan de opname-data alles bevatten wat de tekenaar (MB) en
verkoop kantoor nodig hebben.

Drie hoofdblokken:

1. Materiaal + kleur: één default-keuze per project, optioneel
   per-blad-override
2. Randafwerking per zijde: klikbaar SVG-blad waarop de inmeter elke
   zijde aanwijst en de code kiest
3. Accessoires: lijst met catalogus + handmatige invoer

## Werkomgeving

- Repo: `Dollee-404/y-app-keukenblad-opname` (geen wijziging)
- Branch: `feat/sprint-4-specificaties` vanaf `main` ná merge sprint 3b-2
- Test in Y-App developer-mode

## Stap-voor-stap

### 1. Datamodel uitbreiden — `src/data/seed-types.ts`

**Project-niveau materiaal**: al aanwezig als `state.materiaal`. Type
ongewijzigd, maar nu **echt configureerbaar via UI** ipv hardcoded.

**Per-blad override**: voeg optionele property toe aan `Blad`:

```typescript
export type Blad = {
  // ... bestaande properties ...
  materiaal_override?: MateriaalKeuze;  // overschrijft project-niveau
};

export type MateriaalKeuze = {
  soort: string;      // bv. 'COMPOSIET', 'DEKTON'
  dikte_mm: number;   // 20, 30, 12
  kleur_code: string; // bv. 'TIPO'
  kleur_label: string; // bv. 'Tipo'
  leverancier?: string; // bv. 'Quartzforms'
};
```

**Randafwerking per zijde** — nieuw veld op `Blad`:

```typescript
export type ZijdeId = string; // bv. 'voor', 'achter', 'links-1', 'rechts'

export type Randafwerking = {
  zijdeId: ZijdeId;
  code: string;     // bv. 'DV40', 'T1-EF', 'KF', 'A1', 'recht'
  label: string;    // human-readable
  hoogte_mm?: number; // alleen voor DV-codes (40, 60 etc.)
};

export type Blad = {
  // ...
  randafwerkingen?: Randafwerking[];
};
```

L-vorm bladen hebben 6 zijden (rechthoek 4 + uithap 2 extra). Gewone
rechthoeken: 4. Helper functie `bladZijden(blad)` in nieuwe
`bladZijdenHelpers.ts` retourneert array van zijde-objecten met `id`,
`startPunt`, `eindPunt`, `lengte_mm`.

**Accessoires** — nieuw veld op `Opname`:

```typescript
export type AccessoireRegel = {
  id: string;
  sku?: string;     // uit catalogus, of leeg bij handmatig
  naam: string;     // 'Afdekprofiel 30mm', 'Eindkap links', 'Karldur lijm tube'
  aantal: number;
  kleur_code?: string; // optioneel (voor zichtbare accessoires)
  notitie?: string;
};

export type Opname = {
  // ...
  accessoires?: AccessoireRegel[];
};
```

### 2. Seed-data uitbreiden — `src/data/seed-data.json`

**Randafwerking-codes catalogus** — toevoegen sectie:

```json
"randafwerking_codes": [
  { "code": "recht", "label": "Recht (geen bewerking)", "type": "GEEN" },
  { "code": "T1-EF", "label": "T1 enkel facet", "type": "FACET" },
  { "code": "A1", "label": "A1 facet blad", "type": "FACET" },
  { "code": "KF", "label": "Klein facet", "type": "FACET" },
  { "code": "DV20", "label": "DV20 - verstek 20mm hoog", "type": "VERSTEK", "hoogte_mm": 20 },
  { "code": "DV40", "label": "DV40 - verstek 40mm hoog", "type": "VERSTEK", "hoogte_mm": 40 },
  { "code": "DV60", "label": "DV60 - verstek 60mm hoog", "type": "VERSTEK", "hoogte_mm": 60 },
  { "code": "DV80", "label": "DV80 - verstek 80mm hoog", "type": "VERSTEK", "hoogte_mm": 80 }
]
```

Codes komen uit de Excel-template-analyse. Vul aan met andere DV-hoogtes
(100, 120) als die in seed-data.json al voorkomen.

**Accessoire-catalogus** — toevoegen sectie:

```json
"accessoires_catalogus": [
  { "sku": "AFDEK30", "naam": "Afdekprofiel 30mm", "eenheid": "stuk", "default_aantal": 1 },
  { "sku": "AFDEK40", "naam": "Afdekprofiel 40mm", "eenheid": "stuk", "default_aantal": 1 },
  { "sku": "EINDKAP-L", "naam": "Eindkap links", "eenheid": "stuk", "default_aantal": 1 },
  { "sku": "EINDKAP-R", "naam": "Eindkap rechts", "eenheid": "stuk", "default_aantal": 1 },
  { "sku": "LIJM-KARLDUR", "naam": "Karldur lijm tube", "eenheid": "tube", "default_aantal": 1 },
  { "sku": "SCHROEFSET", "naam": "Bevestigingsschroeven (set)", "eenheid": "set", "default_aantal": 1 }
]
```

Lijst bewust beperkt — uitbreiden kan in latere sprint na inmeter-feedback.

### 3. Reducer-acties — `src/state/opnameReducer.ts`

Nieuwe acties:

```typescript
| { type: 'MATERIAAL_INSTELLEN'; materiaal: MateriaalKeuze }
| { type: 'BLAD_MATERIAAL_OVERRIDE'; bladId: string; materiaal: MateriaalKeuze | null }
| { type: 'RANDAFWERKING_BIJWERKEN'; bladId: string; zijdeId: ZijdeId; code: string }
| { type: 'RANDAFWERKING_VERWIJDEREN'; bladId: string; zijdeId: ZijdeId }
| { type: 'ACCESSOIRE_TOEVOEGEN'; regel: AccessoireRegel }
| { type: 'ACCESSOIRE_BIJWERKEN'; id: string; patch: Partial<AccessoireRegel> }
| { type: 'ACCESSOIRE_VERWIJDEREN'; id: string }
```

### 4. Stap 3-pagina — `src/pages/step3/Step3Specs.tsx` (nieuw)

Drie-koloms layout, consistent met stap 2:

- **Links (240px)**: navigatie tussen sub-secties
  - Materiaal & kleur (project-niveau)
  - Randafwerking per blad
  - Accessoires
- **Midden (flex)**: actieve sub-sectie
- **Rechts (220px)**: live samenvatting

Routing tussen sub-secties via state, geen URL-wijziging.

### 5. Sub-sectie 1 — Materiaal & kleur

**Project-niveau formulier:**

```
┌─ Materiaal & kleur (project) ──────────────────────┐
│  Materiaalsoort   [COMPOSIET ▼]                    │
│  Dikte            [20 mm ▼]                        │
│  Kleur            [Zoek kleur... 🔍]               │
│                                                    │
│  ▼ Gekozen: Quartzforms · Tipo                    │
└────────────────────────────────────────────────────┘
```

- Materiaalsoort: dropdown met 11 opties uit seed (`materialen`)
- Dikte: dropdown afhankelijk van materiaal (uit seed)
- Kleur: zoekveld met live filter, lijst met merk + kleurnaam +
  optioneel kleurmonster (vierkant van 16×16px met hex uit seed indien
  beschikbaar)

**Per-blad override sectie** (eronder, expand-on-demand):

```
┌─ Bladen-override (optioneel) ──────────────────────┐
│  Standaard volgen alle bladen het project-materiaal.│
│  Optioneel kan een blad ander materiaal hebben.    │
│                                                    │
│  ☐ Bladdeel A — COMPOSIET · 20mm · Tipo (default) │
│  ☐ Bladdeel B — COMPOSIET · 20mm · Tipo (default) │
│  ☐ Achterwand — [✓ override] DEKTON · 12mm · Sirius│
└────────────────────────────────────────────────────┘
```

Default zijn alle bladen toggle uit (volgen project). Toggle aan opent
mini-formulier met dezelfde drie velden.

### 6. Sub-sectie 2 — Randafwerking per blad

**Hoofdgedachte**: hergebruik de Canvas-component uit stap 2, maar in
"randafwerking-modus". Klikbaar SVG-blad waarop de inmeter elke zijde
aanwijst.

**Layout:**

```
┌─ Randafwerking ────────────────────────────────────┐
│  Bladen: [Bladdeel A ▼]                            │
│                                                    │
│       ┌───────────────────────────────┐           │
│       │ ← klik op een zijde            │           │
│       │   om afwerking te kiezen       │           │
│       │                                │           │
│       │                                │           │
│       └───────────────────────────────┘           │
│       │ ▲ kleur per code: grijs=onbep │           │
│         T1-EF=blauw, DV40=teal etc.   │           │
└────────────────────────────────────────────────────┘
```

**Visueel feedback per zijde:**

- Zijden zonder code: grijs (lijn 0.5px, kleur `--color-text-tertiary`)
- Zijden met code: gekleurd op basis van code-type
  - FACET (T1-EF, A1, KF) → blauw stroke 1px
  - VERSTEK (DV20-DV80) → teal stroke 1.5px met klein hoogte-label
    "DV40" naast de zijde
  - GEEN (recht) → grijs maar dikker dan onbepaald (1px)
- Code-label staat **buiten** het blad (zelfde principe als boorgat-
  labels uit sprint 3b-2), met leader-lijn naar het midden van de zijde

**Tik-flow:**

1. Inmeter tikt op een zijde van het blad → kleine popup verschijnt
2. Popup toont segmented control met code-categorieën:
   `Recht • Facet • Verstek`
3. Bij keuze categorie: tweede rij verschijnt met sub-opties
   - Recht: alleen "Recht"
   - Facet: T1-EF / A1 / KF
   - Verstek: DV20 / DV40 / DV60 / DV80 (+ "Aangepast..." voor custom)
4. Bij keuze: code wordt opgeslagen, popup sluit, zijde kleurt + label
   verschijnt

**Snelkoppeling — "Pas op alle zijden toe":**

Onderaan de pagina knop: "Stel alle zijden in op [DV40 ▼]" → bulk-apply.
Handig voor projecten waar bv. alle bladen DV40 hebben.

**Visualisatie (vereenvoudigd):**

```
Voor (lengte 1958)           ← klik hier
┌────────────────────┐
│       T1-EF        │ ← label boven blad
│                    │
│ ┃                  ┃ ← links/rechts: A1
│ ┃                  ┃
│                    │
│       DV40         │ ← label onder blad
└────────────────────┘
Achter (lengte 1958)
```

### 7. Sub-sectie 3 — Accessoires

**Layout:**

```
┌─ Accessoires ──────────────────────────────────────┐
│  Toegevoegd:                                       │
│  ┌──────────────────────────────────────────────┐ │
│  │ Afdekprofiel 30mm    [Quartz Tipo]  × 2  [✕]│ │
│  │ Eindkap links        ─────────────  × 1  [✕]│ │
│  │ Karldur lijm tube    ─────────────  × 3  [✕]│ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  [+ Uit catalogus ▼]    [+ Handmatig...]          │
└────────────────────────────────────────────────────┘
```

**Catalogus-knop** opent dropdown met items uit seed. Klik = direct
toevoegen met default_aantal 1.

**Handmatig-knop** opent inline mini-form:
- Naam (text input)
- Aantal (number input)
- Eventueel kleur-keuze (dropdown uit gekozen project-kleur of
  "geen kleur")

**Per item in lijst:**
- Naam
- Optioneel kleur-badge (alleen voor zichtbare accessoires zoals
  profielen)
- Aantal-stepper (− / [3] / +)
- Verwijder-knop

### 8. Rechter samenvatting-paneel

Live update terwijl de inmeter werkt:

```
┌─ Samenvatting ─────────────────────┐
│  MATERIAAL                         │
│  Quartzforms · Tipo                │
│  COMPOSIET · 20mm                  │
│                                    │
│  3 BLADEN — 6.40 m²                │
│  Bladdeel A · alle zijden bekend   │
│  Bladdeel B · 2/4 zijden bekend ⚠ │
│  Achterwand · DEKTON · 12mm        │
│                                    │
│  ACCESSOIRES (5 stuks)             │
│  2× Afdekprofiel 30mm              │
│  1× Eindkap links                  │
│  3× Karldur lijm tube              │
└────────────────────────────────────┘
```

Bladen zonder volledige randafwerking krijgen amber waarschuwingsicoon.
Niet blokkerend — de inmeter kan doorgaan naar stap 4 (overzicht), maar
ziet daar weer de waarschuwing.

### 9. Vlakbouw-warning werkt nu echt reactief

Vorige sprint hardcoded composiet → vlakbouw-warning altijd actief.
Nu: bij materiaal-wijziging via stap 3 controleert het systeem alle
sparingen en boorgaten op gekoppelde producten en past de warning
dynamisch aan.

Concreet: als materiaal naar `DEKTON` of `KERAMIEK` wijzigt → vlakbouw-
warnings verdwijnen (geen scheurrisico bij die materialen). Bij wisselen
terug naar `COMPOSIET` of `KWARTSCOMPOSIET` → warnings komen weer.

### 10. Step-indicator update in topbar

Stap 3 bolletje wordt actief op deze pagina. Klik op stap 2-bolletje
gaat terug naar tekening (sparingen + boorgaten). Klik op stap 4 nog
niet beschikbaar (komt in sprint 5).

### 11. Test-scenarios

Voor commit, doorloop deze flow en post screenshot per scenario:

**Scenario A — Standaard project, alle bladen zelfde materiaal:**
1. Maak project met klant + 2 bladen
2. Ga naar stap 3 → Materiaal & kleur
3. Kies Quartzforms · Tipo · 20mm
4. Ga naar Randafwerking → kies Bladdeel A
5. Klik op voorzijde → kies Facet → T1-EF
6. Klik op achterzijde → kies Verstek → DV40
7. Klik op links/rechts → A1
8. Snelkoppeling "Stel alle zijden in op T1-EF" als test
9. Ga naar Accessoires → voeg uit catalogus toe: 2× Afdekprofiel 30mm, 1× Eindkap links
10. Voeg handmatig toe: "Speciaal anker bovenkant"
11. Screenshot samenvatting

**Scenario B — Materiaal-override op één blad:**
1. Project-materiaal: COMPOSIET · Tipo
2. Bladdeel C: toggle override aan → DEKTON · Sirius · 12mm
3. Plaats vlakbouw kookplaat op Bladdeel A en Bladdeel C
4. Verwacht: warning op A (composiet), GEEN warning op C (dekton)

**Scenario C — L-vorm blad met 6 zijden:**
1. Maak L-vorm blad (rechthoek + uithap)
2. Ga naar randafwerking → check dat alle 6 zijden tikbaar zijn
3. Geef elke zijde een andere code
4. Verwacht: alle 6 codes visueel correct gerenderd, geen overlap, labels
   leesbaar buiten blad

### 12. Commits

Atomic, suggestie:
- `feat: types and seed-data for material override and randafwerking`
- `feat: reducer actions for material, randafwerking, accessories`
- `feat: helper for bladZijden computation including L-shape`
- `feat: Step3Specs page skeleton with three sub-sections`
- `feat: material and color selection with per-blad override`
- `feat: clickable SVG canvas for randafwerking per side`
- `feat: accessoires list with catalog and manual input`
- `feat: live samenvatting panel for stap 3`
- `feat: reactive vlakbouw warning based on chosen material`
- `feat: enable step 3 in topbar navigation`

## Definition of done

- [ ] Materiaal-keuze werkt op project-niveau
- [ ] Per-blad override werkt (default uit, toggle aan opent form)
- [ ] Randafwerking per zijde werkt via klikbaar SVG
- [ ] L-vorm bladen tonen alle 6 zijden klikbaar
- [ ] Code-labels staan buiten het blad met leader-lijn (zelfde patroon
      als boorgat-labels)
- [ ] Snelkoppeling "alle zijden tegelijk" werkt
- [ ] Accessoires-catalogus en handmatig invoer werken
- [ ] Aantal-stepper per accessoire werkt
- [ ] Live samenvatting rechts toont alle keuzes correct
- [ ] Bladen met incomplete randafwerking tonen amber waarschuwing
- [ ] Vlakbouw-warning reageert dynamisch op materiaal-keuze
- [ ] Stap 3 bolletje actief in topbar
- [ ] Drie scenario-screenshots in chat
- [ ] `npm run build` slaagt
- [ ] PR ready om te mergen

## Wat NIET doen

- Geen prijs-velden (rate=0 in Quotation, kantoor vult later in)
- Geen leveringsdatum-velden
- Geen wizard-navigatie wijziging (komt sprint 5)
- Geen verstek-relaties tussen bladen (komt sprint 3c)
- Geen verkoper auto-match op user (later, vereist Y-App context)
- Geen catalog-uitbreiding via UI (catalogus is statisch in seed-data,
  uitbreiden gebeurt door code-PR)

## Vooruitblik

Na deze sprint heeft de extensie alle data die een PDF werkplaatstekening
nodig heeft: klant + bladen + sparingen + boorgaten + materiaal +
randafwerking per zijde + accessoires. Sprint 5 (overzicht +
wizard-navigatie) en sprint 6 (PDF generatie) kunnen daarna gefocust
worden op rendering, niet op data-completeness.

## Open vragen voor later

- Materialen-catalogus uitbreidbaar door inmeter zelf? Of alleen via
  code-PR? Voorlopig: alleen code-PR.
- Custom DV-hoogtes (DV35, DV45)? Voorlopig: vaste set, "Aangepast..."
  optie kan numeric input voor andere hoogtes (komt mogelijk in deze
  sprint als simpel toe te voegen, anders polish-sprint).
- Accessoires met kleur-koppeling: alleen profielen zijn zichtbaar in
  de keuken — eindkappen, lijm, schroeven niet. Voorlopig kleur-keuze
  optioneel voor alle items, inmeter beslist zelf.
