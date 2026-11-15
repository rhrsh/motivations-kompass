// Die wichtigsten Abläufe aus Sicht des Nutzers. Jeder Test startet mit leerem Browser.
const { test, expect } = require("@playwright/test");

// Konsolenfehler sammeln: Ein Test schlägt fehl, sobald die App einen Fehler meldet.
let consoleErrors = [];
test.beforeEach(async ({ page }) => {
  consoleErrors = [];
  page.on("pageerror", (e) => consoleErrors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
});
test.afterEach(async () => { expect(consoleErrors, "Konsolenfehler").toEqual([]); });

async function rateWholeWeek(page) {
  await page.locator("#homeBtn").tap();
  const total = await page.locator("#progress button").count();
  for (let i = 0; i < total; i++) {
    await expect(page.locator("#stepCount")).toHaveText(`${i + 1} / ${total}`);
    await page.locator(`#scale .opt[data-v="${(i % 5) + 1}"]`).tap();
  }
  await expect(page.locator("#summary")).toBeVisible();
}

test("Woche bewerten: Auswertung passt ohne Scrollen und bleibt nach Neuladen erhalten", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator("#homeBtn")).toHaveText("Woche bewerten");
  await rateWholeWeek(page);
  const [scroll, height] = await page.evaluate(() => [document.documentElement.scrollHeight, innerHeight]);
  expect(scroll, "Auswertung muss ohne Scrollen passen").toBeLessThanOrEqual(height);
  await page.reload();
  await expect(page.locator("#homeText")).toContainText("Diese Woche erledigt");
  await expect(page.locator("#homeBtn")).toHaveText("Ergebnis ansehen");
});

test("Production zeigt keine Beta-Werkzeuge", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator("#betaTools")).toBeHidden();
  await expect(page.locator(".beta-badge")).toBeHidden();
});

test("Preview (beta) ist von Production getrennt", async ({ page }) => {
  // Production: einen Motivator bewerten
  await page.goto("./");
  await page.locator("#homeBtn").tap();
  await page.locator('#scale .opt[data-v="4"]').tap();
  await expect(page.locator("#saveState")).toHaveText("✓ Gespeichert");
  await page.goto("./");
  await expect(page.locator("#homeText")).toContainText("1 von");

  // Beta: eigene, leere Daten, gekennzeichnet, mit Werkzeugen
  await page.goto("./beta/");
  await expect(page.locator(".beta-badge")).toBeVisible();
  await expect(page.locator("#homeText")).toContainText("noch nicht bewertet");
  await page.locator("#sampleBtn").tap();
  await expect(page.locator("#homeText")).toContainText("Beispieldaten");
  const sampleWeeks = await page.evaluate(async () => {
    const db = await new Promise((r) => { const q = indexedDB.open("kompass-beta"); q.onsuccess = () => r(q.result); });
    const rows = await new Promise((r) => { const q = db.transaction("entries").objectStore("entries").getAll(); q.onsuccess = () => r(q.result); });
    return new Set(rows.map((x) => x.week)).size;
  });
  expect(sampleWeeks).toBeGreaterThanOrEqual(10);

  // Production: unverändert
  await page.goto("./");
  await expect(page.locator("#homeText")).toContainText("1 von");
  const prodWeeks = await page.evaluate(async () => {
    const db = await new Promise((r) => { const q = indexedDB.open("kompass"); q.onsuccess = () => r(q.result); });
    const rows = await new Promise((r) => { const q = db.transaction("entries").objectStore("entries").getAll(); q.onsuccess = () => r(q.result); });
    return new Set(rows.map((x) => x.week)).size;
  });
  expect(prodWeeks, "Production darf keine Beispieldaten enthalten").toBe(1);
});

test("Offline-Speicher von Production und Preview bleiben beide erhalten", async ({ page }) => {
  // Beim ersten Besuch der Preview übernimmt deren Service Worker und die Seite lädt sich einmal neu,
  // daher hier geduldig nachfragen statt beim ersten Versuch abzubrechen.
  const cacheNames = () => page.evaluate(async () => {
    await navigator.serviceWorker.ready; return (await caches.keys()).sort();
  }).catch(() => []);
  await page.goto("./");
  await expect.poll(cacheNames).toContainEqual(expect.stringMatching(/^kompass-v\d+$/));
  await page.goto("./beta/");
  await expect.poll(cacheNames).toContainEqual(expect.stringMatching(/^kompass-beta-v\d+$/));
  await expect.poll(cacheNames, { message: "Production-Cache darf nicht gelöscht werden" })
    .toContainEqual(expect.stringMatching(/^kompass-v\d+$/));
  // Production darf keine Dateien der Preview gespeichert haben
  const leaked = await page.evaluate(async () => {
    const name = (await caches.keys()).find((n) => /^kompass-v\d+$/.test(n));
    return (await (await caches.open(name)).keys()).map((r) => r.url).filter((u) => u.includes("/beta/"));
  });
  expect(leaked).toEqual([]);
});
