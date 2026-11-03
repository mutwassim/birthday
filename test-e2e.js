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

// Wait 2.5 seconds for server to start
await new Promise((res) => setTimeout(res, 2500));

console.log("Launching Chrome with SwiftShader WebGL...");
const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: "new",
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
  defaultViewport: { width: 1280, height: 800 },
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
  } else {
    console.log(`[Page Console]: ${msg.text()}`);
  }
});

page.on("pageerror", (err) => {
  console.error(`[Uncaught Page Error]: ${err.toString()}`);
  consoleErrors.push(err.toString());
});

try {
  console.log("Navigating to http://127.0.0.1:4173...");
  await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle0", timeout: 15000 });

  // 1. Wait for loading screen to fade
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(screenshotsDir, "01-intro.png") });
  console.log("✓ Captured 01-intro.png");

  // 2. Click "Tap to open"
  console.log("Clicking 'Tap to open'...");
  await page.click("#btn-open");
  await new Promise((r) => setTimeout(r, 2200));
  await page.screenshot({ path: path.join(screenshotsDir, "02-cake.png") });
  console.log("✓ Captured 02-cake.png");

  // 3. Click "Blow out the candles"
  console.log("Clicking 'Blow out the candles'...");
  await page.click("#btn-blow-candles");
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(screenshotsDir, "03-celebration.png") });
  console.log("✓ Captured 03-celebration.png");

  // 4. Click "Read Your Letter" -> PIN modal opens
  console.log("Clicking 'Read Your Letter'...");
  await page.click("#btn-to-message");
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(screenshotsDir, "03b-pin-prompt.png") });
  console.log("✓ Captured 03b-pin-prompt.png");

  // Test incorrect PIN first
  console.log("Testing wrong PIN (000000)...");
  await page.type("#pin-input", "000000");
  await page.click("#btn-unlock-pin");
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(screenshotsDir, "03c-pin-error.png") });
  console.log("✓ Captured 03c-pin-error.png");

  // Now enter correct PIN: 052004
  console.log("Entering correct PIN (052004)...");
  await page.evaluate(() => {
    document.getElementById("pin-input").value = "";
  });
  await page.type("#pin-input", "052004");
  await page.click("#btn-unlock-pin");
  await new Promise((r) => setTimeout(r, 2000));

  // 5. Letter Page 1
  await page.screenshot({ path: path.join(screenshotsDir, "04-message-page-1.png") });
  console.log("✓ Captured 04-message-page-1.png");

  // Turn to Page 2
  console.log("Turning to Page 2...");
  await page.click(".btn-letter-next");
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(screenshotsDir, "04-message-page-2.png") });
  console.log("✓ Captured 04-message-page-2.png");

  // Turn to Page 3
  console.log("Turning to Page 3...");
  await page.click(".btn-letter-next");
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(screenshotsDir, "04-message-page-3.png") });
  console.log("✓ Captured 04-message-page-3.png");

  // 6. Click "Cherished Memories"
  console.log("Clicking 'Cherished Memories'...");
  await page.click(".btn-to-gallery-action");
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(screenshotsDir, "05-gallery.png") });
  console.log("✓ Captured 05-gallery.png");

  // 7. Click "The Grand Finale"
  console.log("Clicking 'The Grand Finale'...");
  await page.click("#btn-to-finale");
  await new Promise((r) => setTimeout(r, 3000));
  await page.screenshot({ path: path.join(screenshotsDir, "06-finale.png") });
  console.log("✓ Captured 06-finale.png");

  console.log("\n==================================");
  console.log(`TOTAL CONSOLE ERRORS: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error("Errors found:", consoleErrors);
  } else {
    console.log("ALL SCENES PASSED WITH 0 CONSOLE ERRORS! 🎉");
  }
  console.log("==================================\n");
} catch (err) {
  console.error("Test execution failed:", err);
} finally {
  await browser.close();
  server.kill();
  process.exit(consoleErrors.length > 0 ? 1 : 0);
}
