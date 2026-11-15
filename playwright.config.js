// Automatische Tests (CI): laufen bei jedem Pull Request in GitHub Actions und lokal mit `npm test`.
const { defineConfig } = require("@playwright/test");

const pixel = { viewport: { width: 412, height: 870 }, isMobile: true, hasTouch: true };

module.exports = defineConfig({
  testDir: "tests",
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  use: { baseURL: "http://localhost:4173/motivations-kompass/", trace: "off" },
  projects: [
    { name: "hell", use: { ...pixel, colorScheme: "light" } },
    { name: "dunkel", use: { ...pixel, colorScheme: "dark" } },
  ],
  webServer: { command: "node tests/serve.js 4173", url: "http://localhost:4173/motivations-kompass/", reuseExistingServer: !process.env.CI },
});
