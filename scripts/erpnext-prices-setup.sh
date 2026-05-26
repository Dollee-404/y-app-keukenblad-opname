#!/usr/bin/env bash
# Stap 1: maakt ontbrekende toeslag-items aan (boorgaten, sparingen, randen, verstek).
# Stap 2: koppelt verkoopprijzen (Standard Selling) aan alle blad-items.
#         Bestaande toeslag-prijzen worden NIET overschreven.
#
# Gebruik:
#   export ERPNEXT_URL="https://jouw-instance.example.com"
#   export ERPNEXT_KEY="api_key"
#   export ERPNEXT_SECRET="api_secret"
#   bash scripts/erpnext-prices-setup.sh
#
# Blad-prijzen: excl. BTW, per m². Pas aan naar eigen tarieven.

set -euo pipefail

: "${ERPNEXT_URL:?Stel ERPNEXT_URL in}"
: "${ERPNEXT_KEY:?Stel ERPNEXT_KEY in}"
: "${ERPNEXT_SECRET:?Stel ERPNEXT_SECRET in}"

AUTH="Authorization: token $ERPNEXT_KEY:$ERPNEXT_SECRET"
INSERT="$ERPNEXT_URL/api/method/frappe.client.insert"
PRICE_LIST="Standard Selling"

# ─── Helpers ─────────────────────────────────────────────────────────────────

maak_item() {
  local code="$1" naam="$2" groep="$3" uom="$4"
  echo -n "  item $code ... "
  curl -sf -X POST \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    "$INSERT" \
    -d "{\"doc\":{\"doctype\":\"Item\",\"item_code\":\"$code\",\"item_name\":\"$naam\",\"item_group\":\"$groep\",\"stock_uom\":\"$uom\",\"is_sales_item\":1,\"is_stock_item\":0,\"include_item_in_manufacturing\":0}}" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK')" \
    2>/dev/null || echo "(bestaat al — doorgaan)"
}

stel_prijs() {
  local code="$1" uom="$2" prijs="$3"
  echo -n "  prijs $code = €$prijs/m² ... "
  curl -sf -X POST \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    "$INSERT" \
    -d "{\"doc\":{\"doctype\":\"Item Price\",\"item_code\":\"$code\",\"price_list\":\"$PRICE_LIST\",\"uom\":\"$uom\",\"price_list_rate\":$prijs,\"currency\":\"EUR\"}}" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK')" \
    2>/dev/null || echo "(fout — mogelijk al ingesteld)"
}

# ─── Toeslag items aanmaken (prijzen worden NIET aangepast) ──────────────────

echo ""
echo "=== Toeslag items aanmaken (alleen als ze nog niet bestaan) ==="

maak_item "TOESLAG-BOORGAT-KRAAN"              "Boorgat kraan"                "All Item Groups" "Nos"
maak_item "TOESLAG-BOORGAT-QUOOKER"            "Boorgat Quooker"              "All Item Groups" "Nos"
maak_item "TOESLAG-BOORGAT-ELEKTRA"            "Boorgat elektra"              "All Item Groups" "Nos"
maak_item "TOESLAG-BOORGAT-WCD"                "Boorgat dubbele WCD"          "All Item Groups" "Nos"

maak_item "TOESLAG-SPARING-ONDERBOUW"          "Uitsparing onderbouw"         "All Item Groups" "Nos"
maak_item "TOESLAG-SPARING-VLAKBOUW"           "Uitsparing vlakbouw"          "All Item Groups" "Nos"
maak_item "TOESLAG-SPARING-OPBOUW"             "Uitsparing opbouw"            "All Item Groups" "Nos"
maak_item "TOESLAG-SPARING-KOOKPLAAT-VLAKBOUW" "Kookplaatuitsparing vlakbouw" "All Item Groups" "Nos"
maak_item "TOESLAG-SPARING-KOOKPLAAT-OPBOUW"   "Kookplaatuitsparing opbouw"   "All Item Groups" "Nos"
maak_item "TOESLAG-SPARING-HOEK"               "Hoekuitsparing"               "All Item Groups" "Nos"
maak_item "TOESLAG-SPARING-KOLOM"              "Kolomuitsparing"              "All Item Groups" "Nos"
maak_item "TOESLAG-SPARING-KOOF"               "Koofuitsparing"               "All Item Groups" "Nos"

