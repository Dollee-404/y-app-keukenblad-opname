# Sprint 6 taak 11 — Zaagbrief PDF-generator (versie 2)

## Belangrijke context-wijzigingen vóór implementatie

Drie beslissingen vooraf:

### 1. Terminologie-aanpassing (codebase-wijd)

`Blad.breedte` → `Blad.lengte`, `Blad.hoogte` → `Blad.breedte`. Vasto en
werkplaats noemen de horizontale dimensie "lengte" en de verticale
"breedte". Onze huidige naamgeving (X=breedte, Y=hoogte) is grafisch
correct maar werkplaats-onvriendelijk.

**Reikwijdte:** dit is een rename die door de hele codebase moet
worden uitgevoerd:
- Type-definities in `seed-types.ts`
- Alle `.tsx` / `.ts` files die `blad.breedte` of `blad.hoogte`
  gebruiken
- UI-labels in step2/step3/step4 panels
- PDF-rendering code (renderHeader, renderTekening, etc.)
- Test-files
- Documentatie

**Aanpak:**
- Gebruik IDE rename-refactor (geen find-replace — anders raak je
  ook CSS-property `height` of HTML-attribuut `width`)
- Eén commit voor de rename, los van de zaagbrief-implementatie
- Verifieer met `npm run build` + `npm test` dat alles nog werkt
- Visueel checken dat tekening-render nog steeds klopt (X-as = lengte,
  Y-as = breedte)

**Coordinate-conventie behouden:** lengte = X-as, breedte = Y-as.
Datamodel-Y=0 onderaan blijft staan zoals nu.

Doe deze rename **vóór** de zaagbrief-implementatie begint, zodat
nieuwe code direct in de juiste terminologie geschreven wordt.

### 2. m²-formule — placeholder voor nu

Vasto-formule onbekend (kan niet uit één voorbeeld afgeleid worden).
Implementatie:

```ts
function berekenM2VoorRand(blad: Blad, rand: Randafwerking): number {
  // TODO: opdrachtgever levert formule
  // Vasto toont 1,86 / 1,00 / 1,96 m² voor randen 1958/1001/1958mm op
  // 1958×1001×20mm blad — formule niet te reverse-engineeren uit één
  // voorbeeld. Placeholder retourneert 0,00.
  return 0
}
```

In PDF-output verschijnt `0,00` op alle afwerking-rijen tot formule
beschikbaar is.

### 3. "Groep 0" en categorisaties — weglaten

Niet hardcoden. Vasto-materiaal-string wordt vereenvoudigd:

```
Vasto: "Glencoe Gepolijst Groep 0 Composiet t/m 49mm"
Onze:  "Glencoe Gepolijst Composiet"
```

Format-string:
```ts
const materiaalRegel = `${blad.materiaal.kleur} ${blad.materiaal.afwerking} ${blad.materiaal.soort}`
```

Geen "Groep 0", geen "t/m 49mm", geen "rugwand"-suffix. Pure
weergave van wat in seed-data staat. Opdrachtgever bepaalt later
welke extra categorisering nodig is.

## Doel

