import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on("pageerror", (error) => console.log("PAGEERROR:", error.message));
page.on("console", (message) => {
  if (message.type() === "error") console.log("CONSOLE:", message.text());
});
page.on("requestfailed", (request) =>
  console.log("REQFAIL:", request.url(), request.failure()?.errorText),
);
page.on("response", (response) => {
  if (response.status() >= 400) console.log("HTTP", response.status(), response.url());
});

await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
await page.fill("#email", "admin@tasu.app");
await page.fill("#password", "tasu-demo");
await page.click('button[type="submit"]');
await page.waitForURL("**/app", { timeout: 20000 });
await page.goto("http://localhost:3000/app/queue", { waitUntil: "networkidle" });

await page.getByRole("checkbox", { name: "Select all tickets" }).check();
await page.waitForTimeout(200);
const btn = page.getByRole("button", { name: "Assign selected tickets to me" });
console.log("assign button visible:", await btn.isVisible(), "enabled:", await btn.isEnabled());
await btn.click();
for (let i = 0; i < 12; i += 1) {
  await page.waitForTimeout(500);
  const toasts = await page.locator("[data-sonner-toast]").allInnerTexts();
  const barVisible = await page
    .getByRole("region", { name: "Bulk ticket actions" })
    .isVisible()
    .catch(() => false);
  console.log(`t=${(i + 1) * 0.5}s bar=${barVisible} toasts=${JSON.stringify(toasts)}`);
  if (toasts.length > 0) break;
}
console.log("body tail:", (await page.locator("body").innerText()).slice(-400));
await browser.close();
