# Sprint 5 — Stap 4 Overzicht + wizard-navigatie

## Status na sprint 4

- Stap 1 (klant + project), stap 2 (tekening met sparingen en boorgaten),
  stap 3 (specificaties met materiaal, randafwerking, accessoires) zijn
  volledig functioneel
- Reactieve vlakbouw-warning werkt op bestaande sparingen bij materiaal-
  wijziging
- Live SamenvattingPanel in stap 3 toont alle data
- Datamodel bevat alles wat nodig is voor PDF-generatie

## Doel van deze sprint

Stap 4 Overzicht: een scan-bare eindpagina waar de inmeter in één
oogopslag verifieert dat alle data klopt. Plus per-sectie navigatie-
knoppen die hem direct naar de juiste plek brengen voor correcties.

Plus: "Concept opslaan" naar localStorage zodat opnames niet verloren
gaan bij browser-refresh. ERPNext-integratie blijft sprint 8.

## Werkomgeving

- Repo: `Dollee-404/y-app-keukenblad-opname` (geen wijziging)
- Branch: `feat/sprint-5-overzicht` vanaf `main` ná merge sprint 4
- Test in Y-App developer-mode

## Ontwerpprincipes

Stap 4 is een **scan-pagina**, geen lees-pagina. De inmeter wil snel
zien: klopt het, mis ik iets, kan ik dit versturen. Drie principes:

1. **Visuele hiërarchie boven symmetrie** — klantnaam en totalen
   prominent, accessoires onderaan
2. **Mini-canvas per blad** — vorm + sparingen + boorgaten in 0.3
   seconden te herkennen, vervangt tekstlijst
3. **Onregelmatigheden vallen op** — amber pills voor warnings,
   incomplete randafwerking direct zichtbaar

## Stap-voor-stap

### 1. Step4Overzicht component — `src/pages/step4/Step4Overzicht.tsx`

Single-page scrollbare lay-out, geen drie-koloms (in tegenstelling tot
stap 2/3). Reden: deze pagina is om te scannen, niet om mee te werken.
Maximum breedte 1024px, gecentreerd.

Vier zones onder elkaar:

#### Zone 1 — Header

```tsx
<header style="display: flex; justify-content: space-between; ...">
  <div>
    <h2>Bakker · Alblasserdam</h2>
    <p>Inmeting 12-05-2026</p>
  </div>
  <div style="text-align: right; ...">
    <div>Verkoper: Cees van Hoogdalem</div>
    <div>Inmeter: Eelke Dollee</div>
  </div>
</header>
```

- Klantnaam = `customer.name` of "Nog geen klant" indien leeg
- Inmeting-datum = `state.meetdatum` formatted
- Verkoper en inmeter uit state

Bij ontbrekende klant: amber waarschuwing onder de header: "Geen klant
gekozen — ga naar stap 1".

#### Zone 2 — Key metrics

Horizontale rij met drie grote getallen + globale warnings:

```tsx
<div style="display: flex; align-items: baseline; gap: 24px; ...">
  <div><big>{aantalBladen}</big> bladen</div>
  <div><big>{totaalM2.toFixed(2)} m²</big> totaal oppervlak</div>
  <div><big>{aantalAccessoires}</big> accessoires</div>
  {warnings && <AmberPill>... </AmberPill>}
</div>
```

Borders boven en onder voor visuele scheiding.

Globale warnings (rechts in deze zone als amber pill):
- "X bladen incomplete randafwerking" (telling van bladen waar
  randafwerking-codes ontbreken op zijden)
- "Vlakbouw in composiet zonder gecontroleerde override" (als er
  sparingen zijn met vlakbouw + composiet zonder bewust override)
- "Geen kleur gekozen" (als project-materiaal geen kleur heeft)

Toon maximaal twee warnings tegelijk; bij meer: "X waarschuwingen —
klik om alle te zien" met expandable.

#### Zone 3 — Bladen grid

```tsx
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 12px;">
  {bladen.map(blad => <BladKaart blad={blad} key={blad.id} />)}
</div>
```

Per blad één **BladKaart**:

- Header: bladnaam + afmetingen (`1958 × 800 mm · 1.57 m²`)
- "Bewerken ↗" knop rechtsboven kaart → navigeert naar stap 2 met
  dit blad geselecteerd
- Mini-canvas SVG (viewBox passend voor blad):
  - Blad-outline met juiste vorm (rechthoek of L-vorm via bladPath)
  - Sparingen op echte positie (klein, met basis kleur per type:
    rood/blauw/grijs)
  - Boorgaten als kleine paarse cirkels
  - Geen maatvoering (te druk op kleine schaal)
  - Geen labels (komt op PDF, niet hier)
  - Vlakbouw-warning ⚠ op sparingen die 'm hebben
- Onder canvas: materiaal-regel + status-regel
  - Materiaal: "COMPOSIET · 20 mm · Adamina" of bij override
    "DEKTON · 12 mm · Sirius (override)" in blauwe accent
  - Status:
    - Compleet → groene check + "4/4 zijden · X sparingen · Y boorgaten"
    - Incompleet → amber driehoek + "2/4 zijden · X sparingen · Y boorgaten"

#### Zone 4 — Accessoires

```tsx
<section style="background: white; border-radius: var(--border-radius-lg); padding: 12px 16px;">
  <header>
    Accessoires <span>(9 stuks)</span>
    <button>Bewerken ↗</button>
  </header>
  <div style="display: grid; grid-template-columns: 1fr 1fr;">
    {accessoires.map(item => <div>{item.aantal}× {item.naam}</div>)}
  </div>
</section>
```

Twee-koloms grid voor compactheid bij >4 items. Bij 0 accessoires:
"Geen accessoires toegevoegd" in muted tekst.

#### Zone 5 — Acties

```tsx
<footer style="display: flex; gap: 8px; justify-content: flex-end;">
  <button onClick={openPrintPreview}>Print preview</button>
  <button onClick={saveConceptToLocalStorage} variant="primary">
    Concept opslaan
  </button>
</footer>
```

**Print preview**: opent browser-print-dialog met afdruk-vriendelijke
versie. Voor MVP: gewoon `window.print()` met print-CSS die de
overzichtspagina toont zonder topbar of buttons. Detail komt in
sprint 6 met PDF-generatie.

**Concept opslaan**: serialiseert `state` naar JSON en slaat op in
`localStorage` onder key `kbf-concept-{timestamp}`. Toont confirm:
"Opname opgeslagen als concept. Je kan 'm later terughalen via..."
(voor MVP: zonder concept-lijst-feature, alleen opslaan).

### 2. Topbar navigatie

Topbar moet 4 stappen tonen als bolletjes/pills, allemaal klikbaar:

- Stap 1 Klant
- Stap 2 Tekening
- Stap 3 Specs
- Stap 4 Overzicht (nu actief)

Klikbaar naar elke stap, ook vooruit als ze al bezocht zijn. Routing
via state, geen URL-wijziging.

### 3. Per-sectie "Bewerken ↗" navigatie

Drie verschillende routes:

- **Klant-sectie "Bewerken"** → stap 1
- **BladKaart "Bewerken"** → stap 2 met `selectedBladId` gezet naar
  deze blad
- **Accessoires "Bewerken"** → stap 3 met `selectedSubSection`
  gezet naar 'accessoires'

Voor stap 2 navigatie met blad-context: nieuwe action
`NAAR_STAP_MET_BLAD`:

```typescript
{ type: 'NAAR_STAP_MET_BLAD'; stap: 1|2|3|4; bladId?: string; subSection?: string }
```

State houdt bij wat de gewenste sub-context is bij navigatie.

### 4. Mini-canvas helper — `src/drawing/miniCanvasBlad.tsx` (nieuw)

Een compacte SVG-render voor een blad in overzicht-context.

```typescript
type MiniCanvasProps = {
  blad: Blad;
  width?: number;   // default 200
  height?: number;  // default 90
};

function MiniCanvasBlad({ blad, width = 200, height = 90 }): JSX.Element {
  // 1. Bereken viewBox uit blad afmetingen
  // 2. Render blad-outline (rechthoek of L-vorm via bladPath)
  // 3. Render sparingen (kleine rechthoeken met basis-kleur)
  // 4. Render boorgaten (kleine paarse cirkels)
  // 5. Geen labels, geen maatvoering
}
```