Lijst-georiënteerde zaagbrief naast de werkplaatstekening. Geen
tekening, geen geometrie. Voor kantoor en zager als referentielijst.
Referentie: `Zaagbrief.pdf` (Vasto order 2600376, 3 pagina's).

## Anatomie

### Zone 1 — Titel
- "**ZAAGBRIEF**" centraal bovenaan, ~24pt bold
- Horizontale lijn 0.5mm onder de titel, doorlopend

### Zone 2 — Order-header
Twee kolommen, labels bold, waardes regular:

**Linkerkolom (~30% breedte):**
- `Ordernr` → `2600376`
- `Datum` → `30-03-2026`
- `Uw referentie` → `ZIJLMANS - VAN VLIMMEREN`
- (lege regel)
- `Leverweek` → `14  Vrijdag`

**Rechterkolom (~70% breedte):**
- `Zijlmans Interieur op maat B.V.`
- `Van Vlimmeren`
- `Zonnebloemlaan 10 Hoeven`
- `Ondehoudsset: Nee`
- `Verpakken: Nee`

Onder dit blok een horizontale lijn 0.5mm.

### Zone 3 — Bladen-lijst
Per blad:

```
Materiaal:    Glencoe Gepolijst Composiet
              Lengte: 1958 Breedte: 1001
Afwerking:    Randafwerking verstek 40mm hoog    0,00
Afwerking:    Randafwerking verstek 40mm hoog    0,00
Afwerking:    Randafwerking verstek 40mm hoog    0,00
Uitsparing:   Uitsparing vlakinbouw kookplaat

              [witregel]
```

Patroon:
- `Materiaal:` label bold ~80mm vanaf links, waarde bold rechts
- `Lengte: X Breedte: Y` (bold) onder materiaal
- `Afwerking:` per rand-rij + omschrijving + m² getal
- `Uitsparing:` per sparing-rij + omschrijving (geen m²)

## Helpers

```ts
// src/pdf/zaagbrief-helpers.ts

function omschrijvingVoorCode(code: string): string {
  // DV20 → "Randafwerking verstek 20mm hoog"
  // DV30 → "Randafwerking verstek 30mm hoog"
  // DV40 → "Randafwerking verstek 40mm hoog"
  // T1   → "Randafwerking enkel facet"
  // T1-EF → "Randafwerking enkel facet"
  // KF   → "Randafwerking kanten-facet"
  // overige: fallback naar code zelf
}

function omschrijvingVoorSparing(sparing: Sparing): string | null {
  // BOORGAT → null (NIET in zaagbrief — niet materieel relevant)
  // SPOELBAK + onderbouw → "Uitsparing onderbouw spoelbak"
  // SPOELBAK + vlakbouw → "Uitsparing vlakinbouw vierkante spoelbak"
  // KOOKPLAAT + vlakbouw → "Uitsparing vlakinbouw kookplaat"
  // KOOKPLAAT + opbouw → "Uitsparing opbouw kookplaat"
  // KOOF / KOLOM / HOEK → "Uitsparing {sparing.naam.toLowerCase()}"
}

function berekenM2VoorRand(blad: Blad, rand: Randafwerking): number {
  // TODO formule opdrachtgever — placeholder 0
  return 0
}
```

## Implementatie-stappen

### Stap 11a — Skelet
- `src/pdf/zaagbrief.ts` met `genereerZaagbrief(opname): Promise<Blob>`
- jsPDF portrait A4
- Titel "ZAAGBRIEF" + horizontale lijn
- Returns blob

Visueel verifiëren.

### Stap 11b — Order-header
- Twee-koloms blok onder titel
- Labels bold, waardes regular
- Horizontale lijn onder

Visueel vergelijken met Vasto pagina 1.

### Stap 11c — Eén blad-blokje
- Materiaal-regel + Lengte/Breedte-regel + afwerking-rijen + uitsparing-rijen
- Test met Vasto-test-blad
- m² altijd 0,00 voor nu

### Stap 11d — Multi-blad + paginering
- Loop over `opname.bladen`
- Auto-page-break als blok niet meer past
- Titel + orderblok alleen pagina 1 (voor nu)

Visueel verifiëren met multi-blad opname.

## Bestandstructuur

```
src/pdf/
  ...bestaande files...
  zaagbrief.ts              ← nieuw
  zaagbrief-helpers.ts      ← nieuw
```

## Niet aanraken

- Werkplaatstekening-generator — apart
- Datamodel structuur (alleen rename in eerste commit)
- Footer/header van werkplaatstekening — zaagbrief heeft eigen lay-out
- `doorsneeprofiel.ts` skelet — blijft uncalled

## Verificatie

1. Single-blad opname → 1 pagina met titel + orderblok + 1 blad-blokje
2. Multi-blad Vasto-test-opname → 2-3 pagina's
3. Tekst-vergelijking met Vasto pagina 1: terminologie, fontgroottes,
   layout

Screenshot per stap naar Eelke voor akkoord.

## Workflow-volgorde

**Volgorde belangrijk:**
1. Eerst **rename-commit** (breedte→lengte, hoogte→breedte) over hele
   codebase. Pushen, akkoord vragen aan Eelke vóór doorgaan.
2. Pas daarna stap 11a t/m 11d.

Zo blijft elke commit overzichtelijk en is een eventuele rollback
schoon.
