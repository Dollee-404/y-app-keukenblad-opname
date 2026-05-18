# Handover — Keukenblad Opname project (Y-App extensie)

## Context

Eelke (GitHub: Dollee-404, eelke@impertio.nl, Dordrecht NL) bouwt een Y-App extensie voor **De Keukenbladenfabriek** (handelsnaam **Vasto Natuursteen Steenhouwerij BV**, KvK 23068075). De extensie laat inmeters op locatie volledige opnames maken (klant + bladen + sparingen + boorgaten + materiaal + accessoires + verstek-relaties) en genereert daaruit twee PDFs: werkplaatstekening (voor tekenaar MB) en zaagbrief (voor kantoor).

**Repo**: `Dollee-404/y-app-keukenblad-opname` op GitHub
**Live**: https://dollee-404.github.io/y-app-keukenblad-opname/
**Tech**: React 18 + Vite + TypeScript, sandboxed iframe in Y-App, postMessage-bridge, ERPNext via Y-App browsersessie
**Test-instance**: Drechtsteden Bouw B.V. (drechtstedenbouw-erp.prilk.cloud)
**Domeintaal**: Nederlands (Blad, Zichtzijde DV40/T1-EF/KF, Sparing, Verstek, Vlakbouw, Werkstuktype, Boorgat)

## Gemerged op main (5f0dad1 + sprint 3c)

### Sprint 1: Project-skelet
Vite/React/TS, bridge.ts, seed-data infrastructure

### Sprint 2: Klant
Step1 met Customer/Address aanmaak via Dynamic Link

### Sprint 3a: Tekening basis
Step2 met drie-koloms layout (240px nav | flex canvas | 220px BladInfoPanel)

### Sprint 3b-1: Sparingen
Productcatalogus (6 kookplaten, 5 spoelbakken), vlakbouw composiet warning

### Sprint 3b-2: Boorgaten
Kraan-flow herontwerp, boorgat-dialog met categorieën, leader-line labels met label-zone systeem (kostte 4 rondes — uiteindelijk Y-flip bug + label-zones aanpak)

### Sprint 4: Specificaties
- Materiaal + kleur per project + per-blad override (`MateriaalKeuze` met soort + dikte + kleur)
- Randafwerking per zijde via klikbaar SVG (rechthoek 4 zijden, L-vorm 6 zijden via `bladZijden` helper)
- Accessoires catalogus + handmatige invoer (SKU-match voor samenvoegen catalogus-items bij dubbeltoevoegen)
- Reactieve vlakbouw-warning via `effectiefMateriaalSoort(blad, state)` helper
- Live SamenvattingPanel rechts in stap 3

Belangrijk: materiaal-override neemt ALLE drie velden mee (soort + dikte + kleur), niet alleen soort.

### Sprint 5: Stap 4 Overzicht
- 5 zones: header, key-metrics (bladen / m² / accessoires), bladen-grid met MiniCanvasBlad, accessoires, acties
- Per-sectie "Bewerken ↗" navigatie met bladId/sub-section context
- Globale waarschuwingen (incompleet randafwerking, geen kleur, etc.)
- localStorage `saveConcept` werkt (load + lijst voor sprint 9)
- Print-CSS voor browser-print preview
- `?leeg=1` URL-param toggle voor dev-mode lege-staat test

### Sprint 3c: Verstek-relaties
- `verstek?: boolean` per Randafwerking + `VerstekRelatie` type op Opname
- Reducer met cascade-delete bij blad-verwijderen
- `verstekHelpers` (5 functies + 25 tests): relatiesVoorBlad, zijdeIsGekoppeld, gekoppeldeZijde, ongekoppeldeVerstekzijden, verstekConflicten
- "Verstek (koppeling)" optie in ZijdePopup met DV-conflict amber warning (niet blokkerend)
- VerstekRelatieDialog 3-staps (zijde eigen blad → ander blad → zijde ander blad + hoek + notitie)
- BladInfoPanel verstek-relaties sectie met perspectief-omdraaien
- Canvas verstek-driehoekjes + "↔ {bladnaam}" sub-label (alleen canvas in stap 2, niet PDF)
- Validatie warnings in SamenvattingPanel + globaleWaarschuwingen
- Playwright tests voor 4 scenarios

