# Sprint 11 — Offline-flow + concept-persistentie

## Doel

De extensie persistent maken over Y-App-sessies en browser-refreshes.
Inmeter kan een opname halverwege afbreken (tab sluit, batterij leeg,
Y-App refresh) en bij heropening exact verder gaan waar hij gebleven
was. Bij netwerk-uitval blijft de extensie werkbaar, alleen
ERPNext-verzending wordt uitgesteld.

## Vier aannames (al beslist met Eelke)

| Aspect | Keuze |
|---|---|
| Persistentie-niveau | Hele opname als concept, niet alleen quotationName |
| Concept-identificatie | Eén actief concept tegelijk (geen multi-concept-switching) |
| Sync-queue | Niet in sprint 11 — uitgesteld naar 11b of later |
| Offline-gedrag | Soft offline — knop disabled bij geen verbinding, geen auto-retry |

## Scope deze sprint

In scope:
- localStorage opslag van actieve opname
- Auto-save bij elke state-mutatie (of debounced)
- Hervatten bij app-open
- "Nieuwe opname" knop met confirm-modal als er een actief concept is
- Offline-detectie + UI-indicator
- ERPNext-knop disabled bij geen verbinding

Buiten scope (latere sprint):
- Sync-queue / auto-retry bij netwerk-terugkeer
- Multi-concept-lijst (concepten-overzicht, switchen tussen klanten)
- Cloud-sync (ERPNext als concept-opslag)
- Conflict-resolutie bij multi-device

## Datamodel

```ts
// Eén actief concept in localStorage
interface OpgeslagenConcept {
  opname: Opname                  // Volledig opname-object
  laatstGewijzigd: string         // ISO-datum
  versie: number                  // Schema-versie voor migraties
}

// localStorage key
const CONCEPT_KEY = 'kbf-opname-concept-v1'
```

`versie` is belangrijk: als datamodel later wijzigt (bv. nieuwe velden),
moet de loader weten of opgeslagen data nog compatibel is. Bij
incompatibele versie: oude concept verwerpen, opnieuw beginnen.

## Stap 11.1 — Concept opslaan + laden

`src/storage/conceptOpslag.ts`:

```ts
const CONCEPT_KEY = 'kbf-opname-concept-v1'
const HUIDIGE_VERSIE = 1

export function opslaanConcept(opname: Opname): void {
  try {
    const concept: OpgeslagenConcept = {
      opname,
      laatstGewijzigd: new Date().toISOString(),
      versie: HUIDIGE_VERSIE,
    }
    localStorage.setItem(CONCEPT_KEY, JSON.stringify(concept))
  } catch (err) {
    console.warn('[concept-opslag] Kan concept niet opslaan:', err)
    // localStorage kan vol zijn of geblokkeerd (private mode)
    // Niet fataal — opname blijft in-memory werkend
  }
}

export function laadConcept(): Opname | null {
  try {
    const raw = localStorage.getItem(CONCEPT_KEY)
    if (!raw) return null

    const concept = JSON.parse(raw) as OpgeslagenConcept

    // Versie-check — incompatibele oudere versies verwerpen
    if (concept.versie !== HUIDIGE_VERSIE) {
      console.warn('[concept-opslag] Incompatibele versie, concept verwijderd')
      localStorage.removeItem(CONCEPT_KEY)
      return null
    }

    return concept.opname
  } catch (err) {
    console.warn('[concept-opslag] Kan concept niet laden:', err)
    return null
  }
}

export function wisConcept(): void {
  localStorage.removeItem(CONCEPT_KEY)
}

export function bestaatConcept(): boolean {
  return localStorage.getItem(CONCEPT_KEY) !== null
}
```

Unit tests voor alle vier de functies, inclusief edge cases:
- Lege localStorage → laadConcept returnt null
- Corrupt JSON → laadConcept returnt null, gooit niet
- Oude versie → verwerpen + cleanup
- localStorage geblokkeerd (mock throw) → opslaan logt warning, gooit niet

## Stap 11.2 — Auto-save bij state-mutaties

Bij elke dispatch naar opnameReducer een auto-save triggeren. Twee
opties:

**a) Direct na elke dispatch** (in App.tsx of opname-context)
```tsx
useEffect(() => {
  opslaanConcept(opname)
}, [opname])
```

**b) Debounced (500ms)** — voorkomt te veel writes bij snel typen
```tsx
useEffect(() => {
  const timer = setTimeout(() => {
    opslaanConcept(opname)
  }, 500)
  return () => clearTimeout(timer)
}, [opname])
```

