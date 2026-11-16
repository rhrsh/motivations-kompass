// Installation, Offline-Betrieb und Updates (specs/008-installation-offline-updates.md)
const { test, expect } = require("@playwright/test");
const { PROD, BETA, failOnConsoleErrors, weeksIn } = require("./helpers");

failOnConsoleErrors();

test("[008 AK-1, AK-6] Manifest: installierbar, Vollbild, Name, Icons, helle Startfarbe", async ({ page }) => {
  await page.goto(PROD);
  const m = await page.evaluate(async () => (await fetch("manifest.webmanifest")).json());
  expect(m.display).toBe("standalone");
  expect(m.short_name).toBe("Motivation");
  expect(m.background_color.toUpperCase()).toBe("#F1F3F6");
  expect(m.icons.some((i) => i.purpose === "maskable")).toBe(true);
  expect(m.icons.some((i) => i.sizes === "512x512")).toBe(true);
});

test("[008 AK-2] Nach dem ersten Öffnen startet die App ohne Netz", async ({ page, context }) => {
  await page.goto(PROD);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // jetzt vom Service Worker gesteuert, alle Dateien im Speicher
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await expect(page.locator("#homeText")).not.toBeEmpty();
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("#homeBtn")).toBeVisible();
  await expect(page.locator("#homeText")).not.toBeEmpty();
  await context.setOffline(false);
});

test("[008 AK-5] Version unten auf dem Start, in der Beta mit Hinweis", async ({ page }) => {
  for (const [url, re] of [[PROD, /^Version v\d+$/], [BETA, /^Version v\d+ · Beta$/]]) {
    await page.goto(url);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await expect(page.locator("#version")).toHaveText(re);
  }
});

test("[008 AK-7] Daten aus sehr alten Versionen (localStorage) werden einmalig übernommen", async ({ page }) => {
  await page.goto(PROD);
  await expect(page.locator("#homeText")).not.toBeEmpty();
  await page.evaluate(() => {
    localStorage.setItem("kompass:checks", JSON.stringify({ "2025-W30": { ratings: { sinn: 4 }, comments: { sinn: "alt" }, updatedAt: "2025-07-25T10:00:00Z" } }));
  });
  await page.reload();
  await expect(page.locator("#homeText")).not.toBeEmpty();
  expect(await weeksIn(page, "kompass")).toBe(1);
  expect(await page.evaluate(() => localStorage.getItem("kompass:checks"))).toBeNull();
});
