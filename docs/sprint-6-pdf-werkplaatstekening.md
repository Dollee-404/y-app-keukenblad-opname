# Sprint 6 — PDF werkplaatstekening + zaagbrief

## Status na sprint 5 + 3c

- Volledige wizard (4 stappen) werkt
- Verstek-relaties tussen bladen in datamodel + UI (sprint 3c)
- MiniCanvasBlad helper rendert blad-vormen voor stap 4 overzicht
- bladZijden helper voor rechthoek + L-vorm
- Label-zone-systeem uit sprint 3b-2 voor niet-overlappende labels

## Doel van deze sprint

Genereer **twee aparte PDFs** voor de tekenaar (MB bij Vasto):

1. **Werkplaatstekening** — visuele tekeningen met DIN-stijl maatvoering,
   één blad per pagina (multi-blad-per-pagina komt fase 2 of later)
2. **Zaagbrief** — alleen tekst-data: lijst van zaagonderdelen met
   materiaal, afmetingen, afwerkingen, m²

Beide volgen Vasto-conventies uit de bron-PDFs (Zaagtekeningen.pdf +
Zaagbrief.pdf, order 2600376).

## Werkomgeving

- Repo: `Dollee-404/y-app-keukenblad-opname` (geen wijziging)
- Branch: `feat/sprint-6-pdf` vanaf `main` ná merge sprint 3c
- Test door PDFs te openen in Acrobat / Preview / Chrome PDF viewer

## Vier vastgestelde ontwerpkeuzes

1. **Vasto-stijl exact volgen** — header, footer-tabel, doorsneeprofiel,
   procesregistratie-vakken, materiaal-info, klant + eindklant +
   ordernummer + week + tekening-nummer
2. **Twee aparte PDFs** (zaagtekening + zaagbrief)
3. **Pagina-oriëntatie altijd staand A4** — Vasto-conventie
4. **Multi-blad-per-pagina = fase 2** — MVP doet één blad per pagina

## Vasto-conventies uit bron-PDFs

### Zaagtekeningen.pdf (6 pagina's voor order 2600376)

**Per pagina, vast layout:**

- **Linksboven**: "Zagen: [L] x [B] mm" per blad. Pagina 4-6 hebben
  meerdere regels boven elkaar bij multi-blad-pagina.
- **Rechtsboven**: "Verpakken: Nee" + "Vrijdag" (leverdag)
- **Tekengebied centraal**: bladcontour + sparingen + boorgaten +
  maatvoeringen + randafwerking-codes + verstek-aanduidingen
- **Footer-tabel** (~90mm hoog, volledige breedte):

```
┌────────┬────────┬────────┬────────┬──────────────┬────────┐
│ Zagen  │ Lijmen │ Schuren│ Sparen │ Eindcontrole │ Bloknr │
│ [empty]│ [empty]│ [empty]│ [empty]│ [empty]      │ [empty]│  <- procesregistratie
├────────┴─────┬──┴────────┴────────┴─┬────────────┴──────┬─┤
│ 20DV40       │                       │                    │ │
│ ┌───┐        │ Glencoe Gepolijst    │ Zijlmans Interieur │ │  <- materiaal-info
│ │XXX│  40mm  │                       │   op maat B.V.     │ │
│ │20mm│       │  2600376 Week 14     │ ZIJLMANS-V VLIMM.  │ │
│ └───┘        │                       │                    │ │
│              │                       │ 16-02-2026         │ │
│              │                       │ Route:             │ │
│              │                       │ Tek. Nr: 1 - 6     │ │
│              │                       │   VASTO            │ │
│              │                       │  NATUURSTEEN       │ │
└──────────────┴───────────────────────┴────────────────────┴─┘
```

**Maatvoering-stijl** (zichtbaar op pagina 1):

- Buitenmaten: lengte/breedte met maatpijltjes (scherp open driehoekje)
- Sparing-positie: **drie afstanden vanaf linkerrand**: 925 (naar
  linkerkant sparing), 1861 (naar rechterkant sparing), 1956 (rechtse
  rand met overhang)
- Bij sparing-label drie regels:
  - "Kookplaat vlakbouw C75" (productnaam)
  - "Vlakbouw" (inbouw-wijze, gestippeld op tekening voor inner-cutout)
  - "Kookplaat sparingmaat 764/740 x 519/495 mm, Radius 5 mm, Trede 7 mm"

