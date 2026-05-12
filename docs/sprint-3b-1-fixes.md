# Sprint 3b deel 1 — Fixes vóór merge

## Context

Sprint 3b deel 1 werkt qua kern: sparingen toevoegen, productcatalogus,
positie aanpassen, kleur-codering klopt (rood/blauw/grijs voor types,
groen = geselecteerd-accent overlay). Twee fixes nog vóór PR merge.

## Fix 1 — Watermerk verbergen bij sparingen

**Probleem:** de "X.XX m²" watermerk in het midden van het blad overlapt
met sparingen die in het midden geplaatst worden. Visueel rommelig.

**Wat moet er gebeuren:**

In `Canvas.tsx`, de watermerk-text render-conditie aanpassen:

```jsx
{(!blad.sparingen || blad.sparingen.length === 0) && (
  <text x={...} y={...} fontSize="18" fill="#B4B2A9" opacity="0.7"
        textAnchor="middle">
    {oppervlakteM2(blad).toFixed(2)} m²
  </text>
)}
```

Alleen tonen wanneer er geen sparingen op het blad zijn. Zodra de inmeter
een eerste sparing plaatst, verdwijnt het watermerk automatisch.

Het m²-getal blijft sowieso zichtbaar in BladInfoPanel rechts en in
BladList links, dus de info gaat niet verloren.

## Fix 2 — Vlakbouw composiet warning

**Probleem:** wanneer een vlakbouw kookplaat (zoals Bora Pure 60) wordt
geplaatst op een blad van composiet/kwartscomposiet, hoort er een
prominente waarschuwing te verschijnen. Nu verschijnt die niet.

**Wat moet er gebeuren:**

### A. Warning-banner in SparingDialog stap 2

Wanneer de inmeter in de productlijst een vlakbouw-product **selecteert**,
en het project-materiaal is COMPOSIET of KWARTSCOMPOSIET:

- Toon een geel/oranje warning-banner **boven of onder de productlijst**
- Tekst (uit `seed.clausules.VLAKBOUW_WAARSCHUWING`):
  *"Let op: Wanneer u kiest voor een vlakbouw kookplaatsparing houdt u dan
  rekening met het volgende: door het uitzetten van de kookplaat bestaat
  het risico dat uw blad gaat scheuren. Wij raden vlakbouw dan ook af."*
- Twee knoppen:
  - "Toch toevoegen" → vervolg de flow normaal
  - "Kies ander product" → terug naar productlijst (warning verdwijnt
    tot opnieuw vlakbouw gekozen)

**Implementatie hint:**

```typescript
const isComposiet = ['COMPOSIET', 'KWARTSCOMPOSIET'].includes(
  state.materiaal.soort
);
const isVlakbouw = selectedProduct?.inbouwwijze === 'VLAKBOUW';
const toonWarning = isComposiet && isVlakbouw && !warningAccepted;
```

Stijl: amber-50 achtergrond, amber-700 border-left 3px solid, padding 12px,
icoon `ti-alert-triangle` links van tekst.

### B. Persistent indicator op de sparing zelf

Nadat de inmeter "Toch toevoegen" heeft gekozen en de sparing geplaatst is:

- Een klein waarschuwingsicoon (`ti-alert-triangle` in amber-600) op of
  bij de sparing op canvas — bv. rechtsboven van de sparing-rechthoek
- Hover/tap toont tooltip: "Vlakbouw in composiet — risico op scheuren"
- Ook zichtbaar in BladInfoPanel sparingen-lijst: dezelfde icoon naast
  de productnaam

Reden: na enkele dagen weet de inmeter (of de tekenaar later) misschien
niet meer dat hij de waarschuwing heeft geaccepteerd. Visuele restmarkering
voorkomt vergeten.

### C. Edge case — materiaal nog onbekend

Wanneer `state.materiaal.soort` nog niet is gekozen (default fallback):

- Toon de warning NIET
- Geen vals-positieve waarschuwingen

## Definition of done

- [ ] Watermerk verdwijnt zodra eerste sparing op blad staat
- [ ] Vlakbouw-product geselecteerd in dialog → warning-banner zichtbaar
      bij composiet/kwartscomposiet
- [ ] Warning heeft "Toch toevoegen" en "Kies ander product" knoppen
- [ ] Geplaatste vlakbouw-sparing in composiet toont waarschuwingsicoon op
      canvas
- [ ] Zelfde icoon in BladInfoPanel sparingen-lijst
- [ ] Niet-vlakbouw producten → geen warning
- [ ] Niet-composiet materialen → geen warning
- [ ] Materiaal onbekend → geen warning
- [ ] Nieuwe screenshot in chat
- [ ] `npm run build` slaagt
- [ ] PR ready om te mergen

## Commits

Atomic, suggestie:
- `fix: hide m² watermark when sparingen present`
- `feat: warning banner for vlakbouw in composiet`
- `feat: persistent warning icon on risky sparing`

Push naar dezelfde branch, dan PR mergen.

## Wat NIET doen

- Geen volledige herontwerp van SparingDialog
- Geen andere material-specifieke waarschuwingen (alleen
  composiet+vlakbouw nu — meer komt sprint 3b deel 2 met rand-afstand)
- Geen wijziging aan kleur-codering rood/blauw/grijs (werkt al)
- Geen wijziging aan helpers of reducer

## Wat als de warning te dwingend voelt

Als bij testen blijkt dat de warning irritant wordt (komt bij elk product
weer terug), kan in een latere iteratie een "Ik weet het, niet meer tonen
deze sessie" optie toegevoegd worden. Voor nu: bewust elke keer tonen, want
het risico is groot genoeg dat herinnering nuttig is.
