// Production und Beta nebeneinander installierbar, frühere Adresse (specs/001-umgebungen.md, AK-10 bis AK-12)
const { test, expect } = require("@playwright/test");
const { ROOT, PROD, BETA, failOnConsoleErrors } = require("./helpers");

failOnConsoleErrors();

// Zuständigkeitsbereich (Scope) einer App aus ihrem Manifest, als absoluter Pfad
async function scopeOf(page, appPath) {
  return page.evaluate(async (base) => {
    const url = new URL("manifest.webmanifest", location.origin + base);
    const m = await (await fetch(url)).json();
    return new URL(m.scope || ".", url).pathname;
  }, appPath);
}

test("[001 AK-10] Production und Beta liegen nicht im Scope der jeweils anderen", async ({ page }) => {
  await page.goto(PROD);
  const prod = await scopeOf(page, PROD), beta = await scopeOf(page, BETA);
  expect(prod).toBe(PROD);
  expect(beta).toBe(BETA);
  expect(beta.startsWith(prod), "Beta darf nicht unter Production liegen").toBe(false);
  expect(prod.startsWith(beta), "Production darf nicht unter der Beta liegen").toBe(false);
  // Auch die Service Worker sind getrennt zuständig
  const scopes = await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    return (await navigator.serviceWorker.getRegistrations()).map((r) => new URL(r.scope).pathname);
  });
  expect(scopes).toEqual([PROD]);
});

test("[001 AK-11] Frühere Adresse leitet weiter, Daten und Einrichtungslink bleiben", async ({ page }) => {
  // Daten in Production anlegen
  await page.goto(PROD);
  await page.locator("#homeBtn").tap();
  await page.locator('#scale .opt[data-v="4"]').tap();
  await expect(page.locator("#saveState")).toHaveText("✓ Gespeichert");

  // Frühere Adresse: landet in Production mit denselben Daten
  await page.goto(ROOT);
  await expect(page).toHaveURL(new RegExp(PROD + "$"));
  await expect(page.locator("#homeText")).toContainText("1 von");

  // Einrichtungslink über die frühere Adresse wird angewendet
  const list = [{ id: "a", name: "Testmotiv A", q: "Frage A?", icon: "key" }, { id: "b", name: "Testmotiv B", q: "Frage B?", icon: "star" }];
  const b64 = Buffer.from(JSON.stringify(list)).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  await page.goto(ROOT + "#setup=" + b64);
  await expect(page).toHaveURL(new RegExp(PROD));
  await page.locator("#homeBtn").tap();
  await expect(page.locator("#qName")).toHaveText("Testmotiv A");
  await expect(page.locator("#stepCount")).toHaveText("1 / 2");
});

test("[001 AK-12] Alter Service Worker unter der früheren Adresse meldet sich selbst ab", async ({ page }) => {
  await page.goto(PROD);
  // So war eine früher installierte App registriert
  await page.evaluate((root) => navigator.serviceWorker.register(root + "sw.js", { scope: root }), ROOT);
  await expect.poll(() => page.evaluate(async (root) =>
    (await navigator.serviceWorker.getRegistrations()).some((r) => new URL(r.scope).pathname === root), ROOT),
  { message: "alter Service Worker muss verschwinden", timeout: 10_000 }).toBe(false);
});
