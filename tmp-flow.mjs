import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const errors = [];
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(`console: ${message.text()}`);
});

await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
await page.fill("#email", "admin@tasu.app");
await page.fill("#password", "tasu-demo");
await page.click('button[type="submit"]');
await page.waitForURL("**/app", { timeout: 20000 });

const routes = [
  "/app/knowledge",
  "/app/knowledge/new",
  "/app/knowledge/reset-your-password-safely",
  "/app/knowledge/reset-your-password-safely/edit",
  "/app/inbox",
  "/app/inbox?view=activity",
  "/app/reports?range=7d",
  "/app/reports?range=90d",
];
for (const route of routes) {
  const response = await page.goto(`http://localhost:3000${route}`, {
    waitUntil: "networkidle",
  });
  const h1 = await page.locator("h1").first().textContent().catch(() => null);
  console.log(`${response?.status()} ${route} — ${h1?.trim() ?? "no h1"}`);
}

// Create an article through the real form.
await page.goto("http://localhost:3000/app/knowledge/new", {
  waitUntil: "networkidle",
});
const title = `Test guide ${Date.now()}`;
await page.fill("#article-title", title);
await page.fill(
  "#article-body",
  "## Overview\n\nThis is a temporary article created by the smoke test.\n\n## Steps\n\n1. Open the thing.\n2. Fix the thing.",
);
await page.click('button[type="submit"]');
await page.waitForURL("**/app/knowledge/**", { timeout: 20000 });
console.log("Created article at", page.url());
const heading = await page.locator("h1").first().textContent();
console.log("Article heading:", heading?.trim());
const tocCount = await page.locator('nav[aria-label="Table of contents"] a').count();
console.log("TOC links:", tocCount);

// Helpful vote
await page.getByRole("button", { name: "Yes" }).click();
await page.waitForTimeout(600);
console.log("Vote confirmation:", await page.getByText("Thanks for the feedback").isVisible());

// Edit it
const slug = page.url().split("/").pop();
await page.goto(`http://localhost:3000/app/knowledge/${slug}/edit`, {
  waitUntil: "networkidle",
});
await page.fill("#article-title", `${title} (edited)`);
await page.click('button[type="submit"]');
await page.waitForURL(`**/app/knowledge/${slug}`, { timeout: 20000 });
console.log("Edited heading:", (await page.locator("h1").first().textContent())?.trim());

console.log(errors.length ? `ERRORS:\n${errors.join("\n")}` : "No page errors");
await browser.close();
