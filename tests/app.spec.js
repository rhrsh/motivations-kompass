// Durchgang durch eine ganze Woche (004, 005) und Umgebungen (001)
const { test, expect } = require("@playwright/test");
const { PROD, BETA, failOnConsoleErrors, fitsScreen, weeksIn, rateWholeWeek } = require("./helpers");

failOnConsoleErrors();

test("[004 AK-3, AK-7] [005 AK-3, AK-11] Ganze Woche bewerten: Auswertung ohne Scrollen, bleibt nach Neuladen", async ({ page }) => {
  await page.goto(PROD);
  await expect(page.locator("#homeBtn")).toHaveText("Woche bewerten");
  await rateWholeWeek(page);
  expect(await fitsScreen(page), "Auswertung muss ohne Scrollen passen").toBe(true);
  await page.reload();
  await expect(page.locator("#homeText")).toContainText("Diese Woche erledigt");
  await expect(page.locator("#homeBtn")).toHaveText("Ergebnis ansehen");
});

test("[001 AK-8] Production zeigt keine Beta-Kennzeichnung und keine Beta-Werkzeuge", async ({ page }) => {
  await page.goto(PROD);
  await expect(page.locator("#betaTools")).toBeHidden();
  await expect(page.locator(".beta-badge")).toBeHidden();
});

test("[001 AK-2, AK-4] Beta hat eigene Daten und ist gekennzeichnet", async ({ page }) => {
  await page.goto(PROD);
  await page.locator("#homeBtn").tap();
  await page.locator('#scale .opt[data-v="4"]').tap();
  await expect(page.locator("#saveState")).toHaveText("✓ Gespeichert");

  await page.goto(BETA);
  await expect(page.locator(".beta-badge")).toBeVisible();
  await expect(page.locator("#betaTools")).toBeVisible();
  await expect.poll(() => weeksIn(page, "kompass-beta")).toBeGreaterThanOrEqual(10);

  await page.goto(PROD);
  await expect(page.locator("#homeText")).toContainText("1 von");
  expect(await weeksIn(page, "kompass"), "Production darf keine Beispieldaten enthalten").toBe(1);
});

test("[001 AK-5, AK-6, AK-7] Beta startet mit Beispieldaten, Zurücksetzen leert sie dauerhaft", async ({ page }) => {
  await page.goto(BETA);
  await expect(page.locator("#homeText")).toContainText("Beispieldaten");
  // laufende Woche bleibt frei
  await page.reload();
  await expect(page.locator("#homeBtn")).toHaveText("Woche bewerten");
  expect(await weeksIn(page, "kompass-beta")).toBeGreaterThanOrEqual(10);

  page.once("dialog", (d) => d.accept());
  await page.locator("#resetBtn").tap();
  await expect(page.locator("#homeText")).toContainText("gelöscht");
  await page.reload();
  expect(await weeksIn(page, "kompass-beta"), "nach Zurücksetzen keine automatischen Beispieldaten").toBe(0);

  await page.locator("#sampleBtn").tap();
  await expect(page.locator("#homeText")).toContainText("Beispieldaten");
  expect(await weeksIn(page, "kompass-beta")).toBeGreaterThanOrEqual(10);
});

test("[001 AK-3] Offline-Speicher von Production und Beta bleiben getrennt erhalten", async ({ page }) => {
  // Beim ersten Besuch der Beta übernimmt deren Service Worker; geduldig nachfragen.
  const cacheNames = () => page.evaluate(async () => {
    await navigator.serviceWorker.ready; return (await caches.keys()).sort();
  }).catch(() => []);
  await page.goto(PROD);
  await expect.poll(cacheNames).toContainEqual(expect.stringMatching(/^kompass-v\d+$/));
  await page.goto(BETA);
  await expect.poll(cacheNames).toContainEqual(expect.stringMatching(/^kompass-beta-v\d+$/));
  await expect.poll(cacheNames, { message: "Production-Cache darf nicht gelöscht werden" })
    .toContainEqual(expect.stringMatching(/^kompass-v\d+$/));
  const leaked = await page.evaluate(async () => {
    const name = (await caches.keys()).find((n) => /^kompass-v\d+$/.test(n));
    return (await (await caches.open(name)).keys()).map((r) => r.url).filter((u) => u.includes("/beta/"));
  });
  expect(leaked, "Production darf keine Dateien der Beta speichern").toEqual([]);
});
