import { test } from "@playwright/test";

const BASE = "http://localhost:5174/y-app-keukenblad-opname/";

async function gaNaarStap2(page: any) {
  await page.goto(BASE);
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /2.*Tekening/i }).click();
  await page.waitForTimeout(400);
}

test.describe("Taak 7 — verstek canvas annotaties", () => {
  test("Scenario A: blad geselecteerd zonder verstek", async ({ page }) => {
    await gaNaarStap2(page);
    await page.getByText("Bladdeel A").first().click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: "tests/screenshots/taak7-A-geen-verstek.png" });
  });

  test("Scenario B: verstek-relatie Achterkant A <-> Zijde 1 B", async ({ page }) => {
    await gaNaarStap2(page);
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
    await page.screenshot({ path: "tests/screenshots/taak7-B-verstek-driehoekjes.png" });
  });

  test("Scenario C: tweede verstek Voorkant A <-> Zijde 2 B", async ({ page }) => {
    await gaNaarStap2(page);
    await page.getByText("Bladdeel A").first().click();
    await page.waitForTimeout(300);
    // Voeg eerste relatie toe
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
    // Tweede relatie
    await page.getByRole("button", { name: /Verstek-relatie toevoegen/i }).click();
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: "Voorkant" }).click();
    await page.waitForTimeout(200);
    await page.getByRole("button").filter({ hasText: /Volgende/ }).last().click();
    await page.waitForTimeout(300);
    await page.getByRole("button").filter({ hasText: /Bladdeel B.*m²/ }).click();
    await page.waitForTimeout(300);
    await page.getByRole("button").filter({ hasText: /Volgende/ }).last().click();
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: "Zijde 2" }).click();
    await page.waitForTimeout(200);
    await page.getByRole("button", { name: "Toepassen" }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: "tests/screenshots/taak7-C-twee-verstek.png" });
  });

  test("Scenario D: canvas + BladInfoPanel samen na verstek", async ({ page }) => {
    await gaNaarStap2(page);
    await page.getByText("Bladdeel A").first().click();
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: /Verstek-relatie toevoegen/i }).click();
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: "Linkerkant" }).click();
    await page.waitForTimeout(200);
    await page.getByRole("button").filter({ hasText: /Volgende/ }).last().click();
    await page.waitForTimeout(300);
    await page.getByRole("button").filter({ hasText: /Bladdeel B.*m²/ }).click();
    await page.waitForTimeout(300);
    await page.getByRole("button").filter({ hasText: /Volgende/ }).last().click();
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: "Zijde 3" }).click();
    await page.waitForTimeout(200);
    await page.getByRole("button", { name: "Toepassen" }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: "tests/screenshots/taak7-D-canvas-plus-panel.png" });
  });
});
