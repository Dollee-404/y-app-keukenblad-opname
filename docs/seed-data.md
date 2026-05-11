# Seed-data — Keukenblad Opname extensie

Twee bestanden:

- **`seed-data.json`** (28 KB) — alle vaste lijsten, productcatalogus en clausules
- **`seed-types.ts`** — TypeScript types + helpers, importeer direct in je Vite/React app

## Bronnen

Geëxtraheerd uit:

1. `09-250226-BAKKER-ALBLASSERDAM.xlsx` — Excel-template van De Keukenbladenfabriek met validatielijsten
2. `Voorbeeld_orderbevestiging.pdf` (order 2600376) — productcodes COM20WB / COM20RW
3. `Voorbeeld_vrachtbrief.pdf` — artikel-categorieën Vasto
4. `Zaagbrief.pdf` + `Zaagtekeningen.pdf` — randafwerkingscodes (T1, KF, DV40, verstek)
5. `voorbeeld_factuur.pdf` — bedrijfsgegevens, BTW, IBAN, KvK

## Wat zit erin

| Categorie | Aantal | Voorbeeld |
|---|---:|---|
| Materialen | 11 | COMPOSIET, DEKTON, NATUURSTEEN, ... |
| Kleuren (totaal) | 561 | TAJ MAHAL, GLENCOE, AERIS, ... |
| Producenten | 9 | VASTO, COSENTINO, CAESARSTONE, ... |
| Afwerkingen | 20 | GEPOLIJST, LEATHER, RIVERWASHED, ... |
| Diktes (mm) | 6 | 6, 8, 12, 13, 20, 30 |
| Zichtzijden | 21 | A1-12, T1-EF, DV40, KF, VERSTEK |
| Werkstukken | 23 | Bladdeel A–H, Achterwand, Eiland, ... |
| Werkstuk-categorieën | 6 | WB, RW, VB, PL, ST, OV |
| Sparing-typen | 6 | BOORGAT, SPOELBAK, KOOKPLAAT, KOOF, KOLOM, HOEK |
| Boorgat-doelen | 7 | KRAAN, QUOOKER, ELEKTRA, DUBBELE_WCD, ZEEPPOMP, DOWNDRAFT, OVERIG |
| Inbouwwijzen | 5 | VLAKBOUW, ONDERBOUW, OPBOUW, NIS, VERSTEK |
| Accessoires | 7 | Spoelbak, Kraan, Quooker, ... |
| Etages | 23 | Begane grond t/m 22e etage |
| Verkopers | 4 | Rob, Cees, Jack, Febe |
| Montagepartners | 2 | Berg en Smidt, LEV Interieurbouw |
| Clausules | 19 | Vlakbouw-waarschuwing, productietekening-clausule, ... |
| Betalingsregelingen | 5 | Vooraf per bank, PIN bij levering, ... |
| Productie-routes | 6 | Zagen, Lijmen, Schuren, Sparen, Eindcontrole, Bloknr |
| Producten kookplaat | 1 (seed) | Bora C75 (uitbreidbaar) |
| Producten spoelbak | 2 (seed) | Caressi CAPP50R10, Generiek 50SP |

## Gebruik in de extensie

```typescript
import seed from './seed-data.json';
import type { SeedData, Opname, Blad } from './seed-types';
import { legeOpname, bouwProductCode, kleurenVoorMateriaal } from './seed-types';

const data = seed as SeedData;

// Nieuwe opname starten
const opname = legeOpname(data);

// Dropdown voor materiaal
data.producenten.map(p => <option value={p}>{p}</option>);

// Cascadende kleur-dropdown
const kleuren = kleurenVoorMateriaal(opname.materiaal.soort, data);

// Productcode genereren bij opslaan
const code = bouwProductCode('COMPOSIET', 20, 'WB', data);  // → "COM20WB"
```

## Wat NIET in deze seed zit (bewuste keuze)

- **Klantenlijst** — komt uit ERPNext via `bridge.fetchList('Customer')`
- **Eerdere opnames** — komen uit ERPNext via `bridge.fetchList('Quotation', { filters: { custom_kbf_opname: 1 } })`
- **Werkelijke prijzen** — worden door kantoor ingevuld, niet door inmeter
- **Volledige product-catalogus kookplaten/spoelbakken/kranen** — alleen 1 seed-item per categorie als template. Uit te breiden door:
  - Caressi-merk-volledige-lijst toe te voegen
  - Bora / Pitt / AEG / Siemens / Atag kookplaat-modellen
  - Quooker / Grohe / Hansgrohe kraan-modellen

## Hoe uit te breiden

### Nieuwe kleur toevoegen
Bewerk `seed-data.json` direct, voeg toe aan `materialen.<MATERIAAL>.kleuren`.

### Nieuwe randafwerking (zichtzijde)
Voeg toe aan `zichtzijden[]` met unieke `code`. Update ook `ZichtzijdeCode` union in `seed-types.ts`.

### Nieuwe kookplaat / spoelbak
Voeg toe aan `producten_kookplaten[]` of `producten_spoelbakken[]`. Velden zelf-verklarend.

### Nieuwe clausule
Voeg key/value toe aan `clausules`. Gebruik in opname via `geactiveerdeClausules: ['MIJN_NIEUWE_KEY']`.

## Volgende stappen

1. **Y-App extensie initialiseren** — `npm create vite@latest keukenblad-opname -- --template react-ts`
2. **Beide bestanden plaatsen** in `src/data/`
3. **Bridge.ts kopiëren** uit Bouwmeester-repo
4. **Wizard-screens bouwen** die uit `seed` putten voor alle dropdowns
5. **ERPNext-mapping** schrijven die `Opname` → `Quotation` payload converteert

## Wijzigingslog

- **1.0.0** (2026-05-11) — Eerste versie, op basis van order 2600376 (Zijlmans/Van Vlimmeren) en offerte 09-250226 (Bakker/Alblasserdam)
