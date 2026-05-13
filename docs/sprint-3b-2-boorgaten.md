# Sprint 3b deel 2 — Boorgaten + validatie + notities

## Status na sprint 3b deel 1

- Sparingen werken: productcatalogus (kookplaten + spoelbakken), 3-staps
  dialog, floating popover, vlakbouw composiet warning, kleur-codering
  per type
- 11 commits gemerged, live op GitHub Pages

## Doel van deze sprint

Vier features toevoegen die de tekening compleet maken — boorgaten,
validatie, notities, maat-referentie — allemaal binnen de **bestaande
UI-patronen** van de applicatie. Geen nieuwe interactie-modi.

Aan het eind:

- Boorgaten plaatsen via "+ Boorgat" toolbar-knop → BoorgatDialog
  (3-staps, zelfde patroon als SparingDialog)
- Boorgat-groepen (`D7 D70` zoals Vasto-tekening) via sub-actie in
  BoorgatPanel: "+ Volgend boorgat hiernaast"
- Kraan-op-spoelbak via sub-actie in SparingPanel: "+ Kraangat"
- Rand-afstand validatie: amber warning bij <60mm tot blad-rand voor
  zowel sparingen als boorgaten
- Notitie per sparing/boorgat
- Maat-referentie-selector: "Gemeten vanaf [linkerrand / rechterrand /
  vorige sparing / midden blad]"

## Werkomgeving

- Werk uitsluitend in deze repo
- Branch: `feat/sprint-3b-2-boorgaten` (vanaf `main`, ná merge 3b-1)
- Test in Y-App developer-mode

## Stap-voor-stap

### 1. Types en seed-data uitbreiden

**`src/data/seed-types.ts`**: voeg `Boorgat`-type toe:

```typescript
export type BoorgatDoelCode =
  | 'KRAAN' | 'QUOOKER' | 'ELEKTRA' | 'DUBBELE_WCD'
  | 'ZEEPPOMP' | 'DOORVOER' | 'OVERIG';

export type Boorgat = {
  id: string;
  bladId: string;
  doel: BoorgatDoelCode;
  diameter: number;          // mm, default per doel
  doorboring: boolean;       // true = door blad, false = blindgat
  positie: Point;            // midden van het gat, mm vanaf linksonder blad

  // Maat-referentie (optioneel, default 'LINKSONDER')
  referentie?: MaatReferentie;

  // Groep-koppeling (voor D7 D70 patroon)
  groepId?: string;
  groepVolgnummer?: number;  // 1, 2, 3...

  notitie?: string;
};

export type MaatReferentie =
  | { type: 'LINKSONDER' }                              // default
  | { type: 'LINKERRAND'; offsetVanaf: 'onder'|'boven' }
  | { type: 'RECHTERRAND'; offsetVanaf: 'onder'|'boven' }
  | { type: 'MIDDEN_BLAD' }
  | { type: 'VORIGE_SPARING'; sparingId: string }
  | { type: 'VORIG_BOORGAT'; boorgatId: string };
```

Default-diameters per doel in `seed-data.json` (al aanwezig):
```json
"boorgat_doelen": [
  { "code": "KRAAN",        "label": "Kraan",        "default_diameter_mm": 35 },
  { "code": "QUOOKER",      "label": "Quooker",      "default_diameter_mm": 35 },
  { "code": "ELEKTRA",      "label": "Elektra",      "default_diameter_mm": 70 },
  { "code": "DUBBELE_WCD",  "label": "Dubbele wcd",  "default_diameter_mm": 70 },
  { "code": "ZEEPPOMP",     "label": "Zeeppomp",     "default_diameter_mm": 35 },
  { "code": "DOORVOER",     "label": "Doorvoer",     "default_diameter_mm": 70 },
  { "code": "OVERIG",       "label": "Overig",       "default_diameter_mm": null }
]
```

Pas hetzelfde patroon toe als nodig.

**Verfijning op `Sparing`**: voeg `notitie?: string` en `referentie?: MaatReferentie` toe (consistent met Boorgat).

### 2. State + reducer uitbreiden

`opnameReducer.ts`:

```typescript
| { type: 'BOORGAT_TOEVOEGEN'; boorgat: Boorgat }
| { type: 'BOORGAT_VERWIJDEREN'; id: string }
| { type: 'BOORGAT_BIJWERKEN'; id: string; patch: Partial<Boorgat> }
| { type: 'BOORGAT_SELECTEREN'; id: string | null }
| { type: 'BOORGATGROEP_AANMAKEN'; basisId: string }  // genereert groepId
```

