# Kickoff — eerste taak

## Doel van deze sessie

Een **lege Y-App extensie** opzetten in deze eigen repo, geïnspireerd op
Bouwmeester maar volledig op zichzelf staand. Aan het eind:

- `npm run dev` draait op poort 5174
- Browser op `http://localhost:5174/` toont titel + bewijs dat seed-data is
  geladen + bridge-status
- In Y-App Developer-modus kan ik die URL plakken en de extensie laadt in
  het iframe
- `docs/bridge-api.md` bestaat met complete bridge-documentatie
- GitHub-repo bestaat, GitHub Pages deploy is gelukt

**Geen wizard, geen tekening, geen PDF, geen ERPNext-mapping.** Alleen
een gezonde basis.

## Werkomgeving

- Deze repo (`yapp-ext-keukenblad-opname/`) is je werkmap.
- `../bouwmeester/` bestaat op het filesysteem als **read-only referentie**.
- **Schrijf NOOIT bestanden in `../bouwmeester/`.** Niet eens een tijdelijke
  notitie. Alles wat je leert noteer je in `docs/` van deze repo.

## Stap-voor-stap

### 1. Lees referentiemateriaal

Lezen, niet schrijven. Volgorde:

1. `CLAUDE.md` in repo-root (deze repo)
2. `docs/seed-data.md` (uitleg seed-data)
3. `src/data/seed-types.ts` (volledig domein)
4. **`../bouwmeester/src/bridge.ts`** (kritieke referentie)
5. `../bouwmeester/vite.config.ts`
6. `../bouwmeester/package.json` (welke dependency-versies werken)
7. `../bouwmeester/.github/workflows/` (deploy-flow)
8. Indien aanwezig: `../bouwmeester/README.md` of `docs/`

Maak na het lezen een samenvatting in chat van:
- Welke bridge-methodes bestaan?
- Hoe wordt postMessage ingericht (origin-check, message-types)?
- Hoe vangt Bouwmeester de URL-params (`host`, `instance`, `erpUrl`, `lang`) op?
- Welke versies/dependencies gebruikt Bouwmeester?

### 2. Schrijf `docs/bridge-api.md`

Een compleet API-document met:

- Lijst van methodes met signatures + return types
- **Hoe maak je een NIEUW document aan?** (Quotation insert)
- **Hoe upload je een file?** (PDF, foto's)
- URL-params verwerking
- Error-handling-patronen
- Open vragen waar Bouwmeester onduidelijk is

Dit document is ons contract. Alle latere code in deze repo verwijst hierheen.

### 3. Setup deze repo

Nieuwe, eigen `package.json`, `vite.config.ts`, `tsconfig.json` — **niet
gekopieerd uit Bouwmeester zonder denken**, maar wel met dezelfde versies
om compat-issues te vermijden.

- Vite dev-server: **poort 5174**
- React 18 + TypeScript (versies = Bouwmeester)
- GitHub Pages base-path: `/yapp-ext-keukenblad-opname/` (of wat de
  uiteindelijke repo-naam ook wordt — check met mij voor je commit)
- Toe te voegen dependencies: `jspdf`, `svg2pdf.js`, `vitest`

### 4. Bevestig repo-naam met mij

Voordat je de remote configureert: stel mij twee opties voor (bv.
`yapp-ext-keukenblad-opname` of `Y_App-extension-keukenblad-opname`) en
wacht op mijn keuze. De base-path in `vite.config.ts` hangt hiervan af.

### 5. Schrijf je eigen `src/bridge.ts`

Op basis van wat je in Bouwmeester hebt gezien. Niet een 1-op-1 copy-paste
zonder aanpassing — maar wel functioneel hetzelfde. Naming en structuur mag
afwijken als jouw versie helderder is. Documenteer afwijkingen in chat.

Belangrijke gedragsregels:
- **Graceful fallback** wanneer geopend zonder Y-App-context (bv. directe
  browsernavigatie naar `localhost:5174`). Geen crashes, wel duidelijke
  console-warning "Geen Y-App context — alleen UI-test".
- Origin-check op binnenkomende messages (security).
- Type-safe interfaces voor alle methodes.

### 6. Hello-world `src/App.tsx`

Importeer `seed-data.json` en `seed-types.ts`. Toon op het scherm:

```
Keukenblad Opname (extensie v0.1.0)

Seed-data: versie X.Y.Z, geladen op <timestamp>
  - Materialen: 11 (561 kleuren totaal)
  - Zichtzijden: 21
  - Werkstukken: 23

Y-App context:
  Status: <connected|disconnected>
  Host: <waarde of "n.v.t.">
  Instance: <waarde of "n.v.t.">
  ERP-URL: <waarde of "n.v.t.">
  Taal: <waarde of "nl (default)">

Wizard volgt in volgende sessie.
```

### 7. GitHub Pages workflow

Eigen `.github/workflows/deploy.yml`, geïnspireerd op Bouwmeester. Pas
paths aan voor deze repo. Push naar `main` → automatische deploy.

### 8. README.md

Korte project-README:
- Wat is dit (1 alinea + link naar De Keukenbladenfabriek)
- Lokaal draaien: `npm install`, `npm run dev`
- **Hoe testen in Y-App:**
  1. Open Y-App → Extensies → Geavanceerd / Ontwikkelaar
  2. Plak `http://localhost:5174/` als custom URL
  3. Klik Installeren
  4. Extensie verschijnt in de zijbalk
- Link naar `CLAUDE.md` voor verdere docs

### 9. Commit & push naar eigen GitHub-repo

Atomic commits:
- `chore: initial Vite + React + TypeScript setup`
- `feat: add bridge wrapper based on Bouwmeester reference`
- `feat: add hello-world page with seed-data and bridge status`
- `docs: add bridge-api documentation`
- `ci: add GitHub Pages deploy workflow`

Push naar `main`. Verifieer dat GitHub Pages succesvol bouwt en de URL
bereikbaar is.

## Definition of done voor deze sessie

- [ ] Samenvatting van Bouwmeester gepost in chat
- [ ] `docs/bridge-api.md` bestaat en is bruikbaar als referentie
- [ ] Repo-naam bevestigd met mij
- [ ] `npm install` werkt zonder errors
- [ ] `npm run dev` start op poort 5174
- [ ] `http://localhost:5174/` toont titel + seed-info + bridge-status
- [ ] In Y-App Developer-modus geïnstalleerd met die URL → extensie laadt
- [ ] `npm run build` werkt zonder errors
- [ ] GitHub-repo aangemaakt, code gepusht
- [ ] GitHub Pages deploy is succesvol
- [ ] **Niets gewijzigd in `../bouwmeester/`** — bevestig dit expliciet
- [ ] Open vragen-lijst aan mij gegeven

## Wat NIET doen in deze sessie

- Niets schrijven in `../bouwmeester/`. Lezen alleen.
- Geen wizard-screens, tekening, PDF, ERPNext-mapping
- Geen catalogus-PR voorbereiden (komt pas als 't werkt)
- Geen styling-systeem opbouwen zonder eerst Bouwmeester's keuze te zien
- Geen extra dependencies buiten wat hierboven staat

## Open vragen om mee af te sluiten

Eindig met een lijstje in chat van vragen voor mij. Waarschijnlijk
onderwerpen:

- Bridge-methode voor file-upload — bestaat 'm in Bouwmeester? Zo nee, hoe
  doen andere extensies (KG Planning, 3BM) het?
- Manifest/identificatie van de extensie — heeft de Y-App catalogus
  metadata-bestand nodig (naam, icoon, beschrijving, organisatie)?
- Welke ERPNext custom fields bestaan al op Quotation? Mogen wij `kbf_*`
  prefix gebruiken?
- Bestaat er publieke Y-App extensie-documentatie buiten de Bouwmeester-
  broncode?
