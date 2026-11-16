// Start und Auswertung der Woche (specs/005-start-und-auswertung.md)
const { test, expect } = require("@playwright/test");
const { PROD, failOnConsoleErrors, rateWholeWeek } = require("./helpers");

failOnConsoleErrors();

const face = (page, v) => page.locator(`#scale .opt[data-v="${v}"]`);

test("[005 AK-1, AK-3] Start nach Neuladen, Text und Knopf folgen dem Stand", async ({ page }) => {
  await page.goto(PROD);
  await expect(page.locator("#home")).toBeVisible();
  await expect(page.locator("#homeWeek")).toHaveText(/^KW \d+ · \d+\. \S+$/);
  await expect(page.locator("#homeText")).toHaveText("Diese Woche noch nicht bewertet. Dauert etwa zwei Minuten.");
  await expect(page.locator("#homeBtn")).toHaveText("Woche bewerten");
  await page.locator("#homeBtn").tap();
  await face(page, 4).tap();
  await expect(page.locator("#stepCount")).toHaveText("2 / 7");
  await face(page, 4).tap();
  await expect(page.locator("#stepCount")).toHaveText("3 / 7");
  await page.reload();
  await expect(page.locator("#home")).toBeVisible(); // nicht mitten im Bewerten
  await expect(page.locator("#homeText")).toHaveText("2 von 7 Motivatoren bewertet.");
  await expect(page.locator("#homeBtn")).toHaveText("Weiter bei Sinn");
});

test("[005 AK-2] Ring und Gesicht zeigen den Schnitt der Woche", async ({ page }) => {
  await page.goto(PROD);
  await rateWholeWeek(page, 4);
  await page.locator("#doneBtn").tap();
  await expect(page.locator("#homeText")).toHaveText("Diese Woche erledigt. Im Schnitt weitgehend erfüllt.");
  await expect(page.locator("#homeGauge")).toHaveAttribute("style", /--p:\s*80%/);
  await expect(page.locator("#homeFace .face")).toHaveAttribute("style", /--s4/);
});

test("[005 AK-4] Start bietet Verlauf, Sichern, Laden und zeigt die Version", async ({ page }) => {
  await page.goto(PROD);
  await expect(page.locator("#historyBtn")).toHaveText("Verlauf");
  await expect(page.locator("#exportBtn")).toHaveText("Daten sichern");
  await expect(page.locator("#importBtn")).toHaveText("Sicherung laden");
  // Die Version erscheint, sobald der Offline-Speicher angelegt ist (beim allerersten Öffnen noch leer, siehe 008)
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.locator("#version")).toHaveText(/^Version v\d+$/);
});

test("[005 AK-6, AK-7] Auswertung: Schnitt in Worten, Zeile je Motivator, Kommentar per Sprechblase", async ({ page }) => {
  await page.goto(PROD);
  await page.locator("#homeBtn").tap();
  await face(page, 2).tap();
  await page.locator("#comment").tap();
  await page.locator("#comment").fill("Ein Kommentar");
  await page.locator("#commentNext").tap();
  for (let i = 1; i < 7; i++) {
    await expect(page.locator("#stepCount")).toHaveText(`${i + 1} / 7`);
    await face(page, 4).tap();
  }
  await expect(page.locator("#summary")).toBeVisible();
  await expect(page.locator("#avg")).toHaveText(/erfüllt$/);
  await expect(page.locator("#sumWeek")).toHaveText(/^KW \d+/);
  const rows = page.locator("#items .row");
  await expect(rows).toHaveCount(7);
  await expect(rows.first().locator(".ic svg")).toBeVisible();
  await expect(rows.first().locator(".cbtn")).toHaveCount(1);
  await expect(rows.nth(1).locator(".cbtn")).toHaveCount(0);
  await rows.first().locator(".cbtn").tap();
  await expect(rows.first().locator(".ctext")).toHaveText("Ein Kommentar");
  await rows.first().locator(".cbtn").tap();
  await expect(rows.first().locator(".ctext")).toBeHidden();
});

test("[005 AK-8] Zeile antippen ändert den Motivator und führt zurück zur Auswertung", async ({ page }) => {
  await page.goto(PROD);
  await rateWholeWeek(page, 3);
  await page.locator("#items .item").nth(3).tap();
  await expect(page.locator("#qName")).toHaveText("Anerkennung");
  await face(page, 5).tap();
  await expect(page.locator("#summary")).toBeVisible();
  await expect(page.locator("#items .row").nth(3).locator(".mini .face")).toHaveAttribute("style", /--s5/);
});

test("[005 AK-9] „Neu ausfüllen“ löscht erst nach zweitem Tipp", async ({ page }) => {
  await page.goto(PROD);
  await rateWholeWeek(page, 3);
  const redo = page.locator("#redoBtn");
  await redo.tap();
  await expect(redo).toHaveText("Wirklich löschen?");
  await expect(redo).toHaveText("Neu ausfüllen", { timeout: 4000 }); // nach 3 Sekunden zurück
  await redo.tap();
  await redo.tap();
  await expect(page.locator("#step")).toBeVisible();
  await expect(page.locator("#stepCount")).toHaveText("1 / 7");
  await page.reload();
  await expect(page.locator("#homeText")).toHaveText("Diese Woche noch nicht bewertet. Dauert etwa zwei Minuten.");
});

test("[005 AK-10] „Fertig“ führt zum Start", async ({ page }) => {
  await page.goto(PROD);
  await rateWholeWeek(page, 3);
  await page.locator("#doneBtn").tap();
  await expect(page.locator("#home")).toBeVisible();
});

test("[005 AK-12] Zurück-Geste geht einen Schritt zurück", async ({ page }) => {
  await page.goto(PROD);
  await page.locator("#homeBtn").tap();
  await face(page, 3).tap();
  await expect(page.locator("#stepCount")).toHaveText("2 / 7");
  await page.goBack();
  await expect(page.locator("#stepCount")).toHaveText("1 / 7");
  await page.goBack();
  await expect(page.locator("#home")).toBeVisible();
});
