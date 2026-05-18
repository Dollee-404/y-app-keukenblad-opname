# Sprint 6 taak 11 — Zaagbrief PDF-generator

## Doel

Tweede PDF-output naast de werkplaatstekening: een **lijst-georiënteerde
zaagbrief** met materialen + afmetingen + afwerkingen + uitsparingen per
blad. Geen tekening, geen geometrie. Voor kantoor en zager als
referentielijst bij materiaal-bestelling en afhandeling.

Referentie: `Zaagbrief.pdf` (3 pagina's, Vasto order 2600376).

## Vasto-anatomie

Bekijk `Zaagbrief.pdf` pagina 1 voor exact voorbeeld. Drie zones
verticaal:

### Zone 1 — Titel
- Groot "**ZAAGBRIEF**" centraal bovenaan, ~24pt bold
- Horizontale lijn 0.5mm onder de titel, doorlopend over pagina-breedte

### Zone 2 — Order-header (orderblok)
Twee kolommen, labels vet, waardes regular:

**Linkerkolom (~30% breedte, label bold):**
- `Ordernr` — `2600376`
- `Datum` — `30-03-2026`
- `Uw referentie` — `ZIJLMANS - VAN VLIMMEREN`
- (lege regel)
- `Leverweek` — `14  Vrijdag`

**Rechterkolom (~70% breedte, regular tekst):**
- `Zijlmans Interieur op maat B.V.`
- `Van Vlimmeren`
- `Zonnebloemlaan 10 Hoeven`
- `Ondehoudsset: Nee`
- `Verpakken: Nee`

Onder dit blok een horizontale lijn 0.5mm, weer doorlopend.

### Zone 3 — Bladen-lijst
Per blad een blokje met dezelfde structuur:

```
Materiaal:    Glencoe Gepolijst Groep 0 Composiet t/m 49mm
              Lengte: 1958 Breedte: 1001
Afwerking:    Randafwerking verstek 40mm hoog    1,86
Afwerking:    Randafwerking verstek 40mm hoog    1,00
Afwerking:    Randafwerking verstek 40mm hoog    1,96
Uitsparing:   Uitsparing vlakinbouw kookplaat

              [witregel]
```

Patroon:
- `Materiaal:` label links (bold, ~80pt vanaf links), waarde rechts
  (bold)
- Onder materiaal-waarde: `Lengte: X Breedte: Y` (bold)
- Per afwerking-rij: `Afwerking:` label + omschrijving + m² getal
- Per uitsparing-rij: `Uitsparing:` label + omschrijving (geen m²)

## Datastructuur — wat komt waarvandaan

Voor elk blad uit `opname.bladen` genereer je een blok. Per blad:

```ts
{
  materiaal: `${blad.materiaal.kleur} ${blad.materiaal.afwerking} Groep 0 ${blad.materiaal.soort} t/m 49mm`,
  // bv. "Glencoe Gepolijst Groep 0 Composiet t/m 49mm"
  // Let op: "Groep 0" en "t/m 49mm" zijn Vasto-conventies voor
  // materiaal-categorisatie. Voor nu hardcoded — opdrachtgever
  // levert later regels voor groep/dikte-categorie.

  lengte: blad.breedte,    // Vasto noemt het Lengte
  breedte: blad.hoogte,    // Vasto noemt het Breedte
  // NB: terminologie-mismatch! Vasto's "lengte" = onze blad-breedte
  // omdat een blad horizontaal ligt. Onze X-as = Vasto's lengte.

  afwerkingen: blad.randafwerking
    .filter(r => r.code !== 'KF' || r.verstek)  // alleen "betalende" randen
    .map(r => ({
      omschrijving: omschrijvingVoorCode(r.code),  // "Randafwerking verstek 40mm hoog"
      m2: berekenM2VoorRand(blad, r)
    })),

  uitsparingen: blad.sparingen.map(s => ({
    omschrijving: omschrijvingVoorSparing(s)  // "Uitsparing vlakinbouw kookplaat"
  }))
}
```

## Helpers nodig

```ts
// In src/pdf/zaagbrief-helpers.ts
function omschrijvingVoorCode(code: string): string {
  // DV40 → "Randafwerking verstek 40mm hoog"
  // DV30 → "Randafwerking verstek 30mm hoog"
  // T1   → "Randafwerking enkel facet"
  // T1-EF → "Randafwerking enkel facet"
  // KF   → "Randafwerking kanten-facet"
  // ...
}

function omschrijvingVoorSparing(sparing: Sparing): string {
  // BOORGAT → null (boorgaten verschijnen NIET in zaagbrief — niet
  //                 materieel relevant)
  // SPOELBAK + onderbouw → "Uitsparing onderbouw spoelbak"
  // SPOELBAK + vlakbouw → "Uitsparing vlakinbouw vierkante spoelbak"
  // KOOKPLAAT + vlakbouw → "Uitsparing vlakinbouw kookplaat"
  // KOOKPLAAT + opbouw → "Uitsparing opbouw kookplaat"
  // ...
}

function berekenM2VoorRand(blad: Blad, rand: Randafwerking): number {
  // Lengte van de zijde in mm × 1m hoogte = m² gerond op 2 decimalen
  // Vasto laat zien: 1958mm rand × ... = 1,96 m²
  // Eigenlijk gewoon lengte_mm / 1000, want hoogte is constant 1m
  // voor randberekening (Vasto-conventie?)
  // Bevestigen met Eelke: wat is de m²-formule voor randen exact?
}
```

## Open vragen — eerst beantwoorden vóór implementatie

### Vraag 1 — m²-formule voor randafwerking

Bekijk Vasto:
- Blad 1958×1001, drie verstek-randen: 1,86 + 1,00 + 1,96 m²
- Som zou ~4,82 zijn. Lengtes optellen: 1958+1001+1958 = 4917mm = 4,92m
- Maar getoonde m² = 4,82. Niet helemaal lengte/1000.

Mogelijk: lengte × dikte. Bij 40mm dikte: 1958 × 40 = 78320 mm² =
0,078 m². Klopt ook niet.

Wat is de formule? **Vraag aan Eelke / opdrachtgever.** Voor nu kan
het als TODO/placeholder gerenderd worden.

### Vraag 2 — "Groep 0" en "t/m 49mm" hardcoded?

Vasto toont "Groep 0 Composiet t/m 49mm". Wat is Groep 0? Een
prijscategorie? Een dikte-bucket? Dit zit niet in onze seed-data.

**Vraag aan opdrachtgever.** Voor nu: hardcoded `Groep 0` en
`t/m 49mm` met TODO.

### Vraag 3 — Rugwand vs blad-categorisatie

Vasto toont sommige bladen als "20mm Composiet rugwand" i.p.v. "Composiet
t/m 49mm". Dit is de werkstuk-categorie uit seed (`WB/RW/VB/PL/ST/OV`).

Mapping nodig:
- WB (blad) → "Composiet t/m 49mm" (Vasto)
- RW (rugwand) → "20mm Composiet rugwand"
- VB (vouwblad?) → ?
- PL → ?
- ST → ?
- OV → ?

**Voor nu:** alle bladen renderen als blad-categorie. Rugwanden
worden in latere sprint correct gemapped.

## Implementatie-stappen

### Stap 11a — Skelet
- `src/pdf/zaagbrief.ts` aanmaken met functie
  `genereerZaagbrief(opname): Promise<Blob>`
- jsPDF instantiëren met portrait A4
- Titel "ZAAGBRIEF" centraal bovenaan + horizontale lijn
- Returns `pdf.output('blob')`

Visueel verifiëren: lege PDF met alleen titel.

### Stap 11b — Order-header
- Twee-koloms blok onder titel
- Labels bold, waardes regular
- Horizontale lijn onder het blok

Visueel verifiëren met Vasto pagina 1.

### Stap 11c — Eén blad-blokje
- Eén Materiaal/Lengte-Breedte/Afwerking/Uitsparing-blok
- Test met Vasto-test-blad (1958×1001, 3× DV40, 1 kookplaat-sparing)
- m²-getallen voorlopig als placeholder of 0,00

### Stap 11d — Multi-blad + paginering
- Loop over `opname.bladen`
- Detecteer wanneer een blad-blok niet meer past op huidige pagina →
  `pdf.addPage()`
- Header (titel + orderblok) **alleen op pagina 1**
- Vasto-pagina 2/3 hebben hetzelfde orderblok herhaald — bevestigen of
  dit nodig is, voor nu eerst zonder

Visueel verifiëren met multi-blad test-opname.

## Concreet voor test-opname

Verwacht eindresultaat met test-opname (3 bladen + 1 rugwand + 2
zijwanden + 2 tegellijsten zoals Vasto):
- 3 pagina's (zoals Vasto)
- Pagina 1: titel, orderblok, ~5 blad-blokjes
- Pagina 2: orderblok herhaald, ~5 blad-blokjes
- Pagina 3: orderblok herhaald, ~3 blad-blokjes

## Niet aanraken

- Werkplaatstekening-generator (`genereerWerkplaatstekening`) — apart
- Datamodel (`Opname`, `Blad`, `Sparing`, etc.) — alleen lezen
- Footer / header van werkplaatstekening — niet hergebruiken, zaagbrief
  heeft eigen lay-out

## Bestandstructuur

```
src/pdf/
  ...bestaande files...
  zaagbrief.ts              ← nieuw: genereerZaagbrief()
  zaagbrief-helpers.ts      ← nieuw: omschrijvingVoorCode, etc.
```

## Verificatie

1. Single-blad test: kleine opname (1 blad) → 1 pagina met titel +
   orderblok + 1 blad-blokje
2. Multi-blad test: Vasto-test-opname (8+ bladen) → 2-3 pagina's
3. Tekst-vergelijking met Vasto pagina 1 — terminologie moet matchen
   (Lengte/Breedte/Afwerking/Uitsparing labels, fontgroottes ruwweg
   gelijk)

Screenshot naar Eelke voor akkoord per stap.

## Workflow-suggestie

Net als bij taak 10: stap 11a (skelet) eerst opleveren en visueel
verifiëren vóór content erbij komt. Open vragen 1-3 mogen parallel
beantwoord worden door Eelke terwijl skelet wordt gebouwd.
