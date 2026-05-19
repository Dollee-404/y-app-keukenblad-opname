# Step4 actie-zone — UI/UX herziening

## Probleem-analyse

De huidige actie-zone heeft drie problemen die de inmeter onnodig
laten denken:

**1. Twee concurrerende primary-stijlen.**
"Concept opslaan" (teal) en "Verzenden naar ERPNext" (donker) vechten
beide om aandacht. De inmeter ziet twee even-belangrijke knoppen en
moet zelf bepalen wat de hoofdactie is. Dat is een keuze die de UI
zou moeten maken.

**2. Twee verspreide actie-clusters.**
Links: PDF + ERPNext (3 knoppen). Rechts: Print preview + Concept
opslaan (2 knoppen). Vijf knoppen verdeeld over twee zones zonder
duidelijke logica. De inmeter moet over het scherm scannen om te
zien wat-waar zit.

**3. "Print preview" is overbodig.**
"Werkplaatstekening" en "Zaagbrief" genereren al de PDFs die hij
kan bekijken. Een aparte "Print preview" knop voegt verwarring toe
zonder functionaliteit te leveren — wat zou hij previewen, en
waarom in een aparte knop?

## Ontwerp-principes voor de oplossing

**1. Eén primary-actie per scherm.**
De inmeter moet in één oogopslag zien: "wat is hier de hoofdactie?"
Voor Step4 is dat **"Verzenden naar ERPNext"** — dat is letterlijk
het doel van de hele wizard. Alle andere acties zijn ondersteunend.

**2. Acties groeperen op functie, niet op locatie.**
- *Eindactie* (hoofdtaak): Verzenden naar ERPNext
- *Tussenacties* (intermediate): Concept opslaan
- *Bijwerk-acties* (output): PDFs downloaden

**3. Visuele hiërarchie via stijl, niet via positie.**
Primary > Secondary > Tertiary. Niet links vs rechts.

## Concrete fix

### Verwijderen
- "Print preview" knop — overbodig

### Knoppen-rij herstructureren — één rij rechts onderaan

```
                                          [📄 Werkplaatstekening]  [📋 Zaagbrief]  [Concept opslaan]  [Verzenden naar ERPNext]
                                          tertiary outline         tertiary outline  secondary teal     PRIMARY teal vol
```

Logica van rechts naar links lezen:
- **Rechts (meest dominant)**: Verzenden naar ERPNext — de eindactie,
  groot, teal, vol
- **Daarnaast**: Concept opslaan — secondary teal outline of lichter
  teal, want het is een veilig-stellen-actie maar niet de eindactie
- **Daarvoor**: PDF-knoppen — tertiary outline, kleinere visuele
  prominence want het zijn output-acties die niet altijd nodig zijn

Alles op één rij, rechts uitgelijnd. Geen links/rechts versplintering.

### Stijl-tokens

| Knop | Variant | Kleur | Border | Tekstkleur |
|---|---|---|---|---|
| Verzenden naar ERPNext | primary | teal vol (`#0F766E` of jullie teal-700) | geen | wit |
| Concept opslaan | secondary | teal-50 fill (`#F0FDFA`) | teal-300 border | teal-700 |
| Werkplaatstekening | tertiary | transparent | gray-300 border | gray-700 |
| Zaagbrief | tertiary | transparent | gray-300 border | gray-700 |

Tussenruimte: 12px tussen knoppen, met iets meer ruimte (~24px)
tussen tertiary-groep en secondary/primary om de visuele scheiding
te markeren.

### Disabled-states

- **Verzenden naar ERPNext** disabled bij: geen klant, geen bladen,
  of bezig met andere actie. Tooltip per oorzaak (al geïmplementeerd
  in 8c.1).
- **Concept opslaan** disabled bij: geen wijzigingen sinds laatste
  opslag (optioneel, of altijd actief).
- **PDF-knoppen** disabled bij: geen bladen.

### Loading-states

Tijdens een actie:
- Actieve knop: spinner + "Bezig…"
- Andere knoppen: disabled om dubbele acties te voorkomen
- Behalve PDF-knoppen onderling — die mogen parallel (al
  geïmplementeerd in taak 12)

## Responsive — kleinere schermen (tablet)

Op breedte < 768px:
- Knoppen wrappen naar twee rijen
- Volgorde behoudt prominentie: eerste rij = primary + secondary
  (Verzenden naar ERPNext + Concept opslaan), tweede rij = tertiary
  PDF-knoppen
- Alle knoppen full-width binnen hun rij voor goede tap-targets

## Verwacht eindbeeld

Inmeter ziet één rij rechts onderaan:

```
[Werkplaatstekening]  [Zaagbrief]    [Concept opslaan]    [Verzenden naar ERPNext]
```

In één oogopslag duidelijk:
- "Verzenden naar ERPNext" is **de actie** die ik wil doen
- "Concept opslaan" als ik nog niet wil verzenden maar wel bewaren
- PDF-knoppen voor als ik output nodig heb voor de werkplaats/klant

Geen denkwerk over welke knop primair is. Geen versplintering over
het scherm.

## Niet aanraken

- Bladen-grid en accessoires-zone — staat goed
- Step-pills bovenaan — staat goed
- Key-metrics (2 bladen, 2.83m², 9 accessoires) — staat goed
- Waarschuwing-banner ("1 blad incomplete randafwerking") — staat
  goed
- handleVerzendNaarERPNext-logica uit 8c.1 — werkt al

## Verificatie

Screenshot Step4 na fix. Check:
- [ ] "Print preview" weg
- [ ] Vier knoppen op één rij rechts onderaan
- [ ] "Verzenden naar ERPNext" dominantste visuele aanwezigheid
- [ ] "Concept opslaan" secondary maar duidelijk aanwezig (niet
      uitwisselbaar met PDF-knoppen)
- [ ] PDF-knoppen tertiary, leesbaar maar visueel ondergeschikt
- [ ] Bij tablet-breedte: wrap naar twee rijen, prominent eerst

Screenshot naar Eelke voor akkoord vóór door naar stap 8c.2 (echte
bridge-call).
