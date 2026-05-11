# Sprint 3a addendum — UX-geoptimaliseerde layout

## Context

Sprint 3a werkt functioneel. Vóór PR-merge één grotere visuele/UX-ronde om
de inmeter-workflow optimaal te maken. Doel: maximaal canvas-oppervlak,
betere status-zichtbaarheid, en compacte panelen die niet meer
schermruimte claimen dan ze verdienen.

**Belangrijke aanwijzing**: de visuele referentie staat in de chat als
mockup-widget. Lees die mockup zorgvuldig vóór je begint. Alle pixelmaten
hieronder corresponderen 1-op-1 met die mockup.

## Doel — drie grote wijzigingen

1. **Compactere top-bar** — van 150px naar 50px. StepIndicator wordt
   pill-stijl en deelt de bar met klantnaam, opslag-status en
   Volgende-knop.
2. **Drie-koloms layout** — Bladenlijst (240px) | Canvas (fluid) | Blad-info
   paneel (220px, inklapbaar).
3. **Canvas vult werkelijk de hele beschikbare ruimte** met mini-toolbar
   bovenaan en status-bar onderaan. SegmentPanel wordt floating popover.

## Stap-voor-stap

### 1. App-root: zorg dat hoogte tot onderkant loopt

Eerst de hele hoogte-keten checken voor `h-full` werkt:

- Root `<div>` in `main.tsx` / `App.tsx`: `h-screen` of `h-[100dvh]`
- Wizard-wrapper: `h-full flex flex-col`
- Step-container: `flex-1 min-h-0`

Test: zonder content moet je nu een lege werkomgeving zien die exact tot
onderkant browser loopt, geen scrollbars op body.

### 2. Top-bar herontwerp — `src/components/TopBar.tsx`

Vervang de huidige header + StepIndicator door één compacte bar.

**Layout**: `flex items-center justify-between` met padding `10px 16px`,
border-bottom `0.5px`.

**Links** (flex row, gap 16px):
- Klant-blok: twee regels
  - Bovenste: eindklant-naam (`13px font-medium`) — uit
    `state.afleveradres.naam` (of opdrachtgever als afleveradres leeg)
  - Onderste: opdrachtgever + datum (`11px text-secondary`) — bv.
    "Zijlmans Interieur · 30-03-2026"
- Verticale separator (`24px h, 0.5px w`)
- Step-pills row (flex gap 4px) — vervangt huidige StepIndicator:
  - Voltooid: `bg-slate-100 text-slate-600`, label "1 Klant ✓"
  - Actief: `bg-teal-600 text-white font-medium`, label "2 Tekening"
  - Nog te doen: `bg-slate-100 text-slate-400`, label "3 Specs" / "4 Overzicht"
  - Elke pill: `font-size 11px, padding 4px 10px, border-radius 999px`

**Rechts** (flex row, gap 8px):
- Opslag-status: `<i ti-cloud-check />` + "Bewaard" (`11px text-secondary`)
  — voor nu hard "Bewaard" tonen, in sprint 9 verbinden aan echte sync-status
- Volgende-knop: `12px, padding 5px 12px, border 0.5px secondary, rounded 6px`
  + chevron-right icoon. Voor nu disabled style; werking komt in sprint 5.

Verwijder de bestaande grote StepIndicator (`src/components/StepIndicator.tsx`).
Niet nodig meer.

### 3. Step2Tekening — drie-koloms layout

`src/pages/Step2Tekening.tsx`:

```
flex flex-row h-full min-h-0
├── BladList               (240px, flex-shrink-0)
├── Canvas-kolom           (flex-1, min-w-0, flex-col)
│   ├── Canvas-toolbar     (flex-shrink-0)
│   ├── SVG-area           (flex-1, relative, padding 24px)
│   └── Status-bar         (flex-shrink-0)
└── BladInfoPanel          (220px, flex-shrink-0)
```

Op tablet portrait (~768px en kleiner): BladInfoPanel wordt drawer (klap-knop
in canvas-toolbar). BladList blijft 240px.

### 4. BladList — verfijning

`src/pages/step2/BladList.tsx`:

**Header (padding 12px 12px 8px)**:
- "+ Nieuw blad" knop: teal-600 bg, white text, 100% breed, 10px padding,
  6px radius, plus-icoon links van tekst

**Sub-label (padding 4px 8px)**:
- "3 bladen — 2.84 m²" — `10px uppercase text-tertiary, letter-spacing 0.05em`
- Auto-berekend uit `state.bladen` (gebruik `oppervlakteM2` uit `seed-types.ts`)

**Lijst-items (padding 8px, gap 8px, border-radius 6px)**:
- Geselecteerd: `bg-teal-50` + `border-left 3px solid teal-600`
- Niet geselecteerd: transparent hover bg
- Thumbnail-svg 36×24 (proportioneel geschaald op blad-aspectratio, niet vast vierkant)
- Label-blok: werkstuk-naam (`12px font-medium`) + afmetingen
  (`10px text-secondary`)
- Rechts: status-icoon
  - Compleet: `ti-circle-check` (teal-600) of niets
  - Heeft openstaande items: `ti-alert-circle` (amber-600) — voor nu altijd
    tonen op niet-geselecteerd blad, in sprint 4 echt valideren
- Verwijder-knop: long-press (touch) of hover-only x-icoon (desktop) — niet
  altijd zichtbaar, dat oogt rommelig

### 5. Canvas-toolbar — `src/pages/step2/CanvasToolbar.tsx` (nieuw)

Vlak boven het canvas, witte bg, border-bottom `0.5px`, padding `8px 16px`,
flex justify-between.

**Links**:
- Blad-label (`13px font-medium`)
- Materiaal-pill (`11px, padding 2px 8px, bg-slate-100, rounded 4px`):
  bv. "Werkblad · 20 mm · Composiet". Materiaal en kleur uit
  `state.materiaal`, werkstukType uit blad.

**Rechts** (icon-only knoppen, allemaal `padding 4px 8px, border 0.5px,
rounded 4px, white bg`):
- `ti-corner-down-right` — Hoek wegknippen (alternatieve trigger naast
  tikken-op-hoek)
- `ti-arrows-horizontal` — Overhang toevoegen (placeholder voor sprint 3b)
- Verticale separator
- `ti-zoom-in` / `ti-zoom-out` / `ti-maximize` (fit-to-screen)

Aria-labels op alle icon-buttons. Disabled state als geen blad geselecteerd
is.

### 6. Canvas SVG — vult container, geen vaste hoogte

`src/pages/step2/Canvas.tsx`:

- Outer-div: `flex-1 relative w-full h-full p-6`
- SVG: `width="100%" height="100%"` en `preserveAspectRatio="xMidYMid meet"`
- viewBox blijft blad-coordinaten doen, marge 20% rondom blad-bounds
- Geselecteerd segment: render een groen-doorzichtige rect (`fill teal-600
  opacity 0.6`) bovenop dat segment
- Geselecteerd segment krijgt ook **groen-geaccentueerde maatvoering**
  (stroke teal-600 ipv slate-500, pill-label `bg teal-600 white text` ipv
  losse text)
- Hoekpunten: `8px radius, white fill, 2px teal-600 stroke` — subtiel
  zichtbaar maar niet dominant
- Watermerk in midden blad: m² waarde (`18px text-slate-400 opacity-0.7`)
  — auto uit `oppervlakteM2(blad)`

ResizeObserver toevoegen om bij container-resize de viewBox bij te werken
zodat blad gecentreerd blijft.

### 7. SegmentPanel — floating popover

`src/pages/step2/SegmentPanel.tsx` herstructureren:

**Positionering**:
- Absoluut binnen de canvas-container
- Ankerpunt: midden van geselecteerd segment, 50px naar buiten langs de
  segment-normaal
- Clamp binnen canvas-bounds (8px marge)
- Bij geen ruimte buiten: flip naar binnen-kant van het blad

**Visueel**:
- Witte bg, `border 0.5px secondary, rounded 8px, padding 12px 14px,
  min-width 380px`
