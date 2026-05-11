# Keukenblad Opname — Y-App extensie

## Wat dit project is

Dit is een **op zichzelf staande Y-App extensie** voor De Keukenbladenfabriek.
Het is een aparte repo, een aparte deploy, een aparte extensie in de Y-App
catalogus.

Inmeters gebruiken deze extensie op tablet om keukenbladen ter plaatse op
te nemen. Output:

1. Werkplaatstekening (PDF) voor de tekenaar bij Vasto
2. Klantbevestiging (PDF) voor de eindklant met handtekening-veld
3. Quotation in ERPNext (rate=0 — prijs vult kantoor in)

## Wat dit project NIET is

- **Geen onderdeel van Bouwmeester.** Bouwmeester is een *andere* Y-App
  extensie die we alleen als referentie raadplegen. We voegen niets toe aan
  Bouwmeester. We wijzigen niets in Bouwmeester.
- **Geen onderdeel van de Y-App codebase zelf.** We werken niet in de
  Y-App repo. We voegen daar niets toe.
- **Geen monorepo of workspace.** Deze repo heeft één `package.json` en is
  volledig op zichzelf installeerbaar.

## Architectuur — Y-App extensie

Y-App heeft een **extensie-catalogus** waarin extensies in een **sandboxed
iframe** draaien. Twee installatie-paden:

| Pad | Voor |
|---|---|
| Custom URL — `http://localhost:5174/` | Lokale ontwikkeling (deze sessie) |
| Gepubliceerde extensie | Eigen GitHub repo + GitHub Pages, dan PR naar de Y-App catalogus |

**Hoe het werkt:**

- ERPNext-aanroepen lopen via de **Y-App browsertab** en hergebruiken de
  ERPNext-sessie van de actieve tab. De extensie heeft GEEN eigen
  credentials en kan ze ook niet zien.
- Communicatie tussen extensie en Y-App host gebeurt via **`postMessage`**.
- De extensie ontvangt context-info via URL-params: `host`, `instance`,
  `erpUrl`, `lang`.

## Bouwmeester — geen lokale afhankelijkheid

Bouwmeester is een *andere* Y-App extensie van dezelfde organisatie. We
hebben geen lokale kopie en hoeven er niet in te kijken. De eigen
`bridge.ts`, `vite.config.ts` en workflows zijn al geschreven in Sprint 1
en zijn volledig zelfstandig.

Visueel meekijken hoe Bouwmeester dingen doet in de Y-App UI (interactie-
patronen, layout) mag als referentie voor onze eigen keuzes, maar we zoeken
niet in broncode of klonen niets.

## Andere referentie-extensies

Voor vragen over file-upload, handtekeningveld e.d.:

- **KG Planning** — `https://impertio-studio.github.io/Y_App-extension-kg-planning/`
- **Projectplanning 3BM** — `https://piyton.github.io/yapp-ext-3BMEng-projectplanning/`

## Repo-structuur (deze repo, op zichzelf)

```
yapp-ext-keukenblad-opname/         ← deze repo, eigen GitHub repo
├── CLAUDE.md                        ← projectbriefing
├── README.md
├── package.json                     ← eigen, niet gedeeld
├── vite.config.ts                   ← eigen (geïnspireerd op Bouwmeester)
├── tsconfig.json
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── bridge.ts                    ← eigen kopie/aanpassing van Bouwmeester
│   ├── data/
│   │   ├── seed-data.json           ← al aanwezig vanaf kickoff
│   │   └── seed-types.ts            ← al aanwezig vanaf kickoff
│   ├── components/                  ← onze UI
│   ├── pages/                       ← wizard-screens
│   ├── drawing/                     ← SVG canvas + geometry
│   ├── pdf/                         ← werkplaats + klant PDF
│   └── erpnext/                     ← Opname → Quotation mapping
├── docs/
│   ├── kickoff.md                   ← deze sprint
│   ├── seed-data.md                 ← uitleg seed-data
│   ├── domein-analyse.md            ← (optioneel) gap-analyse
│   └── bridge-api.md                ← genereer in sessie 1
└── .github/workflows/
    └── deploy.yml                   ← GitHub Pages workflow
```

**Niets buiten deze repo wijzigen.** Geen symlinks, geen `npm link` met
Bouwmeester, geen monorepo-tooling.

## Tech-stack