Hergebruikt: `bladPath()` uit stap 2, `sparingPath()` uit stap 2.
Wel met aangepaste kleuren omdat selectie-state niet bestaat hier.

### 5. localStorage concept-opslag

Helper `src/state/conceptStorage.ts`:

```typescript
export function saveConcept(state: Opname): string {
  const key = `kbf-concept-${Date.now()}`;
  const data = JSON.stringify({
    version: 1,
    savedAt: new Date().toISOString(),
    state,
  });
  localStorage.setItem(key, data);
  return key;
}

export function loadConcept(key: string): Opname | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (data.version === 1) return data.state;
    return null;
  } catch {
    return null;
  }
}

export function listConcepts(): Array<{key: string; savedAt: string;
                                       customerName: string}> {
  // Itereer over localStorage, retourneer concepts gesorteerd op
  // savedAt desc
}
```

Voor sprint 5: alleen `saveConcept` gebruikt. `loadConcept` en
`listConcepts` zijn voor sprint 9 (offline-flow) maar definiëren we
alvast.

### 6. Aantal-tellingen helpers

Voor de header-metrics en zone-2:

```typescript
// In src/state/helpers.ts
export function totaalM2(state: Opname): number {
  return state.bladen.reduce((sum, b) => sum + oppervlakteM2(b), 0);
}

export function totaalAccessoires(state: Opname): number {
  return (state.accessoires ?? []).reduce((sum, a) => sum + a.aantal, 0);
}

export function bladenMetIncompleteRandafwerking(state: Opname): Blad[] {
  return state.bladen.filter(blad => {
    const zijden = bladZijden(blad);
    const ingesteld = (blad.randafwerkingen ?? []).length;
    return ingesteld < zijden.length;
  });
}

export function globaleWaarschuwingen(state: Opname): string[] {
  const w: string[] = [];

  const incompleet = bladenMetIncompleteRandafwerking(state);
  if (incompleet.length > 0) {
    w.push(`${incompleet.length} ${incompleet.length === 1 ? 'blad' : 'bladen'} incomplete randafwerking`);
  }

  if (!state.materiaalKeuze?.kleur_code) {
    w.push('Geen kleur gekozen');
  }

  // Vlakbouw + composiet zonder override?
  // Wordt al per-blad getoond via sparing-warning, op overzicht-niveau
  // alleen tellen.

  return w;
}
```

### 7. Print-CSS

Eén kleine CSS toevoegen voor `@media print`:

```css
@media print {
  /* Verberg topbar, navigatie, knoppen */
  .topbar, .step-nav, .actions, button { display: none !important; }

  /* Strek overzicht naar volledige breedte */
  .overzicht-page { max-width: none; padding: 0; }

  /* Forceer kleur-rendering */
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
```

In MVP: niet uitgebreid mooi maken — sprint 6 vervangt dit door
volwaardige PDF-generatie. Print-preview is alleen voor "kan ik dit
ergens even kopiëren of e-mailen voor nu".

### 8. Test scenarios voor screenshots

**Scenario A — Compleet project met 2 bladen, geen warnings**

1. Klant: Bakker (zakelijk, Alblasserdam)
2. Verkoper: Cees, inmeter: Eelke, datum 12-05-2026
3. Bladdeel A 1958×800: 4/4 zijden randafwerking, 1 spoelbak +
   1 kookplaat + 1 kraan
4. Bladdeel B 1958×800: 4/4 zijden randafwerking, geen sparingen
5. Materiaal: COMPOSIET 20mm Adamina
6. Accessoires: 4× Afdekprofiel, 3× Karldur lijm
7. Ga naar stap 4
8. **Screenshot**: header + metrics + 2 bladkaarten + accessoires +
   acties. Geen warnings.

**Scenario B — Project met incomplete randafwerking + override**

1. Zelfde als A maar Bladdeel B is L-vorm met slechts 4/6 zijden
   ingesteld
