# Sprint 9 — ERPNext prijsstructuur opzetten

## Doel

ERPNext-instance `drechtstedenbouw-erp.prilk.cloud` inrichten met
keukenblad-Items, variants per kleur, prijzen en toeslag-Items. Zodat
sprint 8b's Quotation-mapper later kan upgraden naar specifieke
item_codes en ERPNext automatisch de juiste prijs berekent.

**Eenmalige setup-actie**, geen runtime-code in de extensie. Net als
sprint 8a (custom fields).

## Architectuur-keuzes (al beslist met Eelke)

| Keuze | Beslissing |
|---|---|
| Pad | B — structuur + indicatieve tarieven (midden van markt-range) |
| Item-strategie | Variants per kleur, dikte als aparte template |
| Toeslagen | Als aparte Items |
| Tarief-startpunt | Midden van markt-range, alle prijzen gemarkeerd met `(TEST INDICATIEF)` |
| Scope | 3-5 kleuren per materiaal als test-data, alle 11 materiaal-types |

## Stap 1 — Item Groups aanmaken

Hiërarchische structuur:

```
Keukenblad (parent group)
├── Composiet
├── Dekton
├── Keramiek
├── Graniet
├── Marmer
├── Kwartsiet
├── Natuursteen
├── HPL
├── Massief Hout
├── RVS
└── Beton

Toeslagen (parent group, parallel aan Keukenblad)
├── Sparing
├── Randafwerking
└── Boorgat
```

Per Item Group via `frappe.client.insert`:
```json
{
  "doctype": "Item Group",
  "item_group_name": "Composiet",
  "parent_item_group": "Keukenblad",
  "is_group": 0
}
```

`Keukenblad` en `Toeslagen` parent-groups eerst aanmaken met `is_group: 1`.

## Stap 2 — UOM verificatie

Check of UOM "m²" bestaat in ERPNext:
```
GET /api/method/frappe.client.get?doctype=UOM&name=Square Meter
```

Als ontbreekt, aanmaken via insert:
```json
{
  "doctype": "UOM",
  "uom_name": "Square Meter",
  "must_be_whole_number": 0
}
```

Per-stuk-toeslagen gebruiken UOM `Nos` (bestaat default in ERPNext).
Per-strekkende-meter-toeslagen gebruiken UOM `Meter` (bestaat default).

## Stap 3 — Item Templates aanmaken

Per materiaal-en-dikte combinatie één Item-template. Diktes zijn niet
universeel — per materiaal alleen de gangbare diktes opnemen.

**Templates (en Items voor materialen zonder veel dikte-variatie):**

