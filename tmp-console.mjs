import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on("console", (message) => {
  if (message.type() === "error" || message.type() === "warning")
    console.log(`[${message.type()}]`, message.text());
});
page.on("pageerror", (error) => console.log("[pageerror]", error.message));

await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
await page.fill("#email", "admin@tasu.app");
await page.fill("#password", "tasu-demo");
await page.click('button[type="submit"]');
await page.waitForURL("**/app", { timeout: 20000 });
for (const route of ["/app", "/app/queue", "/app/tickets", "/app/inbox?view=activity"]) {
  console.log("=== route", route);
  await page.goto(`http://localhost:3000${route}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
}
await browser.close();