State-veld: `selectedBoorgatId: string | null`. Bij selectie van een
boorgat: deselect sparing en omgekeerd (maximaal één item tegelijk
geselecteerd).

### 3. Helpers — `src/drawing/boorgatHelpers.ts` (nieuw)

```typescript
// Bereken absolute positie uit maat-referentie
export function absolutePositie(
  positie: Point,
  referentie: MaatReferentie,
  blad: Blad,
  context: { sparingen: Sparing[]; boorgaten: Boorgat[] }
): Point

// Rand-afstand: minimum afstand tot bladrand
export function randAfstand(
  positie: Point,
  diameter: number,
  blad: Blad
): { minAfstand: number; risico: boolean }    // risico = true bij <60mm

// Genereer volgend boorgat in groep (D7 D70 patroon)
export function volgendBoorgatInGroep(
  basis: Boorgat,
  richting: 'rechts' | 'links' | 'boven' | 'onder',
  hartAfstand: number   // mm, default 70
): Omit<Boorgat, 'id'>
```

Tests in `boorgatHelpers.test.ts`:
- `randAfstand` op midden van blad → groot, geen risico
- `randAfstand` 30mm van linkerrand met Ø35 → minAfstand = 12.5mm, risico=true
- `volgendBoorgatInGroep` rechts met h.o.h. 70 → positie correct verschoven
- `absolutePositie` met `LINKERRAND` ref → correct geconverteerd

### 4. BoorgatDialog — `src/pages/step2/BoorgatDialog.tsx` (nieuw)

**Zelfde 3-staps patroon als SparingDialog.**

**Stap 1 — Doel kiezen:**

Segmented control of grid van knoppen (7 opties uit `seed.boorgat_doelen`):
- Kraan / Quooker / Elektra / Dubbele wcd / Zeeppomp / Doorvoer / Overig
- Icoon per doel (kies passend uit Tabler Icons)
- Eén tik → door naar stap 2

**Stap 2 — Diameter + doorboring:**

- Diameter: number input, default ingevuld op basis van doel
  (35 voor kraan, 70 voor elektra, etc.)
- Quick-knoppen voor standaard-maten: `35` / `50` / `70` / `90`
- Doorboring: toggle `Doorgaand • Blind`
- Default: doorgaand (klopt voor 95% van de gevallen)

**Stap 3 — Positie:**

- X en Y inputs (mm vanaf linksonder)
- Maat-referentie-dropdown (zie sectie 7 hieronder)
- Mini-preview SVG van blad + boorgat-positie
- Rand-afstand check live: als <60mm → amber banner met
  "Boorgat <X>mm van rand — risico op breuk bij installatie"
- Knoppen: Annuleer / Toepassen

Na Toepassen: dialog sluit, boorgat geselecteerd, BoorgatPanel opent
floating naast 'm.

### 5. Boorgat renderen op canvas

In `Canvas.tsx` na sparing-rendering:

```jsx
{blad.boorgaten?.map(boorgat => {
  const isSelected = state.selectedBoorgatId === boorgat.id;
  const heeftRisico = randAfstand(...).risico;

  return (
    <g key={boorgat.id}>
      <circle
        cx={boorgat.positie.x}
        cy={blad.breedte - boorgat.positie.y}  // y flippen voor SVG
        r={boorgat.diameter / 2}
        fill="none"
        stroke={isSelected ? '#1D9E75' : '#6B4FB8'}  // paars voor boorgat
        strokeWidth="1.5"
        strokeDasharray={boorgat.doorboring ? 'none' : '4,2'}
      />

      {/* Tap-zone groter dan visuele cirkel */}
      <circle
        cx={...} cy={...} r={Math.max(boorgat.diameter / 2, 12)}
        fill="transparent"
        onPointerDown={() => dispatch({
          type: 'BOORGAT_SELECTEREN', id: boorgat.id
        })}
      />

      {/* Diameter-label naast cirkel */}
      <text x={...} y={...} fontSize="9" fill="#6B4FB8">
        Ø{boorgat.diameter}
      </text>

      {/* Risico-icoon */}
      {heeftRisico && (
        <i className="ti ti-alert-triangle" style={{
          position: 'absolute', ...
        }} />
      )}
    </g>
  );
})}
```

**Visuele afspraken (vasthouden):**
- Boorgaten paars (`#6B4FB8`), sparingen rood/blauw/grijs — onmiskenbaar
  verschil
- Doorboring: doorgetrokken lijn
- Blind: gestippelde lijn (4,2 dasharray)
- Geselecteerd: stroke wordt teal (zoals sparing en segment)
- Bij groep: dunne verbindingslijn tussen gerelateerde boorgaten met
  hartafstand-label ertussen

