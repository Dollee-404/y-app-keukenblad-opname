# Sprint 6 taak 9a — polish footer-grid

De grid-structuur (2 rijen × 6 kolommen met merged cells) staat goed.
Vier punten moeten nog gefixt. Visueel side-by-side vergelijken met
Vasto pagina 1 footer (`Zaagtekeningen.pdf` pagina 1, onderste ~90mm).

## Probleem 1 — Rij 2 is veel te hoog

Huidig: rij 2 is ongeveer 4× hoger dan rij 1, met enorme witruimte onderaan.
Branding wordt daardoor naar onder geduwd, ver weg van de rest.

Vasto: rij 1 en rij 2 zijn ongeveer **even hoog**.

Fix:
- Rij 1 (procesregistratie): ~25mm hoog
- Rij 2 (info-blok): ~25mm hoog (3 sub-rijen á ~8mm)
- Totaal tabel: ~50–55mm, niet ~90mm

De witruimte onderin moet weg.

## Probleem 2 — Sub-rij scheidingslijnen ontbreken in rij 2

Huidig: rij 2 is één blok per kolom zonder horizontale lijnen.

Vasto:
- Kolom 4 heeft **1 horizontale scheidingslijn** (2 sub-rijen: klant boven,
  eindklant onder)
- Kolom 5 heeft **2 horizontale scheidingslijnen** (3 sub-rijen: datum /
  Route: / Getekend:)
- Kolom 6 heeft **2 horizontale scheidingslijnen** (3 sub-rijen: leeg /
  Tek. Nr / branding)

Die lijntjes zijn structureel. Teken ze.

## Probleem 3 — Kolomverdeling in rij 2 lijkt anders dan Vasto

Huidig: kolom 4 (klant) lijkt breder dan kolom 5 en 6 samen.

Vasto-verhoudingen (ruw, totaal ~180mm):
- Kolom 1 materiaalcode: ~22mm
- Kolom 2-3 merged (kleur + ordernr): ~56mm
- Kolom 4 klant/eindklant: ~38mm
- Kolom 5 datum/route/getekend: ~32mm
- Kolom 6 leeg/tek.nr/branding: ~32mm

Houd deze breedtes aan.

## Probleem 4 — Branding "DE KEUKENBLADENFAB / RIEK" breekt midden in woord

Huidig: tekst wordt automatisch afgebroken na "FAB", "RIEK" valt op
volgende regel. Lelijk en onleesbaar.

Fix-opties (kies één):

a. **Twee regels op woordgrens** — render expliciet:
   ```
   DE KEUKEN-
   BLADENFABRIEK
   ```
   Vet, geen automatische hyphenation.

b. **Kleinere font + één regel** — als kolom 6 ~32mm breed is, dan moet
   "DE KEUKENBLADENFABRIEK" passen op één regel. Probeer 7pt of 6.5pt
   bold.

c. **Acroniem** — alleen "DE KEUKENBLADEN-" + "FABRIEK" op twee
   handmatige regels.

Daaronder: "Vasto Natuursteen" klein lichtgrijs (~5.5pt, #888).

Optie a of b heeft voorkeur. Probeer eerst b (één regel kleiner font);
als dat niet leesbaar is, val terug op a.

## Niet aan komen

- Materiaalcode-kolom (kolom 1) blijft leeg met placeholder — dat is
  taak 9b. Niet meenemen in deze fix.
- "2600376 Week 8" (kolom 2-3 merged onderaan): mag op één regel groot
  vet zoals Vasto "2600376 Week 14". Als dat al goed staat, niet
  aanraken.
- Rij 1 procesregistratie: ziet er goed uit, niet aanraken.

## Verificatie

Render een test-PDF en open visueel. Vergelijk side-by-side met Vasto
pagina 1. Stuur PDF + screenshot naar Eelke voor akkoord vóór taak 9b.

## Verwacht eindbeeld

- Compacte footer ~50–55mm hoog (niet ~90mm)
- 6 kolommen met juiste verhoudingen
- Sub-rij scheidingslijnen zichtbaar in kolom 4, 5, 6
- Branding "DE KEUKENBLADENFABRIEK" leesbaar zonder midden-woord-break
- "Vasto Natuursteen" klein lichtgrijs eronder
