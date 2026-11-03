import puppeteer from "puppeteer-core";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const screenshotsDir = path.resolve("./screenshots");

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

console.log("Starting Vite preview server...");
const server = spawn("node", ["node_modules/vite/bin/vite.js", "preview", "--port", "4173", "--host", "127.0.0.1"], {
  stdio: "pipe",
});

server.stdout.on("data", (data) => console.log(`[Server] ${data}`));
server.stderr.on("data", (data) => console.error(`[Server Error] ${data}`));

await new Promise((res) => setTimeout(res, 2500));

const tempDir = path.resolve(`./temp-profile-${Date.now()}`);
fs.mkdirSync(tempDir, { recursive: true });

console.log("Launching Chrome in Mobile Viewport (390x844)...");
const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: "new",
  userDataDir: tempDir,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--in-process-gpu",
    "--disable-gpu-sandbox",
  ],
  defaultViewport: { width: 390, height: 844, isMobile: true, hasTouch: true },
});

const page = await browser.newPage();
const consoleErrors = [];

page.on("response", (res) => {
  if (res.status() >= 400) {
    console.error(`[HTTP ${res.status()}]: ${res.url()}`);
    consoleErrors.push(`HTTP ${res.status()} on ${res.url()}`);
  }
});

page.on("console", (msg) => {
  if (msg.type() === "error") {
    console.error(`[Page Console Error]: ${msg.text()}`);
    consoleErrors.push(msg.text());
  }
});

page.on("pageerror", (err) => {
  console.error(`[Uncaught Page Error]: ${err.toString()}`);
  consoleErrors.push(err.toString());
});

try {
  console.log("Navigating on mobile...");
  await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle0", timeout: 15000 });

  await new Promise((r) => setTimeout(r, 1200));
  await page.click("#btn-open");
  await new Promise((r) => setTimeout(r, 2200));
  await page.click("#btn-blow-candles");
  await new Promise((r) => setTimeout(r, 2000));
  await page.click("#btn-to-message");
  await new Promise((r) => setTimeout(r, 1000));

  // Enter PIN
  await page.type("#pin-input", "052004");
  await page.click("#btn-unlock-pin");
  await new Promise((r) => setTimeout(r, 2000));

  // Mobile Letter Page 1
  await page.screenshot({ path: path.join(screenshotsDir, "mobile-04-letter-p1.png") });
  console.log("✓ Captured mobile-04-letter-p1.png");

  // Mobile Letter Page 2
  await page.click(".btn-letter-next");
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(screenshotsDir, "mobile-04-letter-p2.png") });
  console.log("✓ Captured mobile-04-letter-p2.png");

  // Mobile Letter Page 3
  await page.click(".btn-letter-next");
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(screenshotsDir, "mobile-04-letter-p3.png") });
  console.log("✓ Captured mobile-04-letter-p3.png");

  // Mobile Gallery
  await page.click(".btn-to-gallery-action");
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(screenshotsDir, "mobile-05-gallery.png") });
  console.log("✓ Captured mobile-05-gallery.png");

  // Mobile Finale
  await page.click("#btn-to-finale");
  await new Promise((r) => setTimeout(r, 3000));
  await page.screenshot({ path: path.join(screenshotsDir, "mobile-06-finale.png") });
  console.log("✓ Captured mobile-06-finale.png");

  console.log("\n==================================");
  console.log(`TOTAL CONSOLE ERRORS: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error("Errors found:", consoleErrors);
  } else {
    console.log("MOBILE TEST PASSED WITH 0 CONSOLE ERRORS! 🎉");
  }
  console.log("==================================\n");
} catch (err) {
  console.error("Test execution failed:", err);
} finally {
  await browser.close();
  server.kill();
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch {}
  process.exit(consoleErrors.length > 0 ? 1 : 0);
}
