// Playwright script: sprint 3b-2 test flow screenshots
import { chromium } from "@playwright/test";
import { mkdirSync } from "fs";

const BASE = "http://localhost:5174/y-app-keukenblad-opname/";
const OUT = "docs/screenshots-sprint3b2";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 800 });

async function shot(name) {
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`✓ ${name}`);
}

// Helper: klik exacte knoptekst (geen substring-matches)
function exactBtn(text) {
  return page.locator(`button`).filter({ hasText: new RegExp(`^${text}$`) }).first();
}

// === 01: Startscherm ===
await page.goto(BASE, { waitUntil: "networkidle" });
await shot("01-startscherm");

// === 02: Stap 1 — klant invullen ===
await page.locator('button:has-text("Nieuwe klant")').first().click();
await page.waitForTimeout(300);
const naamInput = page.locator('input[placeholder*="naam"], input[placeholder*="Naam"], input[placeholder*="Bedrijf"]').first();
if (await naamInput.isVisible()) await naamInput.fill("Vasto Test BV");
const inmeterInput = page.locator('input[placeholder*="inmeter"], input[placeholder*="Inmeter"]').first();
if (await inmeterInput.isVisible()) await inmeterInput.fill("Eelke Dollee");
await shot("02-stap1-klant-ingevuld");

// === 03: Stap 2 Tekening ===
await page.locator('button:has-text("2"), button:has-text("Tekening")').first().click();
await page.waitForTimeout(500);
await shot("03-stap2-leeg");

// === 04: Blad-dialog openen ===
await page.locator('button:has-text("+ Nieuw blad")').first().click();
await page.waitForTimeout(400);
await shot("04-blad-dialog");

// Afmetingen invullen
const numInputs = await page.locator('input[type="number"]').all();
if (numInputs[0]) await numInputs[0].fill("1958");
if (numInputs[1]) await numInputs[1].fill("1001");
// Dikte is een select, standaard 20 is al goed

// Klik exacte "Toevoegen" knop in de modal
await exactBtn("Toevoegen").click();
await page.waitForTimeout(700);
await shot("05-blad-aangemaakt");

// === 06: Sparing dialog — categorie ===
await page.locator('button:has-text("+ Sparing")').first().click();
await page.waitForTimeout(400);
await shot("06-sparing-dialog-categorie");

// === 07: Kookplaat selecteren ===
await page.locator('button:has-text("Kookplaat")').first().click();
await page.waitForTimeout(300);
await shot("07-sparing-kookplaat-lijst");

// Klik Bora C75
await page.locator('button:has-text("Bora C75")').first().click();
await page.waitForTimeout(400);
await shot("08-vlakbouw-warning");

// === 09: Toch toevoegen → positie ===
await exactBtn("Toch toevoegen").click();
await page.waitForTimeout(400);
await shot("09-kookplaat-positie-stap3");

// Toevoegen (stap 3 van SparingDialog)
await exactBtn("Toevoegen").click();
await page.waitForTimeout(500);
await shot("10-kookplaat-geplaatst-op-canvas");

// === 11: Spoelbak toevoegen ===
await page.locator('button:has-text("+ Sparing")').first().click();
await page.waitForTimeout(400);
await page.locator('button:has-text("Spoelbak")').first().click();
await page.waitForTimeout(300);

const caressi = page.locator('button:has-text("Caressi")').first();
if (await caressi.isVisible({ timeout: 3000 })) await caressi.click();
await page.waitForTimeout(400);
await shot("11-spoelbak-positie-stap3");

await exactBtn("Toevoegen").click();
await page.waitForTimeout(500);
await shot("12-spoelbak-geplaatst-op-canvas");

// === 12: Klik op spoelbak → SparingPanel ===
// Klik in het midden van de canvas, waar de spoelbak staat
const canvasBB = await page.locator('svg').first().boundingBox();
if (canvasBB) {
  // Spoelbak staat links geplaatst, klik iets links van midden canvas
  await page.mouse.click(canvasBB.x + canvasBB.width * 0.45, canvasBB.y + canvasBB.height * 0.5);
  await page.waitForTimeout(600);
}
await shot("13-sparingpanel-spoelbak-open");

// Kraangat toevoegen (knop zichtbaar als spoelbak geselecteerd)
const kraangatBtn = page.locator('button:has-text("Kraangat")').first();
if (await kraangatBtn.isVisible({ timeout: 2000 })) {
  await kraangatBtn.click();
  await page.waitForTimeout(600);
  await shot("14-kraangat-automatisch-boven-spoelbak");
} else {
  await shot("14-kraangat-btn-niet-gevonden");
}

// === 13: + Boorgat — Elektra Ø70 ===
await page.keyboard.press("Escape");
await page.waitForTimeout(300);

await page.locator('button:has-text("+ Boorgat")').first().click();
await page.waitForTimeout(400);
await shot("15-boorgat-dialog-doel");

await page.locator('button:has-text("Elektra")').first().click();
await page.waitForTimeout(300);
await shot("16-boorgat-dialog-maat");

// Quick-knop Ø70
const d70 = page.locator('button').filter({ hasText: /^70$/ }).first();
if (await d70.isVisible()) await d70.click({ force: true });
await page.waitForTimeout(200);

// Volgende → positie
const volgendeStap = page.locator('button:has-text("Volgende →")').first();
if (await volgendeStap.isVisible()) {
  await volgendeStap.click();
  await page.waitForTimeout(300);
}
await shot("17-boorgat-dialog-positie");

await exactBtn("Toevoegen").click();
await page.waitForTimeout(500);
await shot("18-boorgat-elektra-geplaatst");

// === 14: Selecteer boorgat → BoorgatPanel ===
// Klik op de paarse cirkel in de SVG
const cirkel = page.locator('circle').first();
if (await cirkel.isVisible({ timeout: 2000 })) {
  await cirkel.click({ force: true });
  await page.waitForTimeout(500);
  await shot("19-boorgatpanel-maat-referentie");
}

// === Eindstand ===
await page.keyboard.press("Escape");
await page.waitForTimeout(300);
await shot("20-eindstand-canvas-volledig");

await browser.close();
console.log(`\nKlaar — screenshots in ${OUT}/`);
