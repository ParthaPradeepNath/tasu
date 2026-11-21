import { chromium } from "playwright";

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  colorScheme: "dark",
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();
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
  "/app",
  "/app/tickets",
  "/app/tickets/HD-1072",
  "/app/tickets/new",
  "/app/queue",
  "/app/knowledge",
  "/app/knowledge/reset-your-password-safely",
  "/app/inbox",
  "/app/inbox?view=activity",
  "/app/reports",
];
for (const route of routes) {
  const response = await page.goto(`http://localhost:3000${route}`, {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(350);
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    bg: getComputedStyle(document.body).backgroundColor,
    color: getComputedStyle(document.body).color,
  }));
  const overflow = metrics.scrollWidth > metrics.innerWidth + 1;
  console.log(
    `${response?.status()} ${route} — ${overflow ? `OVERFLOW ${metrics.scrollWidth}>${metrics.innerWidth}` : "ok"} — ${metrics.bg} / ${metrics.color}`,
  );
}

// Mobile drawer
await page.goto("http://localhost:3000/app", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Open navigation" }).click();
await page.waitForTimeout(400);
console.log("Drawer visible:", await page.getByRole("navigation", { name: "Main" }).isVisible());
await page.keyboard.press("Escape");
await page.waitForTimeout(300);
const drawerClosed = await page
  .locator('aside[aria-hidden="true"]')
  .count()
  .catch(() => 0);
console.log("Drawer closed:", drawerClosed >= 0);

console.log(errors.length ? `ERRORS:\n${errors.join("\n")}` : "No page errors");
await browser.close();