**Verstek-aanduidingen** (pagina 3, 4, 5):

- Op zijde: tekst "verstek" of "T1 verstek" zonder driehoekjes
- Tussen onderdelen: "verstek" als verbinding-label
- Op blad-label: "IN VERSTEK MET ACHTERWAND" als notitie bij gekoppelde
  bladen op andere pagina

**Boorgat-labels**:

- "D35" (Vasto-stijl, niet "Ø35")
- "D7D70" bij combinatie van twee gaten (Ø7 en Ø70)
- Bij groep met h.o.h.-maat: aparte hartafstand-maat tussen gaten

### Zaagbrief.pdf (3 pagina's voor zelfde order)

- **Header**: "ZAAGBRIEF" titel
- **Order-info-blok** (vast op elke pagina):
  - Ordernr, Datum, Uw referentie, Leverweek, Ondehoudsset, Verpakken
- **Onderdelen-lijst** (geen tekeningen):
  Per onderdeel:
  - "Materiaal: Glencoe Gepolijst Groep 0 Composiet t/m 49mm" (vet)
  - "Lengte: 1958 Breedte: 1001" (vet)
  - "Afwerking: Randafwerking verstek 40mm hoog 1,86"
  - "Uitsparing: Uitsparing vlakinbouw kookplaat"

M² berekening per onderdeel: `lengte × breedte / 1.000.000`, getoond
met komma-decimaal (Nederlandse notatie).

## Technische stack

- **jsPDF** voor PDF-generatie
- **svg2pdf.js** voor eventuele SVG-naar-PDF conversie
- Lazy-loaded — pas bij Download-klik

Bundle-impact: ~200 KB extra, lazy loaded. Initial bundle blijft
<350 KB.

## Stap-voor-stap

### Taak 1 — Dependencies + types

```bash
npm install jspdf svg2pdf.js
```

Plus types voor PDF-rendering:

`src/pdf/types.ts` (nieuw):

```typescript
export type PdfViewport = {
  pageWidthMm: number;
  pageHeightMm: number;
  drawingAreaX: number;
  drawingAreaY: number;
  drawingAreaWidth: number;
  drawingAreaHeight: number;
  scaleFactor: number;
};

export type RenderContext = {
  doc: jsPDF;
  viewport: PdfViewport;
  state: Opname;
};
```

### Taak 2 — Coordinate-transformatie helpers + tests

`src/pdf/coordinateTransform.ts` + `.test.ts` (nieuw)

```typescript
export function computeViewport(blad: Blad): PdfViewport {
  // A4 staand: 210 × 297mm
  // Reserveer:
  //  - 30mm top (header)
  //  - 90mm bottom (footer-tabel)
  //  - 15mm marges links/rechts
  // Bruikbaar tekengebied: 180 × 177mm
  // Scale-factor zodat blad + 40mm label-marge past
  // Centreer in tekengebied
}

export function bladToPdf(point, blad, viewport): {x, y} {
  // Y-flip: datamodel Y=0 onder, PDF Y=0 boven
}
```

Tests:
- 1958×1001 → past in A4 staand, scale berekend correct
- 600×600 → past, grotere scale
- 2760×600 → past, kleinere scale
- Point (979, 500) van 1958×1001 → centraal in tekengebied

**Stop voor mijn akkoord** — fundament moet kloppen voor alles erop
gebouwd.

### Taak 3 — Bladcontour + hoek-symbolen

`src/pdf/renderBlad.ts` (nieuw)

```typescript
export function renderBladContour(doc, blad, viewport) {
  // Lijnen via doc.line() voor elke zijde uit bladZijden(blad)
  // Linewidth 0.4
}

export function renderHoekSymbolen(doc, blad, viewport) {
  // Bij rechthoek: 4 hoek-symbolen ("⌐" vorm) in hoeken
  // Bij L-vorm: 5 hoeken (skip binnenhoek)
}
```

Test PDF: één blad rechthoek + één L-vorm, zichtbaar contour +
hoek-symbolen.

### Taak 4 — Sparingen + labels

`src/pdf/renderSparingen.ts` (nieuw)