2. Materiaal-override op Bladdeel B: DEKTON 12mm Sirius
3. **Screenshot**: amber warning pill in zone 2 ("1 blad incomplete
   randafwerking"). Bladdeel B kaart toont amber driehoek + "4/6
   zijden" + "(override)" in materiaal-regel.

**Scenario C — Per-sectie navigatie werkt**

1. Bekijk overzicht uit scenario A
2. Klik "Bewerken ↗" op Bladdeel A
3. **Verwacht**: navigatie naar stap 2, Bladdeel A geselecteerd op canvas
4. Klik op topbar stap 4 → terug naar overzicht
5. Klik "Bewerken ↗" op Accessoires
6. **Verwacht**: navigatie naar stap 3, sub-sectie Accessoires actief

Geen aparte screenshot voor C; werkt als navigatie correct gaat.

**Scenario D — Concept opslaan**

1. Vul project A volledig in
2. Klik "Concept opslaan"
3. **Verwacht**: confirmation tekst + nieuwe key in localStorage
4. Refresh browser
5. State is leeg (geen auto-load nog, dat is sprint 9)
6. localStorage bevat de key — verificatie via DevTools

### 9. Commits

Atomic, suggestie:

- `feat: types and helpers for stap 4 overzicht metrics`
- `feat: enable stap 4 in topbar navigation`
- `feat: MiniCanvasBlad helper for compact blad rendering`
- `feat: Step4Overzicht page with header, metrics, blad cards, accessoires`
- `feat: per-section Bewerken navigation actions`
- `feat: localStorage concept save helper`
- `feat: print-friendly CSS for stap 4`
- `feat: globale waarschuwingen detection`

## Definition of done

- [ ] Stap 4 bolletje actief en klikbaar in topbar
- [ ] Step4Overzicht page rendert met juiste 4 zones
- [ ] Mini-canvas toont blad correct (rechthoek + L-vorm)
- [ ] Sparingen en boorgaten zichtbaar in mini-canvas
- [ ] BladKaart toont status (compleet/incompleet) met juiste icoon
- [ ] Materiaal-override duidelijk gelabeld in BladKaart
- [ ] Per-sectie "Bewerken ↗" navigeert correct (klant → 1, blad → 2
      met bladId, accessoires → 3 met sub-sectie)
- [ ] Topbar navigatie werkt vooruit en terug
- [ ] Globale waarschuwingen verschijnen als amber pills in zone 2
- [ ] Aantallen kloppen: bladen, totaal m², accessoires-telling
- [ ] "Concept opslaan" werkt naar localStorage met goede key
- [ ] Print preview opent browser-print dialog
- [ ] Print-CSS verbergt topbar/knoppen
- [ ] Lege-staat: "Nog geen klant" / "Geen accessoires"
- [ ] Vier scenario screenshots in chat
- [ ] `npm run build` slaagt
- [ ] PR ready om te mergen

## Wat NIET doen

- Geen ERPNext Quotation-aanmaak (sprint 8)
- Geen PDF-generatie (sprint 6)
- Geen concept-lijst-pagina (sprint 9)
- Geen auto-load van laatste concept bij refresh (sprint 9)
- Geen wijzigingen aan stap 1, 2, 3 inhoud (alleen navigatie-bridge)
- Geen nieuwe interactie-patronen (gebruik bestaande knop-stijlen,
  card-stijlen, kleur-codering)

## Open vragen voor later

- Concept-lijst-pagina (sprint 9): "Lopende concepten" met optie om
  oude opnames terug te laden of te verwijderen
- Auto-save tijdens werken (debounced naar localStorage elke 30 sec)
  om dataverlies bij crash te voorkomen
- "Versturen naar kantoor" knop in sprint 8 die ERPNext Quotation
  aanmaakt + PDF uploadt

## Vooruitblik

Na sprint 5 heeft de extensie een **volledige wizard van begin tot
eind**. Sprint 6 (PDF werkplaatstekening) en sprint 8 (ERPNext) maken
de output bruikbaar voor de tekenaar en het kantoor. Tussendoor kan
veldtest met deze versie al waardevolle UX-feedback opleveren.

## Methode

Subagent-driven development zoals sprint 4:
- Eén taak per keer
- Screenshot per taak (waar visueel)
- Wacht op akkoord voor doorgaan
- Geen "ik combineer X en Y" zonder vooraankondiging
