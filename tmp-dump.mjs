import { chromium } from "playwright";

const email = process.argv[2] ?? "admin@tasu.app";
const route = process.argv[3] ?? "/app/reports";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
const errors = [];
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(`console: ${message.text()}`);
});

await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
await page.fill("#email", email);
await page.fill("#password", "tasu-demo");
await page.click('button[type="submit"]');
await page.waitForURL("**/app", { timeout: 20000 });
const response = await page.goto(`http://localhost:3000${route}`, {
  waitUntil: "networkidle",
});
await page.waitForTimeout(600);
console.log("URL:", page.url(), "status:", response?.status());
console.log(await page.locator("main").innerText());
console.log(errors.length ? `ERRORS:\n${errors.join("\n")}` : "No page errors");
await browser.close();
