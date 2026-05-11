# Sprint 3b deel 1 — Sparingen op canvas

## Status na sprint 3a

- Wizard layout geoptimaliseerd (drie-koloms, compacte top-bar, floating
  popovers)
- Bladen toevoegen werkt: rechthoek-template + hoekuithap
- BladInfoPanel rechts toont werkstuk/materiaal/afmetingen
- Canvas met DIN-stijl maatvoering, pan/zoom, geselecteerd segment-accent

## Doel van deze sprint (deel 1)

Sparingen plaatsen op het canvas — kookplaat, spoelbak, vrije rechthoek —
met productcatalogus-keuze. Aan het eind:

- Inmeter tikt op "Sparing toevoegen" → kiest type + product → de sparing
  verschijnt visueel op het blad
- Sparing kan verplaatst worden (tik → input X/Y) en aangepast (afmetingen,
  hoekradius)
- Vlakbouw-sparingen renderen met dubbele lijn (boven/onder), zoals
  Vasto-tekening
- Productcatalogus: minimaal 5 kookplaten + 5 spoelbakken vóóringevuld
- Veiligheids-warning verschijnt bij vlakbouw kookplaat in composiet
- BladInfoPanel rechts toont sparingen-lijst per blad
- State volledig in `opnameReducer` — JSON-preview toont alle sparingen

**Niet in scope (komt in deel 2):**
- Boorgaten (cirkel-sparingen) — alleen rechthoekige sparingen nu
- Maat-referentie-selector ("Gemeten vanaf...")
- Rand-afstand validatie
- Notities + foto's per sparing
- Boorgat-groepen (D7 D70)

## Werkomgeving

- Werk uitsluitend in deze repo (`y-app-keukenblad-opname/`)
- Branch: `feat/sprint-3b-1-sparingen` (vanaf `main`, ná merge sprint 3a)
- Test in Y-App developer-mode tegen Drechtsteden Bouw

## Stap-voor-stap

### 1. Seed-data uitbreiden — productcatalogus

`src/data/seed-data.json` heeft al `producten_kookplaten` en
`producten_spoelbakken`. Uitbreiden naar minimaal 5 elk.

**Kookplaten** — bekende merken in Nederlandse keukens:
- Bora Pure (60×52, vlakbouw, radius 5, trede 7)
- Bora Classic 2.0 (76×52, vlakbouw, radius 5, trede 7)
- Pitt Cooking (vrij configureerbaar — voor nu: standaard 4-pits 60×52,
  vlakbouw)
- AEG IKE85751FB (78×52, vlakbouw, radius 5, trede 7)
- Siemens EX875LX67E (80×52, vlakbouw, radius 5, trede 7)
- Atag HI8271EV (78×52, onderbouw, radius 10, geen trede)

**Spoelbakken** — Caressi + generiek:
- Caressi CAPP50R10 C60 (54×44, vlakbouw, radius 10)
- Caressi CA40R10 (44×44, onderbouw, radius 10)
- Reginox Ohio (60×44, onderbouw, radius 10)
- Franke MRG 610-58 (58×44, opbouw, radius 15)
- Generiek 50SP (50×40, onderbouw, radius 10) — voor "weet niet, neem
  default"

**Belangrijk**: alleen merk-/modelnamen die ik kan verifiëren. Als Claude
Code twijfelt over een echt product → label 'm als "(specs onbevestigd)"
en zet realistische default-maten. Liever conservatief dan een fake
product met fake maten.

Schema-uitbreiding per kookplaat-item:
```json
{
  "merk": "Bora",
  "model": "Pure 60",
  "inbouwwijze": "VLAKBOUW",
  "sparing_boven_mm": [600, 520],
  "sparing_onder_mm": [576, 496],
  "radius_mm": 5,
  "trede_mm": 7,
  "afbeelding": null,
  "opmerking": "Compact vlakbouw"
}
```

Per spoelbak-item:
```json
{
  "merk": "Caressi",
  "model": "CAPP50R10 C60",
  "inbouwwijze": "VLAKBOUW",
  "sparing_boven_mm": [540, 440],
  "sparing_onder_mm": [516, 416],
  "radius_mm": 10,
  "trede_mm": 6,
  "afbeelding": null
}
```