**Voorkeur: b**. Inmeter typt opmerking-veld, geen 50 writes per
seconde. 500ms is onmerkbaar voor de inmeter maar veel gezonder
voor localStorage.

**Edge case:** als de extensie sluit voor de debounce-timer afloopt,
is de laatste wijziging verloren. Mitigatie: ook opslaan bij
`beforeunload`:

```tsx
useEffect(() => {
  const handler = () => opslaanConcept(opname)
  window.addEventListener('beforeunload', handler)
  return () => window.removeEventListener('beforeunload', handler)
}, [opname])
```

## Stap 11.3 — Hervatten bij app-open

In App.tsx bij mount:

```tsx
useEffect(() => {
  const concept = laadConcept()
  if (concept) {
    dispatch({ type: 'LAAD_OPNAME', opname: concept })
    // Optioneel: toon een toast "Concept hervat van [datum]"
  }
}, [])
```

Nieuwe reducer-action:
```ts
case 'LAAD_OPNAME':
  return action.opname
```

UI-indicatie: subtiel toast of header-melding bij hervatten zodat de
inmeter weet dat hij niet bij nul begint:

> *"Concept hervat — laatst gewijzigd 18 mei 2026 14:32"*

## Stap 11.4 — "Nieuwe opname" actie met confirm

Als de inmeter een nieuwe opname wil starten terwijl er een actief
concept is, moet hij dat bewust bevestigen — anders gaat eerder werk
verloren.

Knop "Nieuwe opname" toevoegen aan UI (header? Step1?). Bij klik:

```tsx
function handleNieuweOpname() {
  if (bestaatConcept()) {
    const ok = window.confirm(
      'Er is een actief concept. Dit wordt verwijderd als je een nieuwe opname start. Doorgaan?'
    )
    if (!ok) return
  }
  wisConcept()
  dispatch({ type: 'RESET_OPNAME' })
}
```

Reducer-action:
```ts
case 'RESET_OPNAME':
  return legeOpname(seedData)
```

Voor MVP: native `window.confirm()` volstaat. Mooie modal kan later
polish zijn.

## Stap 11.5 — Concept wissen na succesvolle verzending

Na succesvolle `createDocument` of `updateDocument` naar ERPNext: het
concept is "afgehandeld" en moet weg uit localStorage. Anders blijft
hij staan en wordt bij volgende opstart hervat — dat is verwarrend.

In Step4 handleVerzendNaarERPNext, na succes:

```ts
const result = await bridge.createDocument(...)
dispatch({ type: 'SET_QUOTATION_NAME', quotationName: result.name })
wisConcept()  // <-- nieuw
toonSucces(...)
```

Of bij update:
```ts
await bridge.updateDocument(...)
wisConcept()  // <-- nieuw
toonSucces(...)
```

**Belangrijk:** `quotationName` moet WEL bewaard blijven na verzending,
maar niet via localStorage want het concept zelf is weg. Twee opties:

a) **Quotation-naam in eigen localStorage-key**, los van het concept.
   Bij volgende start: laad alleen die naam, niet de hele opname.

b) **Concept blijft staan met quotationName erin**, alleen
   "afgehandeld"-vlag erbij. Inmeter ziet bij hervatten:
   "Concept is reeds verzonden, klik hier om een nieuwe te starten".

**Voorkeur: b**. Houdt context bij elkaar. Voeg veld toe aan
OpgeslagenConcept:

```ts
interface OpgeslagenConcept {
  opname: Opname
  laatstGewijzigd: string
  versie: number
  verzonden?: boolean   // true na succesvolle ERPNext-verzending
}
```

Na verzending wordt `verzonden: true` gezet i.p.v. wisConcept. Bij
hervatten met `verzonden: true`: toon banner "Deze opname is reeds
verzonden naar ERPNext als Quotation [naam]. Start een nieuwe opname
of bekijk de Quotation in ERPNext."

Bij "Nieuwe opname" knop wordt het concept dan wel echt gewist.

## Stap 11.6 — Offline-detectie + UI-indicator

`window.navigator.onLine` + `online`/`offline` events:

```tsx
// useNetworkStatus hook
function useNetworkStatus() {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  return online
}
```

**Belangrijke noot:** `navigator.onLine` detecteert alleen
browser-level connectiviteit (netwerk-kabel/wifi). Het detecteert NIET
of ERPNext bereikbaar is via de Y-App-bridge. Voor MVP: dit is goed
genoeg. Echte ERPNext-bereikbaarheid zou een ping-call vereisen,
overkill voor sprint 11.

