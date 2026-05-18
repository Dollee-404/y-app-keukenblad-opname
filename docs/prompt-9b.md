# Sprint 6 taak 9b — Materiaalcode + doorsneeprofiel-icoon

## Doel

Linker footer-cel ("materiaalcode (taak 9b)" placeholder) vullen met:
1. Materiaalcode bovenaan, vet
2. Doorsneeprofiel-icoon eronder

Beide portrait Vasto-getrouw én landscape redesign moeten dit krijgen.
In landscape staat het in de linkerzone bovenaan, in portrait in kolom 1
van de footer-grid.

## Wat is de materiaalcode

Format: `{dikte}{zichtzijde-code}` zonder spatie, **bold**, ~11pt.

Voorbeelden uit Vasto-pagina's:
- `20DV40` — 20mm dikte + DV40 randafwerking (verstek 40mm hoog)
- `20T1` — 20mm dikte + T1 (enkel facet)
- `30KF` — 30mm dikte + KF (kanten-facet)

Bron-data in seed: `blad.dikte` (uit MateriaalKeuze) + `randafwerking[zijde].code`
(uit Randafwerking-type).

**Welke zichtzijde-code gebruiken als blad meerdere randen heeft?**
Vasto-conventie: de **dominante** randafwerking — meestal de
verstek-rand als die er is, anders de meest gebruikte code op het blad.

Voorgestelde regel:
```ts
function hoofdRandcode(blad: Blad): string {
  const codes = blad.randafwerking.map(r => r.code)
  // Prioriteit: DV* > KF > T* > rest
  const dv = codes.find(c => c.startsWith('DV'))
  if (dv) return dv
  const kf = codes.find(c => c === 'KF')
  if (kf) return kf
  const t = codes.find(c => c.startsWith('T'))
  if (t) return t
  return codes[0] ?? 'T1'  // fallback
}
```

Bespreek met Eelke of dit klopt vóór implementatie — kan zijn dat in
de praktijk altijd de "duurste" randafwerking de materiaalcode bepaalt.

## Wat is het doorsneeprofiel

Een **klein technisch icoon** dat de fysieke vorm van de randafwerking
in dwarsdoorsnede toont. Bekijk Vasto pagina 1 (DV40) en pagina 3 (T1)
voor referentie.

### Type 1 — Verstek-profielen (DV20, DV30, DV40)

Een verdiepte rand met getoonde verstek-hoogte:

```
  ┌─── label "20MM" ───┐
  │                    │\
  │                     \      ← verstekhoek (~45°)
  │      ▓▓▓▓▓▓▓▓▓▓     ─┐
  │      ▓▓▓▓▓▓▓▓▓▓      │
  └──────▓▓▓▓▓▓▓▓▓▓     ─┘   ← label "40MM" (totaal hoog)
```

- Bovenste maat (`20MM`) = blad-dikte
- Rechter maat (`40MM` voor DV40) = totale verstek-hoogte
- Gearceerde rechthoek = de "extra" rand die onderop is gelijmd
- Verstek-driehoekje rechtsboven = de verstekhoek waar het bovenblad
  in overgaat naar de onderrand

### Type 2 — Enkele profielen (T1, T2, KF, etc)

Simpele rechthoekige doorsnede met alleen blad-dikte:

```
  ┌──────────────────┐
  │      20MM        │
  └──────────────────┘
```

Geen verstek, geen arcering, alleen rechthoek met "{dikte}MM" tekst
binnenin.

### Type 3 — Facet-profielen (T1-EF, A-codes)

Rechthoek met **kleine schuine afsnijding** rechtsboven:

```
  ┌────────────────╲
  │     20MM        ╲
  └──────────────────┘
```

## Implementatie

### Stap 1 — Type-detectie helper

```ts
type ProfielType = 'verstek' | 'facet' | 'recht'

function profielType(code: string): ProfielType {
  if (code.startsWith('DV')) return 'verstek'
  if (code.endsWith('-EF') || code.startsWith('A')) return 'facet'
  return 'recht'
}

function verstekHoogte(code: string): number | null {
  // DV40 → 40, DV30 → 30, DV20 → 20
  const m = code.match(/^DV(\d+)$/)
  return m ? parseInt(m[1], 10) : null
}
```

### Stap 2 — Iconen-rendering (SVG via jsPDF)

Maak één functie `tekenDoorsneeprofiel(pdf, x, y, breedte, hoogte, dikte, code)`
die op basis van `profielType(code)` het juiste icoon tekent.

**Afmetingen (in mm voor PDF):**
- Icoon-bounding-box: ~22mm breed × ~12mm hoog (past in materiaalcode-cel)
- Lijndikte: 0.3mm
- Tekst: 6pt regular
- Arcering: parallelle lijnen onder 45°, ~0.5mm spacing, 0.2mm lijndikte

### Stap 3 — Cel-layout (portrait)

Kolom 1 materiaalcode-cel:
- Boven: materiaalcode 11pt bold (bv. "20DV40"), padding 2mm links/boven
- Onder: doorsneeprofiel-icoon, gecentreerd horizontaal in cel,
  ~2mm padding tot onderrand cel

### Stap 4 — Cel-layout (landscape)

Linkerzone, bovenaan info-blok:
- Regel 1 (was leeg): materiaalcode 11pt bold + icoon rechts ernaast
  op dezelfde hoogte
- Voorbeeld: `20DV40  [icoon]`
- Rest van info-blok (kleur, klant, datum) blijft hetzelfde

## Concreet voor Vasto-test-data

Met huidige test-blad (1958×1001, 20mm, DV40):
- Materiaalcode: `20DV40`
- Profiel-type: `verstek`
- Icoon: rechthoek 20mm hoog (label "20MM" boven), verstek-driehoek
  rechtsboven (~45°), gearceerde rechthoek 20mm hoog eronder
  (label "40MM" rechts voor totaal)

## Niet meenemen

- Edge cases voor exotische codes (alleen DV, T, KF, EF nu)
- Productie-route-balk (komt later, sprint 8?)
- Andere taken — uitsluitend kolom 1 / linkerzone-bovenaan vullen

## Verificatie

Render twee test-PDFs:
1. Portrait (Vasto-getrouw) met DV40 — vergelijk met
   `Zaagtekeningen.pdf` pagina 1
2. Landscape redesign met DV40 — controleer dat icoon visueel
   uitlijnt met "20DV40" tekst

Bonus: render een derde PDF met T1 randafwerking (geen verstek) om
profielType-switch te valideren.

Screenshot beide naar Eelke voor akkoord.

## Volgorde

Voorstel: eerst alléén de verstek-variant implementeren (DV40 → werkend
icoon). Akkoord, daarna T1/recht-variant erbij. Akkoord, dan facet-variant.

Drie kleinere iteraties met visuele check tussendoor is veiliger dan
één grote oplevering die voor 70% goed is en je niet kunt aanwijzen
waar het misgaat.