### 6. BoorgatPanel — `src/pages/step2/BoorgatPanel.tsx` (nieuw)

Floating popover, zelfde stijl als SparingPanel.

**Header**: "Boorgat — [doel-label]" + close-x
**Body**:
- X / Y inputs (met maat-referentie indien gekozen)
- Diameter input + quick-knoppen
- Doorboring toggle
- Maat-referentie dropdown ("Gemeten vanaf...")
- Notitie textarea (klein, 2 regels)

**Sub-actie**: knop "+ Volgend boorgat hiernaast" — opent kleine submenu:
- Richting: ↑ ↓ ← →
- Hartafstand: number input (default 70mm)
- Maakt nieuw boorgat met `groepId` van huidige + `groepVolgnummer + 1`
- Beide boorgaten worden gerendert met verbindingslijn

**Verwijderen**: knop onderaan (rood). Bij verwijderen van een boorgat
uit een groep: groep blijft bestaan, volgnummers worden hernummerd.

### 7. Maat-referentie-selector

In zowel SparingPanel als BoorgatPanel een uitklapbare sectie
"Gemeten vanaf...":

Dropdown met opties:
- "Linksonder blad" (default, geen offset)
- "Linkerrand (vanaf onder)"
- "Linkerrand (vanaf boven)"
- "Rechterrand (vanaf onder)"
- "Rechterrand (vanaf boven)"
- "Midden blad"
- "Vorige sparing: [naam]" (alleen als er sparingen zijn op dit blad)
- "Vorig boorgat: [doel]" (alleen als er boorgaten zijn)

Bij keuze:
- X/Y inputs labelen om met het referentiepunt: bv. "Afstand vanaf
  linkerrand" / "Hoogte vanaf onder"
- Canvas toont **referentielijnen** vanaf het gekozen punt naar het item
  (gestippelde grijze lijntjes, zoals op de Vasto-tekening)
- Absolute positie wordt automatisch herrekend en opgeslagen — referentie
  is alleen UI-help, niet de bron van waarheid

**Belangrijk**: de opgeslagen positie blijft `Point` in mm vanaf
linksonder. De referentie is UI-input-conventie, niet data-format.

### 8. Sub-actie "+ Kraangat" in SparingPanel (alleen spoelbak)

In `SparingPanel.tsx`: wanneer `sparing.type === 'SPOELBAK'`, voeg knop toe:

**"+ Kraangat toevoegen"**

Klik plaatst automatisch:
- Boorgat met `doel: 'KRAAN'`, `diameter: 35`, `doorboring: true`
- Positie: middenlijn van de spoelbak, 50mm voor de achterkant van het blad
- Selectie verschuift naar het nieuwe boorgat → BoorgatPanel opent

Niet zichtbaar bij andere sparingtypen.

### 9. Notitie-veld per item

Zowel SparingPanel als BoorgatPanel: textarea (max 200 tekens) onderaan,
boven de Verwijder-knop. Placeholder: "Notitie (optioneel)".

Op canvas: kleine pen-icoon (`ti-pencil`) naast het item als er een
notitie is. Hover/tap → tooltip met de notitie-tekst.

In BladInfoPanel: pen-icoon naast items met notitie.

### 10. Rand-afstand validatie

Live tijdens plaatsen én bewerken:
- BoorgatDialog stap 3: warning banner bij <60mm tot rand
- BoorgatPanel: dezelfde warning als positie via panel wordt verschoven
  tot onder 60mm
- Canvas: amber warning-icoon op boorgat met risico
- BladInfoPanel: amber-icoon in lijst
- Zelfde patroon als vlakbouw composiet warning — niet blokkeren, wel
  zichtbaar maken

**Voor sparingen**: zelfde validatie. <60mm tot rand → warning.

### 11. BladInfoPanel uitbreiden

Onder de bestaande "Sparingen"-lijst een nieuwe sectie "Boorgaten":

- Header: "BOORGATEN" (kleine label-stijl, zoals sparingen)
- Per boorgat een rij:
  - Klein cirkel-icoon (paars)
  - Label: doel + diameter, bv. "Kraan · Ø35"
  - Eventuele waarschuwings-icoon (amber)
  - Eventuele notitie-icoon (pencil)
  - Bij groep: "in groep" badge
- Lege staat: "Geen boorgaten"
- Onderaan: "+ Boorgat toevoegen" knop (zelfde stijl als sparing-knop)

### 12. CanvasToolbar uitbreiden

