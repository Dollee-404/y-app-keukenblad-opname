# Roadmap — Keukenblad Opname extensie

Levend document. Update na elke sprint-merge.

## Project in één oogopslag

Y-App extensie voor De Keukenbladenfabriek (Vasto Natuursteen Steenhouwerij BV). Laat inmeters op locatie volledige opnames maken — klant + bladen + sparingen + boorgaten + materiaal + accessoires + verstek-relaties — en stuurt die door naar ERPNext als Quotation, plus genereert werkplaats-PDFs.

**Repo:** `Dollee-404/y-app-keukenblad-opname` op GitHub
**Live:** https://dollee-404.github.io/y-app-keukenblad-opname/
**Tech:** React 18 + Vite + TypeScript, sandboxed iframe in Y-App, postMessage-bridge
**Test-instance ERPNext:** drechtstedenbouw-erp.prilk.cloud
**Domeintaal:** Nederlands (Blad, Zichtzijde DV40/T1-EF/KF, Sparing, Verstek, Vlakbouw, Werkstuktype, Boorgat)

## Wat is af

| Sprint | Onderwerp | Status |
|---|---|---|
| 1 | Project-skelet + bridge + seed-data | ✅ |
| 2 | Step1 Klant — zoek + aanmaken via Customer/Address | ✅ |
| 3a | Step2 Tekening basis + drie-koloms layout | ✅ |
| 3b-1 | Sparingen op canvas + productcatalogus | ✅ |
| 3b-2 | Boorgaten + leader-lijnen + label-zones | ✅ |
| 3c | Verstek-relaties + helpers + multi-blad-view | ✅ |
| 4 | Step3 Specificaties — materiaal + randen + accessoires | ✅ |
| 5 | Step4 Overzicht + concept-opslag + globale waarschuwingen | ✅ |
| 6 | PDF werkplaatstekening + zaagbrief + UI download-knoppen | ✅ |
| 8 | ERPNext custom fields + Quotation-mapper + UI-knop | ✅ |
| 9 | ERPNext prijsstructuur — Items + Variants + Prices | ✅ |
| 10 | Mapper-upgrade naar specifieke item_codes + validatie | ✅ |

**Niet in deze tabel maar wel relevant:** sprint 7 (klantbevestiging-PDF) is uitgesteld, zie sectie hieronder.

## Wat volgt

### Sprint 11 — Offline-flow + concept-persistentie

Nu nog werkt de extensie alleen tijdens een open Y-App-sessie. State leeft in-memory; bij refresh of opnieuw openen is alles weg, inclusief `quotationName` waardoor je dubbele Quotations krijgt bij heropening.

Wat erin moet:
- localStorage concept-opslag voor lopende opnames
- Hervatten van laatste concept bij opstart
- Lijst van eerdere concepten + selecteren
- `quotationName` persistent zodat update-flow werkt over sessies
- Sync-queue voor opnames gemaakt zonder netwerk
- Detectie wanneer bridge faalt + visuele indicator

Bouwt op werk dat al staat — `saveConcept` werkt al lokaal sinds sprint 5, alleen niet hervat-bij-opstart.

### Sprint 12 — ERPNext als single source of truth (fase 2)

Eelke heeft de wens uitgesproken dat alle configuratie-data uiteindelijk uit ERPNext komt. Sprint 10 was fase 1 (item_codes-validatie). Sprint 12 is fase 2:

- Materiaal-soorten dropdown in Step3 uit ERPNext Item Group "Keukenblad" i.p.v. seed
- Kleur-dropdown uit Item Variants per materiaal
- Diktes uit beschikbare templates per materiaal
- Bij ontbrekende variant: duidelijke melding "deze kleur is nog niet geconfigureerd"

Vereist:
- Werkgesprek met De Keukenbladenfabriek over wie ERPNext gaat beheren
- Migratie van seed-data kleuren (561 stuks) naar ERPNext-variants — of bewust startklein blijven
- Backwards-compatibility met bestaande lokale opnames die naar oude kleur-namen verwijzen

### Sprint 13 — Productcatalogus uit ERPNext (fase 3)

Sparing-producten (kookplaten, spoelbakken, kranen, Quookers) komen nu uit hardcoded JSON in sprint 3b-1. Verplaatsen naar ERPNext Items in een eigen Item Group "Apparatuur" of vergelijkbaar.

- Bora C75, Pitt, AEG, Siemens, Atag kookplaat-modellen
- Caressi spoelbak-volledige-lijst
- Quooker / Grohe / Hansgrohe kraan-modellen
- Sparing-component in Step2 fetcht producten uit ERPNext

### Sprint 14 — Klantbevestiging via ERPNext Print Format

Was oorspronkelijk sprint 7 maar uitgesteld. Architectuur-keuze: niet zelf bouwen, ERPNext heeft hier een ingebouwd Print Format systeem voor.

Plan:
- ERPNext Print Format voor Quotation aanmaken (voorblad + specificatie-pagina + voorwaarden-footer)
- Quotation-template met logo + clausules + handtekening-velden
- Eventueel: server-side PDF-merge via custom Frappe-method om werkplaatstekening + zaagbrief in te voegen

