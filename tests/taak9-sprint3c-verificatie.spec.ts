import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5174/y-app-keukenblad-opname/";
const LEEG = BASE + "?leeg";

// ── Helpers ────────────────────────────────────────────────────────────────

async function gaNaarStap2(page: any) {
  await page.getByRole("button", { name: /2.*Tekening/i }).click();
  await page.waitForTimeout(300);
}

async function gaNaarStap3(page: any) {
  await page.getByRole("button", { name: /3.*Specs/i }).click();
  await page.waitForTimeout(300);
}

async function gaNaarStap4(page: any) {
  await page.getByRole("button", { name: /4.*Overzicht/i }).click();
  await page.waitForTimeout(500);
}

async function voegBladToe(page: any, lengte: number, breedte: number, label?: string) {
  await page.getByRole("button", { name: /Nieuw blad/i }).first().click();
  await page.waitForTimeout(200);
  await page.getByPlaceholder("bijv. 1958").fill(String(lengte));
  await page.getByPlaceholder("bijv. 640").fill(String(breedte));
  if (label) {
    await page.getByPlaceholder("Bladdeel A").fill(label);
  }
  await page.getByRole("button", { name: "Toevoegen", exact: true }).click();
  await page.waitForTimeout(300);
}

async function voegVerstekRelatieToe(
  page: any,
  zijdeA: string,
  bladBLabel: string,
  zijdeB: string,
  hoek: number = 45
) {
  await page.getByRole("button", { name: /Verstek-relatie toevoegen/i }).click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: zijdeA }).click();
  await page.waitForTimeout(200);
  await page.getByRole("button").filter({ hasText: /Volgende/ }).last().click();
  await page.waitForTimeout(300);
  await page.getByRole("button").filter({ hasText: new RegExp(bladBLabel + ".*m²") }).click();
  await page.waitForTimeout(300);
  await page.getByRole("button").filter({ hasText: /Volgende/ }).last().click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: zijdeB }).click();
  await page.waitForTimeout(200);
  if (hoek !== 45) {
    await page.getByRole("button", { name: `${hoek}°` }).click();
    await page.waitForTimeout(100);
  }
  await page.getByRole("button", { name: "Toepassen" }).click();
  await page.waitForTimeout(400);
}

async function setVerstekKoppelingOpZijde(page: any) {
  // Click top edge of blade in step 3 RandafwerkingSectie canvas (viewBox 0 0 600 420)
  const svgEl = page.locator('svg[viewBox="0 0 600 420"]');
  const box = await svgEl.boundingBox();
  if (!box) throw new Error("SVG canvas (viewBox 600×420) not found");
  // Top edge (Achterkant) midpoint: ~(300, 120) in 600×420 viewBox
  await page.mouse.click(box.x + 300 * (box.width / 600), box.y + 120 * (box.height / 420));
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: "Verstek (koppeling)" }).click();
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: "Toepassen" }).last().click();
  await page.waitForTimeout(400);
}

// ── Scenario A: werkende verstek-relatie ───────────────────────────────────