Naast "+ Sparing" knop een **"+ Boorgat" knop** met passend icoon
(`ti-circle-dot` of `ti-target`). Identiek gestyled.

### 13. Test in Y-App developer-mode

Voor commit, doorloop deze flow en post screenshots in chat:

1. Open extensie, maak een blad 1958 × 1001 × 20 mm composiet
2. Plaats kookplaat Bora C75 (vlakbouw) → krijgt warning
3. Plaats spoelbak Caressi CAPP50R10
4. Klik op spoelbak → SparingPanel → klik "+ Kraangat"
   → boorgat verschijnt automatisch op middenlijn boven spoelbak
5. Klik "+ Boorgat" in toolbar → kies Elektra → diameter 70 → doorgaand
   → positioneer op X=1500, Y=500 → toepassen
6. Klik op het elektra-boorgat → BoorgatPanel → klik
   "+ Volgend boorgat hiernaast" → richting rechts, h.o.h. 70mm
   → tweede boorgat verschijnt met verbindingslijn
7. Plaats een boorgat op X=30 (te dicht bij rand) → check amber warning
8. Voeg notitie toe aan een boorgat: "Cleantap, koud water"
   → check pen-icoon op canvas + lijst
9. Switch maat-referentie naar "Vorige sparing: Caressi" → check
   referentielijntjes op canvas
10. BladInfoPanel rechts toont alles: sparingen-sectie + boorgaten-sectie
    met juiste iconen
11. Verwijder een boorgat → groep blijft, volgnummers hernummerd
12. JSON-preview onderaan: `boorgaten[]` met alle velden correct

### 14. Commits

Atomic, suggestie:
- `feat: types and reducer for boorgaten`
- `feat: add boorgatHelpers with tests`
- `feat: add BoorgatDialog with 3-step flow`
- `feat: render boorgaten on canvas in purple`
- `feat: add BoorgatPanel with sub-action for groups`
- `feat: add + Boorgat button to canvas toolbar`
- `feat: maat-referentie selector in panels`
- `feat: rand-afstand validation with amber warning`
- `feat: notitie field on sparingen and boorgaten`
- `feat: + Kraangat sub-action on spoelbak`
- `feat: list boorgaten in BladInfoPanel`

Push naar `feat/sprint-3b-2-boorgaten`, open PR, merge na visuele check.

## Definition of done

- [ ] `Boorgat` type met groep + referentie + notitie
- [ ] `Sparing` type uitgebreid met notitie + referentie
- [ ] `boorgatHelpers.ts` met passing tests
- [ ] BoorgatDialog: doel → diameter/doorboring → positie
- [ ] Boorgaten renderen paars, doorboring vs blind via lijntype
- [ ] BoorgatPanel met sub-actie "+ Volgend boorgat hiernaast"
- [ ] Boorgat-groepen met verbindingslijn op canvas
- [ ] SparingPanel met "+ Kraangat" sub-actie (alleen spoelbak)
- [ ] Maat-referentie-dropdown in beide panels met referentielijntjes
      op canvas
- [ ] Rand-afstand <60mm → amber warning (banner + canvas-icoon + lijst-icoon)
- [ ] Notitie-veld werkt op sparingen én boorgaten
- [ ] Notitie-icoon (pencil) op canvas + in lijst
- [ ] BladInfoPanel toont sparingen + boorgaten gesplitst
- [ ] "+ Boorgat" knop in canvas-toolbar
- [ ] Screenshots in chat van flow
- [ ] `npm run build` slaagt
- [ ] PR gemerged, GitHub Pages deploy ok

## Wat NIET doen

- Geen drag-and-drop op canvas (komt in sprint 3c?)
- Geen verstek-relaties (sprint 3c)
- Geen foto-upload per item (vereist bridge file-upload — sprint 8)
- Geen producten voor boorgaten (kraan-merk komt in sprint 4 accessoires)
- Geen wijziging aan sparing-flow (alleen toevoegingen)
- Geen wijziging aan rendering van bestaande sparingen behalve
  notitie-icoon

## Open vragen om mee af te sluiten

- Boorgat-groep richtingen — kunnen ze ook diagonaal? Of alleen 90°?
- Notitie-tekens max 200 — genoeg, of moet 't langer?
- Maat-referentie "vorige sparing" — wat als die sparing wordt verwijderd?
  Boorgat-positie omrekenen naar absoluut?

## Vooruitblik sprint 3c

Na deze sprint, sprint 3c (verstek + import):
- Verstek-relaties tussen bladen aangeven
- Multi-blad-view in canvas
- Foto/PDF achtergrond importeren + calibratie + overtrekken
