import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on("request", (request) => {
  if (request.method() !== "GET") console.log("REQ", request.method(), request.url());
});
page.on("response", (response) => {
  if (response.request().method() !== "GET")
    console.log("RES", response.status(), response.url());
});
page.on("console", (message) => console.log("CONSOLE", message.type(), message.text()));
page.on("pageerror", (error) => console.log("PAGEERROR:", error.message));

await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
await page.fill("#email", "admin@tasu.app");
await page.fill("#password", "tasu-demo");
await page.click('button[type="submit"]');
await page.waitForURL("**/app", { timeout: 20000 });
await page.goto("http://localhost:3000/app/queue", { waitUntil: "networkidle" });

await page.getByRole("checkbox", { name: "Select all tickets" }).check();
await page.waitForTimeout(200);
await page.getByRole("button", { name: "Assign selected tickets to me" }).click();
await page.waitForTimeout(6000);
await browser.close();
