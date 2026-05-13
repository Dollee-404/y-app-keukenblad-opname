// Playwright verification — three post-fix checks for sprint 3b-2
import { chromium } from "@playwright/test";
import { mkdirSync } from "fs";

const BASE = "http://localhost:5174/y-app-keukenblad-opname/";
const OUT = "docs/screenshots-sprint3b2-fixes";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });

async function shot(name) {
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`  📸 ${name}.png`);
}

async function navigeerStap2() {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.locator('button:has-text("Nieuwe klant")').first().click();
  await page.waitForTimeout(300);
  await page.locator('button:has-text("2"), button:has-text("Tekening")').first().click();
  await page.waitForTimeout(500);
}

async function maakBlad(lengte, breedte) {
  await page.locator('button:has-text("+ Nieuw blad")').first().click();
  await page.waitForTimeout(400);
  // NieuwBladDialog uses Tailwind classes — just grab first two number inputs on page
  await page.locator('input[type="number"]').nth(0).fill(String(lengte));
  await page.locator('input[type="number"]').nth(1).fill(String(breedte));
  await page.locator('button').filter({ hasText: /^Toevoegen$/ }).first().click();
  await page.waitForTimeout(700);
}

// Close any floating panel via its × aria-label button
async function sluitPanel() {
  const btn = page.locator('button[aria-label="Sluiten"]').first();
  if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(300);
  }
}

// BoorgatDialog wrapper: [style*="z-index"] (React renders zIndex as z-index in DOM)
async function voegBoorgatToe(doelLabel, diameterMm, posX, posY) {
  await page.locator('button:has-text("+ Boorgat")').first().click();
  await page.waitForTimeout(400);

  const dlg = page.locator('[style*="z-index"]');

  // Stap 1: doel kiezen — partial match (button may contain emoji + label)
  await dlg.locator('button').filter({ hasText: new RegExp(doelLabel, "i") }).click();
  await page.waitForTimeout(300);

  // Stap 2: diameter
  const quick = dlg.locator('button').filter({ hasText: new RegExp(`^${diameterMm}$`) }).first();
  if (await quick.isVisible({ timeout: 800 }).catch(() => false)) {
    await quick.click({ force: true });
  } else {
    await dlg.locator('input[type="number"]').first().fill(String(diameterMm));
  }
  await dlg.locator('button').filter({ hasText: /Volgende/ }).click();
  await page.waitForTimeout(300);

  // Stap 3: positie
  const inputs = dlg.locator('input[type="number"]');
  await inputs.nth(0).fill(String(posX));
  await inputs.nth(1).fill(String(posY));
  await dlg.locator('button').filter({ hasText: /^Toevoegen$/ }).click();
  await page.waitForTimeout(500);

  // Close the BoorgatPanel that opens automatically after adding
  await sluitPanel();
}

// ═══════════════════════════════════════════════════════════════
// TEST 1 — Labels niet meer overlappen
// ═══════════════════════════════════════════════════════════════
console.log("\nTest 1 — Labels niet meer overlappen");

await navigeerStap2();
await maakBlad(4000, 600);

// Drie Ø35 boorgaten dicht bij elkaar
await voegBoorgatToe("Losse kraan", 35, 1500, 400);
await voegBoorgatToe("Losse kraan", 35, 1520, 400);
await voegBoorgatToe("Losse kraan", 35, 1540, 400);

await page.waitForTimeout(300);
await shot("test1-drie-boorgaten-labels");

// Controleer SVG labels via bounding boxes (2px tolerantie voor rounding)
const OVERLAP_TOLERANCE_PX = 2;
const labelLocs = page.locator('svg text').filter({ hasText: /^Ø35$/ });
const labelCount = await labelLocs.count();
console.log(`  Ø35-labels gevonden: ${labelCount}`);

const boxes = [];
for (let i = 0; i < labelCount; i++) {
  const bb = await labelLocs.nth(i).boundingBox().catch(() => null);
  if (bb) boxes.push({ i, ...bb });
}

let aantalOverlap = 0;
for (let a = 0; a < boxes.length; a++) {
  for (let b = a + 1; b < boxes.length; b++) {
    const ba = boxes[a], bb2 = boxes[b];
    const vertOverlap = ba.y + ba.height - OVERLAP_TOLERANCE_PX > bb2.y &&
                        bb2.y + bb2.height - OVERLAP_TOLERANCE_PX > ba.y;
    if (vertOverlap) {
      aantalOverlap++;
      console.log(`  ✗ label[${ba.i}] en label[${bb2.i}] overlappen — y: ${Math.round(ba.y)} (h=${Math.round(ba.height)}) vs y=${Math.round(bb2.y)}`);
    }
  }
}
if (aantalOverlap === 0 && labelCount >= 3) {
  console.log(`  ✓ Alle ${labelCount} labels verticaal gescheiden, geen overlap`);
} else if (labelCount < 3) {
  console.log(`  ✗ Slechts ${labelCount} labels — verwacht 3`);
}