(Onderbouw heeft geen trede; `trede_mm: 0` en `sparing_onder_mm` gelijk aan
`sparing_boven_mm`.)

### 2. Types verfijnen — `seed-types.ts`

De huidige `Sparing` is goed; maar voeg toe/concretiseer:

```typescript
export type Sparing = {
  id: string;
  type: SparingTypeCode;          // 'KOOKPLAAT' | 'SPOELBAK' | 'KOOF' | 'KOLOM' | 'HOEK'
  bladId: string;
  inbouwwijze: InbouwwijzeCode;   // 'VLAKBOUW' | 'ONDERBOUW' | 'OPBOUW' | 'NIS' | 'VERSTEK'

  // Productkeuze (optioneel — als 'm uit catalogus komt)
  productMerk?: string;
  productModel?: string;

  // Positie midden van sparing, vanaf linksonder blad (mm)
  positie: Point;

  // Afmetingen rechthoek (bij vlakbouw zijn dit de boven-maten)
  breedte: number;
  hoogte: number;

  // Vlakbouw extra
  vlakbouw?: {
    breedteOnder: number;
    hoogteOnder: number;
    radiusMm: number;
    tredeMm: number;
  };

  // Hoekafronding (niet-vlakbouw)
  radiusMm?: number;

  notitie?: string;
};
```

State-uitbreiding `opnameReducer.ts`:

```typescript
| { type: 'SPARING_TOEVOEGEN'; sparing: Sparing }
| { type: 'SPARING_VERWIJDEREN'; id: string }
| { type: 'SPARING_BIJWERKEN'; id: string; patch: Partial<Sparing> }
| { type: 'SPARING_SELECTEREN'; id: string | null }
```

State-veld: `selectedSparingId: string | null`.

### 3. Helpers — `src/drawing/sparingHelpers.ts` (nieuw)

```typescript
// Outline van sparing-rechthoek met afgeronde hoeken
// (in mm, relatief vanaf positie-midden)
export function sparingPath(
  sparing: Sparing,
  laag: 'boven' | 'onder'   // vlakbouw heeft 2 lagen
): string  // SVG path string

// Check: ligt sparing volledig binnen blad-outline?
export function sparingPastInBlad(
  sparing: Sparing,
  blad: Blad
): { past: boolean; reden?: string }

// Wijzig product van bestaande sparing — vult maten in vanuit catalogus
export function pasProductToe(
  sparing: Sparing,
  product: KookplaatProduct | SpoelbakProduct
): Sparing
```

Tests in `sparingHelpers.test.ts`:
- `sparingPath` voor vlakbouw Bora Pure → bevat correct radius
- `sparingPastInBlad` — sparing helemaal binnen blad → past=true
- `sparingPastInBlad` — sparing half buiten → past=false met reden
- `pasProductToe` — Caressi-bak vervangt vlakbouw-data correct

### 4. SparingDialog — nieuwe sparing aanmaken

`src/pages/step2/SparingDialog.tsx`:

Modal/sheet binnen canvas-container (niet over hele app).

**Stap 1 — Type kiezen:**

Vier grote tap-knoppen (op tablet 100×100px minimaal):
- `ti-flame` Kookplaat
- `ti-droplet` Spoelbak
- `ti-square` Vrije rechthoek (voor onbekend / overig)
- `ti-x` Annuleren (kleine knop rechtsboven)

**Stap 2 — Product kiezen** (alleen bij Kookplaat/Spoelbak):

- Lijst van producten uit catalogus, gefilterd op type
- Per item een rij: merk + model + inbouwwijze-badge + maten-preview
- Zoekveld bovenaan ("Bora pure...")
- Optie onderaan: "Niet in lijst — voer handmatig in"

Bij keuze:
- Auto-fill alle maten
- Bij vlakbouw kookplaat: check materiaal van het blad. Als
  `state.materiaal.soort === 'COMPOSIET'` of 'KWARTSCOMPOSIET' →
  toon waarschuwing-banner: `seed.clausules.VLAKBOUW_WAARSCHUWING`
  met "Toch toevoegen" / "Andere kookplaat" knoppen

**Stap 3 — Plaatsing (bij alle types):**

