# Sprint 6 taak 10 — Generator entrypoint werkplaatstekening

## Doel

Eén publieke functie die op basis van een `Opname` een PDF-blob
teruggeeft, klaar voor download of preview. Alle eerder gebouwde
componenten (coordinate-transform, bladcontour, sparingen, boorgaten,
maatvoering, randafwerking, footer) komen samen.

## Open ontwerp-vragen — eerst beantwoorden vóór implementatie

Stel deze vragen aan Eelke voordat je begint. Niet zelf invullen.

### Vraag 1 — orientation-keuze

Per blad bepalen of portrait of landscape wordt gerenderd? Optie:

a. **Auto-detect per blad** op basis van `breedte > hoogte * 1.3`
   (zoals nu in V3 landscape redesign werkt voor één blad)

b. **Per opname kiezen** — alle bladen in dezelfde opname krijgen
   dezelfde orientation (handiger voor afdrukken)

c. **Per blad expliciet** door inmeter (extra UI-keuze)

Voorkeur ligt waarschijnlijk bij **a** (consistent met huidige code en
verstandig per blad).

### Vraag 2 — multi-blad-output

Een opname heeft N bladen. Wat is de gewenste output?

a. **Eén PDF met N pagina's** (zoals Vasto doet) — `Blob` retour
b. **N losse PDFs** — `Blob[]` retour
c. **Beide opties** met parameter

Voorkeur is bijna zeker **a** (één PDF met meerdere pagina's). Vasto
doet dit ook (zie `Zaagtekeningen.pdf` met 6 pagina's).

### Vraag 3 — signature

Gegeven antwoorden op 1 en 2, voorgestelde signatuur:

```ts
async function genereerWerkplaatstekening(
  opname: Opname,
  options?: { bladIds?: string[] }  // filter optioneel
): Promise<Blob>
```

- Default: alle bladen, één PDF
- Optioneel: alleen specifieke bladen (voor preview van één pagina)

## Implementatie-volgorde

Pas na vragen 1-3 beantwoord. Vier sub-stappen:

### Stap 10a — Pagina-orchestratie skelet

Functie `genereerWerkplaatstekening(opname)` die:
1. jsPDF instantieert met A4-formaat
2. Per blad in `opname.bladen`:
   - Orientation bepalen (zie vraag 1)
   - `pdf.addPage({orientation, format: 'a4'})` voor 2e+ blad
   - Aanroep naar `renderBlad(pdf, blad, opname)` placeholder
3. Returns `pdf.output('blob')`

Test: leeg PDF met N pagina's wordt gegenereerd, juiste oriëntatie per
pagina. Verifieer met test-opname die 2 bladen heeft (1958×1001 →
landscape, 630×604 → portrait).

### Stap 10b — Header-functie

`renderHeader(pdf, blad, opname)` — bestaande header-render-code
extraheren uit huidige test-files naar een herbruikbare functie. Werkt
voor portrait én landscape.

### Stap 10c — Tekening-zone-functie

`renderTekening(pdf, blad, opname)` — alle bladcontour + sparingen +
boorgaten + randafwerking + maatvoering. Bestaande code consolideren.

### Stap 10d — Footer-functie

`renderFooter(pdf, blad, opname)` — bestaande footer-render-code
consolideren. Werkt voor portrait én landscape (twee verschillende
implementaties).

## Concreet voor test-opname

Verwacht eindresultaat met het Vasto-test-blad (1958×1001 + sparingen):
- 1 pagina, landscape oriëntatie (want 1958 > 1001 × 1.3)
- Header, tekening, footer zoals huidige V5-output

Verwacht eindresultaat met opname die meerdere bladen heeft:
- N pagina's in één PDF
- Elke pagina heeft de juiste orientation
- Elke pagina toont één blad

## Bestandstructuur-suggestie

```
src/pdf/
  index.ts                  ← publieke export: genereerWerkplaatstekening
  generator.ts              ← orchestratie (10a)
  renderHeader.ts           ← 10b
  renderTekening.ts         ← 10c
  renderFooter.ts           ← 10d
  doorsneeprofiel.ts        ← skelet uit 9b, niet gebruikt
  types.ts                  ← bestaand
  coordinateTransform.ts    ← bestaand
```

## Niet aanraken

- Bestaande coordinate-transform helpers — werken al
- Bestaande sparing-rendering, boorgat-rendering, etc. — alleen
  reorganiseren naar herbruikbare functies
- Footer-content / lay-out — alleen verplaatsen naar renderFooter()
- Doorsneeprofiel-icoon — skelet blijft uncalled (sprint 9b besluit)

## Verificatie

1. **Single-blad test:** opname met Vasto-blad (1958×1001) → 1
   pagina, landscape, ziet er hetzelfde uit als huidige V5-output
2. **Multi-blad test:** opname met 3 bladen verschillende ratios →
   3 pagina's met juiste orientations
3. **Bladfilter-test:** `genereerWerkplaatstekening(opname,
   { bladIds: [bladA.id] })` → 1 pagina met alleen blad A
4. **Bundle-check:** initial bundle <350 KB (lazy-load jsPDF + svg2pdf
   blijft gerespecteerd)

Screenshot/PDF naar Eelke voor akkoord vóór commit.

## Tip voor volgorde

Stap 10a (skelet met lege pagina's) eerst opleveren en visueel
verifiëren — zorgt dat orchestratie + orientation klopt vóór alle
content erop komt. Daarna 10b/c/d in losse iteraties of in één keer
als 10a en bestaande renderfuncties netjes te combineren zijn.