| Item Code | Item Name | Item Group | UOM | Has Variants | Variant Based On |
|---|---|---|---|---|---|
| COMPOSIET-BLAD-12MM | Composiet keukenblad 12mm | Composiet | Square Meter | 1 | Item Attribute |
| COMPOSIET-BLAD-20MM | Composiet keukenblad 20mm | Composiet | Square Meter | 1 | Item Attribute |
| COMPOSIET-BLAD-30MM | Composiet keukenblad 30mm | Composiet | Square Meter | 1 | Item Attribute |
| DEKTON-BLAD-8MM | Dekton keukenblad 8mm | Dekton | Square Meter | 1 | Item Attribute |
| DEKTON-BLAD-12MM | Dekton keukenblad 12mm | Dekton | Square Meter | 1 | Item Attribute |
| DEKTON-BLAD-20MM | Dekton keukenblad 20mm | Dekton | Square Meter | 1 | Item Attribute |
| KERAMIEK-BLAD-12MM | Keramiek keukenblad 12mm | Keramiek | Square Meter | 1 | Item Attribute |
| KERAMIEK-BLAD-20MM | Keramiek keukenblad 20mm | Keramiek | Square Meter | 1 | Item Attribute |
| GRANIET-BLAD-20MM | Graniet keukenblad 20mm | Graniet | Square Meter | 1 | Item Attribute |
| GRANIET-BLAD-30MM | Graniet keukenblad 30mm | Graniet | Square Meter | 1 | Item Attribute |
| MARMER-BLAD-20MM | Marmer keukenblad 20mm | Marmer | Square Meter | 1 | Item Attribute |
| MARMER-BLAD-30MM | Marmer keukenblad 30mm | Marmer | Square Meter | 1 | Item Attribute |
| KWARTSIET-BLAD-20MM | Kwartsiet keukenblad 20mm | Kwartsiet | Square Meter | 1 | Item Attribute |
| KWARTSIET-BLAD-30MM | Kwartsiet keukenblad 30mm | Kwartsiet | Square Meter | 1 | Item Attribute |
| NATUURSTEEN-BLAD-20MM | Natuursteen keukenblad 20mm | Natuursteen | Square Meter | 1 | Item Attribute |
| HPL-BLAD-38MM | HPL keukenblad 38mm | HPL | Meter | 0 | n.v.t. |
| MASSIEFHOUT-BLAD-40MM | Massief hout keukenblad 40mm | Massief Hout | Square Meter | 1 | Item Attribute |
| RVS-BLAD | RVS keukenblad op maat | RVS | Meter | 0 | n.v.t. |
| BETON-BLAD-40MM | Beton keukenblad 40mm | Beton | Square Meter | 0 | n.v.t. |

`Has Variants: 1` betekent het is een template; variants worden in stap 5
aangemaakt per kleur. HPL/RVS/Beton hebben geen kleur-variants (kleur-keuze
veel beperkter of n.v.t.) — voor MVP behandeld als enkelvoudig Item zonder
variants.

## Stap 4 — Item Attribute "Kleur" aanmaken

ERPNext Item Attribute voor de variant-dimensie:

```json
{
  "doctype": "Item Attribute",
  "attribute_name": "Kleur",
  "item_attribute_values": [
    { "attribute_value": "Glencoe", "abbr": "GLENCOE" },
    { "attribute_value": "Aeris", "abbr": "AERIS" },
    { "attribute_value": "Adamina", "abbr": "ADAMINA" },
    { "attribute_value": "Sirius", "abbr": "SIRIUS" },
    { "attribute_value": "Aura", "abbr": "AURA" },
    { "attribute_value": "Bromo", "abbr": "BROMO" },
    { "attribute_value": "Niro", "abbr": "NIRO" },
    { "attribute_value": "Pietra", "abbr": "PIETRA" },
    { "attribute_value": "Black Pearl", "abbr": "BLACKPEARL" },
    { "attribute_value": "Star Galaxy", "abbr": "STARGALAXY" },
    { "attribute_value": "Calacatta", "abbr": "CALACATTA" },
    { "attribute_value": "Carrara", "abbr": "CARRARA" },
    { "attribute_value": "Taj Mahal", "abbr": "TAJMAHAL" },
    { "attribute_value": "Macaubas", "abbr": "MACAUBAS" },
    { "attribute_value": "Belgisch Hardsteen", "abbr": "BELGISCHHARDSTEEN" },
    { "attribute_value": "Jura Beige", "abbr": "JURABEIGE" },
    { "attribute_value": "Eiken Massief", "abbr": "EIKEN" },
    { "attribute_value": "Bamboe", "abbr": "BAMBOE" }
  ]
}
```

## Stap 5 — Item Variants aanmaken

Per template-Item, drie kleur-variants. Per variant een Item-record met:

```json
{
  "doctype": "Item",
  "item_code": "COMPOSIET-BLAD-20MM-GLENCOE",
  "item_name": "Composiet keukenblad 20mm Glencoe",
  "item_group": "Composiet",
  "stock_uom": "Square Meter",
  "variant_of": "COMPOSIET-BLAD-20MM",
  "attributes": [
    { "attribute": "Kleur", "attribute_value": "Glencoe" }
  ]
}
```

