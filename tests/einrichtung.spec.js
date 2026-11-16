// Einrichtung der Motivatoren (specs/007-einrichtung-der-motivatoren.md)
const { test, expect } = require("@playwright/test");
const { PROD, BETA, failOnConsoleErrors, setupHash } = require("./helpers");

failOnConsoleErrors();

const MOTIVES = [{ id: "a", name: "Testmotiv A", q: "Frage A?", icon: "key" }, { id: "b", name: "Testmotiv B", q: "Frage B?", icon: "star" }];

test("[007 AK-1, AK-2, AK-6] Link legt Motivatoren ab und verschwindet aus der Adresse", async ({ page }) => {
  await page.goto(PROD + setupHash(MOTIVES));
  await expect(page).toHaveURL(new RegExp(PROD + "$"));
  await page.locator("#homeBtn").tap();
  await expect(page.locator("#qName")).toHaveText("Testmotiv A");
  await expect(page.locator("#qText")).toHaveText("Frage A?");
  await expect(page.locator("#qIcon svg")).toBeVisible();
  await expect(page.locator("#stepCount")).toHaveText("1 / 2");
});

test("[007 AK-3] Link wirkt auch bei schon geöffneter App", async ({ page }) => {
  await page.goto(PROD);
  await expect(page.locator("#homeText")).not.toBeEmpty();
  await page.evaluate((hash) => { location.hash = hash; }, setupHash(MOTIVES).slice(1));
  await page.waitForLoadState("load");
  await expect(page).toHaveURL(new RegExp(PROD + "$"));
  await page.locator("#homeBtn").tap();
  await expect(page.locator("#qName")).toHaveText("Testmotiv A");
});

test("[007 AK-4] Ohne Einrichtung neutrale Standard-Motivatoren", async ({ page }) => {
  await page.goto(PROD);
  await page.locator("#homeBtn").tap();
  await expect(page.locator("#stepCount")).toHaveText("1 / 7");
  await expect(page.locator("#qName")).toHaveText("Verantwortung");
});

test("[007 AK-5] Bewertungen bleiben bei gleicher id zugeordnet", async ({ page }) => {
  await page.goto(PROD);
  await page.locator("#homeBtn").tap();
  await page.locator('#scale .opt[data-v="4"]').tap();
  await expect(page.locator("#saveState")).toHaveText("✓ Gespeichert");
  await page.goto(PROD + setupHash([{ id: "verantwortung", name: "Neuer Name", q: "Neue Frage?", icon: "target" }]));
  await expect(page.locator("#homeText")).toHaveText("Diese Woche erledigt. Im Schnitt weitgehend erfüllt.");
});

test("[007 AK-8] Production und Beta haben getrennte Motivatoren", async ({ page }) => {
  await page.goto(PROD + setupHash(MOTIVES));
  await expect(page.locator("#homeText")).not.toBeEmpty();
  await page.goto(BETA);
  await page.locator("#homeBtn").tap();
  await expect(page.locator("#qName")).toHaveText("Verantwortung");
});
