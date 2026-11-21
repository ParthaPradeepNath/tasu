import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on("response", (response) => {
  if (response.request().method() !== "GET")
    console.log("RES", response.status(), response.url());
});
page.on("console", (message) => {
  if (message.type() === "error") console.log("CONSOLE", message.text());
});
page.on("pageerror", (error) => console.log("PAGEERROR:", error.message));

await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
await page.fill("#email", "admin@tasu.app");
await page.fill("#password", "tasu-demo");
await page.click('button[type="submit"]');
await page.waitForURL("**/app", { timeout: 20000 });
await page.goto("http://localhost:3000/app/queue", { waitUntil: "networkidle" });

const rowChecks = page.locator('li input[type="checkbox"]');
await rowChecks.nth(0).check();
await page.waitForTimeout(200);
await page.getByRole("button", { name: "Assign selected tickets to me" }).click();
for (let i = 0; i < 20; i += 1) {
  await page.waitForTimeout(1000);
  const toasts = await page.locator("[data-sonner-toast]").allInnerTexts();
  console.log(`t=${i + 1}s toasts=${JSON.stringify(toasts)}`);
  if (toasts.length) break;
}
await browser.close();