**Welke kleur bij welk materiaal — verdeling:**

| Materiaal | Kleur-variants |
|---|---|
| Composiet | Glencoe, Aeris, Adamina |
| Dekton | Sirius, Aura, Bromo |
| Keramiek | Niro, Pietra |
| Graniet | Black Pearl, Star Galaxy |
| Marmer | Calacatta, Carrara |
| Kwartsiet | Taj Mahal, Macaubas |
| Natuursteen | Belgisch Hardsteen, Jura Beige |
| Massief Hout | Eiken Massief, Bamboe |

HPL/RVS/Beton geen variants.

Per template-Item alle bovenstaande kleur-variants aanmaken voor elke
beschikbare dikte. Totaal ongeveer 50-60 variants.

## Stap 6 — Toeslag-Items aanmaken

Niet-variant Items voor toeslagen. Eén item per type:

### Sparingen
| Item Code | Item Name | Item Group | UOM |
|---|---|---|---|
| TOESLAG-SPARING-ONDERBOUW | Toeslag sparing spoelbak onderbouw | Sparing | Nos |
| TOESLAG-SPARING-VLAKBOUW | Toeslag sparing spoelbak vlakbouw | Sparing | Nos |
| TOESLAG-SPARING-OPBOUW | Toeslag sparing spoelbak opbouw | Sparing | Nos |
| TOESLAG-SPARING-KOOKPLAAT-VLAKBOUW | Toeslag sparing kookplaat vlakbouw | Sparing | Nos |
| TOESLAG-SPARING-KOOKPLAAT-OPBOUW | Toeslag sparing kookplaat opbouw | Sparing | Nos |
| TOESLAG-SPARING-KOOKPLAAT-DOWNDRAFT | Toeslag sparing downdraft | Sparing | Nos |
| TOESLAG-SPARING-HOEK | Toeslag hoekuitsparing | Sparing | Nos |
| TOESLAG-SPARING-KOLOM | Toeslag kolomuitsparing | Sparing | Nos |
| TOESLAG-SPARING-KOOF | Toeslag koofuitsparing | Sparing | Nos |

### Randafwerking (per strekkende meter)
| Item Code | Item Name | Item Group | UOM |
|---|---|---|---|
| TOESLAG-RAND-DV20 | Toeslag randafwerking verstek 20mm hoog | Randafwerking | Meter |
| TOESLAG-RAND-DV30 | Toeslag randafwerking verstek 30mm hoog | Randafwerking | Meter |
| TOESLAG-RAND-DV40 | Toeslag randafwerking verstek 40mm hoog | Randafwerking | Meter |
| TOESLAG-RAND-T1 | Toeslag randafwerking enkel facet | Randafwerking | Meter |
| TOESLAG-RAND-KF | Toeslag randafwerking kanten-facet | Randafwerking | Meter |
| TOESLAG-RAND-VERSTEK | Toeslag verstekverbinding | Randafwerking | Nos |

### Boorgaten en overig
| Item Code | Item Name | Item Group | UOM |
|---|---|---|---|
| TOESLAG-BOORGAT-KRAAN | Toeslag boorgat kraan | Boorgat | Nos |
| TOESLAG-BOORGAT-QUOOKER | Toeslag boorgat Quooker | Boorgat | Nos |
| TOESLAG-BOORGAT-ELEKTRA | Toeslag boorgat elektra | Boorgat | Nos |
| TOESLAG-BOORGAT-WCD | Toeslag boorgat dubbele WCD | Boorgat | Nos |
| TOESLAG-INMETEN | Toeslag inmeten op locatie | Boorgat | Nos |
| TOESLAG-TRANSPORT | Toeslag transport | Boorgat | Nos |
| TOESLAG-MONTAGE | Toeslag montage | Boorgat | Nos |

## Stap 7 — Price List bestaande controleren

ERPNext heeft default een "Standard Selling" Price List. Check of die
bestaat:
```
GET /api/method/frappe.client.get?doctype=Price List&name=Standard Selling
```

