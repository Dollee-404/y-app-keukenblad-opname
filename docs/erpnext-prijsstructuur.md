# ERPNext Prijsstructuur — Keukenblad Opname

> ⚠️ **TARIEVEN ZIJN TEST INDICATIEF**
> Alle Item Prices zijn ingesteld op gemiddelde markt-middenklasse tarieven
> en MOETEN worden gevalideerd met kantoor vóór productie-gebruik.
> Zie elk Item Price: note = "(TEST INDICATIEF - gemiddelde markttarief,
> valideren met kantoor vóór productie)"

Aangemaakt: 2026-05-19 — sprint 9

---

## Item Group hiërarchie

```
All Item Groups
├── Keukenblad
│   ├── Composiet
│   ├── Dekton
│   ├── Keramiek
│   ├── Graniet
│   ├── Marmer
│   ├── Kwartsiet
│   ├── Natuursteen
│   ├── HPL
│   ├── Massief Hout
│   ├── RVS
│   └── Beton
└── Toeslagen
    ├── Sparing
    ├── Randafwerking
    └── Boorgat
```

---

## Item Attribute

| Attribute | Waarden |
|---|---|
| Kleur | Glencoe, Aeris, Adamina, Sirius, Aura, Bromo, Niro, Pietra, Black Pearl, Star Galaxy, Calacatta, Carrara, Taj Mahal, Macaubas, Belgisch Hardsteen, Jura Beige, Eiken Massief, Bamboe |

---

## Item Templates (19 stuks)

| Item Code | Item Name | Group | UOM | Variants |
|---|---|---|---|---|
| COMPOSIET-BLAD-12MM | Composiet keukenblad 12mm | Composiet | Square Meter | 3 kleuren |
| COMPOSIET-BLAD-20MM | Composiet keukenblad 20mm | Composiet | Square Meter | 3 kleuren |
| COMPOSIET-BLAD-30MM | Composiet keukenblad 30mm | Composiet | Square Meter | 3 kleuren |
| DEKTON-BLAD-8MM | Dekton keukenblad 8mm | Dekton | Square Meter | 3 kleuren |
| DEKTON-BLAD-12MM | Dekton keukenblad 12mm | Dekton | Square Meter | 3 kleuren |
| DEKTON-BLAD-20MM | Dekton keukenblad 20mm | Dekton | Square Meter | 3 kleuren |
| KERAMIEK-BLAD-12MM | Keramiek keukenblad 12mm | Keramiek | Square Meter | 2 kleuren |
| KERAMIEK-BLAD-20MM | Keramiek keukenblad 20mm | Keramiek | Square Meter | 2 kleuren |
| GRANIET-BLAD-20MM | Graniet keukenblad 20mm | Graniet | Square Meter | 2 kleuren |
| GRANIET-BLAD-30MM | Graniet keukenblad 30mm | Graniet | Square Meter | 2 kleuren |
| MARMER-BLAD-20MM | Marmer keukenblad 20mm | Marmer | Square Meter | 2 kleuren |
| MARMER-BLAD-30MM | Marmer keukenblad 30mm | Marmer | Square Meter | 2 kleuren |
| KWARTSIET-BLAD-20MM | Kwartsiet keukenblad 20mm | Kwartsiet | Square Meter | 2 kleuren |
| KWARTSIET-BLAD-30MM | Kwartsiet keukenblad 30mm | Kwartsiet | Square Meter | 2 kleuren |
| NATUURSTEEN-BLAD-20MM | Natuursteen keukenblad 20mm | Natuursteen | Square Meter | 2 kleuren |
| MASSIEFHOUT-BLAD-40MM | Massief hout keukenblad 40mm | Massief Hout | Square Meter | 2 kleuren |
| HPL-BLAD-38MM | HPL keukenblad 38mm | HPL | Meter | geen |
| RVS-BLAD | RVS keukenblad op maat | RVS | Meter | geen |
| BETON-BLAD-40MM | Beton keukenblad 40mm | Beton | Square Meter | geen |

---

## Item Variants per materiaal (38 stuks)

| Materiaal | Kleuren | Diktes |
|---|---|---|
| Composiet | Glencoe, Aeris, Adamina | 12, 20, 30mm |
| Dekton | Sirius, Aura, Bromo | 8, 12, 20mm |
| Keramiek | Niro, Pietra | 12, 20mm |
| Graniet | Black Pearl, Star Galaxy | 20, 30mm |
| Marmer | Calacatta, Carrara | 20, 30mm |
| Kwartsiet | Taj Mahal, Macaubas | 20, 30mm |
| Natuursteen | Belgisch Hardsteen, Jura Beige | 20mm |
| Massief Hout | Eiken Massief, Bamboe | 40mm |