Vereist:
- Huisstijl-assets (logo "DE KEUKEN/BLADEN/FABRIEK")
- Standaard clausule-set (de 19 clausules uit seed → ERPNext Terms and Conditions)
- Vasto-orderbevestiging als referentie (al beschikbaar)

### Sprint 15 — Tekening-PDF huisstijl-refactor

De huidige werkplaatstekening gebruikt oude Vasto-stijl footer (2×6 grid). De orderbevestiging-bron toont een nieuwe huisstijl met logo rechtsboven en 3×3 footer-grid. Voor consistentie met de klantbevestiging:

- Logo rechtsboven in plaats van header-tekst
- Footer 3×3 grid met materiaalcode-formaat `COM20WB` / `COM20RW`
- Doorsneeprofiel-icoon in eigen cel
- Materiaalcode-prefix-systeem (COM, DEK, KER, GRA, MAR, KWA, NAT)

Vereist input van opdrachtgever:
- Exacte doorsneeprofiel-anatomie (eerder 3 iteraties op vastgelopen, parkeerd)
- Materiaalcode-prioriteits-regel bij meerdere randafwerkingen op één blad

### Sprint 16 — Foto/PDF-import

Was oorspronkelijk sprint 3c maar uitgesteld. Achtergrond-foto importeren in Step2-canvas zodat de inmeter erover kan overtrekken.

- Drag-drop foto in canvas
- Calibratie: één bekende maat tekenen om schaal te bepalen
- Overtrekken in import-mode (zelfde tools als teken-mode)
- PDF-pagina rasterizen als achtergrond

### Sprint 17 — File-upload via bridge

Open vraag sinds sprint 1. Bridge ondersteunt `fetchPrivateFile` (download) maar niet `uploadFile` (upload). Nodig voor:
- Foto's van opname meesturen naar Quotation
- Gegenereerde PDFs als attachment opslaan op Quotation