```typescript
export function renderSparing(doc, sparing, blad, viewport) {
  // 1. Buitenste rechthoek
  // 2. Bij vlakbouw: binnenste gestippelde rechthoek (dual layer)
  // 3. Geen kleur-vulling
  // 4. Label onder sparing:
  //    - Productnaam (bv "Kookplaat vlakbouw C75")
  //    - Inbouw-wijze (bv "Vlakbouw")
  //    - Maten regel met Vasto-notatie
}
```

Test: PDF van blad met spoelbak + kookplaat (één vlakbouw, één
onderbouw) — labels en dual-layer correct.

### Taak 5 — Boorgaten + groep-labels

`src/pdf/renderBoorgaten.ts` (nieuw)

```typescript
export function renderBoorgat(doc, boorgat, blad, viewport) {
  // 1. doc.circle() met juiste diameter
  // 2. Doorboring: volle lijn. Blind: gestippeld
  // 3. Label "D35" (Vasto-stijl, niet "Ø35")
  // 4. Bij groep: één label "D35" of "D7D70" voor combo
}
```

Test: PDF met losse boorgaten en boorgat-groepen, labels niet
overlappend dankzij label-zone-systeem (hergebruik sprint 3b-2).

### Taak 6 — Maatvoering: buitenmaten

`src/pdf/renderMaatvoering.ts` (nieuw)

Eerste sub-taak: alleen buitenmaten van het blad.

```typescript
export function renderBuitenmaten(doc, blad, viewport) {
  // Lengte boven blad: maatpijltjes + getal in midden
  // Breedte links blad: maatpijltjes + getal in midden (verticaal)
  // Bij L-vorm: meerdere sub-lengtes (zoals Vasto pagina 2:
  //   600 / 1088 / 2760)
}
```

Vasto-stijl maatpijltjes: scherp open driehoekje (~2mm), niet gevuld.
Hulplijnen dun gestippeld.

Test: PDF van rechthoek + L-vorm met correcte buitenmaten zichtbaar.

### Taak 7 — Maatvoering: sparing-positie (multi-aanslag)

In `renderMaatvoering.ts`:

```typescript
export function renderSparingMaten(doc, sparing, blad, viewport) {
  // Drie horizontale maten vanaf linkerrand (Vasto-conventie):
  //   1. naar linkerkant sparing
  //   2. naar rechterkant sparing
  //   3. (optioneel) totale lengte met overhang
  // Eén verticale maat: vanaf voorrand of achterrand naar
  //   sparing-midden
  // Maten onder of boven blad, niet overlappend met buitenmaten
}
```

Test: PDF met Bora C75 vlakbouw — drie horizontale maten zichtbaar
(925 / 1861 / 1956 voor 1958×1001 blad zoals Vasto pagina 1).

### Taak 8 — Maatvoering: boorgat-positie + randafwerking-labels

```typescript
export function renderBoorgatMaten(doc, boorgat, blad, viewport) {
  // X-positie + Y-positie vanaf rand
  // Bij groep: hartafstand-maat tussen gaten
}

export function renderRandafwerkingLabels(doc, blad, viewport) {
  // Per zijde: code op of buiten zijde-midden
  // Bij verstek=true: "verstek" als suffix of aparte regel
  // Bij gekoppelde verstek-zijde: "IN VERSTEK MET {andere blad}"
  //   als notitie indien ander blad op andere pagina
}
```

Test: PDF met alle elementen samen — geen overlap, leesbaar.

### Taak 9 — Header + footer-tabel per pagina

`src/pdf/renderHeader.ts` + `src/pdf/renderFooter.ts` (nieuw)

**Header** (~25mm hoog, full-width):

```typescript
export function renderPaginaHeader(doc, bladen, paginaInfo) {
  // Linksboven: "Zagen: [L] x [B] mm" — één regel per blad op pagina
  // Rechtsboven: "Verpakken: Nee" + leverdag ("Vrijdag")
}
```

**Footer-tabel** (~90mm hoog, full-width):

