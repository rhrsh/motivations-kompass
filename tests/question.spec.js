// Eigene Entscheidungsfrage im Verlauf (specs/003-entscheidungsfrage.md)
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const { PROD, BETA, failOnConsoleErrors, fitsScreen } = require("./helpers");

failOnConsoleErrors();

const LONGEST = "W".repeat(10) + " " + "Will ich in dieser Rolle die nächsten zwei Jahre weitermachen oder ist es Zeit für einen Wechsel in eine andere Richtung? Und".slice(0, 129);

async function openHistory(page, base = PROD) {
  await page.goto(base);
  await page.locator("#historyBtn").tap();
  await expect(page.locator("#history")).toBeVisible();
}
async function setQuestion(page, text) {
  await page.locator("#questionBtn").tap();
  await page.locator("#questionInput").fill(text);
  await page.locator("#questionSave").tap();
  await expect(page.locator("#questionEdit")).toBeHidden();
}

test("[003 AK-2] Ohne Frage steht ein dezenter Hinweis", async ({ page }) => {
  await openHistory(page);
  await expect(page.locator("#questionBtn")).toHaveText("+ Eigene Frage festhalten");
  await expect(page.locator("#questionBtn")).toHaveClass(/empty/);
});

test("[003 AK-1, AK-4, AK-8] Frage festhalten, oben anzeigen, nach Neustart erhalten", async ({ page }) => {
  await openHistory(page);
  await page.locator("#questionBtn").tap();
  await expect(page.locator("#questionInput")).toBeFocused();
  await expect(page.locator("#questionSave")).toBeVisible();
  await expect(page.locator("#questionCancel")).toBeVisible();
  await page.locator("#questionInput").fill("Will ich so weitermachen?");
  await page.locator("#questionSave").tap();
  await expect(page.locator("#questionBtn .q-text")).toHaveText("Will ich so weitermachen?");
  // steht über den Motivatoren
  const q = await page.locator("#questionBtn").boundingBox(), card = await page.locator("#history .h-card").boundingBox();
  expect(q.y).toBeLessThan(card.y);
  await page.reload();
  await page.locator("#historyBtn").tap();
  await expect(page.locator("#questionBtn .q-text")).toHaveText("Will ich so weitermachen?");
});

test("[003 AK-5, AK-3] Höchstens 140 Zeichen mit Zähler, Übersicht passt weiter ohne Scrollen", async ({ page }) => {
  await openHistory(page, BETA); // mit Beispieldaten
  await page.locator("#questionBtn").tap();
  await expect(page.locator("#questionCount")).toHaveText("noch 140 Zeichen");
  await page.locator("#questionInput").fill("x".repeat(10));
  await expect(page.locator("#questionCount")).toHaveText("noch 130 Zeichen");
  await page.locator("#questionInput").fill("");
  await page.locator("#questionInput").pressSequentially("y".repeat(150), { delay: 0 });
  await expect(page.locator("#questionInput")).toHaveValue("y".repeat(140));
  await expect(page.locator("#questionCount")).toHaveText("noch 0 Zeichen");
  await page.locator("#questionInput").fill(LONGEST.slice(0, 140));
  await page.locator("#questionSave").tap();
  expect(await fitsScreen(page), "Übersicht mit längster Frage muss ohne Scrollen passen").toBe(true);
});

test("[003 AK-6] Leer speichern entfernt die Frage", async ({ page }) => {
  await openHistory(page);
  await setQuestion(page, "Bleibe ich?");
  await setQuestion(page, "   ");
  await expect(page.locator("#questionBtn")).toHaveText("+ Eigene Frage festhalten");
  await page.reload();
  await page.locator("#historyBtn").tap();
  await expect(page.locator("#questionBtn")).toHaveText("+ Eigene Frage festhalten");
});

test("[003 AK-7] Abbrechen und Zurück-Geste verwerfen die Eingabe", async ({ page }) => {
  await openHistory(page);
  await setQuestion(page, "Bleibe ich?");
  await page.locator("#questionBtn").tap();
  await page.locator("#questionInput").fill("Etwas anderes");
  await page.locator("#questionCancel").tap();
  await expect(page.locator("#questionBtn .q-text")).toHaveText("Bleibe ich?");
  // Zurück-Geste: schließt nur das Eingabefeld, der Verlauf bleibt offen
  await page.locator("#questionBtn").tap();
  await page.locator("#questionInput").fill("Noch etwas anderes");
  await page.goBack();
  await expect(page.locator("#questionEdit")).toBeHidden();
  await expect(page.locator("#history")).toBeVisible();
  await expect(page.locator("#questionBtn .q-text")).toHaveText("Bleibe ich?");
});

test("[003 AK-9] Frage ist Teil der Sicherung und wird nur übernommen, wenn keine da ist", async ({ page }, info) => {
  await openHistory(page);
  await setQuestion(page, "Frage aus Production");
  await page.locator("#historyBack").tap();
  const [dl] = await Promise.all([page.waitForEvent("download"), page.locator("#exportBtn").click()]);
  const file = info.outputPath("sicherung.json");
  await dl.saveAs(file);
  expect(JSON.parse(fs.readFileSync(file, "utf8")).decisionQuestion).toBe("Frage aus Production");

  // Beta ohne Frage: wird übernommen
  await page.goto(BETA);
  await page.setInputFiles("#importFile", file);
  await expect(page.locator("#homeText")).toContainText("Entscheidungsfrage übernommen");
  await page.locator("#historyBtn").tap();
  await expect(page.locator("#questionBtn .q-text")).toHaveText("Frage aus Production");

  // Beta mit eigener Frage: bleibt
  await setQuestion(page, "Eigene Beta-Frage");
  await page.goto(BETA);
  await page.setInputFiles("#importFile", file);
  await expect(page.locator("#homeText")).not.toContainText("Entscheidungsfrage übernommen");
  await page.locator("#historyBtn").tap();
  await expect(page.locator("#questionBtn .q-text")).toHaveText("Eigene Beta-Frage");
});

test("[003 AK-10] Production und Beta haben eigene Fragen, Beispieldaten ohne Frage", async ({ page }) => {
  await openHistory(page, BETA);
  await expect(page.locator("#questionBtn")).toHaveText("+ Eigene Frage festhalten");
  await setQuestion(page, "Nur Beta");
  await openHistory(page, PROD);
  await expect(page.locator("#questionBtn")).toHaveText("+ Eigene Frage festhalten");
});
