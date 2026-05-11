# Sprint 3a — Step2 Tekening (basis)

## Status na sprint 2

- Step1Klant volledig werkend: bestaande klant zoeken + nieuwe klant
  aanmaken (zakelijk/particulier) in Drechtsteden Bouw ERPNext
- Wizard-skelet aanwezig: StepIndicator + currentStep state
- opnameReducer met `SET_OPDRACHTGEVER`, `SET_AFLEVERADRES`, etc.
- JSON-preview onderaan toont actuele state
- Stap 2/3/4 zijn nog placeholders

## Doel van deze sprint

Bouw **Step2** — het tekenen van bladen. Aan het eind:

- De inmeter kan een nieuw blad toevoegen via een **rechthoek-template**:
  invul L × B × dikte → rechthoek verschijnt op canvas
- Bladen verschijnen in een **lijst links** met thumbnails + werkstuktype-label
- Eén blad tegelijk actief in de **canvas rechts** (multi-view komt in sprint 3b)
- **Maatvoering altijd zichtbaar** op elke zijde van het blad
- **Tikken/klikken op een zijde** opent een input-paneel om de maat aan te
  passen (numeric input, mm)
- **Pan + zoom** werkt op canvas (pointer events — touch én muis)
- **Hoek wegknippen** voor L-vormen: tik/klik op een hoekpunt → input voor
  de twee uithap-maten → de outline wordt aangepast
- State volledig in `opnameReducer` — JSON-preview toont alle bladen

**Niet in scope (komt in sprint 3b):**
- Import-mode (foto/PDF achtergrond + calibratie + overtrekken)
- Verstek-relaties tussen bladen aangeven
- Meerdere bladen samen op één canvas tonen
- Overhang als apart concept
- Boorgaten / uitsparingen (sprint 4 — Step3 specificaties)
- Schuine zijden / niet-haakse hoeken

## Werkomgeving

- Werk uitsluitend in deze repo (`y-app-keukenblad-opname/`)
- Branch: `feat/sprint-3a-tekening` (vanaf `main`)
- Test in Y-App developer-mode tegen Drechtsteden Bouw — extensie geladen
  via `http://localhost:5174/`
- **Bouwmeester is een andere extensie** die naast onze extensie in Y-App
  draait (zichtbaar in de sidebar). We hebben geen lokale kopie en hoeven
  niet in de broncode te kijken. Wat we wél kunnen: visueel meekijken hoe
  Bouwmeester dingen doet in de UI (interactie-patronen, layout) als
  referentie voor onze eigen keuzes.

## Stap-voor-stap

### 1. Lees referentiemateriaal

In deze volgorde:

1. `docs/sprint-2-klant.md` + de Step1Klant code — welk styling-pattern
   gebruiken we?
2. `src/data/seed-types.ts` — specifiek de types `Blad`, `Point`, `Rand`,
   `WerkstukType`, `WerkstukCategorieCode`, `Dikte`
3. `src/state/opnameReducer.ts` — hoe is state nu opgebouwd?
4. `src/bridge.ts` en `docs/bridge-api.md` — voor straks (sprint 3 zelf
   gebruikt geen bridge, maar handig voor context)

Samenvatting in chat:
- Welk SVG-pattern past bij onze huidige stijl?
- Hoe doen we touch + muis tegelijk? Pointer events of aparte handlers?
- Welke types uit seed-types.ts gebruiken we direct?

### 2. State-uitbreiding — opnameReducer

Voeg toe aan `src/state/opnameReducer.ts`:

```typescript
type Action =
  | { type: 'BLAD_TOEVOEGEN'; blad: Blad }
  | { type: 'BLAD_VERWIJDEREN'; id: string }
  | { type: 'BLAD_BIJWERKEN'; id: string; patch: Partial<Blad> }
  | { type: 'BLAD_SELECTEREN'; id: string | null }
  | ...
```

State-veld toevoegen: `selectedBladId: string | null` voor welk blad in de
canvas zichtbaar is.

Pure helpers in een aparte module (`src/drawing/bladHelpers.ts`):

```typescript
// Rechthoek-outline genereren in mm (0,0 = linksonder)
export function rechthoekOutline(lengte: number, breedte: number): Point[]

// Auto-bereken lengte per segment uit outline
export function segmentLengtes(outline: Point[]): number[]

// Hoek wegknippen: vervang corner i door drie punten met de uithap
export function knipHoekUit(
  outline: Point[],
  cornerIndex: number,
  breedteUithap: number,
  hoogteUithap: number
): Point[]

// Update één segment-lengte: schaalt het hele blad over dat segment
export function bewerkSegmentLengte(
  outline: Point[],
  segmentIndex: number,
  nieuweLengte: number
): Point[]
```