// ═══════════════════════════════════════════════════════════════
// TEST 2 — Geen duplicaat-kraan
// ═══════════════════════════════════════════════════════════════
console.log("\nTest 2 — Geen duplicaat-kraan bij spoelbak");

await navigeerStap2();
await maakBlad(2000, 600);

// Open SparingDialog
await page.locator('button:has-text("+ Sparing")').first().click();
await page.waitForTimeout(400);

const spDlg = page.locator('[style*="z-index"]');

// Stap 1: Spoelbak — button bevat "💧" + "Spoelbak", gebruik partial match
await spDlg.locator('button').filter({ hasText: /Spoelbak/ }).click();
await page.waitForTimeout(300);

// Stap 2: Product — Caressi (eerste in lijst) of handmatig
const caressiBtn = spDlg.locator('button').filter({ hasText: /Caressi/ }).first();
if (await caressiBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
  await caressiBtn.click();
} else {
  await spDlg.locator('button').filter({ hasText: /Niet in lijst/ }).click();
}
await page.waitForTimeout(400);

// Stap 3: Positie (900, 400)
const spInputs = page.locator('[style*="z-index"]').locator('input[type="number"]');
await spInputs.nth(0).fill("900");
await spInputs.nth(1).fill("400");
await page.waitForTimeout(200);

// Volgende → stap 4
await page.locator('[style*="z-index"]').locator('button').filter({ hasText: /Volgende/ }).click();
await page.waitForTimeout(500);

// Stap 4: Standaard kraan
await page.locator('[style*="z-index"]').locator('button').filter({ hasText: /Standaard kraan/ }).click();
await page.waitForTimeout(700);

// Sluit BoorgatPanel indien open
await sluitPanel();

await shot("test2-na-eerste-kraan");

// Tel paarse boorgat-cirkels (kraan Ø35) — verwacht: 1
const kraanCirkels = page.locator('svg circle[stroke="#6B4FB8"]');
const aantalKranen = await kraanCirkels.count();
console.log(`  Kraangaten op canvas: ${aantalKranen} (verwacht: 1)`);
if (aantalKranen === 1) {
  console.log("  ✓ Exactly 1 kraangat — geen duplicaat");
} else {
  console.log(`  ✗ ${aantalKranen} kraangaten — duplicaat aangemaakt`);
}

// Klik op spoelbak in canvas — SparingPanel moet openen, GEEN stap-4 dialog
const svgBB = await page.locator('svg').first().boundingBox();
if (svgBB) {
  await page.mouse.click(svgBB.x + svgBB.width * 0.44, svgBB.y + svgBB.height * 0.4);
  await page.waitForTimeout(600);
}

await shot("test2-klik-spoelbak-canvas");

// Stap-4 header "Kraan toevoegen?" mag NIET zichtbaar zijn
const stap4Header = page.locator('[style*="z-index"]').filter({ hasText: /Kraan toevoegen\?/ });
const stap4Zichtbaar = await stap4Header.isVisible({ timeout: 500 }).catch(() => false);
console.log(stap4Zichtbaar
  ? "  ✗ Stap-4 dialog IS zichtbaar na klik op bestaande spoelbak"
  : "  ✓ Stap-4 dialog NIET geopend bij klik op bestaande spoelbak");

// Kranen mogen niet zijn toegenomen na canvas-klik
const aantalNa = await page.locator('svg circle[stroke="#6B4FB8"]').count();
console.log(`  Kraangaten na canvas-klik: ${aantalNa} (verwacht: ${aantalKranen})`);
if (aantalNa === aantalKranen) {
  console.log("  ✓ Geen extra kraangaten bijgekomen");
}

// ═══════════════════════════════════════════════════════════════
// TEST 3 — Onderste maatvoering leesbaar (niet ondersteboven)
// ═══════════════════════════════════════════════════════════════
console.log("\nTest 3 — Onderste maatvoering leesbaar");

await navigeerStap2();
await maakBlad(4000, 800);
await page.waitForTimeout(400);

await shot("test3-maatvoering-4000x800");

// Controleer SVG text "4000" — transform mag geen rotate(180) bevatten
const maatLocs = page.locator('svg text').filter({ hasText: /^4000$/ });
const maatCount = await maatLocs.count();
console.log(`  "4000" tekst-elementen: ${maatCount}`);

let ondersteboven = 0;
for (let i = 0; i < maatCount; i++) {
  const transform = await maatLocs.nth(i).getAttribute("transform").catch(() => "");
  const bb = await maatLocs.nth(i).boundingBox().catch(() => null);
  const slecht = (transform ?? "").includes("180");
  console.log(`  [${i}] transform="${transform}" y=${bb ? Math.round(bb.y) : "?"}px  ${slecht ? "✗ ONDERSTEBOVEN" : "✓ leesbaar"}`);
  if (slecht) ondersteboven++;
}
if (ondersteboven === 0) {
  console.log("  ✓ Geen ondersteboven tekst — maatvoering correct");
}

// ═══════════════════════════════════════════════════════════════
await browser.close();
console.log(`\nKlaar — screenshots in ${OUT}/`);
