import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
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

await page.goto("http://localhost:3000/app/queue", { waitUntil: "networkidle" });

const rows = await page.locator("[data-ticket-row]").count();
const boxes = await page.getByRole("checkbox").count();
console.log(`queue rows: ${rows}, checkboxes: ${boxes}`);
if (rows !== 80) console.log("NOTE: expected 80 rows (queue limit)");

// Select all
await page.getByRole("checkbox", { name: "Select all tickets" }).check();
await page.waitForTimeout(250);
const bar = page.getByRole("region", { name: "Bulk ticket actions" });
console.log("Bulk bar visible:", await bar.isVisible());
console.log("Bar text:", (await bar.innerText()).replace(/\s+/g, " ").trim());

// Assign all to me
await page.getByRole("button", { name: "Assign selected tickets to me" }).click();
await page.getByText(/Assigned to you/).first().waitFor({ timeout: 20000 });
await page.waitForTimeout(800);
console.log("Bar hidden after assign:", !(await bar.isVisible().catch(() => false)));
console.log(
  "Toast:",
  (await page.locator("[data-sonner-toast]").first().innerText())
    .replace(/\s+/g, " ")
    .trim(),
);

// Select two individual rows and set priority
await page.waitForTimeout(400);
const rowChecks = page.locator('li input[type="checkbox"]');
await rowChecks.nth(0).check();
await rowChecks.nth(1).check();
console.log("Selected count text:", await bar.innerText().then((t) => t.split("\n")[0].trim()));
await page.getByRole("button", { name: "Change priority" }).click();
await page.getByRole("menuitem", { name: /Urgent/ }).click();
await page.getByText(/Priority set to urgent/).first().waitFor({ timeout: 20000 });
await page.waitForTimeout(700);
console.log("Priority toast:", (await page.locator("[data-sonner-toast]").first().innerText()).replace(/\s+/g, " ").trim());

// Select one row and resolve it
await page.waitForTimeout(400);
await rowChecks.nth(0).check();
await page.getByRole("button", { name: "Change status" }).click();
await page.getByRole("menuitem", { name: /^Resolved/ }).click();
await page.getByText(/Marked resolved/).first().waitFor({ timeout: 20000 });
await page.waitForTimeout(700);
console.log("Status toast:", (await page.locator("[data-sonner-toast]").first().innerText()).replace(/\s+/g, " ").trim());

// Keyboard: focus first row, j to move, x to select
await page.goto("http://localhost:3000/app/queue", { waitUntil: "networkidle" });
await page.locator("[data-ticket-row]").first().focus();
await page.keyboard.press("j");
await page.keyboard.press("x");
await page.waitForTimeout(250);
console.log("Keyboard selection bar:", await bar.isVisible());
console.log("Keyboard bar text:", (await bar.innerText()).replace(/\s+/g, " ").trim());

console.log(errors.length ? `ERRORS:\n${errors.join("\n")}` : "No page errors");
await browser.close();