Als die ontbreekt, aanmaken:
```json
{
  "doctype": "Price List",
  "price_list_name": "Standard Selling",
  "currency": "EUR",
  "selling": 1,
  "enabled": 1
}
```

## Stap 8 — Item Prices invoeren

Per Item één Item Price record. Indicatieve middenklasse-tarieven uit
markt-range:

### Materialen — midden van markt-range
| Item Code | Rate (€/m²) | UOM |
|---|---|---|
| COMPOSIET-BLAD-*-* | 675 | Square Meter |
| DEKTON-BLAD-*-* | 850 | Square Meter |
| KERAMIEK-BLAD-*-* | 850 | Square Meter |
| GRANIET-BLAD-*-* | 600 | Square Meter |
| MARMER-BLAD-*-* | 1050 | Square Meter |
| KWARTSIET-BLAD-*-* | 1050 | Square Meter |
| NATUURSTEEN-BLAD-*-* | 700 | Square Meter |
| MASSIEFHOUT-BLAD-*-* | 350 | Square Meter |
| BETON-BLAD-*-* | 700 | Square Meter |
| HPL-BLAD-38MM | 140 | Meter |
| RVS-BLAD | 750 | Meter |

**Alle kleur-variants binnen één materiaal-template krijgen dezelfde
basis-prijs voor MVP.** Later kan kantoor per-kleur differentiëren
(premium kleuren hoger zetten). Dat is een handmatige UI-actie, geen
extra code nu.

### Toeslagen — midden van markt-range
| Item Code | Rate (€) | UOM |
|---|---|---|
| TOESLAG-SPARING-ONDERBOUW | 165 | Nos |
| TOESLAG-SPARING-VLAKBOUW | 195 | Nos |
| TOESLAG-SPARING-OPBOUW | 75 | Nos |
| TOESLAG-SPARING-KOOKPLAAT-VLAKBOUW | 140 | Nos |
| TOESLAG-SPARING-KOOKPLAAT-OPBOUW | 75 | Nos |
| TOESLAG-SPARING-KOOKPLAAT-DOWNDRAFT | 195 | Nos |
| TOESLAG-SPARING-HOEK | 100 | Nos |
| TOESLAG-SPARING-KOLOM | 100 | Nos |
| TOESLAG-SPARING-KOOF | 100 | Nos |
| TOESLAG-RAND-DV20 | 35 | Meter |
| TOESLAG-RAND-DV30 | 45 | Meter |
| TOESLAG-RAND-DV40 | 50 | Meter |
| TOESLAG-RAND-T1 | 20 | Meter |
| TOESLAG-RAND-KF | 30 | Meter |
| TOESLAG-RAND-VERSTEK | 175 | Nos |
| TOESLAG-BOORGAT-KRAAN | 35 | Nos |
| TOESLAG-BOORGAT-QUOOKER | 35 | Nos |
| TOESLAG-BOORGAT-ELEKTRA | 35 | Nos |
| TOESLAG-BOORGAT-WCD | 35 | Nos |
| TOESLAG-INMETEN | 110 | Nos |
| TOESLAG-TRANSPORT | 100 | Nos |
| TOESLAG-MONTAGE | 275 | Nos |

### Item Price format
```json
{
  "doctype": "Item Price",
  "item_code": "COMPOSIET-BLAD-20MM-GLENCOE",
  "price_list": "Standard Selling",
  "price_list_rate": 675,
  "currency": "EUR",
  "valid_from": "2026-05-19"
}
```

**Voeg in elke Item Price een `note` of `comment` toe:**
`(TEST INDICATIEF - gemiddelde markttarief, valideren met kantoor vóór productie)`

## Stap 9 — Documentatie

Maak `docs/erpnext-prijsstructuur.md` met:
- Volledige tabellen uit deze prompt
- Per Item Group: welke Items erin zitten
- Per toeslag: korte beschrijving wanneer van toepassing
- **Expliciete waarschuwing** bovenaan: "Tarieven zijn TEST INDICATIEF.
  Kantoor moet alle Item Prices valideren voor productie-gebruik."