Sprint 3c had merge-incident: lokale commits niet gepusht voor PR #8 squash → 10 commits cherry-picked naar PR #9 fix branch → daarna gemerged. Procesregel toegevoegd: **eerst `git push`, dan PR aanmaken**.

## ACTIEVE SPRINT: Sprint 6 — PDF werkplaatstekening + zaagbrief

### Branch: `feat/sprint-6-pdf`

### Vier vastgestelde ontwerpkeuzes
1. **Vasto-stijl exact volgen** — uit bron-PDFs Zaagtekeningen.pdf en Zaagbrief.pdf (order 2600376)
2. **Twee aparte PDFs** (werkplaatstekening + zaagbrief)
3. **A4 staand altijd** — Vasto-conventie
4. **Eén blad per pagina voor MVP** — multi-blad-per-pagina is fase 2

### Tech-stack
- jsPDF + svg2pdf.js, lazy-loaded
- Bundle <350 KB initial

### Branding in footer rechtsonder (afspraak)
- Regel 1 groot vet: "DE KEUKENBLADENFABRIEK"
- Regel 2 klein lichtgrijs: "Vasto Natuursteen"

### TODO-lijst Sprint 6 (13 taken)
1. ✅ Dependencies + types (`src/pdf/types.ts`)
2. ✅ Coordinate-transformatie helpers + tests (`coordinateTransform.ts`, 6 tests)
3. ✅ Bladcontour + hoek-symbolen (rechthoek 4, L-vorm 5 — binnenhoek via z<0 cross-product gedetecteerd)
4. ✅ Sparingen + vlakbouw dual-layer + labels onder blad
5. ✅ Boorgaten met D-notatie (D35 doorboring volle lijn, D8 blind gestippeld, D7D70 groep samengevoegd)
6. ✅ Buitenmaten Vasto-stijl pijltjes (open driehoekjes)
7. ✅ Sparing-aanslag-maten — KOOS optie A: drie logische maten (sparing-center / sparing-rechterkant / bladrand-2mm). Vasto's 1861 wordt NIET gerepliceerd want is een bladstap/rabat-feature (genoteerd voor sprint 11)
8. ✅ Boorgat-positie-maten + randafwerking-codes (op zijde, Vasto-stijl zonder leader) + verstek-tekst (geen driehoekjes in PDF)
9. ⏳ **Taak 9a hangt** — header werkt, footer-tabel layout was fout en moet herzien
10. Generator entrypoint werkplaatstekening
11. Zaagbrief PDF generator
12. UI download-knoppen in stap 4
13. Vier scenario-tests + build verificatie

### Stand van zaken Taak 9a (waar we nu staan)

Footer-tabel layout was **fundamenteel fout** in mijn sprint-document. Beschreef "5 zones links-naar-rechts" maar Vasto's echte footer is **grid van 2 rijen × 6 kolommen met merged cells**:

**Rij 1 (procesregistratie)** — 6 even-verdeelde kolommen:
- Zagen | Lijmen | Schuren | Sparen | Eindcontrole | Bloknr
- Klein header in cel-bovenkant, lege ruimte eronder voor paraaf

**Rij 2 (info-blok)** — 6 onevenverdeelde kolommen met merged cells:
- Kolom 1 (~22mm): materiaalcode vet "20DV40" + doorsneeprofiel eronder
- Kolom 2-3 samen (~56mm): "Glencoe Gepolijst" boven + GROOT "2600376 Week 14" onderaan
- Kolom 4 (~38mm): klant boven + eindklant onder (2 sub-rijen)
- Kolom 5 (~32mm): datum / Route: / Getekend: MB (3 sub-rijen)
- Kolom 6 (~32mm): leeg / Tek. Nr: X-Y / branding (3 sub-rijen)