Drie opties besproken in sprint 1:
- `callMethod` naar `frappe.client.attach_file` proberen zonder Y-App te wijzigen
- Y-App `ExtensionHost.tsx` uitbreiden met `uploadFile`-method
- Base64 in custom field (rommelig bij meerdere foto's)

Vereist beslissing van Y-App-team welke route gekozen wordt.

### Sprint 18 — Bladstap/rabat-feature

Fysieke stap in blad-onderzijde voor verstek-aansluiting (Vasto-conventie). Datamodel uitbreiden met `blad.stappen[]` + UI in Step2 + canvas/PDF rendering met arcering.

Voorbeeld uit Vasto order 2600376 pagina 1: "5" met schuine streep op rechterrand betekent 5mm stap.

### Sprint 19 — Catalogus-PR naar Y-App

Productie-ready maken voor de Y-App extensie-catalogus.

- Manifest/metadata voor Y-App extensie-catalogus
- PR naar Y-App repo met CatalogEntry
- Versie-tagging + changelog
- Productie-deploy via GitHub Pages
- Setup-documentatie voor nieuwe ERPNext-instances (verwijzen naar `docs/erpnext-setup.md` + `docs/erpnext-prijsstructuur.md`)

### Sprint 20 — Polish-sprint

Verzamelpot voor losse polish-items die door eerdere sprints zijn verschoven:

- Hex-waarden voor de 561 materiaalkleuren (voor kleurstalen-preview in UI)
- BladKaart materiaal-labels Title Case consistent
- L-vorm zijde-selectie consistent met rechthoek (klikbaar canvas i.p.v. knoppen)
- Verstek-koppeling tabblad-naam korter voor tablet
- Vlakbouw binnenste rechthoek met radius 5mm (Vasto-conventie)
- "Bora C75" → "Kookplaat vlakbouw C75" met productcategorie-prefix
- Catalogus-browser als aparte pagina (stand-alone bruikbaar tijdens klantadvies)
- m²-weergave op Step4 consistent met facturering (volle plaat-oppervlakte voor L-vormen)

## Open vragen, lopend

| Vraag | Status | Sprint |
|---|---|---|
| File upload via bridge — uitbreiding nodig | Open, drie opties besproken | 17 |
| Doorsneeprofiel-icoon — exacte Vasto-anatomie | Parkeerd na 3 iteraties, wacht op opdrachtgever-specs | 15 |
| Materiaalcode-prioriteits-regel (DV > KF > T?) | Wacht op opdrachtgever | 15 |
| m²-formule voor randafwerking in zaagbrief | Wacht op opdrachtgever — placeholder 0,00 | bij eerstvolgende offerte-iteratie |
| Wie beheert ERPNext bij De Keukenbladenfabriek? | Wacht op kantoor-gesprek | 12 |
| Hoe gaan 561 kleuren in ERPNext? | Wacht op kantoor-gesprek | 12 |
| Huisstijl-assets — logo SVG/PNG beschikbaar? | Wacht op opdrachtgever | 14, 15 |
| Algemene voorwaarden tekst | Wacht op opdrachtgever | 14 |
| Verkoper-koppeling met ingelogde user e-mail | Open | 11 of 12 |
| ERPNext brand-prefixen voor andere materialen | Open (alleen Composiet bevestigd) | nieuwe variants |

## Niet in scope (bewust)

- 3D-visualisatie van keuken
- Materiaalkosten / prijscalculatie in de extensie zelf (gaat via ERPNext Items + Prices, niet in JS)
- Klantcommunicatie (e-mail/SMS verzending) — Y-App heeft eigen tools
- Multi-language (alleen NL)
- Niet-haakse blad-vormen anders dan rechthoek + L-vorm + uithap
- Schuine sparing-randen

## Architectuur-evolutie

De koers verschuift van **"seed-data als bron, ERPNext als bestemming"** naar **"ERPNext als single source of truth, extensie als interface"**. Vijf fasen:

1. **Fase 1 (sprint 10 — ✅ klaar)** — Item-codes uit ERPNext gevalideerd bij verzending. Mapper kiest specifieke variants. Seed-data blijft voor dropdowns.
2. **Fase 2 (sprint 12)** — Materiaal + kleur dropdowns in Step3 uit ERPNext. Geen kleur-mismatch meer mogelijk.
3. **Fase 3 (sprint 13)** — Productcatalogus (kookplaten, spoelbakken, kranen) uit ERPNext.
4. **Fase 4 (verspreid over latere sprints)** — Clausules, verkopers, montagepartners, etages uit ERPNext.
5. **Fase 5 (eindstaat)** — Seed-data definitief verwijderd uit codebase. ERPNext is de enige bron voor configuratie-data.

Tussenstaat tijdens fasen 2-4: hybride — sommige data uit ERPNext, sommige nog uit seed. Dat is acceptabel zolang we per fase een werkende oplevering hebben.

## Designprincipes (uit iteratie vastgelegd)

- **Datamodel = fysieke werkelijkheid**: mm-units, Y=0 onderaan groeit omhoog. Render flipt voor SVG/PDF. Eén flip-plek consistent.
- **Positie = MIDDEN** van sparing/boorgat, niet linksonder
- **Maat-referentie**: opgeslagen positie blijft absoluut vanaf linksonder
- **Bij delete referentie-item**: silent omrekenen naar absoluut, geen notificatie
- **Boorgat-labels op canvas**: altijd buiten blad met leader-lijntjes, één label per groep ("2× Ø35"), geen tekst op cirkels
- **Boorgat-labels in PDF**: Vasto-stijl "D35", groep "D7D70" samengevoegd
- **Waarschuwen, niet blokkeren**: vlakbouw composiet, DV+verstek conflict, randafstand <60mm — amber warnings, inmeter mag doorgaan
- **Canvas-kleuren**: rood=kookplaat, blauw=spoelbak, grijs=vrij, paars=boorgat, teal=geselecteerd-overlay, teal=verstek-driehoekjes
- **Title Case consistent** — render-laag past `titleCase()` toe ook op uppercase seed-data
- **Verstek twee niveaus**: zijde-niveau (verstek=true op Randafwerking) + relatie-niveau (VerstekRelatie tussen bladen). DV-codes + verstek = warning niet blokkerend
- **L-vorm maatvoering**: deelmaten boven, totaalmaat onder, uithap-maten buiten de bladcontour (eigen project-conventie, wijkt af van Vasto-standaard)
- **m²-berekening**: altijd `lengte × breedte` (volle plaat). Uithap-aftrek niet toegepast omdat het zaag-afval is dat de klant betaalt.

## Procesregels (geleerd door incidenten)

1. **Eerst `git push`, dan PR aanmaken** — sprint 3c incident waar 10 commits niet meekwamen
2. **Pixels zijn essentieel voor verificatie** — Claude Code's tekst-rapportage is onbetrouwbaar bij visuele wijzigingen
3. **Visuele check vereist screenshot** — niet tekstuele beschrijving
4. **Eerlijk over wat we niet weten** — verzinnen levert bugs of valse aannames op (bv. Vasto's "1861-maat" bleek een bladstap-feature, niet een normale maat)
5. **Bij twijfel: vraag, niet aannemen** — vooral bij vakvraagstukken (welke maat-conventie, welk kleur-systeem, etc.)
6. **Eén-taak-per-keer per Claude Code iteratie** — meer dan dat geeft "voor 80% goed" oplevering waar je niet kunt aanwijzen wat fout is
7. **Akkoord per sub-stap** — vooral bij sprint-prompts met meerdere stappen, eerste stap pas akkoorderen vóór door

## Brondocumenten in repo

- `docs/erpnext-setup.md` — Custom fields setup voor nieuwe ERPNext-instances
- `docs/erpnext-prijsstructuur.md` — Item Groups, Items, Item Prices voor nieuwe instances
- `handover-keukenblad-opname.md` — Project-context voor nieuwe sessies (mogelijk verouderd na deze roadmap-update)

## Referentie-PDFs (extern beschikbaar)

- Vasto-werkplaatstekening order 2600376 — oude huisstijl footer
- Vasto-zaagbrief order 2600376 — tekstuele specificatie-lijst
- Vasto-orderbevestiging order 2600376 — nieuwe huisstijl met logo + 3×3 footer + tekening-pagina's dit moet hem worden