- Curl-commando-template voor batch-import bij nieuwe instances

## Stap 10 — Verificatie

Geautomatiseerd (curl):
1. `GET /api/method/frappe.client.get_count?doctype=Item Group&filters=[["parent_item_group","in",["Keukenblad","Toeslagen"]]]`
   → moet 14 returnen (11 materialen + 3 toeslag-groepen)

2. `GET /api/method/frappe.client.get_count?doctype=Item&filters=[["item_group","in",[...alle keukenblad-groepen...]]]`
   → moet ~50-60 Items returnen (templates + variants)

3. `GET /api/method/frappe.client.get_count?doctype=Item Price`
   → moet matchen met aantal Items dat een prijs hoort te hebben (~50+)

4. Manuele check in ERPNext-UI:
   - Open `Item List` → Items zijn georganiseerd in groups
   - Open een template (bv. COMPOSIET-BLAD-20MM) → 3 variants zichtbaar
   - Open een variant → Item Price van €675 zichtbaar, attribute Kleur=Glencoe
   - Open een toeslag-Item → juiste prijs zichtbaar

## Niet meenemen

- Per-kleur prijsdifferentiatie (premium kleuren hoger). Kantoor doet
  later handmatig in ERPNext-UI.
- Pricing Rules voor klant-staffels of korting. Sprint 12+ als gewenst.
- Item images/foto's. Later.
- Multi-currency. Alleen EUR.
- Voorraadbeheer per variant. Voor MVP irrelevant (op-bestelling-product).
- Automatische m²-berekening uit lengte×breedte. ERPNext doet dit niet
  native voor Quotation items — de extensie (mapper sprint 8b) berekent
  m² zelf en geeft `qty: 1.96` mee aan ERPNext. Sprint 9 aanpassing van
  mapper komt later.

## Workflow

1. **Stap 9.1** — Item Groups + UOM (stappen 1, 2). Verifieer in UI.
   Akkoord aan Eelke vragen.
2. **Stap 9.2** — Item Templates + Attribute Kleur (stappen 3, 4)
3. **Stap 9.3** — Item Variants (stap 5) — dit is de grootste batch
4. **Stap 9.4** — Toeslag-Items (stap 6)
5. **Stap 9.5** — Price List + Item Prices (stappen 7, 8)
6. **Stap 9.6** — Documentatie + verificatie (stappen 9, 10)

Bij stap 9.1 expliciet akkoord vragen — als de Item Group-structuur
goed staat is de rest mechanisch werk.

## Sprint 8b mapper-aanpassing — niet nu, later

Sprint 8b's `quotationMapper.ts` gebruikt nu `item_code: 'AANRECHTBLAD'`
voor alle bladen. Na deze sprint 9 setup moet de mapper aangepast worden
om het juiste variant-item te kiezen:

```ts
// In quotationMapper.ts, later:
function bepaalItemCode(blad: Blad): string {
  const materiaalPrefix = mapMateriaalNaarPrefix(blad.materiaal.soort)
  const kleurSlug = slugify(blad.materiaal.kleur)
  return `${materiaalPrefix}-BLAD-${blad.dikte}MM-${kleurSlug}`
}
```

Plus extra QuotationItems toevoegen voor sparingen, randen, boorgaten
met de juiste TOESLAG-* item_codes. **Dit is sprint 10-werk** (mapper
upgrade), niet sprint 9. Sprint 9 is alleen ERPNext-setup.

## Verificatie aan Eelke

Per sub-stap een korte rapportage:
- Hoeveel records aangemaakt
- Eventuele failures (item bestaat al, attribute-conflict, etc)
- ERPNext-UI screenshot van één template + variants + Item Price

Daarna akkoord vragen vóór door naar volgende sub-stap.
