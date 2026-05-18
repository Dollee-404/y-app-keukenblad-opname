import { test } from "@playwright/test";

const BASE = "http://localhost:5174/y-app-keukenblad-opname/";

async function gaNaarStap3(page: any) {
  await page.goto(BASE);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(300);
}

async function gaNaarStap4(page: any) {
  await page.goto(BASE);
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /4.*Overzicht/i }).click();
  await page.waitForTimeout(500);
}

async function setVerstekOpZijde(page: any, bladNaam: string) {
  // Select the blad in the dropdown
  await page.getByRole("combobox").first().selectOption({ label: bladNaam });
  await page.waitForTimeout(200);

  // Click on the SVG top edge (Achterkant) of the blade
  // The canvas SVG has viewBox="0 0 600 420"
  // For a rectangle ~1958×800mm: top edge midpoint ≈ (300, 120) in SVG coords
  const svgEl = page.locator("svg").first();
  const box = await svgEl.boundingBox();
  if (!box) throw new Error("SVG not found");

  const svgScaleX = box.width / 600;
  const svgScaleY = box.height / 420;
  // Achterkant: top edge at y≈120, midpoint x≈300 in SVG units
  await page.mouse.click(
    box.x + 300 * svgScaleX,
    box.y + 120 * svgScaleY
  );
  await page.waitForTimeout(400);

  // Should see ZijdePopup — click "Verstek (koppeling)" tab
  await page.getByRole("button", { name: "Verstek (koppeling)" }).click();
  await page.waitForTimeout(200);
  // Click Toepassen in the ZijdePopup
  await page.getByRole("button", { name: "Toepassen" }).last().click();
  await page.waitForTimeout(400);
}

test.describe("Taak 8 — verstek validatie warnings", () => {
  test("Scenario 1: geen verstek-zijden — VERSTEK rij verborgen in stap 3", async ({ page }) => {
    await gaNaarStap3(page);
    await page.screenshot({ path: "tests/screenshots/taak8-1-stap3-geen-verstek-rij.png" });
  });

  test("Scenario 1b: geen verstek-zijden — geen verstek-warning in stap 4", async ({ page }) => {
    await gaNaarStap4(page);
    await page.screenshot({ path: "tests/screenshots/taak8-1b-stap4-geen-verstek-warning.png" });
  });

  test("Scenario 2: verstek-zijde zonder koppeling — amber in stap 3", async ({ page }) => {
    await gaNaarStap3(page);
    await setVerstekOpZijde(page, "Bladdeel A");
    await page.screenshot({ path: "tests/screenshots/taak8-2-stap3-amber.png" });
  });

  test("Scenario 2b: verstek-zijde zonder koppeling — warning in stap 4", async ({ page }) => {
    await gaNaarStap3(page);
    await setVerstekOpZijde(page, "Bladdeel A");
    // Navigate to stap 4
    await page.getByRole("button", { name: /4.*Overzicht/i }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "tests/screenshots/taak8-2b-stap4-verstek-warning.png" });
  });

  test("Scenario 3: verstek-zijde MET koppeling — groen in stap 3", async ({ page }) => {
    // Set verstek on Achterkant of Bladdeel A in step 3
    await gaNaarStap3(page);
    await setVerstekOpZijde(page, "Bladdeel A");

    // Go to step 2, add verstek relation
    await page.getByRole("button", { name: /2.*Tekening/i }).click();
    await page.waitForTimeout(400);
    await page.getByText("Bladdeel A").first().click();
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: /Verstek-relatie toevoegen/i }).click();
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: "Achterkant" }).click();
    await page.waitForTimeout(200);
    await page.getByRole("button").filter({ hasText: /Volgende/ }).last().click();
    await page.waitForTimeout(300);
    await page.getByRole("button").filter({ hasText: /Bladdeel B.*m²/ }).click();
    await page.waitForTimeout(300);
    await page.getByRole("button").filter({ hasText: /Volgende/ }).last().click();
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: "Zijde 1" }).click();
    await page.waitForTimeout(200);
    await page.getByRole("button", { name: "Toepassen" }).click();
    await page.waitForTimeout(400);

    // Back to step 3
    await page.getByRole("button", { name: /3.*Specs/i }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: "tests/screenshots/taak8-3-stap3-groen.png" });
  });
});
