// Gemeinsame Hilfen für die Tests
const { test, expect } = require("@playwright/test");

// Konsolenfehler sammeln: Ein Test schlägt fehl, sobald die App einen Fehler meldet.
function failOnConsoleErrors() {
  let errors = [];
  test.beforeEach(async ({ page }) => {
    errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  });
  test.afterEach(async () => { expect(errors, "Konsolenfehler").toEqual([]); });
}

const fitsScreen = (page) => page.evaluate(() => document.documentElement.scrollHeight <= innerHeight);

// Anzahl verschiedener Wochen in einer Datenbank der App ("kompass" = Production, "kompass-beta" = Beta)
const weeksIn = (page, dbName) => page.evaluate(async (name) => {
  const db = await new Promise((r) => { const q = indexedDB.open(name); q.onsuccess = () => r(q.result); });
  if (!db.objectStoreNames.contains("entries")) return 0;
  const rows = await new Promise((r) => { const q = db.transaction("entries").objectStore("entries").getAll(); q.onsuccess = () => r(q.result); });
  db.close();
  return new Set(rows.map((x) => x.week)).size;
}, dbName);

async function rateWholeWeek(page, value) {
  await page.locator("#homeBtn").tap();
  const total = await page.locator("#progress button").count();
  for (let i = 0; i < total; i++) {
    await expect(page.locator("#stepCount")).toHaveText(`${i + 1} / ${total}`);
    await page.locator(`#scale .opt[data-v="${value ?? (i % 5) + 1}"]`).tap();
  }
  await expect(page.locator("#summary")).toBeVisible();
}

module.exports = { failOnConsoleErrors, fitsScreen, weeksIn, rateWholeWeek };
