# Sprint 6 taak 9b — alleen materiaalcode-tekst, icoon uitstellen

## Wat te doen

Materiaalcode-tekst staat nu goed ("20DV40", bold, juiste positie).
Doorsneeprofiel-icoon wordt uitgesteld naar latere sprint — opdrachtgever
levert nog specs voor de exacte vorm.

## Wijziging

Verwijder de huidige icoon-rendering uit de materiaalcode-cel (portrait
+ landscape beide). Alleen de "20DV40" tekst blijft staan in de cel.

In code: de functie/component die het icoon tekent uitcommentariëren of
achter een feature-flag zetten. Niet helemaal verwijderen — de code is
nuttig als startpunt voor de latere implementatie.

```ts
// TODO: doorsneeprofiel-icoon — opdrachtgever levert specs in latere sprint
// Verwijderd uit MVP omdat exacte Vasto-anatomie niet vrij te
// reconstrueren is zonder constructieve input.
// Implementatie-skelet bewaard in src/pdf/doorsneeprofiel.ts (uncalled).
```

## Cel-layout na wijziging

**Portrait (Vasto-grid kolom 1):**
- "20DV40" bold 11pt, padding 2mm links/boven
- Rest van cel leeg (geen icoon)

**Landscape (linkerzone bovenaan):**
- "20DV40" bold 11pt op eigen regel
- Rest van info-blok (kleur, klant, datum) ongewijzigd

## Niet aanraken

- Tekstweergave "20DV40" — goed
- Alle overige footer-elementen — goed
- `getMateriaalcode()` helper en `materiaalcodeOverride` veld — laten
  staan, dat werkt al

## Verificatie

Render portrait + landscape PDF. Materiaalcode-cel toont alleen tekst.
Screenshot naar Eelke. Taak 9b daarmee af — door naar taak 10.
