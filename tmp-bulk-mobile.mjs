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
await page.goto("http://localhost:3000/app/queue", { waitUntil: "networkidle" });

const before = page.url();
const rowChecks = page.locator('li input[type="checkbox"]');
await rowChecks.nth(0).check();
await rowChecks.nth(1).check();
await page.waitForTimeout(350);

console.log("URL unchanged after checkbox:", page.url() === before);
const bar = page.getByRole("region", { name: "Bulk ticket actions" });
const box = await bar.boundingBox();
console.log("bar box:", JSON.stringify(box));
console.log(
  "bar inside viewport:",
  box.x >= 0 && box.x + box.width <= 390 && box.y + box.height <= 844,
);
const metrics = await page.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  innerWidth: window.innerWidth,
}));
console.log("overflow:", metrics.scrollWidth > metrics.innerWidth + 1 ? metrics : "none");
console.log("bar text:", (await bar.innerText()).replace(/\s+/g, " ").trim());
console.log(
  "bar buttons:",
  await bar.getByRole("button").evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("aria-label") ?? node.textContent?.trim()),
  ),
);

// Uncheck one from the list while bar is open.
await rowChecks.nth(0).uncheck();
await page.waitForTimeout(250);
console.log("after uncheck bar:", (await bar.innerText()).replace(/\s+/g, " ").trim());

// Select all via header.
await page.getByRole("checkbox", { name: "Select all tickets" }).check();
await page.waitForTimeout(300);
const header = page.getByRole("checkbox", { name: "Select all tickets" });
console.log("select-all checked:", await header.isChecked());
console.log("bar count:", (await bar.innerText()).split("\n")[0].trim());

// Clear
await page.getByRole("button", { name: "Clear selection" }).click();
await page.waitForTimeout(300);
console.log("bar hidden after clear:", !(await bar.isVisible().catch(() => false)));
console.log("select-all unchecked:", !(await header.isChecked()));

// Row geometry: checkbox wrapper and status dot must not overlap.
const geom = await page.evaluate(() => {
  const firstRow = document.querySelector("[data-ticket-row]");
  const checkbox = firstRow?.parentElement?.querySelector('input[type="checkbox"]');
  const dot = firstRow?.querySelector("span.inline-block.size-\\[7px\\]");
  const a = checkbox?.getBoundingClientRect();
  const b = dot?.getBoundingClientRect();
  return {
    checkbox: a && { left: a.left, right: a.right, top: a.top, height: a.height },
    dot: b && { left: b.left, right: b.right, top: b.top, height: b.height },
  };
});
console.log("geometry:", JSON.stringify(geom));

console.log(errors.length ? `ERRORS:\n${errors.join("\n")}` : "No page errors");
await browser.close();