maak_item "TOESLAG-RAND-VERSTEK"  "Verstekverbinding"       "All Item Groups" "Nos"
maak_item "TOESLAG-RAND-DV20"     "Randafwerking DV 20mm"  "All Item Groups" "Meter"
maak_item "TOESLAG-RAND-DV30"     "Randafwerking DV 30mm"  "All Item Groups" "Meter"
maak_item "TOESLAG-RAND-DV40"     "Randafwerking DV 40mm"  "All Item Groups" "Meter"
maak_item "TOESLAG-RAND-T1"       "Randafwerking T1/Facet" "All Item Groups" "Meter"
maak_item "TOESLAG-RAND-KF"       "Randafwerking KF"       "All Item Groups" "Meter"

# ─── Verkoopprijzen — Bladen (€/m²) ─────────────────────────────────────────

echo ""
echo "=== Prijzen — Composiet (€/m²) ==="
stel_prijs "COMPOSIET-BLAD-6MM"  "Square Meter"  85
stel_prijs "COMPOSIET-BLAD-8MM"  "Square Meter"  95
stel_prijs "COMPOSIET-BLAD-12MM" "Square Meter" 120
stel_prijs "COMPOSIET-BLAD-13MM" "Square Meter" 130
stel_prijs "COMPOSIET-BLAD-20MM" "Square Meter" 185
stel_prijs "COMPOSIET-BLAD-30MM" "Square Meter" 240

echo "=== Prijzen — Dekton (€/m²) ==="
stel_prijs "DEKTON-BLAD-6MM"  "Square Meter" 120
stel_prijs "DEKTON-BLAD-8MM"  "Square Meter" 140
stel_prijs "DEKTON-BLAD-12MM" "Square Meter" 180
stel_prijs "DEKTON-BLAD-13MM" "Square Meter" 195
stel_prijs "DEKTON-BLAD-20MM" "Square Meter" 280
stel_prijs "DEKTON-BLAD-30MM" "Square Meter" 355

echo "=== Prijzen — Keramiek (€/m²) ==="
stel_prijs "KERAMIEK-BLAD-6MM"  "Square Meter" 100
stel_prijs "KERAMIEK-BLAD-8MM"  "Square Meter" 115
stel_prijs "KERAMIEK-BLAD-12MM" "Square Meter" 150
stel_prijs "KERAMIEK-BLAD-13MM" "Square Meter" 165
stel_prijs "KERAMIEK-BLAD-20MM" "Square Meter" 225
stel_prijs "KERAMIEK-BLAD-30MM" "Square Meter" 285

echo "=== Prijzen — Graniet (€/m²) ==="
stel_prijs "GRANIET-BLAD-6MM"  "Square Meter"  90
stel_prijs "GRANIET-BLAD-8MM"  "Square Meter" 105
stel_prijs "GRANIET-BLAD-12MM" "Square Meter" 140
stel_prijs "GRANIET-BLAD-13MM" "Square Meter" 155
stel_prijs "GRANIET-BLAD-20MM" "Square Meter" 205
stel_prijs "GRANIET-BLAD-30MM" "Square Meter" 265

echo "=== Prijzen — Marmer (€/m²) ==="
stel_prijs "MARMER-BLAD-6MM"  "Square Meter" 135
stel_prijs "MARMER-BLAD-8MM"  "Square Meter" 155
stel_prijs "MARMER-BLAD-12MM" "Square Meter" 200
stel_prijs "MARMER-BLAD-13MM" "Square Meter" 215
stel_prijs "MARMER-BLAD-20MM" "Square Meter" 315
stel_prijs "MARMER-BLAD-30MM" "Square Meter" 395

echo "=== Prijzen — Kwartsiet (€/m²) ==="
stel_prijs "KWARTSIET-BLAD-6MM"  "Square Meter" 115
stel_prijs "KWARTSIET-BLAD-8MM"  "Square Meter" 135
stel_prijs "KWARTSIET-BLAD-12MM" "Square Meter" 175
stel_prijs "KWARTSIET-BLAD-13MM" "Square Meter" 190
stel_prijs "KWARTSIET-BLAD-20MM" "Square Meter" 270
stel_prijs "KWARTSIET-BLAD-30MM" "Square Meter" 340

echo "=== Prijzen — Natuursteen (€/m²) ==="
stel_prijs "NATUURSTEEN-BLAD-6MM"  "Square Meter"  80
stel_prijs "NATUURSTEEN-BLAD-8MM"  "Square Meter"  95
stel_prijs "NATUURSTEEN-BLAD-12MM" "Square Meter" 125
stel_prijs "NATUURSTEEN-BLAD-13MM" "Square Meter" 140
stel_prijs "NATUURSTEEN-BLAD-20MM" "Square Meter" 195
stel_prijs "NATUURSTEEN-BLAD-30MM" "Square Meter" 250

echo ""
echo "Klaar. Toeslag-prijzen zijn ongewijzigd gelaten."
