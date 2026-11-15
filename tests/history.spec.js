// Verlauf über mehrere Wochen (Issue #1). Geprüft in der Preview mit Beispieldaten.
const { test, expect } = require("@playwright/test");

let consoleErrors = [];
test.beforeEach(async ({ page }) => {
  consoleErrors = [];
  page.on("pageerror", (e) => consoleErrors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
});
test.afterEach(async () => { expect(consoleErrors, "Konsolenfehler").toEqual([]); });

const fits = (page) => page.evaluate(() => document.documentElement.scrollHeight <= innerHeight);

async function withSampleData(page) {
  await page.goto("./beta/");
  await page.locator("#sampleBtn").tap();
  await expect(page.locator("#homeText")).toContainText("Beispieldaten");
}

test("Übersicht: eine Zeile je Motivator, 8 Wochen, Richtung, ohne Scrollen", async ({ page }) => {
  await withSampleData(page);
  await page.locator("#historyBtn").tap();
  const rows = page.locator("#history .h-row");
  await expect(rows).toHaveCount(7);
  await expect(rows.first().locator(".bars i")).toHaveCount(8);
  await expect(page.locator("#history .kw span")).toHaveCount(8);
  // Beispieldaten: erster Motivator steigt, zweiter sinkt (siehe js/sample.js)
  await expect(rows.nth(0).locator("small")).toContainText("steigt");
  await expect(rows.nth(1).locator("small")).toContainText("sinkt");
  // ausgelassene Woche ist als Lücke sichtbar
  expect(await rows.first().locator(".bars i.gap").count()).toBeGreaterThan(0);
  expect(await fits(page), "Übersicht muss ohne Scrollen passen").toBe(true);
});

test("Ältere Wochen per Knopf und per Wischen", async ({ page }) => {
  await withSampleData(page);
  await page.locator("#historyBtn").tap();
  const range = page.locator("#history .h-range");
  const newest = await range.textContent();
  await expect(page.locator("#history .h-newer")).toBeDisabled();
  await page.locator("#history .h-older").tap();
  await expect(range).not.toHaveText(newest);
  await expect(page.locator("#history .h-older")).toBeDisabled(); // Beispieldaten reichen für 2 Seiten
  await page.locator("#history .h-newer").tap();
  await expect(range).toHaveText(newest);
  // Wischen nach rechts = ältere Wochen
  const card = page.locator("#history .h-card");
  const box = await card.boundingBox();
  await card.dispatchEvent("touchstart", { touches: [{ identifier: 1, clientX: box.x + 60, clientY: box.y + 200 }] });
  await card.dispatchEvent("touchend", { changedTouches: [{ identifier: 1, clientX: box.x + 260, clientY: box.y + 205 }] });
  await expect(range).not.toHaveText(newest);
});

test("Detail: Linie, Vergleich in Zahlen und Kommentare, neueste zuerst", async ({ page }) => {
  await withSampleData(page);
  await page.locator("#historyBtn").tap();
  await page.locator("#history .h-row").first().tap();
  await expect(page.locator("#detail")).toBeVisible();
  await expect(page.locator("#detail .d-chart > svg")).toBeVisible();
  await expect(page.locator("#detail .d-cmp")).toContainText("Letzte 4 Wochen");
  const weeks = await page.locator("#detail .cl small").allTextContents();
  expect(weeks.length).toBeGreaterThan(1);
  const nums = weeks.map((w) => Number(w.replace("KW ", "")));
  // neueste zuerst (Jahreswechsel in den Beispieldaten ausgeschlossen, sonst nur Länge prüfen)
  if (nums.every((n, i) => i === 0 || Math.abs(n - nums[i - 1]) < 20)) expect(nums).toEqual([...nums].sort((a, b) => b - a));
  await page.locator("#detailBack").tap();
  await expect(page.locator("#history")).toBeVisible();
  await page.locator("#historyBack").tap();
  await expect(page.locator("#home")).toBeVisible();
});

test("Ohne Daten: Verlauf erklärt sich statt leer zu sein", async ({ page }) => {
  await page.goto("./");
  await page.locator("#historyBtn").tap();
  await expect(page.locator("#history .h-row").first().locator("small")).toHaveText("noch keine Bewertung");
});

test("Auswertung: Link zum Verlauf, passt weiter ohne Scrollen", async ({ page }) => {
  await page.goto("./");
  await page.locator("#homeBtn").tap();
  const total = await page.locator("#progress button").count();
  for (let i = 0; i < total; i++) {
    await expect(page.locator("#stepCount")).toHaveText(`${i + 1} / ${total}`);
    await page.locator('#scale .opt[data-v="3"]').tap();
  }
  await expect(page.locator("#summary")).toBeVisible();
  expect(await fits(page), "Auswertung muss ohne Scrollen passen").toBe(true);
  await page.locator("#sumHistoryBtn").tap();
  await expect(page.locator("#history")).toBeVisible();
  // Richtung erst ab 6 Wochen
  await expect(page.locator("#history .h-row").first().locator("small")).toContainText("Richtung ab 5 weiteren Wochen");
  await page.locator("#historyBack").tap();
  await expect(page.locator("#summary")).toBeVisible();
});
