# Sprint 3a — Fixes vóór merge

## Context

Layout-redesign uit `sprint-3a-addendum-layout.md` is grotendeels af.
Vijf kleine punten nog op te lossen vóór PR-merge. Allemaal in dezelfde
branch `feat/sprint-3a-tekening`.

## Fixes

### 1. Geselecteerd segment-accent

**Probleem:** segmenten zien er allemaal hetzelfde uit, zelfs geselecteerd.
Geen visueel onderscheid bij tikken.

**Wat moet er gebeuren:**

In `Canvas.tsx`, wanneer een segment is geselecteerd
(`state.selectedSegmentIndex != null` voor het actieve blad):

- Render een groen-doorzichtige rect (`fill="#1D9E75" opacity="0.6"`) als
  10mm dikke strip exact bovenop het segment
- De maatvoering van *dat* segment krijgt:
  - Pijl-lijn: `stroke="#1D9E75" stroke-width="2"` (ipv slate grijs 1)
  - Tekst-label: in een groene pill (`bg-teal-600 white text`) ipv losse tekst
- Andere segmenten blijven slate-grijs zoals nu

**Hoe te bepalen of een segment geselecteerd is:**
- Reducer-state: `selectedSegmentIndex: number | null`
- Bij tikken op segment-tap-zone: dispatch `SEGMENT_SELECTEREN`
- Bij wijziging via SegmentPanel: ná Toepassen dispatch `SEGMENT_DESELECTEREN`
- Bij switch tussen bladen: ook resetten

**Test:** tik op de onderzijde van een blad — groene accent + groene
maat-pill zichtbaar. Tik op een andere zijde — accent verschuift.

### 2. Casing consistent maken — Title Case overal

**Probleem:** "BLADDEEL A" in lijst (uppercase), "Bladdeel B" in info-paneel
(title case). Verwarrend en oogt onrustig.

**Wat moet er gebeuren:**

Kies Title Case (`"Bladdeel A"`) overal:

- `BladList.tsx`: blad-label rendert zonder `text-transform: uppercase`
- `CanvasToolbar.tsx`: idem
- `BladInfoPanel.tsx`: idem
- Werkstuk-typen uit `seed.werkstukken` zijn al Title Case, dus
  bron-data is goed; alleen CSS aanpassen

**Niet aanpassen:**
- Step-pills in top-bar (huidige stijl is prima)
- Sub-labels zoals "2 BLADEN — 2.60 M²" (mag uppercase blijven want is
  meta-info, niet content)

### 3. Verwijder-x veiliger maken

**Probleem:** verwijder-x altijd zichtbaar naast elk blad in de lijst.
Inmeter kan per ongeluk z'n werk weggooien.

**Wat moet er gebeuren:**

Twee opties — kies de simpelste die werkt:

**Optie A — confirm dialog (eenvoudig):**
- X-icoon blijft zichtbaar
- Klik op X opent een kleine modal: "Bladdeel A verwijderen? Deze actie kan
  niet ongedaan gemaakt worden." + [Annuleer] [Verwijderen]
- Verwijderen-knop is rood (`bg-red-600 text-white`)
- Annuleer is default

**Optie B — verberg achter context-menu (iets meer werk):**
- Geen X meer naast blad
- In plaats daarvan: "..."-icoon (`ti-dots-vertical`) rechts in elke rij
- Klik opent dropdown met "Verwijderen" als enige optie
- Klik daarop opent zelfde confirm-dialog als A

**Aanbeveling:** optie A. Sneller, voldoende veilig, kost geen extra UI.

### 4. Sparingen-placeholder in BladInfoPanel

**Probleem:** info-paneel eindigt bij Randafwerking. De inmeter ziet niet
dat er nog meer komt (sparingen in sprint 3b).

**Wat moet er gebeuren:**

Onder de Randafwerking-sectie, een Sparingen-sectie toevoegen:

```jsx
<div style="margin-bottom: 12px;">
  <div style="color: var(--color-text-tertiary); margin-bottom: 6px;
              font-size: 11px;">Sparingen</div>
  <button
    disabled
    style="width: 100%; padding: 6px; font-size: 11px;
           background: white;
           border: 0.5px dashed var(--color-border-secondary);
           border-radius: 4px;
           cursor: not-allowed;
           color: var(--color-text-tertiary);">
    <i class="ti ti-plus" aria-hidden="true"></i> Sparing toevoegen
  </button>
  <div style="margin-top: 4px; font-size: 10px;
              color: var(--color-text-tertiary);
              font-style: italic;">
    Beschikbaar in volgende sprint
  </div>
</div>
```

Disabled-state, dashed border, "Beschikbaar in volgende sprint" eronder.
Zo ziet de inmeter waar 't komt zonder te verwarren.

### 5. Klant-naam fallback in top-bar

**Probleem:** wanneer geen klant gekozen is, staat "Geen klant" — werkt
nu, maar niet duidelijk wat de inmeter moet doen.

**Wat moet er gebeuren:**

In `TopBar.tsx`, klant-blok logica:

- Als `state.afleveradres.naam` of `state.opdrachtgever.naam` aanwezig:
  toon die (zoals nu)
- Als geen van beide: toon "Nog geen klant gekozen" met
  `text-tertiary` styling + klein chevron rechts. Klik gaat terug naar
  stap 1 (`dispatch SET_STAP 1`) — werkt al via de step-pill, maar zo wordt
  het ook duidelijk vanuit de header

Subtitel-regel (Zijlmans Interieur · 30-03-2026) wordt dan: alleen datum
("11-05-2026"). Niet leeg laten.

## Definition of done

- [ ] Geselecteerd segment groen geaccentueerd in canvas + maatvoering
- [ ] Title Case voor alle blad-labels (lijst, toolbar, info-paneel)
- [ ] Verwijder-x heeft confirm-dialog
- [ ] Sparingen-placeholder zichtbaar in BladInfoPanel met disabled knop
- [ ] Top-bar "Nog geen klant gekozen" klikbaar terug naar stap 1
- [ ] Nieuwe screenshot in chat
- [ ] `npm run build` slaagt
- [ ] PR ready om te mergen

## Commits

Atomic, suggestie:
- `feat: highlight selected segment with teal accent`
- `fix: consistent title case for blad labels`
- `feat: confirm dialog before deleting blad`
- `feat: add sparingen placeholder section in BladInfoPanel`
- `fix: clickable empty-klant state in top bar`

Push naar dezelfde branch, dan PR mergen.

## Wat NIET doen

- Geen werking van Sparingen-knop (sprint 3b)
- Geen andere top-bar wijzigingen
- Geen herontwerp van BladList lay-out
- Geen scope-creep — alleen deze 5 fixes