**Unit tests** in `bladHelpers.test.ts`:
- `rechthoekOutline(1958, 1001)` → 4 punten, correcte coordinaten
- `segmentLengtes` van een 1958×1001 rechthoek → `[1958, 1001, 1958, 1001]`
- `knipHoekUit` op rechtsboven-hoek geeft 6 punten in L-vorm
- `bewerkSegmentLengte` op de breedte-zijde verandert alleen Y, niet X

### 3. Bladen-lijst component (links)

`src/pages/step2/BladList.tsx`:

- Boven: knop "+ Nieuw blad" (groot, touch-vriendelijk)
- Lijst: voor elk blad een rij met:
  - Klein SVG-thumbnail (40×40 of zo)
  - Label: werkstuk-type + afmetingen, bv. "Bladdeel A — 1958×1001"
  - Tikken activeert: dispatch `BLAD_SELECTEREN`
  - Geselecteerde rij heeft accentkleur
  - "..."-menu of long-press: verwijderen
- Lege staat: "Nog geen bladen. Tik op + Nieuw blad om te beginnen."

### 4. Nieuw-blad dialog

`src/pages/step2/NieuwBladDialog.tsx`:

Modal/sheet met formulier:

- **Werkstuktype** — dropdown uit `seed.werkstukken` (gegroepeerd per
  `seed.werkstuk_categorieen` voor overzicht)
- **Lengte** (mm) — number input, default leeg, focus erop bij openen
- **Breedte** (mm) — number input
- **Dikte** (mm) — segmented control uit `seed.diktes_mm`
- **Label** — optioneel, default afgeleid van werkstuktype
  (bv. "BLAD A", "ACHTERWAND")
- Knoppen: "Annuleren" / "Toevoegen"

Bij "Toevoegen":
1. Genereer unique id (`crypto.randomUUID()` of `b-${counter}`)
2. Bouw `Blad`-object: `{ id, label, werkstukType, categorie, lengte,
   breedte, dikte, outline: rechthoekOutline(L, B), randen: [] }`
3. `dispatch({ type: 'BLAD_TOEVOEGEN', blad })`
4. `dispatch({ type: 'BLAD_SELECTEREN', id: blad.id })`
5. Sluit dialog

### 5. SVG-canvas component

`src/pages/step2/Canvas.tsx`:

**Eigenschappen:**

- Toont één `Blad` (uit `state.bladen.find(b => b.id === selectedBladId)`)
- SVG `viewBox` past zich aan op blad-afmetingen met marge voor bematingen
- **Pan**: één-vinger-drag of muis-drag-met-rechts (of middle-button)
- **Zoom**: pinch op touch, scroll-wiel op muis
- **Initial fit**: blad past in canvas met 20% padding rondom

**Rendering:**

- **Blad-polygoon**: `<polygon points="..." />` met witte fill + 1.5px stroke
- **Maatvoering per segment** (altijd zichtbaar):
  - Maatlijn 30mm buiten het blad, parallel aan segment
  - Pijltjes aan beide uiteinden
  - Tekst-label met mm-waarde in het midden
  - Volg DIN-stijl (zie Vasto-tekeningen voor referentie)
- **Hoekpunten**: kleine cirkels (8px radius), zichtbaar maar subtiel
- **Tap-zones**:
  - Onzichtbare bredere rect over elk segment (24px dik) → tikken op zijde
  - Onzichtbare bredere cirkel over hoekpunt (40px) → tikken op hoek
  - **Belangrijk**: tap-zones moeten breed genoeg zijn voor touch, ook al
    zie je de zijde maar als dunne lijn

**Pointer events:**

- `onPointerDown` op canvas: start pan als gebied buiten blad geraakt
- `onPointerDown` op segment-tap-zone: open segment-input panel
- `onPointerDown` op hoekpunt-tap-zone: open hoek-uithap dialog
- Pinch detecteren: twee pointers tegelijk → bereken afstand-delta voor zoom

**Pan/zoom state:**

```typescript
const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });
```

Apply via SVG `transform` op een wrapper-g element.

### 6. Segment-input panel

Klein paneel/popover dat verschijnt wanneer een zijde is aangetikt:

- Toont huidige lengte in mm
- Number input met grote knoppen (+/- 10, +/- 100)
- Submit: dispatch `BLAD_BIJWERKEN` met nieuwe outline (via
  `bewerkSegmentLengte`)
- Annuleer-knop
- Sluit ook bij klik buiten

Positie: vast onderaan op tablet (genoeg ruimte voor toetsenbord), naast
het segment op desktop (popover-stijl).

### 7. Hoek-uithap dialog

Wanneer een hoekpunt is aangetikt:

- Dialog met twee number inputs: "Breedte uithap (mm)" en "Hoogte uithap
  (mm)"
