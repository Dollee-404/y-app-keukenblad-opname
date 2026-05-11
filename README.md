# Keukenblad Opname — Y-App extensie

Y-App extensie voor **De Keukenbladenfabriek** waarmee inmeters keukenbladen
ter plaatse digitaal opnemen op tablet. Vervangt het Excel-werkproces.

Output: werkplaatstekening (PDF), klantbevestiging (PDF), Quotation in ERPNext.

---

## Lokaal draaien

```bash
npm install
npm run dev
```

Opent op `http://localhost:5174/`.

## Testen in Y-App

1. Open Y-App → **Instellingen** → **Extensies** → **Geavanceerd / Ontwikkelaar**
2. Plak `http://localhost:5174/` als custom URL
3. Klik **Installeren**
4. Extensie verschijnt in de zijbalk

## Documentatie

Zie [CLAUDE.md](./CLAUDE.md) voor projectbriefing, datamodel en werkwijze.
Zie [docs/bridge-api.md](./docs/bridge-api.md) voor de Y-App bridge API.
