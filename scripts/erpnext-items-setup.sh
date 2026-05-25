#!/usr/bin/env bash
# Maakt alle template blad-items aan in ERPNext.
# Gebruik:
#   export ERPNEXT_URL="https://jouw-instance.example.com"
#   export ERPNEXT_KEY="api_key"
#   export ERPNEXT_SECRET="api_secret"
#   bash scripts/erpnext-items-setup.sh

set -euo pipefail

: "${ERPNEXT_URL:?Stel ERPNEXT_URL in}"
: "${ERPNEXT_KEY:?Stel ERPNEXT_KEY in}"
: "${ERPNEXT_SECRET:?Stel ERPNEXT_SECRET in}"

AUTH="Authorization: token $ERPNEXT_KEY:$ERPNEXT_SECRET"
BASE="$ERPNEXT_URL/api/method/frappe.client.insert"

maak_item() {
  local code="$1" naam="$2" groep="$3"
  echo -n "→ $code ... "
  curl -sf -X POST \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    "$BASE" \
    -d "{\"doc\":{\"doctype\":\"Item\",\"item_code\":\"$code\",\"item_name\":\"$naam\",\"item_group\":\"$groep\",\"stock_uom\":\"Square Meter\",\"is_sales_item\":1,\"is_stock_item\":0,\"include_item_in_manufacturing\":0}}" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK:', d['message']['item_code'])" \
    2>/dev/null || echo "(bestaat al of fout — doorgaan)"
}

echo "=== Composiet ==="
for dikte in 6 8 12 13 20 30; do
  maak_item "COMPOSIET-BLAD-${dikte}MM" "Composiet keukenblad ${dikte}mm" "Composiet"
done

echo "=== Dekton ==="
for dikte in 6 8 12 13 20 30; do
  maak_item "DEKTON-BLAD-${dikte}MM" "Dekton keukenblad ${dikte}mm" "Dekton"
done

echo "=== Keramiek ==="
for dikte in 6 8 12 13 20 30; do
  maak_item "KERAMIEK-BLAD-${dikte}MM" "Keramiek keukenblad ${dikte}mm" "Keramiek"
done

echo "=== Graniet ==="
for dikte in 6 8 12 13 20 30; do
  maak_item "GRANIET-BLAD-${dikte}MM" "Graniet keukenblad ${dikte}mm" "Graniet"
done

echo "=== Marmer ==="
for dikte in 6 8 12 13 20 30; do
  maak_item "MARMER-BLAD-${dikte}MM" "Marmer keukenblad ${dikte}mm" "Marmer"
done

echo "=== Kwartsiet ==="
for dikte in 6 8 12 13 20 30; do
  maak_item "KWARTSIET-BLAD-${dikte}MM" "Kwartsiet keukenblad ${dikte}mm" "Kwartsiet"
done

echo "=== Natuursteen ==="
for dikte in 6 8 12 13 20 30; do
  maak_item "NATUURSTEEN-BLAD-${dikte}MM" "Natuursteen keukenblad ${dikte}mm" "Natuursteen"
done

echo ""
echo "Klaar. Verwacht: 42 items."