- Twee inputs: X (vanaf linkerrand blad, mm) en Y (vanaf onderkant blad, mm)
- Default: midden van blad
- Bij vrije rechthoek: extra inputs breedte/hoogte/radius
- Mini-preview: blad-outline + sparing op de gekozen positie
- Toepassen-knop (groen) + Annuleer

### 5. Sparing renderen op canvas

`src/pages/step2/Canvas.tsx` uitbreiden:

Render binnen de SVG, na het blad-polygoon, vóór de maatvoering:

```jsx
{blad.sparingen?.map(sparing => (
  <g key={sparing.id} className="sparing-group">
    {/* Vlakbouw: onderste laag (kleiner, gestippeld) */}
    {sparing.vlakbouw && (
      <path
        d={sparingPath(sparing, 'onder')}
        fill="none"
        stroke={isSelected ? 'teal-600' : 'slate-400'}
        strokeWidth="0.8"
        strokeDasharray="4,2"
      />
    )}

    {/* Bovenste laag (de zichtbare sparing) */}
    <path
      d={sparingPath(sparing, 'boven')}
      fill={isSelected ? 'teal-50' : 'white'}
      stroke={isSelected ? 'teal-600' : 'slate-700'}
      strokeWidth="1.5"
    />

    {/* Tap-zone (onzichtbaar, groter dan visuele sparing) */}
    <rect
      x={...} y={...} width={...} height={...}
      fill="transparent"
      onPointerDown={() => dispatch({ type: 'SPARING_SELECTEREN', id: sparing.id })}
    />

    {/* Label */}
    <text x={...} y={...} fontSize="10" fill="slate-500">
      {sparing.productMerk} {sparing.productModel}
    </text>
  </g>
))}
```

Geselecteerde sparing krijgt teal-600 stroke; rest grijs.

### 6. SparingPanel — bewerk-paneel

`src/pages/step2/SparingPanel.tsx`:

Floating popover, zelfde stijl als SegmentPanel maar groter (450px breed,
ankert aan sparing-midden).

**Bovenaan**: product-naam + verwijder-icoon
**Body** — drie secties:

1. **Positie** (op blad)
   - X-input + Y-input, ±-knoppen
   - "Centreer op blad" sneltoets-knop

2. **Afmetingen**
   - Breedte + Hoogte
   - Bij vlakbouw: ook "Breedte onder" + "Hoogte onder" + Trede + Radius
   - Bij niet-vlakbouw: alleen Radius

3. **Product wisselen**
   - Mini-knop: "Ander product..." → heropent SparingDialog stap 2
   - Voor handmatige sparing: niet getoond

**Onderaan**: Sluiten-knop (geen Toepassen — wijzigingen zijn live)

### 7. BladInfoPanel — sparingen-lijst

`src/pages/step2/BladInfoPanel.tsx` uitbreiden:

Onder de "Sparingen" header (placeholder uit sprint 3a), nu écht een lijst:

- Voor elke sparing op het geselecteerde blad: een rij
  - Icoon (kookplaat/spoelbak/rechthoek)
  - Productnaam of "Vrije rechthoek"
  - Maat: "764×519 mm @ 925, 500"
- Tikken op rij → selecteert sparing (zelfde state als tikken op canvas)
- Onderaan: "+ Sparing toevoegen" knop (opent SparingDialog)

### 8. Canvas-toolbar uitbreiden

In `CanvasToolbar.tsx`: een knop "+ Sparing" (icoon `ti-circle-plus`)
tussen "Hoek wegknippen" en "Overhang". Opent SparingDialog.

(Toegang via toolbar én via BladInfoPanel — beide flows mogen werken.)

### 9. Validatie — vlakbouw composiet warning

Voor commit: zorg dat bij keuze van een vlakbouw-product, als het project-
materiaal composiet/kwartscomposiet is, een prominente warning verschijnt.

Implementatie:

```typescript
const isComposiet = ['COMPOSIET', 'KWARTSCOMPOSIET'].includes(materiaal.soort);
const isVlakbouw = product.inbouwwijze === 'VLAKBOUW';

if (isComposiet && isVlakbouw) {
  // Toon warning-banner met seed.clausules.VLAKBOUW_WAARSCHUWING
  // Knoppen: "Toch toevoegen" / "Kies ander product"
}
```

Niet block-erend, wel duidelijk zichtbaar.

### 10. Test in Y-App developer-mode

Voor commit, doorloop deze flow:

1. Open extensie in Y-App
2. Klant gevuld vanuit eerdere sessie
3. Stap 2: maak blad "Werkblad" 1958 × 1001 × 20 mm
4. Klik op "+ Sparing" in canvas-toolbar
5. Kies "Kookplaat" → kies "Bora Pure 60"
6. Plaats op X=925, Y=500 → toepassen
7. Check: sparing zichtbaar op canvas met dubbele lijn (vlakbouw), correct
   formaat, op juiste positie
8. Check: warning verschenen want composiet (zet `state.materiaal.soort`
   handmatig op 'COMPOSIET' als 't nog niet zo is)
9. Klik op sparing → SparingPanel verschijnt naast 'm
10. Wijzig X naar 1000 → sparing verschuift live
11. Wijzig naar ander product → maten passen aan
12. Voeg tweede sparing toe: "Spoelbak" → "Caressi CAPP50R10"
13. Verwijder een sparing via panel
14. Check JSON-preview: `bladen[0].sparingen` heeft de juiste data
15. Screenshot in chat

### 11. Commits

Atomic, suggestie:
- `feat: extend product catalog with 5+ cookplates and sinks`
- `feat: refine Sparing type with vlakbouw subobject`
- `feat: add sparingHelpers with path generation and bounds check`
- `test: cover sparingHelpers`
- `feat: add SparingDialog for adding sparingen`
- `feat: render sparingen on canvas with vlakbouw dual-layer`
- `feat: add SparingPanel for editing position and dimensions`
- `feat: list sparingen in BladInfoPanel`
- `feat: vlakbouw composiet warning banner`

Push naar `feat/sprint-3b-1-sparingen`, open PR, merge na visuele check.

## Definition of done

- [ ] Productcatalogus uitgebreid: ≥5 kookplaten + ≥5 spoelbakken
- [ ] `Sparing` type met vlakbouw-subobject werkend
- [ ] `sparingHelpers.ts` met passing tests
- [ ] SparingDialog: type-kiezer → product-kiezer → plaatsing
- [ ] Sparing op canvas zichtbaar met dubbele lijn bij vlakbouw
- [ ] Tikken op sparing opent SparingPanel
- [ ] Position + afmetingen aanpasbaar via panel, live update
- [ ] Product wisselen werkt
- [ ] Sparing verwijderen werkt
- [ ] Vlakbouw composiet warning verschijnt
- [ ] BladInfoPanel toont sparingen-lijst met juiste info
- [ ] Canvas-toolbar heeft "+ Sparing" knop
- [ ] JSON-preview toont sparingen correct
- [ ] Getest in Y-App developer-mode, screenshot in chat
- [ ] `npm run build` slaagt
- [ ] PR gemerged, GitHub Pages deploy ok

## Wat NIET doen

- Geen boorgaten — deel 2
- Geen maat-referentie-selector — deel 2
- Geen rand-afstand validatie — deel 2
- Geen foto's/notities per sparing — deel 2
- Geen catalogusbeheer in de UI (alleen JSON-bewerking voor nu)
- Geen drag-and-drop op canvas — alleen via panel-input (sprint 3c)
- Geen verstek-relaties — sprint 3c

## Open vragen om mee af te sluiten

Eindig met een lijst voor mij. Verwachte onderwerpen:

- Producten waar ik twijfel over de specs — toon mij de lijst zodat ik kan
  bevestigen of corrigeren
- Sparing-label op canvas: productnaam zichtbaar in canvas, of alleen in
  panel/lijst? (mockup-vraag)
- Wat als materiaal nog niet gekozen is (stap 3 nog niet bezocht)? Warning
  voor vlakbouw composiet niet kunnen tonen — fallback gedrag?
- Default-positie van nieuwe sparing — midden van blad, of laatste positie
  + offset?

## Vooruitblik deel 2

Sprint 3b deel 2:
- Boorgaten (kraan, Quooker, elektra) als cirkels op canvas
- Boorgat-groepen (D7 D70 met h.o.h.)
- Maat-referentie-selector: vanaf welke rand?
- Rand-afstand validatie (<60mm = warning)
- Notitie + foto per sparing/boorgat
- Hoekradius op vrije rechthoek-sparingen

Daarna sprint 3c: verstek-relaties + foto/PDF import.