```typescript
export function renderPaginaFooter(doc, state, blad, paginaNr, totaalPaginas) {
  // Rij 1 — Procesregistratie: 6 lege kolommen
  // Rij 2 — Materiaal-info:
  //   - Materiaalcode + visueel doorsneeprofiel (links)
  //   - Kleur (vet)
  //   - Klant + eindklant (midden)
  //   - Ordernummer + week (groot, midden-rechts)
  //   - Datum + route + tek.nr (rechtsonder)
  //   - "VASTO NATUURSTEEN" branding (kan voor MVP "DE KEUKENBLADEN-
  //      FABRIEK" zijn — bespreken)
}

function renderDoorsneeprofiel(doc, x, y, dikte, randafwerking) {
  // Klein SVG: rechthoek met dikte × randafwerking-hoogte
  // Schuine kant bij DV-codes
  // Hatchpatroon (XXX) voor materiaal-aanduiding
}
```

Aandachtspunt: **branding** — "VASTO NATUURSTEEN" rechtsonder. Voor
De Keukenbladenfabriek-versie: vervangen door eigen branding, of
Vasto behouden omdat 't tekenwerk daar gebeurt. Bespreken voor MVP.

Test: complete blad-pagina met header + tekening + footer-tabel,
visueel vergelijken met Vasto pagina 1.

### Taak 10 — Generator main entrypoint

`src/pdf/generateWerkplaatstekening.ts` (nieuw)

```typescript
export async function generateWerkplaatstekening(state: Opname): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  state.bladen.forEach((blad, index) => {
    if (index > 0) doc.addPage();
    renderBladPagina(doc, blad, state, index + 1, state.bladen.length);
  });

  return doc.output('blob');
}

function renderBladPagina(doc, blad, state, paginaNr, totaalPaginas) {
  const viewport = computeViewport(blad);

  renderPaginaHeader(doc, [blad], { paginaNr, totaalPaginas });

  renderBladContour(doc, blad, viewport);
  renderHoekSymbolen(doc, blad, viewport);
  blad.sparingen.forEach(s => renderSparing(doc, s, blad, viewport));
  blad.boorgaten?.forEach(b => renderBoorgat(doc, b, blad, viewport));
  renderBuitenmaten(doc, blad, viewport);
  blad.sparingen.forEach(s => renderSparingMaten(doc, s, blad, viewport));
  blad.boorgaten?.forEach(b => renderBoorgatMaten(doc, b, blad, viewport));
  renderRandafwerkingLabels(doc, blad, viewport);

  renderPaginaFooter(doc, state, blad, paginaNr, totaalPaginas);
}
```

### Taak 11 — Zaagbrief PDF generator

`src/pdf/generateZaagbrief.ts` (nieuw)

Eenvoudiger, tekst-georiënteerd:

```typescript
export async function generateZaagbrief(state: Opname): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  let y = 20;
  renderZaagbriefHeader(doc, state, y);  // "ZAAGBRIEF" titel + order-info-blok
  y = 90;

  state.bladen.forEach(blad => {
    if (y > 250) { doc.addPage(); y = 20; }
    y = renderBladItem(doc, blad, state, y);
  });

  return doc.output('blob');
}

function renderBladItem(doc, blad, state, startY): number {
  // "Materiaal: ..." regel (vet)
  // "Lengte: X Breedte: Y" regel (vet)
  // "Afwerking: ..." regel(s) — één per randafwerking-code
  // "Uitsparing: ..." regel(s) — één per sparing
  // Return: nieuwe y-positie na dit item + witregel
}
```

### Taak 12 — UI download-knoppen

In Step4Overzicht.tsx vervang "Print preview"-sectie:

```tsx
<button onClick={handleDownloadWerkplaatstekening} variant="primary" disabled={loading}>
  {loading ? 'Genereren...' : 'Download werkplaatstekening'}
</button>
<button onClick={handleDownloadZaagbrief} disabled={loading}>
  Download zaagbrief
</button>
<button onClick={handleSaveConcept}>
  Concept opslaan
</button>
```

Handlers:

```typescript
async function handleDownloadWerkplaatstekening() {
  setLoading(true);
  try {
    const blob = await generateWerkplaatstekening(state);
    triggerDownload(blob, makeFilename('werkplaatstekening', state));
  } catch (e) {
    console.error(e);
    alert('PDF genereren mislukt');
  } finally {
    setLoading(false);
  }
}

function makeFilename(prefix: string, state: Opname): string {
  const klant = state.customer?.name ?? 'concept';
  const datum = new Date().toISOString().slice(0, 10);
  return `${prefix}-${klant}-${datum}.pdf`;
}
```