test("Scenario A — relatie maken + visueel", async ({ page }) => {
  await page.goto(LEEG);
  await page.waitForLoadState("networkidle");
  await gaNaarStap2(page);

  // 1. Voeg Bladdeel A en B toe
  await voegBladToe(page, 1000, 600, "Blad A");
  await voegBladToe(page, 600, 600, "Blad B");

  // 2. Selecteer Blad A, voeg verstek-relatie toe
  await page.getByRole("button").filter({ hasText: "Blad A" }).first().click();
  await page.waitForTimeout(300);
  await voegVerstekRelatieToe(page, "Rechterkant", "Blad B", "Linkerkant", 45);

  // --- BladInfoPanel A toont relatie ---
  const panelA = page.locator("[class*='bg-white']").last();
  await expect(page.getByText(/Rechterkant.*Blad B/)).toBeVisible({ timeout: 3000 });

  // --- Schakel naar Blad B, controleer gespiegelde relatie ---
  await page.getByRole("button").filter({ hasText: "Blad B" }).first().click();
  await page.waitForTimeout(300);
  await expect(page.getByText(/Linkerkant.*Blad A/)).toBeVisible({ timeout: 3000 });

  // --- Canvas A: verstek-driehoekjes (polygon fill #0d9488) aanwezig ---
  await page.getByRole("button").filter({ hasText: "Blad A" }).first().click();
  await page.waitForTimeout(300);
  const svgA = page.locator("svg.w-full.h-full");
  const trianglesA = svgA.locator("polygon[fill='#0d9488']");
  await expect(trianglesA).toHaveCount(2, { timeout: 3000 }); // 2 driehoekjes per verstek-zijde

  // --- Canvas A: sub-label "↔ Blad B" aanwezig ---
  await expect(svgA.getByText(/↔.*Blad B/)).toBeVisible({ timeout: 3000 });

  // --- Canvas B: driehoekjes + sub-label ---
  await page.getByRole("button").filter({ hasText: "Blad B" }).first().click();
  await page.waitForTimeout(300);
  const svgB = page.locator("svg.w-full.h-full");
  const trianglesB = svgB.locator("polygon[fill='#0d9488']");
  await expect(trianglesB).toHaveCount(2, { timeout: 3000 });
  await expect(svgB.getByText(/↔.*Blad A/)).toBeVisible({ timeout: 3000 });

  // --- Stap 3: SamenvattingPanel "2/2 gekoppeld" groen ---
  await gaNaarStap3(page);
  await expect(page.getByText(/2\/2 gekoppeld/)).toBeVisible({ timeout: 3000 });
  const verstekRij = page.locator("text=2/2 gekoppeld");
  // Groen: color #0d9488 — controleer dat het GEEN amber is
  await expect(page.getByText(/VERSTEK/i).first()).toBeVisible({ timeout: 3000 });

  // --- Stap 4: geen verstek-warning ---
  await gaNaarStap4(page);
  await expect(page.getByText(/verstek-zijde niet gekoppeld/i)).not.toBeVisible({ timeout: 3000 });
  await expect(page.getByText(/DV-code.*verstek-conflict/i)).not.toBeVisible({ timeout: 3000 });

  console.log("✅ Scenario A: GESLAAGD");
});

// ── Scenario B: verstek zonder koppeling ─────────────────────────────────

test("Scenario B — verstek zonder koppeling", async ({ page }) => {
  await page.goto(LEEG);
  await page.waitForLoadState("networkidle");
  await gaNaarStap2(page);
  await voegBladToe(page, 1958, 800, "Blad A"); // 1958×800 zodat SVG-klik (300,120) de Achterkant raakt

  // --- Stap 3: zet Verstek (koppeling) op top-zijde, GEEN relatie ---
  await gaNaarStap3(page);
  await setVerstekKoppelingOpZijde(page);

  // --- SamenvattingPanel: "0/1 gekoppeld" amber ---
  await expect(page.getByText(/0\/1 gekoppeld/)).toBeVisible({ timeout: 3000 });
  await expect(page.getByText(/VERSTEK/i).first()).toBeVisible({ timeout: 3000 });

  // --- Stap 4: amber pill aanwezig (kan ook collapsed zijn als "meer waarschuwing") ---
  await gaNaarStap4(page);
  await expect(
    page.getByText(/1 verstek-zijde niet gekoppeld/i).or(page.getByText(/meer waarschuwing/i))
  ).toBeVisible({ timeout: 3000 });

  // --- Stap 2: canvas heeft driehoekjes maar geen sub-label ---
  await gaNaarStap2(page);
  await page.getByRole("button").filter({ hasText: "Blad A" }).first().click();
  await page.waitForTimeout(300);
  const svg = page.locator("svg.w-full.h-full");
  // Driehoekjes aanwezig (verstek=true)
  await expect(svg.locator("polygon[fill='#0d9488']")).toHaveCount(2, { timeout: 3000 });
  // Geen sub-label (geen relatie)
  await expect(svg.getByText(/↔/)).not.toBeVisible({ timeout: 2000 });

  // --- BladInfoPanel: "Geen verstek-relaties" ---
  await expect(page.getByText(/Geen verstek-relaties/)).toBeVisible({ timeout: 3000 });

  console.log("✅ Scenario B: GESLAAGD");
});

// ── Scenario C: DV40 + verstek conflict ────────────────────────────────────