Alle cellen hebben scheidingslijnen — grid duidelijk zichtbaar.

**Bron-foto Vasto pagina 1 footer**: `/tmp/vasto-footer.jpg` op huidige container (zal niet bestaan in nieuwe sessie — moet opnieuw rasterizen uit `Zaagtekeningen.pdf`).

**Volgende actie**: prompt sturen naar Claude Code om taak 9a te herzien volgens grid-layout. Mogelijk twee iteratie-rondes nodig.

## Werkpatroon: subagent-driven development

- Eén taak per keer
- Visuele check per visuele taak (PDF openen in viewer, JIJ kijkt — image-limit voorkomt dat Claude visueel mee kan)
- Akkoord per taak voor doorgaan
- Geen taken combineren zonder vooraankondiging
- Tests groen voor commit
- `git push` ELKE keer voor PR aanmaken

## Procesregels die we hebben geleerd

1. **Eerst `git push`, dan PR aanmaken** — sprint 3c incident waar 10 commits niet meekwamen in PR
2. **Pixels zijn essentieel** — Claude Code's tekst-rapportage is onbetrouwbaar ("Familie Bakker" hallucinatie, "scenario C lege staat" bleek scenario B-data)
3. **Eerlijk over wat we niet weten** — zoals Vasto's 1861-maat (gisten gaf bug, eerlijk noteren als bladstap-feature werkte beter)
4. **Visuele verificatie ALTIJD pixels** — niet tekstuele beschrijving
5. **Bij twijfel: vraag, niet aannemen** — Claude Code wel doen, sprint-document mocht niet alles dichttimmeren

## Designprincipes (door iteratie vastgelegd)

- **Datamodel = fysieke werkelijkheid**: mm-units, Y=0 onderaan groeit omhoog. Render flipt voor SVG/PDF. Eén flip-plek consistent.
- **Positie = MIDDEN** van sparing/boorgat, niet linksonder
- **Maat-referentie**: opgeslagen positie blijft absoluut vanaf linksonder
- **Bij delete referentie-item**: silent omrekenen naar absoluut, geen notificatie
- **Boorgat-labels op canvas**: altijd buiten blad met leader-lijntjes, één label per groep ("2× Ø35"), geen tekst op cirkels
- **Boorgat-labels in PDF**: Vasto-stijl "D35" (niet "Ø35"), groep "D7D70" samengevoegd
- **Waarschuwen, niet blokkeren**: vlakbouw composiet, DV+verstek conflict, randafstand <60mm — amber warnings, inmeter mag doorgaan
- **Canvas-kleuren**: rood=kookplaat, blauw=spoelbak, grijs=vrij, paars=boorgat, teal=geselecteerd-overlay, teal=verstek-driehoekjes
- **Title Case consistent** — render-laag past `titleCase()` toe ook op uppercase seed-data
- **Verstek twee niveaus**: zijde-niveau (verstek=true op Randafwerking) + relatie-niveau (VerstekRelatie tussen bladen). DV-codes + verstek = warning niet blokkerend

## Roadmap volgorde

1. ✅ Sprint 1-5 + 3c
2. ⏳ **Sprint 6 — PDF werkplaatstekening + zaagbrief** (NU, vastgelopen op taak 9a)
3. Sprint 7 — Klantbevestiging PDF
4. Sprint 8 — ERPNext mapping naar Quotation + file-upload via bridge
5. Sprint 9 — Offline-flow + concept-lijst pagina (loadConcept activeren) + auto-save
6. Sprint 10 — Foto/PDF-import (verschoven van 3c)
7. Sprint 11 — Bladstap/rabat-feature + Catalogus-PR naar Y-App repo
8. Sprint 12+ — Polish: hex-waarden voor 561 kleuren, multi-blad-canvas, catalogus-browser-pagina

