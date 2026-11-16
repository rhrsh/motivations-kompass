// Daten sichern und laden (specs/006-daten-sichern-und-laden.md)
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const { PROD, failOnConsoleErrors, setupHash, currentWeek, backupFile, weeksIn } = require("./helpers");

failOnConsoleErrors();

const MOTIVES = [{ id: "a", name: "Testmotiv A", q: "Frage A?", icon: "key" }, { id: "b", name: "Testmotiv B", q: "Frage B?", icon: "star" }];

async function ready(page) {
  await expect(page.locator("#homeText")).not.toBeEmpty();
}
async function rateFirst(page, v, comment) {
  await page.locator("#homeBtn").tap();
  await page.locator(`#scale .opt[data-v="${v}"]`).tap();
  if (comment) { await page.locator("#comment").tap(); await page.locator("#comment").fill(comment); }
  await expect(page.locator("#saveState")).toHaveText("✓ Gespeichert");
}
const rowsIn = (page) => page.evaluate(async () => {
  const db = await new Promise((r) => { const q = indexedDB.open("kompass"); q.onsuccess = () => r(q.result); });
  return new Promise((r) => { const q = db.transaction("entries").objectStore("entries").getAll(); q.onsuccess = () => r(q.result); });
});

test("[006 AK-1, AK-2] Sicherung enthält Wochen, Kommentare und Motivatoren, Dateiname mit Ortsdatum", async ({ page }, info) => {
  await page.goto(PROD + setupHash(MOTIVES));
  await ready(page);
  await rateFirst(page, 4, "Kommentar für die Sicherung");
  await page.goto(PROD);
  const [dl] = await Promise.all([page.waitForEvent("download"), page.locator("#exportBtn").click()]);
  const today = await page.evaluate(() => { const d = new Date(), p = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; });
  expect(dl.suggestedFilename()).toBe(`motivation-tracker-${today}.json`);
  const file = info.outputPath("export.json");
  await dl.saveAs(file);
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const week = await currentWeek(page);
  expect(data.format).toBe("motivations-kompass/2");
  expect(data.motives).toEqual(MOTIVES);
  expect(data.weeks[week].a).toMatchObject({ rating: 4, comment: "Kommentar für die Sicherung" });
  expect(data.weeks[week].a.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
});

test("[006 AK-3, AK-4, AK-8] Laden führt zusammen, der neuere Eintrag gewinnt", async ({ page }) => {
  await page.goto(PROD);
  await ready(page);
  await rateFirst(page, 2); // verantwortung = 2, jetzt gespeichert
  const week = await currentWeek(page);
  await page.goto(PROD);
  await ready(page);
  await page.setInputFiles("#importFile", backupFile({
    format: "motivations-kompass/2", motives: null,
    weeks: {
      [week]: {
        verantwortung: { rating: 5, comment: "alt", updatedAt: "2000-01-01T00:00:00.000Z" }, // älter: verliert
        gestaltung: { rating: 3, comment: "neu", updatedAt: "2999-01-01T00:00:00.000Z" },    // fehlt auf dem Gerät: kommt dazu
      },
      "2025-W10": { sinn: { rating: 4, comment: "", updatedAt: "2025-03-05T10:00:00.000Z" } },
    },
  }));
  await expect(page.locator("#homeText")).toHaveText("Sicherung geladen: 2 Einträge aus 2 Wochen übernommen.");
  const rows = await rowsIn(page);
  expect(rows.find((r) => r.motive === "verantwortung").rating).toBe(2);
  expect(rows.find((r) => r.motive === "gestaltung").rating).toBe(3);
  expect(rows.some((r) => r.week === "2025-W10")).toBe(true);
});

test("[006 AK-5] Vorhandene Motivatoren werden beim Laden nicht ersetzt", async ({ page }) => {
  await page.goto(PROD + setupHash(MOTIVES));
  await ready(page);
  await page.setInputFiles("#importFile", backupFile({
    format: "motivations-kompass/2", weeks: {},
    motives: [{ id: "x", name: "Fremdes Motiv", q: "?", icon: "heart" }],
  }));
  await expect(page.locator("#homeText")).toContainText("Sicherung geladen");
  await expect(page.locator("#homeText")).not.toContainText("Motivatoren übernommen");
  await page.locator("#homeBtn").tap();
  await expect(page.locator("#qName")).toHaveText("Testmotiv A");
});

test("[006 AK-6] Sicherung nur mit Motivatoren, ohne Bewertungen, lässt sich laden", async ({ page }) => {
  await page.goto(PROD);
  await ready(page);
  await page.setInputFiles("#importFile", backupFile({ format: "motivations-kompass/2", weeks: {}, motives: MOTIVES }));
  await expect(page.locator("#homeText")).toContainText("Motivatoren übernommen");
  await page.locator("#homeBtn").tap();
  await expect(page.locator("#qName")).toHaveText("Testmotiv A");
});

test("[006 AK-7, AK-8] Altes Format wird geladen, zweites Laden meldet „Alles war schon auf dem Gerät“", async ({ page }) => {
  await page.goto(PROD);
  await ready(page);
  const old = { "2025-W40": { ratings: { sinn: 4, wirkung: 2 }, comments: { sinn: "alt" }, updatedAt: "2025-10-01T10:00:00Z" } };
  await page.setInputFiles("#importFile", backupFile(old));
  await expect(page.locator("#homeText")).toHaveText("Sicherung geladen: 2 Einträge aus 1 Woche übernommen.");
  await page.setInputFiles("#importFile", backupFile(old));
  await expect(page.locator("#homeText")).toHaveText("Sicherung geladen. Alles war schon auf dem Gerät.");
});

test("[006 AK-9] Ungültige Datei ändert nichts", async ({ page }) => {
  await page.goto(PROD);
  await ready(page);
  await rateFirst(page, 3);
  await page.goto(PROD);
  await ready(page);
  await page.setInputFiles("#importFile", backupFile({ foo: 1 }));
  await expect(page.locator("#homeText")).toHaveText("Diese Datei konnte nicht geladen werden. Ist es eine Sicherung des Motivation Trackers?");
  expect(await weeksIn(page, "kompass")).toBe(1);
  await page.setInputFiles("#importFile", { name: "kaputt.json", mimeType: "application/json", buffer: Buffer.from("kein json") });
  await expect(page.locator("#homeText")).toHaveText(/konnte nicht geladen werden/);
});

test("[006 AK-10] App bittet um dauerhaften Speicher", async ({ page }) => {
  await page.addInitScript(() => {
    window.__persistCalls = 0;
    if (navigator.storage) navigator.storage.persist = async () => { window.__persistCalls++; return true; };
  });
  await page.goto(PROD);
  await ready(page);
  await expect.poll(() => page.evaluate(() => window.__persistCalls)).toBeGreaterThan(0);
});
