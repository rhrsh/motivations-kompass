// Wochencheck bewerten (specs/004-wochencheck-bewerten.md)
const { test, expect } = require("@playwright/test");
const { PROD, failOnConsoleErrors } = require("./helpers");

failOnConsoleErrors();

const count = (page) => page.locator("#stepCount");
const face = (page, v) => page.locator(`#scale .opt[data-v="${v}"]`);

async function startWeek(page) {
  await page.goto(PROD);
  await page.locator("#homeBtn").tap();
  await expect(count(page)).toHaveText("1 / 7");
}

test("[004 AK-1] Ein Motivator je Schritt: Symbol, Name, Leitfrage und fünf Gesichter ohne Text", async ({ page }) => {
  await startWeek(page);
  await expect(page.locator("#qName")).toHaveText("Verantwortung");
  await expect(page.locator("#qText")).toHaveText("Wie viel Verantwortung und Entscheidungsspielraum habe ich?");
  await expect(page.locator("#qIcon svg")).toBeVisible();
  await expect(page.locator("#scale .opt")).toHaveCount(5);
  await expect(face(page, 1)).toHaveAttribute("aria-label", "Gar nicht erfüllt");
  await expect(face(page, 5)).toHaveAttribute("aria-label", "Voll erfüllt");
  expect((await page.locator("#scale").innerText()).trim()).toBe("");
  const left = await face(page, 1).boundingBox(), right = await face(page, 5).boundingBox();
  expect(left.x).toBeLessThan(right.x);
});

test("[004 AK-2] Antippen markiert und wechselt nach kurzer Pause", async ({ page }) => {
  await startWeek(page);
  await face(page, 4).tap();
  await expect(face(page, 4)).toHaveClass(/sel/);
  await expect(count(page)).toHaveText("1 / 7"); // noch in der Pause
  await expect(count(page)).toHaveText("2 / 7");
});

test("[004 AK-3] Unbewertete werden nicht übersprungen, danach zur Auswertung", async ({ page }) => {
  await startWeek(page);
  await page.locator("#progress button").nth(6).tap();
  await expect(count(page)).toHaveText("7 / 7");
  await face(page, 3).tap();
  await expect(count(page)).toHaveText("1 / 7"); // erster offener
});

test("[004 AK-4] Zurück-Knopf, Zähler und Sprung über den Fortschrittsbalken", async ({ page }) => {
  await startWeek(page);
  await page.locator("#progress button").nth(3).tap();
  await expect(count(page)).toHaveText("4 / 7");
  await expect(page.locator("#qName")).toHaveText("Anerkennung");
  await page.locator("#backBtn").tap();
  await expect(count(page)).toHaveText("3 / 7");
  await page.locator("#progress button").nth(0).tap();
  await page.locator("#backBtn").tap();
  await expect(page.locator("#home")).toBeVisible();
});

test("[004 AK-5, AK-6] Kommentar hält an, „Weiter →“ und Enter gehen weiter", async ({ page }) => {
  await startWeek(page);
  await expect(page.locator("#comment")).toHaveAttribute("placeholder", "Warum? (optional)");
  await face(page, 2).tap();
  await page.locator("#comment").tap();
  await page.waitForTimeout(1200);
  await expect(count(page)).toHaveText("1 / 7");
  await expect(page.locator("#commentNext")).toBeVisible();
  await page.locator("#commentNext").tap();
  await expect(count(page)).toHaveText("2 / 7");
  await face(page, 3).tap();
  await page.locator("#comment").tap();
  await page.locator("#comment").fill("Grund");
  await page.keyboard.press("Enter");
  await expect(count(page)).toHaveText("3 / 7");
});

test("[004 AK-7] Bewertung und Kommentar sind sofort gespeichert", async ({ page }) => {
  await startWeek(page);
  await face(page, 2).tap();
  await page.locator("#comment").tap();
  await page.locator("#comment").fill("Sofort gespeichert");
  await expect(page.locator("#saveState")).toHaveText("✓ Gespeichert");
  await page.reload();
  await page.locator("#homeBtn").tap(); // „Weiter bei …“ führt zum zweiten
  await page.locator("#progress button").nth(0).tap();
  await expect(face(page, 2)).toHaveClass(/sel/);
  await expect(page.locator("#comment")).toHaveValue("Sofort gespeichert");
});

test("[004 AK-8] Bewertungen gehören zur aktuellen ISO-Kalenderwoche", async ({ page }) => {
  await startWeek(page);
  await face(page, 4).tap();
  await expect(page.locator("#saveState")).toHaveText("✓ Gespeichert");
  const [stored, expected] = await page.evaluate(async () => {
    const { isoWeek } = await import("./js/week.js");
    const db = await new Promise((r) => { const q = indexedDB.open("kompass"); q.onsuccess = () => r(q.result); });
    const rows = await new Promise((r) => { const q = db.transaction("entries").objectStore("entries").getAll(); q.onsuccess = () => r(q.result); });
    return [rows.map((x) => x.week), isoWeek(new Date()).key];
  });
  expect(stored).toEqual([expected]);
  // ISO-Regel an bekannten Grenzfällen
  const weeks = await page.evaluate(async () => {
    const { isoWeek } = await import("./js/week.js");
    return [new Date(2026, 0, 1), new Date(2027, 0, 1), new Date(2025, 11, 29)].map((d) => isoWeek(d).key);
  });
  expect(weeks).toEqual(["2026-W01", "2026-W53", "2026-W01"]);
});

test("[004 AK-9] Im Hintergrund springt die App nicht weiter", async ({ page }) => {
  await startWeek(page);
  await face(page, 3).tap();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(1200);
  await expect(count(page)).toHaveText("1 / 7");
});

test("[004 AK-10] Tastatur: 1–5 bewerten, Pfeile wechseln", async ({ page }) => {
  await startWeek(page);
  await page.keyboard.press("ArrowRight"); // noch nicht bewertet: bleibt
  await expect(count(page)).toHaveText("1 / 7");
  await page.keyboard.press("5");
  await expect(face(page, 5)).toHaveClass(/sel/);
  await expect(count(page)).toHaveText("2 / 7");
  await page.keyboard.press("ArrowLeft");
  await expect(count(page)).toHaveText("1 / 7");
  await page.keyboard.press("ArrowRight");
  await expect(count(page)).toHaveText("2 / 7");
});

test("[004 AK-11] Bewertung lässt sich ändern", async ({ page }) => {
  await startWeek(page);
  await face(page, 2).tap();
  await expect(count(page)).toHaveText("2 / 7");
  await page.locator("#backBtn").tap();
  await face(page, 4).tap();
  await page.locator("#backBtn").tap();
  await expect(face(page, 4)).toHaveClass(/sel/);
  await expect(face(page, 2)).not.toHaveClass(/sel/);
});
