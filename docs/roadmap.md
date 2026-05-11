# Roadmap — Keukenblad Opname extensie

Levend document. Update na elke sprint-merge.

## Overzicht

| Sprint | Onderwerp | Status |
|---|---|---|
| 1 | Project-skelet + bridge + seed-data | ✅ Klaar |
| 2 | Step1 Klant — zoek + aanmaken | ✅ Klaar |
| 3a | Step2 Tekening basis + UX-redesign | 🔄 In uitvoering |
| 3b deel 1 | Sparingen + productcatalogus | ⏳ Volgend |
| 3b deel 2 | Boorgaten + validatie + notities | ⏳ Daarna |
| 3c | Verstek-relaties + foto/PDF import | ⏳ Daarna |
| 4 | Step3 Specificaties (materiaal + randen) | ⏳ |
| 5 | Step4 Overzicht + wizard-navigatie | ⏳ |
| 6 | PDF werkplaatstekening | ⏳ |
| 7 | PDF klantbevestiging | ⏳ |
| 8 | ERPNext mapping + Quotation aanmaken | ⏳ |
| 9 | Offline-flow + sync + concept-opslag | ⏳ |
| 10 | Catalogus-PR naar Y-App | ⏳ |

## Inzichten uit het keukenbladenexpert-perspectief

Tijdens sprint 3a kwamen we tot het besef dat sparingen geen "specificaties"
zijn maar **integraal onderdeel van de tekening**. Een ervaren inmeter
plaatst de kookplaat op de tekening op basis van wat de klant aanwijst —
niet later, in een apart formulier.

Dat heeft drie consequenties:

1. **Sparingen verhuizen van stap 3 naar stap 2** (gedaan in sprint 3b)
2. **Productcatalogus is kritiek** — vrije tekst betekent productiefouten
3. **Stap 3 wordt veel kleiner** — alleen randafwerking, materiaal,
   accessoires die geen sparing zijn

## Stap-indeling herzien

| Stap | Wat | Sprint |
|---|---|---|
| 1 Klant | Opdrachtgever + afleveradres + verkoper | 2 |
| 2 Tekening | Bladen + sparingen + boorgaten + verstek + foto-import | 3a/b/c |
| 3 Specificaties | Materiaal + randen + losse accessoires + clausules | 4 |
| 4 Overzicht | PDF preview + opslaan + ERPNext-koppeling | 5/6/7/8 |

## Wat in welke sprint

### Sprint 3b deel 1 — Sparingen op canvas

- Productcatalogus (5+ kookplaten, 5+ spoelbakken)
- Rechthoekige sparingen plaatsen (kookplaat, spoelbak, vrije rechthoek)
- Vlakbouw rendering (dubbele lijn, boven/onder maten, trede, radius)
- Productkeuze auto-fult maten
- Position + afmetingen aanpasbaar via panel
- Vlakbouw composiet veiligheidswarning
- BladInfoPanel toont sparingen-lijst per blad

→ `docs/sprint-3b-1-sparingen.md`

### Sprint 3b deel 2 — Boorgaten + validatie

- Boorgaten (cirkel-sparingen): kraan, Quooker, elektra, dubbele WCD,
  zeeppomp
- Boorgat-groepen met hartafstand (zoals D7 D70 op Vasto-tekening)
- Doorboring of blindgat per boorgat
- Maat-referentie-selector: "Gemeten vanaf [linkerrand / vorige sparing /
  wand-zijde]"
- Rand-afstand validatie: warning bij <60mm tot blad-rand
- Notitie-veld per sparing
- Foto-upload per sparing (placeholder tot bridge upload werkt)
- Hoekradius input op vrije rechthoek-sparingen

→ `docs/sprint-3b-2-boorgaten.md` (nog te schrijven)

### Sprint 3c — Verstek + import

- Verstek-relatie toevoegen: kies blad A → rand → blad B → rand
- Multi-blad-view in canvas (gerelateerde bladen samen tonen)
- Foto/PDF achtergrond importeren (drag-drop)
- Calibratie: teken één bekende maat → schaal bepalen
- Overtrekken in import-mode (zelfde tools als teken-mode)