- Mini-preview SVG die de uithap toont op de geselecteerde hoek
- Submit: dispatch `BLAD_BIJWERKEN` met nieuwe outline (via `knipHoekUit`)
- Werkt alleen op binnenhoeken voor nu (4 hoeken van rechthoek). Op een
  reeds bewerkte L-vorm: melding "Bewerk eerst de bestaande uithap" of
  gewoon disablen.

### 8. Step2 hoofdcomponent

`src/pages/Step2Tekening.tsx`:

Layout:
- Op desktop: 2-koloms — BladList (300px) + Canvas (rest)
- Op tablet portrait: BladList als drawer (uitklap-knop), Canvas vol
- Op tablet landscape: 2-koloms, BladList smaller (240px)
- Boven canvas: blad-label + werkstuktype + afmetingen (huidige selectie)

Lege staat (geen blad geselecteerd): grote "+ Nieuw blad" knop centraal.

### 9. Wijzig App.tsx wizard-render

In de switch op `currentStep`:
- Step 2 nu rendert `<Step2Tekening />` ipv placeholder
- Stappenindicator toont stap 2 als bereikt zodra er ≥1 blad is

(Knoppen "Volgende/Vorige" komen in sprint 5, niet nu.)

### 10. Test in Y-App developer-mode

Voor commit:
- Maak een blad: 1958 × 1001 × 20mm (de werkblad uit order 2600376)
- Tik op de "1958"-zijde → input opent → wijzig naar 2000 → blad herrekent
- Tik op rechtsboven-hoek → uithap 200×100 → ziet eruit als L-vorm
- Voeg tweede blad toe: 630 × 604 × 20mm
- Switch tussen bladen via lijst
- Verwijder een blad — komt terug?
- Test op tablet (of via Chrome devtools touch-emulatie)
- Check JSON-preview: `bladen[]` heeft beide objecten correct

### 11. Commits

Atomic commits, suggestie:
- `feat: extend opnameReducer with bladen state and actions`
- `feat: add bladHelpers with rectangle, segments, corner cutout`
- `test: cover bladHelpers with vitest`
- `feat: add BladList component for sidebar`
- `feat: add NieuwBladDialog with werkstuk + dimensions form`
- `feat: add SVG Canvas with pan/zoom and dimension display`
- `feat: add segment input panel for editing dimensions`
- `feat: add corner cutout dialog for L-shapes`
- `feat: wire Step2Tekening into wizard`

Push naar `feat/sprint-3a-tekening`, open PR, merge na visuele check.

## Definition of done

- [ ] Samenvatting bestaande code + types gepost in chat
- [ ] `bladHelpers.ts` met passing unit tests
- [ ] `opnameReducer` uitgebreid met bladen-acties, tests passen
- [ ] BladList toont bladen met thumbnails
- [ ] NieuwBladDialog werkt en voegt blad toe aan state
- [ ] Canvas toont geselecteerd blad met maatvoering op elke zijde
- [ ] Pan + zoom werkt op zowel desktop muis als tablet touch
- [ ] Tikken op zijde opent input → wijziging update outline
- [ ] Tikken op hoek opent uithap-dialog → L-vorm werkt
- [ ] Getest in Y-App developer-mode, screenshot in chat
- [ ] JSON-preview toont alle bladen correct
- [ ] `npm run build` slaagt
- [ ] Branch gemerged naar main, GitHub Pages deploy ok

## Wat NIET doen

- Geen import-mode (foto/PDF achtergrond) — sprint 3b
- Geen verstek-relaties — sprint 3b
- Geen multi-blad-view op canvas — sprint 3b
- Geen boorgaten of uitsparingen — sprint 4
- Geen wizard-navigatie tussen stappen — sprint 5
- Geen schuine zijden — onnodige complexiteit nu
- Geen rotatie van bladen — nog niet
- Geen poging om Bouwmeester-broncode te vinden of te clonen — die hebben
  we niet lokaal en hoeven we niet te hebben

## Open vragen om mee af te sluiten

Eindig met een lijst voor mij. Verwachte onderwerpen:

- Hoe groot moet maatvoering-tekst zijn op tablet — is 14px leesbaar genoeg
  vanaf 60cm afstand?
- Snap-grid voor input — moeten we bv. op 10mm afronden bij segment-edit,
  of vrije mm-precisie?
- Verstek-relaties (sprint 3b) — heb je een voorbeeld in Drechtsteden Bouw
  van een complex blad waar dit nodig is, zodat we sprint 3b daar tegen
  kunnen testen?
- Hoekpunt-selectie op touch — werkt de 40px tap-zone of moeten we 'm
  groter maken?

## Vooruitblik sprint 3b

Na deze sprint en jouw test, sprint 3b:
- Import-mode: foto/PDF als achtergrond + calibratie + overtrekken
- Verstek-relaties: aangeven welke kant van blad A in verstek gaat met
  welke kant van blad B
- Multi-view: meerdere gerelateerde bladen tegelijk in canvas zien