- Subtiele shadow: `box-shadow: 0 0 0 1px rgba(0,0,0,0.04)`
- Header: zijde-label (bv. "Onderzijde · maat") + close x rechts (`ti-x`)
- Knoppen-rij (één regel, gap 6px):
  - `[-100] [-10] [input centered] mm [+10] [+100]`
  - ±-knoppen: `padding 6px 8px, font-size 11px, bg-slate-100, rounded 4px`
  - Input: `flex-1, padding 6px 8px, font-size 14px, font-medium, centered,
    border 0.5px secondary, rounded 4px`
- Actie-rij (gap 6px, margin-top 8px):
  - Annuleer: `flex-1, white bg, border 0.5px tertiary, rounded 4px,
    font-size 11px`
  - Toepassen: `flex-2 (dubbel zo breed), teal-600 bg, white text,
    font-medium, no border` — visuele primary-action

**Hoe te bepalen welke zijde geselecteerd is**: voeg toe aan opnameReducer
state `selectedSegmentIndex: number | null`. Wanneer geen segment
geselecteerd, geen popover renderen.

### 8. HoekUithapDialog — gecentreerd in canvas

`src/pages/step2/HoekUithapDialog.tsx`:

- Absoluut gecentreerd binnen canvas-container (`top-1/2 left-1/2
  -translate-1/2`)
- Donkere backdrop `bg-black/30` alleen over canvas-container, niet over
  BladList of BladInfoPanel
- Z-index boven Canvas
- Werking blijft hetzelfde (twee inputs + preview)
- Stijl: dezelfde teal-600 primary action knop als SegmentPanel

### 9. Status-bar onderaan canvas

`src/pages/step2/CanvasStatusBar.tsx` (nieuw):

`padding 6px 16px, border-top 0.5px, white bg, font-size 11px text-secondary`,
flex justify-between.

**Links** (gap 16px):
- `ti-photo` + "0 foto's" — voor nu hard 0, in sprint 3b verbinden
- `ti-pencil` + "0 notities" — voor nu hard 0

**Rechts**:
- "Schaal 1:20 · 100%" — voor nu hard, in sprint 3b dynamisch uit viewport.scale

Niet kritiek om alles te bedraden nu — placeholder-waarden tonen is prima.

### 10. BladInfoPanel — `src/pages/step2/BladInfoPanel.tsx` (nieuw)

Rechter kolom, 220px breed.

**Header (padding 12px 14px, border-bottom 0.5px)**:
- "Blad-info" (`12px font-medium`)
- Chevron-right rechts (`ti-chevron-right`, klikbaar om paneel weg te
  klappen — voor nu visueel, daadwerkelijk klappen mag in sprint 3b)

**Body (padding 12px 14px, font-size 11px)**:

Vier secties met `margin-bottom 12px`:

1. **Werkstuk**
   - Label: "Werkstuk" (text-tertiary, margin-bottom 2px)
   - Value: werkstukType (font-medium)

2. **Materiaal**
   - Label: "Materiaal"
   - Regel 1: "Composiet · 20 mm" (uit state.materiaal.soort + dikte)
   - Regel 2: kleur uit state.materiaal.kleur (text-secondary)

3. **Afmetingen**
   - Label: "Afmetingen"
   - Regel 1: "1958 × 1001 mm"
   - Regel 2: "1.96 m² · omtrek 5918 mm" (afgeleid)

4. **Randafwerking**
   - Label: "Randafwerking"
   - Value: italic "Stap 3" (text-tertiary) — placeholder tot sprint 4

**Footer**:
- Sub-label "Sparingen" (text-tertiary, margin-bottom 6px)
- Knop "+ Sparing toevoegen": `width 100%, padding 6px, dashed border 0.5px
  secondary, rounded 4px, font-size 11px, text-secondary` — disabled
  styling, klikbaar wordt 'ie in sprint 4

### 11. Helpers uitbreiden — `src/drawing/bladHelpers.ts`

Toevoegen:

```typescript
// Omtrek (mm) — som van alle segmentLengtes
export function omtrek(outline: Point[]): number

// Telling van bladen + totaal oppervlakte
export function bladTellingTotaal(bladen: Blad[]): {
  aantal: number;
  totaalM2: number;
}
```

Unit tests in `bladHelpers.test.ts` voor beide.

### 12. State-uitbreiding

`src/state/opnameReducer.ts` extra acties:

```typescript
| { type: 'SEGMENT_SELECTEREN'; bladId: string; segmentIndex: number }
| { type: 'SEGMENT_DESELECTEREN' }
```

State-veld: `selectedSegmentIndex: number | null`. Reset bij
`BLAD_SELECTEREN`.

### 13. Test in Y-App developer-mode

Vóór commit, doorloop deze flow en post een screenshot in chat:

1. Open extensie in Y-App (full-screen browser)
2. Klant gevuld vanuit sprint 2 — check dat klantnaam in top-bar staat
3. Stap 2: voeg 3 bladen toe (bv. 1958×1001, 2760×600, 630×604)
4. Selecteer Bladdeel A → BladInfoPanel rechts toont juiste info
5. Tik op onderzijde → popover verschijnt naast segment, niet onderaan
6. Wijzig naar 2000mm → blad herschaalt, popover sluit
7. Tik op rechtsboven-hoek → uithap-dialog gecentreerd binnen canvas
8. Maak uithap 200×100 → L-vorm verschijnt
9. Switch tussen bladen via lijst → BladInfoPanel update mee, popover weg
10. Test tablet-emulatie in Chrome devtools — drie kolommen passen?
11. Resize browser narrow → BladInfoPanel klap-gedrag (mag in sprint 3b
    nog placeholder zijn, maar de chevron moet zichtbaar zijn)

### 14. Commits

Suggestie:
- `feat: compact top bar with step pills and save indicator`
- `feat: three-column layout for step 2`
- `feat: add canvas toolbar with shape and zoom controls`
- `feat: refactor segment panel as floating popover`
- `feat: add blad info panel on right side`
- `feat: add canvas status bar`
- `feat: extend helpers with omtrek and bladTellingTotaal`
- `refactor: replace step indicator with inline pills`

## Definition of done

- [ ] Top-bar compact (50px), step pills + klantnaam + Volgende
- [ ] Geen oude StepIndicator-component meer in gebruik
- [ ] Drie-koloms layout zichtbaar op desktop
- [ ] Canvas vult werkelijk de hele midden-kolom (geen lege ruimte)
- [ ] SegmentPanel verschijnt als floating popover bij segment
- [ ] Geselecteerd segment groen geaccentueerd in SVG + maatvoering
- [ ] BladInfoPanel rechts toont werkstuk + materiaal + afmetingen
- [ ] Status-bar onderaan canvas
- [ ] HoekUithapDialog gecentreerd binnen canvas-gebied
- [ ] BladList "+ Nieuw blad" knop teal-600 stijl
- [ ] BladList toont "X bladen — Y.YY m²" sub-label
- [ ] Helpers `omtrek` en `bladTellingTotaal` met tests
- [ ] `npm run build` slaagt zonder errors
- [ ] Screenshot in chat van eindresultaat
- [ ] PR ready om te mergen

## Wat NIET doen

- Geen daadwerkelijke werking van BladInfoPanel-klap-gedrag (placeholder
  chevron volstaat, klap-logic mag sprint 3b)
- Geen werking van "Sparing toevoegen"-knop (sprint 4)
- Geen werking van "Volgende"-knop in top-bar (sprint 5)
- Geen dynamische "Bewaard"-state (sprint 9)
- Geen dynamische "schaal 1:20" — voor nu hardcoded
- Geen dynamische foto-/notitie-tellers in status-bar
- Geen tutorial-tips of onboarding
- Geen verandering aan helpers behalve de twee toevoegingen
- Geen verandering aan opnameReducer behalve de twee SEGMENT-acties

## Designvragen om mee af te sluiten

Open vragen waar Claude Code keuzes moet maken die niet hier dichtgespijkerd
zijn, vraag mij dan om bevestiging:

- Welke spacing-conventie volg ik nu in de codebase (Tailwind classes vs
  inline style)? Sluit hierop aan.
- BladList op tablet portrait — drawer of altijd zichtbaar als smaller?
- Kleur-token voor de teal-600 accent — zit deze al in de Tailwind config
  of moet ik 'm toevoegen?
- Selectie van segment vs hoek in dezelfde state — gaan we ooit beide
  tegelijk willen, of is altijd één-van-beide actief?
