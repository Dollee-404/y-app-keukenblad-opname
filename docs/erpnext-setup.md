# ERPNext setup — Keukenbladen Opname custom fields

## Overzicht

Vijf custom fields op DocType **Quotation** voor de KBF Opname extensie.
Eenmalig aanmaken per ERPNext-instance. Niet via de extensie zelf.

## Veld-definities

| fieldname | label | fieldtype | details |
|---|---|---|---|
| `kbf_section` | Keukenbladen Opname | Section Break | Collapsible sectie, anker voor de vier velden |
| `kbf_opname` | Opname | Check | Boolean: deze Quotation is aangemaakt via de opname-extensie |
| `kbf_meetdatum` | Meetdatum | Date | Datum waarop de inmeting plaatsvond |
| `kbf_inmeter` | Inmeter | Data | Naam of e-mail van de inmeter |
| `kbf_opname_json` | Opname JSON | Long Text | Volledige Opname als JSON-string (hidden — alleen voor debug/export) |

## Aanmaken via API

Vereist: ERPNext API key + secret met System Manager rechten.

```bash
export ERPNEXT_URL="https://jouw-instance.example.com"
export ERPNEXT_KEY="your_api_key"
export ERPNEXT_SECRET="your_api_secret"

# Section break
curl -X POST \
  -H "Authorization: token $ERPNEXT_KEY:$ERPNEXT_SECRET" \
  -H "Content-Type: application/json" \
  "$ERPNEXT_URL/api/method/frappe.client.insert" \
  -d '{"doc":{"doctype":"Custom Field","dt":"Quotation","fieldname":"kbf_section","label":"Keukenbladen Opname","fieldtype":"Section Break","insert_after":"supplier_quotation","collapsible":1}}'

# kbf_opname (Check)
curl -X POST \
  -H "Authorization: token $ERPNEXT_KEY:$ERPNEXT_SECRET" \
  -H "Content-Type: application/json" \
  "$ERPNEXT_URL/api/method/frappe.client.insert" \
  -d '{"doc":{"doctype":"Custom Field","dt":"Quotation","fieldname":"kbf_opname","label":"Opname","fieldtype":"Check","insert_after":"kbf_section","default":"0"}}'

# kbf_meetdatum (Date)
curl -X POST \
  -H "Authorization: token $ERPNEXT_KEY:$ERPNEXT_SECRET" \
  -H "Content-Type: application/json" \
  "$ERPNEXT_URL/api/method/frappe.client.insert" \
  -d '{"doc":{"doctype":"Custom Field","dt":"Quotation","fieldname":"kbf_meetdatum","label":"Meetdatum","fieldtype":"Date","insert_after":"kbf_opname"}}'

# kbf_inmeter (Data)
curl -X POST \
  -H "Authorization: token $ERPNEXT_KEY:$ERPNEXT_SECRET" \
  -H "Content-Type: application/json" \
  "$ERPNEXT_URL/api/method/frappe.client.insert" \
  -d '{"doc":{"doctype":"Custom Field","dt":"Quotation","fieldname":"kbf_inmeter","label":"Inmeter","fieldtype":"Data","insert_after":"kbf_meetdatum"}}'

# kbf_opname_json (Long Text, hidden)
curl -X POST \
  -H "Authorization: token $ERPNEXT_KEY:$ERPNEXT_SECRET" \
  -H "Content-Type: application/json" \
  "$ERPNEXT_URL/api/method/frappe.client.insert" \
  -d '{"doc":{"doctype":"Custom Field","dt":"Quotation","fieldname":"kbf_opname_json","label":"Opname JSON","fieldtype":"Long Text","insert_after":"kbf_inmeter","hidden":1}}'
```

## Verificatie

```bash
curl -H "Authorization: token $ERPNEXT_KEY:$ERPNEXT_SECRET" \
  "$ERPNEXT_URL/api/resource/Custom%20Field?filters=%5B%5B%22dt%22%2C%22%3D%22%2C%22Quotation%22%5D%2C%5B%22fieldname%22%2C%22like%22%2C%22kbf_%25%22%5D%5D&fields=%5B%22fieldname%22%2C%22fieldtype%22%2C%22label%22%5D"
```

Verwacht resultaat: 5 records (kbf_section + 4 velden).

## Rollback

```bash
for field in kbf_opname_json kbf_inmeter kbf_meetdatum kbf_opname kbf_section; do
  curl -X DELETE \
    -H "Authorization: token $ERPNEXT_KEY:$ERPNEXT_SECRET" \
    "$ERPNEXT_URL/api/resource/Custom%20Field/Quotation-$field"
done
```

## Instance-status

| Instance | Aangemaakt | Datum |
|---|---|---|
| drechtstedenbouw-erp.prilk.cloud | Ja | 2026-05-18 |
