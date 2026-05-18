# Sprint 6 taak 9b polish — Doorsneeprofiel-icoon corrigeren

Materiaalcode "20DV40" en tekst-positie zijn goed. Het icoon zelf moet
herbouwd worden — vorm + verhoudingen kloppen niet met Vasto.

## Wat er nu fout is

V6 tekent het icoon als een **smal/hoog blokje** waarbij de hele
onderhelft gearceerd is. Dat communiceert "sandwich-blad uit twee
gelijke lagen". Dat klopt constructief niet — bij DV40 is het blad
20mm dik en daar zit alleen een **kleine extra-strook rechts** onder
om de verstek-rand totaal 40mm hoog te maken.

## Wat het icoon hoort te zijn — exacte Vasto-anatomie

Zie referentie `ref-DV40-icoon.png` (zelfde als eerder, exacte Vasto
pagina 1). Het icoon is opgebouwd uit deze elementen, **breed liggend
georiënteerd**:

```
   ←──── breed (~20mm icoon-breedte) ────→

   ───────────────────────╲              ← bovenrand blad
                    20MM   ╲             ← label op blad-bovenkant
   ───────────────────────  ╲            ← onderrand blad
                        ▓▓▓│             ← verstekhoek-lijn
                        ▓▓▓│  40MM       ← gearceerd blokje rechts
                        ▓▓▓│             ← label rechts naast blokje
                        ───┘             ← onderkant gearceerd blok
```

### Elementen één voor één

1. **Blad-strook** (de hoofdvorm): horizontale rechthoek, **breed en
   plat**. Verhouding ongeveer 4:1 (breedte:hoogte) of nog platter.
   - Twee parallelle horizontale lijnen die boven- en onderrand vormen
   - Loopt links **open** (geen verticale lijn aan de linkerkant) —
     suggereert dat het blad doorloopt
   - Eindigt rechts in een verstek-schuinte

2. **Verstek-schuinte** rechtsboven:
   - Diagonale lijn vanaf rechterkant blad-bovenrand naar beneden-rechts
   - Hoek ~45° (verstekhoek)
   - Eindigt waar het gearceerde blokje begint

3. **Gearceerd blokje** rechtsonder (de extra onderlijm-strook):
   - Klein vierkant of bijna-vierkant blokje
   - **Smal** — ongeveer 20-25% van de totale icoon-breedte, niet
     de hele onderhelft
   - Zit aan de **rechterkant** onder het blad
   - Bovenkant raakt onderrand blad
   - Linkerkant is verticaal (gewoon lijn)
   - Rechterkant ligt op één lijn met het einde van de verstek-schuinte
   - Gevuld met diagonale arcering (45°, ~0.5mm spacing)

4. **Maat-label `20MM`**:
   - Tekst staat **op of net boven het blad**, niet ernaast
   - Voorbeeld-positie: tussen de twee blad-randen of er net boven
   - Optioneel: extension-lines (kleine verticale streepjes) die de
     20mm hoogte aangeven — Vasto heeft deze subtiel

5. **Maat-label `40MM`**:
   - Tekst staat **rechts van het gearceerde blokje**
   - Geeft de totale hoogte aan (blad-dikte + extra-strook = 20+20=40)
   - Optioneel: extension-lines die de 40mm-totaal aanduiden

## Verhoudingen concreet (in mm op het PDF)

Aanname: icoon-bounding-box ~22mm breed × ~10mm hoog.

- Blad-strook: 18mm breed × 3mm hoog (verhouding 6:1)
- Verstek-schuinte: ~3mm horizontaal × 3mm verticaal (45° onder
  blad-rechterhoek)
- Gearceerd blokje: ~4mm breed × ~3mm hoog, direct onder de
  verstek-schuinte
- Tekstlabels: 5-6pt, voldoende klein om naast de vorm te passen

## Niet aanraken

- Materiaalcode "20DV40" boven het icoon — goed
- Andere footer-elementen — goed
- Tekst-positie van de icoon-labels binnen redelijke grenzen — fontgrootte
  mag aangepast worden als de huidige niet past

## Verificatie

Render een nieuwe portrait PDF. Lay-out side-by-side met
`ref-DV40-icoon.png`. De vormen moeten **conceptueel matchen**:

- Breed liggend bladprofiel, niet een hoog/smal blokje
- Klein arcering-vierkant rechtsonder, niet hele onderhelft gearceerd
- Verstek-schuinte zit waar bovenkant blad overgaat in arcering-blokje
- "20MM" hoort bij het blad, "40MM" hoort bij de totale hoogte

Screenshot naar Eelke voor akkoord. Als de Vasto-anatomie nu wel klopt,
is taak 9b af en kan iteratie 2 (T1 recht-variant) beginnen — of meteen
door naar taak 10 als T1/EF voorlopig niet nodig zijn.

## Tip voor implementatie

Niet rekenen met SVG-paths op coördinaten — teken het als losse
primitives in jsPDF voor controleerbaarheid:

```ts
// 1. Blad bovenrand
pdf.line(x, y, x + 18, y)
// 2. Blad onderrand
pdf.line(x, y + 3, x + 15, y + 3)
// 3. Verstek-schuinte
pdf.line(x + 15, y + 3, x + 18, y + 6)
// 4. Gearceerd blokje rechterrand
pdf.line(x + 18, y, x + 18, y + 6)
// 5. Gearceerd blokje onderrand
pdf.line(x + 14, y + 6, x + 18, y + 6)
// 6. Gearceerd blokje linkerrand
pdf.line(x + 14, y + 3, x + 14, y + 6)
// 7. Arcering binnen blokje (5-7 schuine lijntjes)
for (let i = 0; i < 6; i++) {
  // diagonale lijntjes 45°
}
// 8. Tekstlabels
pdf.text('20MM', x + 8, y - 0.5)
pdf.text('40MM', x + 19, y + 5)
```

Coördinaten zijn voorbeeld — daadwerkelijke positionering hangt af van
cel-grootte en bounding-box-keuze.
