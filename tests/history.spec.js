// Verlauf über mehrere Wochen (specs/002-verlauf.md). Geprüft in der Beta mit Beispieldaten.
const { test, expect } = require("@playwright/test");
const { PROD, BETA, failOnConsoleErrors, fitsScreen, rateWholeWeek } = require("./helpers");

failOnConsoleErrors();

async function openHistoryWithSampleData(page) {
  await page.goto(BETA);
  await expect(page.locator("#homeText")).toContainText("Beispieldaten"); // automatisch geladen (001 AK-5)
  await page.locator("#historyBtn").tap();
  await expect(page.locator("#history")).toBeVisible();
}

test("[002 AK-1, AK-2, AK-3, AK-4, AK-9] Übersicht: Zeile je Motivator, 8 Wochenbalken, Lücken, ohne Scrollen", async ({ page }) => {
  await openHistoryWithSampleData(page);
  const rows = page.locator("#history .h-row");
  await expect(rows).toHaveCount(7);
  await expect(rows.first().locator(".bars i")).toHaveCount(8);
  await expect(page.locator("#history .kw span")).toHaveCount(8);
  await expect(page.locator("#history .h-range")).toHaveText(/^KW \d+–\d+$/);
  expect(await rows.first().locator(".bars i.gap").count()).toBeGreaterThan(0);
  expect(await fitsScreen(page), "Übersicht muss ohne Scrollen passen").toBe(true);
});

test("[002 AK-5] Richtung und Höhe unter dem Namen", async ({ page }) => {
  await openHistoryWithSampleData(page);
  const rows = page.locator("#history .h-row small");
  // Beispieldaten: erster Motivator steigt, zweiter sinkt (js/sample.js)
  await expect(rows.nth(0)).toHaveText(/^steigt · jetzt \S+/);
  await expect(rows.nth(1)).toHaveText(/^sinkt · jetzt \S+/);
});

test("[002 AK-6, AK-7] Regeln für die Richtung", async ({ page }) => {
  await page.goto(PROD);
  const t = (values) => page.evaluate(async (v) => (await import("./js/history.js")).trend(v).text, values);
  expect(await t([])).toBe("noch keine Bewertung");
  expect(await t([3, 3, 3, 3, 3])).toBe("teils · Richtung ab 1 weiteren Woche");
  expect(await t([2, 2])).toBe("kaum · Richtung ab 4 weiteren Wochen");
  expect(await t([2, 2, 3, 3, 3, 3])).toBe("steigt · jetzt teils");        // +1,0
  expect(await t([3, 3, 3, 3, 3, 3, 3, 5])).toBe("steigt · jetzt weitgehend"); // Grenzfall: 3,5 gegen 3,0 = +0,5
  expect(await t([3, 3, 3, 3, 3, 3, 3, 4])).toBe("stabil · teils");        // +0,25
  expect(await t([4, 4, 4, 4, 4, 4, 2, 2])).toBe("sinkt · jetzt teils");   // −1,0
});

test("[002 AK-8] Ältere Wochen per Pfeil und per Wischen", async ({ page }) => {
  await openHistoryWithSampleData(page);
  const range = page.locator("#history .h-range");
  const newest = await range.textContent();
  await expect(page.locator("#history .h-newer")).toBeDisabled();
  await page.locator("#history .h-older").tap();
  await expect(range).not.toHaveText(newest);
  await page.locator("#history .h-newer").tap();
  await expect(range).toHaveText(newest);
  const card = page.locator("#history .h-card");
  const box = await card.boundingBox();
  await card.dispatchEvent("touchstart", { touches: [{ identifier: 1, clientX: box.x + 60, clientY: box.y + 200 }] });
  await card.dispatchEvent("touchend", { changedTouches: [{ identifier: 1, clientX: box.x + 260, clientY: box.y + 205 }] });
  await expect(range).not.toHaveText(newest);
});

test("[002 AK-10] Ohne Daten: „noch keine Bewertung“", async ({ page }) => {
  await page.goto(PROD);
  await page.locator("#historyBtn").tap();
  await expect(page.locator("#history .h-row").first().locator("small")).toHaveText("noch keine Bewertung");
});

test("[002 AK-11, AK-12, AK-13, AK-15] Detail: Linie, Vergleich, Kommentare neueste zuerst, Zurück", async ({ page }) => {
  await openHistoryWithSampleData(page);
  await page.locator("#history .h-row").first().tap();
  await expect(page.locator("#detail")).toBeVisible();
  await expect(page.locator("#detail .d-name")).not.toBeEmpty();
  await expect(page.locator("#detail .d-chart > svg")).toBeVisible();
  await expect(page.locator("#detail .d-cmp")).toContainText(/Letzte 4 Wochen \d,\d · davor \d,\d/);
  const weeks = (await page.locator("#detail .cl small").allTextContents()).map((w) => Number(w.replace("KW ", "")));
  expect(weeks.length).toBeGreaterThan(1);
  const noYearChange = weeks.every((n, i) => i === 0 || Math.abs(n - weeks[i - 1]) < 20);
  if (noYearChange) expect(weeks).toEqual([...weeks].sort((a, b) => b - a));
  await page.locator("#detailBack").tap();
  await expect(page.locator("#history")).toBeVisible();
  await page.locator("#historyBack").tap();
  await expect(page.locator("#home")).toBeVisible();
});

test("[002 AK-14, AK-15] Einstieg aus der Auswertung, die weiter ohne Scrollen passt", async ({ page }) => {
  await page.goto(PROD);
  await rateWholeWeek(page, 3);
  expect(await fitsScreen(page), "Auswertung muss ohne Scrollen passen").toBe(true);
  await page.locator("#sumHistoryBtn").tap();
  await expect(page.locator("#history")).toBeVisible();
  await expect(page.locator("#history .h-row").first().locator("small")).toHaveText("teils · Richtung ab 5 weiteren Wochen");
  await page.locator("#historyBack").tap();
  await expect(page.locator("#summary")).toBeVisible();
});