## Open polish-items voor later

- BladKaart materiaal-labels soms UPPERCASE i.p.v. Title Case (inconsistent met SamenvattingPanel)
- Kraangat-positie in mini-canvas mogelijk Y-flip restant (lijkt onder ipv boven spoelbak)
- DV40 label in L-vorm-binnenhoek dichter bij blad dan andere labels
- Hex-waarden ontbreken voor 561 kleuren (kleurstalen wachten op data-verrijking)
- D35-label kan dicht bij sparing-bovenrand staan (label-zone-collision tussen boorgat-label en sparing-rand)
- "Bora C75" label mist productcategorie prefix ("Kookplaat vlakbouw C75")
- "VLAKBOUW" zou Title Case "Vlakbouw" moeten zijn
- Vlakbouw binnenste rechthoek scherpe hoeken (Vasto: radius 5mm)
- "Verstek (koppeling)" tabblad-naam mogelijk te lang voor segmented control op tablet
- L-vorm zijde-selectie gebruikt knoppen vs rechthoek klikbaar canvas — inconsistent

## Drie verkopers in seed (default Cees van Hoogdalem)

Cees van Hoogdalem, Rob Dijksman, Jack Keesmaat, Febe V.

## Brondocumenten ter referentie

- `/mnt/user-data/uploads/Zaagtekeningen.pdf` — Vasto werkplaatstekening order 2600376 (6 pagina's)
- `/mnt/user-data/uploads/Zaagbrief.pdf` — Vasto zaagbrief order 2600376 (3 pagina's)
- `/mnt/user-data/uploads/09-250226-_BAKKER_-_ALBLASSERDAM.xlsx` — Bron-data voor seed (11 materialen, 561 kleuren, 21 zichtzijden, 23 werkstukken, 7 boorgat-doelen)

## Volgende stap voor nieuwe sessie

1. Bevestig start met "we zijn bij sprint 6 taak 9a herziening — footer-grid"
2. Vraag om Vasto pagina 1 footer opnieuw te rasterizen indien nodig
3. Stuur de fix-prompt voor taak 9a naar Claude Code:

```
Taak 9a moet herzien. Mijn sprint-doc was fout op de footer-layout.

Vasto's footer is GEEN simpele 5-zone-rij. Het is een GRID:
- Rij 1 (procesregistratie): 6 even-verdeelde kolommen
  Zagen / Lijmen / Schuren / Sparen / Eindcontrole / Bloknr
- Rij 2 (info-blok): 6 ONeven kolommen met merged cells:
  - Kolom 1 (~22mm): materiaalcode (vet) + doorsneeprofiel
  - Kolom 2-3 samen (~56mm): "Kleur" boven + GROOT "Ordernr Week N" onderaan
  - Kolom 4 (~38mm): klant boven + eindklant onder (2 sub-rijen)
  - Kolom 5 (~32mm): datum / Route: / Getekend (3 sub-rijen)
  - Kolom 6 (~32mm): leeg / Tek. Nr X-Y / branding (3 sub-rijen)
- ALLE cellen hebben scheidingslijnen — grid duidelijk zichtbaar

Branding rechtsonder volgens afspraak:
- Regel 1 groot vet: "DE KEUKENBLADENFABRIEK"
- Regel 2 klein lichtgrijs: "Vasto Natuursteen"

Verhoudingen (referentie Vasto pagina 1):
- Totaal tabel-hoogte: ~90mm
- Rij 1 hoogte: ~25mm
- Rij 2 hoogte: ~25mm (3 sub-rijen á 8mm)
- Tabel-breedte: 180mm

Begin met grid lege cellen tekenen (scheidingslijnen), dan per cel
tekst plaatsen. Visueel side-by-side vergelijken met Vasto pagina 1.

Stop voor mijn akkoord vóór taak 9b (doorsneeprofiel toevoegen).
```

Maak de prompt indien nodig korter — boodschap is "grid met merged cells, niet kolom-rij".