UI-indicator: kleine banner of icoon in de header.

- Online: niets, of een subtiel "verbonden" indicator
- Offline: prominente banner "Geen internet — opnames worden lokaal
  bewaard, verzenden naar ERPNext is uitgeschakeld"

Geen alert of modal — niet-blokkerend, inmeter blijft werken.

## Stap 11.7 — ERPNext-knop disabled bij offline

In Step4 `handleVerzendNaarERPNext` knop:

```tsx
<button
  disabled={!online || disabledOmKlant || disabledOmBladen || busy}
  title={
    !online ? 'Geen internet — kan niet verzenden naar ERPNext'
    : disabledOmKlant ? 'Selecteer eerst een klant in stap 1'
    : disabledOmBladen ? 'Voeg eerst een blad toe in stap 2'
    : undefined
  }
>
  Verzenden naar ERPNext
</button>
```

PDF-knoppen blijven actief — die werken lokaal, hebben geen netwerk
nodig.

## Niet aanraken

- Bestaande state management (reducer pattern) — alleen uitbreiden
  met LAAD_OPNAME en RESET_OPNAME
- Mapper, validator, ERPNext-helpers uit sprint 10 — werken al
- PDF-generators — werken al, niet afhankelijk van netwerk
- Step1-2-3 schermen — geen wijzigingen in opname-flow

## Verificatie

### Geautomatiseerd
- Unit tests voor conceptOpslag (12+ tests, alle edge cases)
- Reducer-test voor LAAD_OPNAME en RESET_OPNAME
- Hook-test voor useNetworkStatus (mock navigator.onLine + events)

### Handmatig — 8 scenario's

1. **Auto-save** — vul Step1, refresh tab, alle data nog aanwezig
2. **Auto-save bij meerdere stappen** — vul Step1+2, refresh, beide
   stappen aanwezig
3. **Hervatten met toast** — bij refresh verschijnt toast "Concept
   hervat van [datum]"
4. **Nieuwe opname met confirm** — klik Nieuwe Opname → confirm dialog
   → na bevestigen leeg, na annuleren intact
5. **Verzenden + verzonden-banner** — verzend opname naar ERPNext,
   refresh, banner "Deze opname is reeds verzonden..."
6. **Verzonden + nieuwe opname** — vanaf scenario 5, klik Nieuwe
   Opname → bevestig, lege opname
7. **Offline-detectie** — devtools throttling offline, banner
   verschijnt, ERPNext-knop disabled met tooltip
8. **Offline → online** — schakel netwerk weer in, banner verdwijnt,
   ERPNext-knop weer actief

Screenshots naar Eelke per scenario.

## Workflow

1. **Stap 11.1** — conceptOpslag.ts + unit tests
2. **Stap 11.2** — Auto-save (debounced) + beforeunload-handler
3. **Stap 11.3** — Hervatten bij app-mount + toast
4. **Stap 11.4** — Nieuwe Opname knop + confirm
5. **Stap 11.5** — verzonden-vlag + banner na verzending
6. **Stap 11.6** — useNetworkStatus hook + offline banner
7. **Stap 11.7** — ERPNext-knop disabled bij offline
8. **Stap 11.8** — Handmatige scenario's testen, screenshots

Bij stap 11.1 expliciet akkoord vragen — als de opslag-API klopt is
de rest mechanisch.

## Edge cases om in gedachten te houden

**Bridge / Y-App context.** Y-App is een PWA die offline kan werken,
maar de bridge naar de Y-App parent werkt via postMessage. Als
Y-App zelf offline draait maar de bridge `createDocument` kan
synchroniseren via service-worker queue, dan zou dat eigenlijk de
plek zijn voor sync. Voor MVP: niet onze zorg, soft-offline volstaat.

**Concept met onbestaande customer-link.** Bij hervatten van een oud
concept kan het zijn dat de gekoppelde Customer in ERPNext inmiddels
verwijderd is. Geen probleem voor MVP — fout komt pas naar boven bij
verzenden. Eventueel een check toevoegen in sprint 13+ als productie-
relevant.

**localStorage quota.** Per browser ~5-10MB. Een complete opname met
foto's-als-base64 kan groot worden. Voor MVP: foto-attachments zitten
niet in opname (sprint 17 file-upload). Tekst-data van een opname blijft
onder 100KB.

**Multi-tab.** Inmeter opent extensie in twee tabs tegelijk. Beide
schrijven naar dezelfde localStorage-key. Last-write-wins. Acceptabel
voor MVP — gebruikers werken normaal in één tab.