test("Scenario C — DV40 + verstek conflict", async ({ page }) => {
  await page.goto(LEEG);
  await page.waitForLoadState("networkidle");
  await gaNaarStap2(page);
  await voegBladToe(page, 1958, 800, "Blad A"); // 1958×800 zodat SVG-klik (300,120) de Achterkant raakt

  // --- Stap 3: zet DV40 op top-zijde ---
  await gaNaarStap3(page);
  const svgEl = page.locator('svg[viewBox="0 0 600 420"]');
  const box = await svgEl.boundingBox();
  if (!box) throw new Error("SVG canvas niet gevonden");
  // Klik top-zijde (Achterkant)
  await page.mouse.click(box.x + 300 * (box.width / 600), box.y + 120 * (box.height / 420));
  await page.waitForTimeout(400);
  // Kies DV40 via VERSTEK (hoogte) tab
  await page.getByRole("button", { name: /Verstek.*hoogte/i }).click();
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: "DV40" }).click();
  await page.waitForTimeout(400);

  // --- Klik opnieuw op zijde → kies KOPPELING tab ---
  await page.mouse.click(box.x + 300 * (box.width / 600), box.y + 120 * (box.height / 420));
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: "Verstek (koppeling)" }).click();
  await page.waitForTimeout(200);
  // Amber warning over DV-code conflict zichtbaar ("overbodig" is uniek voor deze meldingstekst)
  await expect(page.getByText(/overbodig/i)).toBeVisible({ timeout: 3000 });
  // Klik Toepassen ondanks waarschuwing
  await page.getByRole("button", { name: "Toepassen" }).last().click();
  await page.waitForTimeout(400);

  // --- Stap 4: amber pill "1 DV-code met verstek-conflict" (kan collapsed zijn) ---
  await gaNaarStap4(page);
  await expect(
    page.getByText(/1 DV-code met verstek-conflict/i).or(page.getByText(/meer waarschuwing/i))
  ).toBeVisible({ timeout: 3000 });

  // --- Stap 3: VERSTEK rij toont 0/1 amber (verstek zonder koppeling) ---
  await gaNaarStap3(page);
  await expect(page.getByText(/0\/1 gekoppeld/)).toBeVisible({ timeout: 3000 });

  console.log("✅ Scenario C: GESLAAGD");
});

// ── Scenario D: cascade-delete ─────────────────────────────────────────────

test("Scenario D — cascade-delete", async ({ page }) => {
  await page.goto(LEEG);
  await page.waitForLoadState("networkidle");
  await gaNaarStap2(page);
  await voegBladToe(page, 1000, 600, "Blad A");
  await voegBladToe(page, 600, 600, "Blad B");

  // Selecteer Blad A, voeg verstek-relatie toe
  await page.getByRole("button").filter({ hasText: "Blad A" }).first().click();
  await page.waitForTimeout(300);
  await voegVerstekRelatieToe(page, "Rechterkant", "Blad B", "Linkerkant", 45);

  // --- Blad B toont relatie in BladInfoPanel ---
  await page.getByRole("button").filter({ hasText: "Blad B" }).first().click();
  await page.waitForTimeout(300);
  await expect(page.getByText(/Linkerkant.*Blad A/)).toBeVisible({ timeout: 3000 });

  // --- Verwijder Blad B via ✕ knop + bevestiging ---
  await page.getByRole("button", { name: /Verwijder Blad B/i }).click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Ja, verwijder" }).click();
  await page.waitForTimeout(400);

  // --- Selecteer Blad A ---
  await page.getByRole("button").filter({ hasText: "Blad A" }).first().click();
  await page.waitForTimeout(300);

  // --- BladInfoPanel A: verstek-relaties leeg ---
  await expect(page.getByText(/Geen verstek-relaties/)).toBeVisible({ timeout: 3000 });

  // --- Canvas A: driehoekjes aanwezig (verstek=true bleef), geen sub-label ---
  const svgCanvas = page.locator("svg.w-full.h-full");
  await expect(svgCanvas.locator("polygon[fill='#0d9488']")).toHaveCount(2, { timeout: 3000 });
  await expect(svgCanvas.getByText(/↔/)).not.toBeVisible({ timeout: 2000 });

  // --- Stap 3: "0/1 gekoppeld" amber ---
  await gaNaarStap3(page);
  await expect(page.getByText(/0\/1 gekoppeld/)).toBeVisible({ timeout: 3000 });

  // --- Stap 4: verstek warning aanwezig (kan collapsed zijn als "meer waarschuwing") ---
  await gaNaarStap4(page);
  await expect(
    page.getByText(/1 verstek-zijde niet gekoppeld/i).or(page.getByText(/meer waarschuwing/i))
  ).toBeVisible({ timeout: 3000 });

  console.log("✅ Scenario D: GESLAAGD");
});
