# Sprint 6 taak 11 polish — twee kleine fixes

Eerste oplevering is bijna goed. Twee dingen aanpassen.

## Fix 1 — Titel ZAAGBRIEF centreren

Huidige positie staat eerder centraal-rechts dan echt centraal. Vasto
heeft "ZAAGBRIEF" exact in het midden van de pagina-breedte.

Fix: gebruik `pdf.text('ZAAGBRIEF', pageWidth / 2, y, { align: 'center' })`
of vergelijkbare centering-API. Verifieer visueel met Vasto pagina 1.

## Fix 2 — m² getallen direct na afwerking-tekst

Huidige output rechtslijnt m² getallen tegen de marge (kolom-stijl).
Vasto plaatst het getal direct achter de omschrijving met een paar
spaties ertussen — geen kolom-rechtsuitlijning.

Voorbeeld Vasto:
```
Afwerking:   Randafwerking verstek 40mm hoog   1,86
```

Huidige V9:
```
Afwerking:   Randafwerking verstek 40mm hoog                                    0,00
```

Fix: m² getal renderen op vaste x-offset direct na het einde van de
omschrijving-tekst, met ~5-10mm spacing. Of: positioneer op vaste
x-coordinaat die nét past achter de langste verwachte omschrijving
(~110mm vanaf links).

## Te onderzoeken (geen code-wijziging zonder antwoord)

**Blad 3 (2760×600) toont geen Uitsparing-regel.** Vasto's vergelijkbare
blad heeft "Uitsparing vlakinbouw vierkante spoelbak". Twee mogelijke
oorzaken:

a. Test-opname heeft geen spoelbak op blad 3 → klopt zo, niets te doen
b. Code rendert sparingen niet correct → bug, te fixen

**Vóór actie:** check de test-opname-data. Heeft `bladen[2].sparingen[]`
een spoelbak-sparing? Als nee: punt 4 in dit document negeren. Als ja:
debuggen waarom de Uitsparing-regel niet gerenderd wordt.

## Niet aanraken

- Order-header layout — goed
- Horizontale scheidingslijnen — goed
- Materiaal-regel formaat (zonder "Groep 0") — goed
- Terminologie Lengte/Breedte — goed
- m² placeholder 0,00 — blijft tot opdrachtgever formule levert

## Verificatie

Render bijgewerkte PDF, vergelijk side-by-side met Vasto pagina 1
(`ref-zaagbrief-p1.png`). Screenshot naar Eelke voor akkoord vóór
commit.