| Onderdeel | Keuze |
|---|---|
| Framework | React 19 + Vite 8 + TypeScript 5 |
| Dev-poort | **5174** (Y-App custom URL-conventie) |
| Styling | Tailwind v4 (`@import "tailwindcss"`) — zie bestaande componenten |
| State | `useReducer` of Zustand — niet Redux |
| Tekening | Native React SVG (geen externe canvas-lib) |
| PDF | `jspdf` + `svg2pdf.js` |
| Tests | Vitest, voor pure geometry/mapping logic |
| Hosting | GitHub Pages |
| Repo-naam | **`yapp-ext-keukenblad-opname`** (3BM-conventie, korte lowercase) |

## Datamodel — single source of truth

Het complete domein staat al klaar:

- **`src/data/seed-data.json`** — alle vaste lijsten: 11 materialen met
  561 kleuren, 21 zichtzijden, 23 werkstukken, sparingen, accessoires,
  clausules, bedrijfsgegevens
- **`src/data/seed-types.ts`** — TypeScript types + helpers
- **`docs/seed-data.md`** — uitleg seed-data
- **`docs/domein-analyse.md`** — gap-analyse t.o.v. Vasto zaagbrief /
  orderbevestiging / factuur

Het hoofdtype `Opname` in `seed-types.ts` is het centrale datamodel. Alles —
formulier, SVG-renderer, PDF-export, ERPNext-mapping — gaat hier vanuit.

**Verzin geen nieuwe enums of datavormen** als ze al in `seed-types.ts`
staan.

## Domeintaal (NL — niet vertalen)

- **Blad** = een fysiek stuk materiaal (werkblad, achterwand, vensterbank...)
- **Zichtzijde** = randafwerking-code (DV40, T1-EF, KF, ...)
- **Sparing** = uitsparing in het blad (boorgat, spoelbak, kookplaat, ...)
- **Verstek** = 45° hoekverbinding tussen stukken
- **Vlakbouw** = inbouwwijze waarbij apparaat gelijk ligt met blad
- **Werkstuktype** = Bladdeel A/B/C..., Achterwand, Eiland, Vensterbank, ...
- **Opname** = de complete dataset die de inmeter verzamelt

## UI-eisen

- **Touch-first** — alle interactieve elementen min. 44×44px
- **Wizard met 4 stappen**:
  1. Project & klant
  2. Tekening (dual mode: vrij tekenen OF foto importeren + overtrekken)
  3. Specificaties (materiaal, zichtzijden per blad, sparingen, accessoires)
  4. Overzicht & opslaan (PDF previews + ERPNext-opslag)
- **Offline-first** — werkt zonder netwerk, sync zodra verbinding er is
  (lokaal in localStorage)
- **Taal** — alles in het Nederlands
- **Geen externe API-calls** behalve via de bridge

## ERPNext-koppeling (via onze eigen bridge.ts)

- **DocType**: `Quotation` (NIET Sales Order — prijs onbekend bij opname)
- **Items**: één regel per onderdeel met `rate: 0`:
  - "Aanrechtblad [materiaal] [kleur] [dikte]mm" → qty = m²
  - "Randafwerking [code]" → qty = strekkende meter
  - "Sparing [type]" → qty = stuks
- **Custom fields** op Quotation:
  - `kbf_opname_json` (Long Text) — volledige Opname als JSON
  - `kbf_tekening_pdf` (Attach) — werkplaatstekening
  - `kbf_inmeter` (Link → User)
  - `kbf_meetdatum` (Date)

Upload-volgorde: eerst PDF + foto's → dan Quotation aanmaken met file-references.

## Werkwijze voor jou (Claude Code)

1. **Werk uitsluitend in deze repo.** Niet schrijven buiten
   `ext-keukenblad-opname/`. Niet in Bouwmeester, niet in de Y-App repo.
2. **Lees eerst** de relevante sprint-doc in `docs/`, daarna
   `src/data/seed-types.ts`. De bridge-API staat al in `docs/bridge-api.md`.
3. **Pure functions** voor geometry/mapping, gescheiden van React. Test met
   Vitest.
4. **Vraag bij twijfel** over bridge-methodes en ERPNext-schemas — niet gokken.
5. **Commit per logische stap** — liever 10 kleine dan 1 grote.

## Wat NIET te doen

- **Niets wijzigen buiten deze repo.** Niet in Bouwmeester, niet in Y-App.
- Geen Bouwmeester-broncode zoeken, klonen of lezen
- Geen monorepo-setup, geen npm workspaces, geen symlinks
- Geen prijzen in de opname-flow (komen uit kantoor)
- Geen externe authenticatie of credentials (bridge regelt alles)
- Geen nieuwe dependencies zonder eerst te vragen
- Geen Excel-export — vervangt juist Excel

## Huidige sprint

Sprint 3a — zie `docs/sprint-3a-tekening.md`.