Item code format: `{MATERIAAL}-BLAD-{DIKTE}MM-{KLEUR_ABBR}`
Voorbeeld: `COMPOSIET-BLAD-20MM-GLENCOE`

---

## Toeslag-Items (22 stuks)

### Sparingen
| Item Code | Omschrijving | UOM | Rate |
|---|---|---|---|
| TOESLAG-SPARING-ONDERBOUW | Spoelbak onderbouw | Nos | €165 |
| TOESLAG-SPARING-VLAKBOUW | Spoelbak vlakbouw | Nos | €195 |
| TOESLAG-SPARING-OPBOUW | Spoelbak opbouw | Nos | €75 |
| TOESLAG-SPARING-KOOKPLAAT-VLAKBOUW | Kookplaat vlakbouw | Nos | €140 |
| TOESLAG-SPARING-KOOKPLAAT-OPBOUW | Kookplaat opbouw | Nos | €75 |
| TOESLAG-SPARING-KOOKPLAAT-DOWNDRAFT | Downdraft uitsparing | Nos | €195 |
| TOESLAG-SPARING-HOEK | Hoekuitsparing | Nos | €100 |
| TOESLAG-SPARING-KOLOM | Kolomuitsparing | Nos | €100 |
| TOESLAG-SPARING-KOOF | Koofuitsparing | Nos | €100 |

### Randafwerking
| Item Code | Omschrijving | UOM | Rate |
|---|---|---|---|
| TOESLAG-RAND-DV20 | Verstek 20mm hoog | Meter | €35/m |
| TOESLAG-RAND-DV30 | Verstek 30mm hoog | Meter | €45/m |
| TOESLAG-RAND-DV40 | Verstek 40mm hoog | Meter | €50/m |
| TOESLAG-RAND-T1 | Enkel facet | Meter | €20/m |
| TOESLAG-RAND-KF | Kanten-facet | Meter | €30/m |
| TOESLAG-RAND-VERSTEK | Verstekverbinding | Nos | €175 |

### Boorgaten + overig
| Item Code | Omschrijving | UOM | Rate |
|---|---|---|---|
| TOESLAG-BOORGAT-KRAAN | Boorgat kraan | Nos | €35 |
| TOESLAG-BOORGAT-QUOOKER | Boorgat Quooker | Nos | €35 |
| TOESLAG-BOORGAT-ELEKTRA | Boorgat elektra | Nos | €35 |
| TOESLAG-BOORGAT-WCD | Boorgat dubbele WCD | Nos | €35 |
| TOESLAG-INMETEN | Inmeten op locatie | Nos | €110 |
| TOESLAG-TRANSPORT | Transport | Nos | €100 |
| TOESLAG-MONTAGE | Montage | Nos | €275 |

---

## Materiaal-tarieven (€/m² tenzij anders)

| Materiaal | Rate | UOM |
|---|---|---|
| Composiet | €675 | Square Meter |
| Dekton | €850 | Square Meter |
| Keramiek | €850 | Square Meter |
| Graniet | €600 | Square Meter |
| Marmer | €1.050 | Square Meter |
| Kwartsiet | €1.050 | Square Meter |
| Natuursteen | €700 | Square Meter |
| Massief Hout | €350 | Square Meter |
| Beton | €700 | Square Meter |
| HPL | €140 | Meter |
| RVS | €750 | Meter |

Alle kleuren binnen één materiaal krijgen dezelfde basisprijs.
Per-kleur differentiatie (premium) is een handmatige UI-actie in ERPNext.

---

## Sprint 10 — mapper-aanpassing (nog te doen)

`quotationMapper.ts` gebruikt nu `item_code: 'AANRECHTBLAD'` voor alle bladen.
Na sprint 9 setup moet de mapper het juiste variant-item kiezen:

```ts
function bepaalItemCode(blad: Blad, opname: Opname): string {
  const prefix = mapMateriaalNaarPrefix(effectiefMateriaalSoort(blad, opname))
  const dikte = blad.dikte ?? opname.materiaalKeuze?.dikte_mm ?? 20
  const kleur = blad.materiaalKeuze?.kleur_code ?? opname.materiaalKeuze?.kleur_code ?? ''
  return `${prefix}-BLAD-${dikte}MM-${kleur}`
}
```

Plus extra QuotationItems voor sparingen, randen en boorgaten
met TOESLAG-* item_codes en berekende qty (strekkende meter / stuks).