→ `docs/sprint-3c-verstek-import.md` (nog te schrijven)

### Sprint 4 — Specificaties

- Project-materiaal (soort + producent + afwerking + kleur via cascade)
- Randafwerking per zijde per blad (DV40, T1, KF, ...)
- Visuele preview van randtype als doorsnede-icoon
- Accessoires zonder sparing (losse kraan-bestelling, Quooker, downdraft)
- Etage + lift-info (verhuizen vanuit stap 1 naar hier? nog te bepalen)
- Selectie van standaardclausules (uit seed.clausules)

→ `docs/sprint-4-specificaties.md` (nog te schrijven)

### Sprint 5 — Overzicht + navigatie

- Wizard-navigatie: Volgende/Vorige knoppen werkend
- Validatie per stap: rode rand op step-pill als incomplete
- Step4 Overzicht-pagina: alle data samengevat
- "Verzenden naar ERPNext" knop (werking in sprint 8)
- "PDF voorbeeld bekijken" knop (werking in sprint 6/7)

→ `docs/sprint-5-overzicht.md`

### Sprint 6 — PDF werkplaatstekening

- jsPDF + svg2pdf integratie
- Layout volgens Vasto-stijl:
  - Boven: blad-info (afmetingen, materiaal, kleur)
  - Midden: technische tekening met maatvoering
  - Onder: titelblok (klant, datum, week, productcode, route-balk)
- Eén pagina per blad (zoals Vasto)
- Detail-tekening van randafwerking + radius indien aanwezig
- Sparing-data inclusief productcode

→ `docs/sprint-6-pdf-werkplaats.md`

### Sprint 7 — PDF klantbevestiging

- Vereenvoudigde versie van de PDF
- Geen technische maatvoering, wel m² + materiaal
- Foto's van opname meegestuurd
- Handtekening-veld onderaan
- Footer met bedrijfsgegevens + algemene voorwaarden

→ `docs/sprint-7-pdf-klant.md`

### Sprint 8 — ERPNext

- Custom fields op Quotation aanmaken (migration JSON)
- Opname → Quotation mapping
- Items per blad/sparing/randafwerking met rate=0
- File-upload van PDF + foto's (vereist bridge-uitbreiding —
  open vraag uit sprint 1)
- Opslaan-knop in Step4

→ `docs/sprint-8-erpnext.md`

### Sprint 9 — Offline + sync

- localStorage concept-opslag
- "Bewaard" indicator dynamisch maken
- Concept hervatten bij opstart
- Sync-queue voor wanneer offline gemaakte opname later wordt verzonden
- Conflict-detectie als bridge faalt

→ `docs/sprint-9-offline.md`

### Sprint 10 — Catalogus

- Manifest/metadata voor Y-App extensie-catalogus
- PR naar Y-App repo met CatalogEntry
- Versie-tagging + changelog
- Productie-deploy via GitHub Pages

→ `docs/sprint-10-catalogus.md`

## Open vragen, lopend

| Vraag | Status | Sprint |
|---|---|---|
| File upload via bridge — uitbreiding nodig | Open | 8 |
| ERPNext custom fields voor `kbf_*` — bestaan ze al? | Open | 8 |
| Catalogus-PR voorwaarden | Open | 10 |
| Verkoper auto-match op ingelogde user e-mail | Open | 5 |

## Niet-in-scope (out of scope, voor nu)

- 3D-visualisatie van keuken
- Materiaalkosten / prijscalculatie (komt uit kantoor)
- Klantcommunicatie (e-mail/SMS verzending) — Y-App heeft eigen tools
- Beheer van productcatalogus in de UI (alleen JSON-bewerking)
- Multi-language (alleen NL)
- Niet-haakse blad-vormen (alleen rechthoeken + L-vorm + uithap)
- Schuine sparing-randen