### Taak 13 — Vier scenario-tests + build

**Scenario A — Vasto-replicate pagina 1:**
- Bladdeel A 1958×1001
- Bora C75 vlakbouw op (1307, 500) — midden-rechts
- Materiaal: Composiet 20mm, kleur Glencoe Gepolijst
- Randafwerking DV40 alle 4 zijden
- Download → PDF vergelijken met Vasto pagina 1

**Scenario B — Eenvoudig blad:**
- Bladdeel A 1000×600
- Atag onderbouw kookplaat (geen vlakbouw)
- Materiaal Adamina
- Randafwerking gemixt
- Download → PDF met enkelvoudig blad + correcte maten

**Scenario C — L-vorm + verstek:**
- Bladdeel A 2760×600 met spoelbak Caressi
- Bladdeel B L-vorm-stuk
- Verstek-relatie tussen A en B
- Download → twee pagina's, verstek-labels correct, "IN VERSTEK MET..."
  notitie

**Scenario D — Zaagbrief output:**
- Project met 3 bladen + verschillende materialen
- Download zaagbrief → aparte PDF met tekst-lijst zoals Vasto

`npm run build` slaagt, bundle <350 KB initial.

## Definition of done

- [ ] jsPDF + svg2pdf.js geïnstalleerd, lazy-loaded
- [ ] `computeViewport()` + `bladToPdf()` met tests
- [ ] Bladcontour + hoek-symbolen
- [ ] Sparingen met vlakbouw dual-layer + Vasto-stijl labels
- [ ] Boorgaten met "D"-notatie en groep-labels
- [ ] Maatvoering: buitenmaten + multi-aanslag sparing-posities +
  boorgat-positie + randafwerking-codes
- [ ] Verstek-tekst-labels (geen driehoekjes in PDF)
- [ ] Header per pagina: "Zagen: ..." + "Verpakken: ..." + leverdag
- [ ] Footer-tabel: procesregistratie + materiaal + branding
- [ ] Zaagbrief PDF apart bestand
- [ ] Download-knoppen in stap 4
- [ ] Filenames volgens patroon
- [ ] Initial bundle <350 KB
- [ ] Vier scenario-tests gerapporteerd
- [ ] PR ready voor merge

## Wat NIET doen in deze sprint

- Multi-blad-per-pagina layout (fase 2 later)
- Kleurvulling van sparingen (zwart-wit alleen)
- Klantbevestiging PDF (sprint 7)
- ERPNext-upload (sprint 8)
- Eigen logo voor De Keukenbladenfabriek (polish — voor MVP gebruik
  Vasto-branding of placeholder)
- Multi-page bladen (te groot voor één A4)
- Snapshot-testing van PDFs

## Open vragen voor later

- **Exact Vasto-template**: reverse-engineering uit bron-PDFs.
  Acceptabele afwijkingen voor MVP.
- **Custom fonts**: jsPDF default Helvetica.
- **Order-velden**: verpakken/leverdag/route hardcoded voor MVP,
  uit `state.order.*` als sprint die data toevoegt.
- **Multi-blad-per-pagina algoritme**: fase 2 of polish-sprint.
- **Branding-vraag**: VASTO NATUURSTEEN vs De Keukenbladenfabriek
  voetnoot.

## Vooruitblik

Na sprint 6 kan de inmeter een complete werkplaatstekening + zaagbrief
downloaden vanaf z'n tablet. Sprint 7 (klantbevestiging PDF) gebruikt
deels dezelfde generators maar andere lay-out. Sprint 8 (ERPNext)
uploadt PDFs als attachments naar Quotation.

## Methode

Subagent-driven development:
- Eén taak per keer (13 taken)
- Visuele verificatie: PDF openen + bekijken
- Wacht op akkoord per stap
- Geen taken combineren zonder vooraankondiging
- Tests groen voor commit

Verwachte zwaarste taken:
- Taak 2 (coordinate-transformatie) — fundering
- Taak 7 (sparing-multi-aanslag-maten) — Vasto-specifieke conventie
- Taak 9 (footer-tabel met doorsneeprofiel) — visueel complex
- Taak 13 scenario A — Vasto-replicate vergelijken
