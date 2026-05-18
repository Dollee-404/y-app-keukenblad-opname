# Sprint 6 taak 10 — Orientation-keuze herzien: altijd portrait

## Wijziging

Auto-detect orientation in `genereerWerkplaatstekening()` wordt
vervangen door **altijd portrait**, conform Vasto-conventie.

Reden: werkplaats werkt met klembord/papierstapel — consistente
oriëntatie weegt zwaarder dan optimaal tekenrendement per blad.

## Concrete code-wijziging

In de generator (`src/pdf/generator.ts` of vergelijkbaar):

```ts
// Was:
const orientation = blad.breedte > blad.hoogte * 1.3 ? 'landscape' : 'portrait'

// Wordt:
const orientation: 'portrait' | 'landscape' = blad.orientation ?? 'portrait'
```

## Datamodel-uitbreiding

`Blad` krijgt een optioneel override-veld:

```ts
interface Blad {
  // ... bestaande velden
  orientation?: 'portrait' | 'landscape'  // override default 'portrait'
}
```

Niet exposen in UI nu — alleen beschikbaar als programmatische override
voor toekomstige uitzonderingen. Documenteer dit in een code-comment.

## Tekening-schaling bij brede bladen op portrait A4

Brede bladen (zoals 1958×1001 of 2760×600) worden nu op portrait
gerenderd. Dat is krap maar werkbaar — Vasto doet dit ook.

Pas de tekening-schaling aan zodat:
- Bij elk blad de tekening + maatvoering past binnen de beschikbare
  pagina-ruimte (na header en footer)
- Maatlabels niet kleiner worden dan 7pt (anders onleesbaar)
- Bij zeer extreme ratios (>5:1) optionele waarschuwing in console,
  maar geen fout

## Niet aanraken

- Footer-rendering (portrait variant) — al goed
- Header-rendering (portrait variant) — al goed
- Tekening-inhoud zelf (sparingen, boorgaten, randafwerking, maatvoering)
- `genereerWerkplaatstekening` signatuur — `Promise<Blob>` blijft
- `bladIds` filter — blijft werken

## Landscape-renderer niet weggooien

De landscape-render-code blijft staan — wordt later mogelijk gebruikt
voor:
- **Sprint 7** klantbevestiging-PDF (komt meestal naar consumenten die
  digitaal lezen, landscape leest prettiger op scherm)
- **Toekomstige A3-print-modus**

Markeer in code:
```ts
// Landscape-variant beschikbaar via renderHeaderLandscape() etc.
// Niet aangeroepen door werkplaatstekening-generator — bewaard voor
// sprint 7 klantbevestiging en toekomstige A3-modus.
```

## Verificatie

Re-render alle drie de test-scenario's:
1. **Single-blad test** (1958×1001) → 1 pagina portrait, krap maar
   leesbaar. Vergelijk met Vasto pagina 1 (`Zaagtekeningen.pdf`).
2. **Multi-blad test** (3 bladen) → 3 pagina's, **allemaal portrait**.
   Doorbladeren leest nu rustig.
3. **Bladfilter test** → 1 pagina portrait.

Screenshot naar Eelke voor akkoord vóór commit.
