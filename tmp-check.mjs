import { chromium } from "playwright";

const email = process.argv[2] ?? "parth@tasu.app";
const routes = [
  "/app",
  "/app/tickets",
  "/app/tickets/HD-1043",
  "/app/tickets/new",
  "/app/queue",
  "/app/knowledge",
  "/app/inbox",
  "/app/inbox?view=activity",
  "/app/reports",
  "/app/reports?range=7d",
  "/app/reports?range=90d",
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
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

for (const route of routes) {
  const response = await page.goto(`http://localhost:3000${route}`, {
    waitUntil: "networkidle",
  });
  const heading = await page.locator("h1").first().textContent().catch(() => null);
  const body = await page.locator("body").innerText();
  console.log(
    `${response?.status()} ${route} — ${heading?.trim() ?? "no h1"} | ${body.length} chars`,
  );
  if (body.includes("Application error") || body.includes("Internal Server Error")) {
    errors.push(`error page at ${route}`);
  }
}

// Knowledge article link
await page.goto("http://localhost:3000/app/knowledge", { waitUntil: "networkidle" });
const articleHref = await page
  .locator('a[href^="/app/knowledge/"]')
  .first()
  .getAttribute("href");
if (articleHref) {
  const response = await page.goto(`http://localhost:3000${articleHref}`, {
    waitUntil: "networkidle",
  });
  const heading = await page.locator("h1").first().textContent();
  console.log(`${response?.status()} ${articleHref} — ${heading?.trim()}`);
}

// CSV export
const csv = await page.request.get(
  "http://localhost:3000/app/reports/export?range=30d",
);
const text = await csv.text();
console.log(
  `CSV ${csv.status()} ${csv.headers()["content-type"]} — ${text.split("\n").length} lines, ${text.length} chars`,
);

console.log(errors.length ? `ERRORS:\n${errors.join("\n")}` : "No page errors");
await browser.close();
