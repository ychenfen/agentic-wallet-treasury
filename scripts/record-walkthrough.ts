/**
 * Playwright-based dashboard walkthrough recorder.
 *
 * Produces a 2:30–3:00 webm (and falls back to mp4 via ffmpeg if available)
 * that mirrors VIDEO_SCRIPT.md timing. The output is intentionally silent —
 * voiceover happens later. Use it as the visual base for the final video.
 *
 * Defaults:
 *   DASHBOARD_URL    https://ychenfen.github.io/agentic-wallet-treasury/
 *   OUTPUT_DIR       artifacts/video
 *   SCREENSHOT_DIR   artifacts/screenshots
 *   VIEWPORT         1920×1080
 *
 * Usage:
 *   npm run record                                # full walkthrough
 *   DASHBOARD_URL=http://127.0.0.1:5175/ npm run record   # local dev server
 *   RECORD_SCREENSHOTS_ONLY=1 npm run record      # skip video, still capture per-section PNGs
 *
 * Playwright must be installed: `npm install -D playwright`. The browser
 * binary is downloaded automatically on first run via `npx playwright install chromium`.
 */

import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { loadProjectEnv } from "@clawdao/core/node";

interface Section {
  /** Stable id used in the screenshot filename. */
  id: string;
  /** aria-label of the <section> in main.tsx. Used as the Playwright locator. */
  ariaLabel?: string;
  /** Or a CSS selector for the <header> / non-section elements. */
  selector?: string;
  /** Voiceover heading from VIDEO_SCRIPT.md. */
  label: string;
  /** Seconds to dwell on this section while recording. */
  dwellSeconds: number;
}

// Mirrors the timeline in VIDEO_SCRIPT.md (2:30–3:00 total).
const SECTIONS: Section[] = [
  { id: "00-topbar",        selector: "header.topbar",                  label: "0:00–0:15 Hook",                 dwellSeconds: 15 },
  { id: "01-hero",          selector: "section.hero",                   label: "0:15–0:25 Five-agent summary",    dwellSeconds: 10 },
  { id: "02-agent-grid",    ariaLabel: "Agent identities",              label: "0:25–0:40 Architecture",          dwellSeconds: 15 },
  { id: "03-workbench",     selector: "section.workbench",              label: "0:40–1:15 Live run",              dwellSeconds: 35 },
  { id: "04-cycle-history", ariaLabel: "Cycle history",                 label: "1:15–1:30 Recent cycles",          dwellSeconds: 15 },
  { id: "05-live-chain",    ariaLabel: "Live chain",                    label: "1:30–1:50 Live chain panel",       dwellSeconds: 20 },
  { id: "06-event-log",     ariaLabel: "Event log",                     label: "1:50–2:15 Event log",              dwellSeconds: 25 },
  { id: "07-readiness",     ariaLabel: "Submission readiness",          label: "2:15–2:30 Submission readiness",   dwellSeconds: 15 },
  { id: "08-evidence",      ariaLabel: "ERC-8004 evidence",             label: "2:30–2:50 Close",                  dwellSeconds: 20 }
];

const ROOT = resolve(process.cwd(), "..");
const OUTPUT_DIR = resolve(ROOT, process.env.OUTPUT_DIR ?? "artifacts/video");
const SCREENSHOT_DIR = resolve(ROOT, process.env.SCREENSHOT_DIR ?? "artifacts/screenshots");

async function ensureDirs(): Promise<void> {
  await mkdir(OUTPUT_DIR, { recursive: true });
  await mkdir(resolve(OUTPUT_DIR, "raw"), { recursive: true });
  await mkdir(SCREENSHOT_DIR, { recursive: true });
}

function run(command: string, args: string[]): Promise<{ exitCode: number }> {
  return new Promise((resolveRun) => {
    const child = spawn(command, args, { stdio: "inherit", env: process.env });
    child.on("close", (code) => resolveRun({ exitCode: code ?? -1 }));
    child.on("error", () => resolveRun({ exitCode: -1 }));
  });
}

async function tryConvertWebmToMp4(webm: string, mp4: string): Promise<boolean> {
  // Best-effort: convert if ffmpeg is available. Otherwise skip silently.
  try {
    const { exitCode } = await run("ffmpeg", ["-y", "-i", webm, "-c:v", "libx264", "-pix_fmt", "yuv420p", mp4]);
    return exitCode === 0;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  loadProjectEnv({ includeGenerated: true });

  const url = process.env.DASHBOARD_URL ?? "https://ychenfen.github.io/agentic-wallet-treasury/";
  const onlyScreenshots = process.env.RECORD_SCREENSHOTS_ONLY === "1";
  const headless = process.env.HEADLESS !== "0";
  const viewportWidth = Number(process.env.VIEWPORT_WIDTH ?? 1920);
  const viewportHeight = Number(process.env.VIEWPORT_HEIGHT ?? 1080);

  await ensureDirs();

  // Lazy import so the script can still print help when Playwright isn't installed.
  let chromium: typeof import("playwright").chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      `[record] playwright not installed. Run \`npm i -D playwright -w @clawdao/scripts && npx playwright install chromium\` first. (${(error as Error).message})`
    );
    process.exit(2);
  }

  // eslint-disable-next-line no-console
  console.log(`[record] dashboard url:     ${url}`);
  // eslint-disable-next-line no-console
  console.log(`[record] viewport:          ${viewportWidth}x${viewportHeight}`);
  // eslint-disable-next-line no-console
  console.log(`[record] mode:              ${onlyScreenshots ? "screenshots only" : "video + screenshots"}`);

  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({
    viewport: { width: viewportWidth, height: viewportHeight },
    deviceScaleFactor: 2,
    recordVideo: onlyScreenshots
      ? undefined
      : {
          dir: resolve(OUTPUT_DIR, "raw"),
          size: { width: viewportWidth, height: viewportHeight }
        }
  });
  const page = await context.newPage();

  // eslint-disable-next-line no-console
  console.log("[record] navigating ...");
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  for (const section of SECTIONS) {
    // eslint-disable-next-line no-console
    console.log(`[record] ${section.label} (${section.dwellSeconds}s) -> ${section.id}`);
    const locator = section.ariaLabel
      ? page.locator(`section[aria-label="${section.ariaLabel}"]`)
      : page.locator(section.selector!);
    try {
      await locator.scrollIntoViewIfNeeded({ timeout: 5_000 });
    } catch {
      // section may not exist (older deploy). Continue.
    }
    await page.waitForTimeout(700);
    try {
      await locator.screenshot({
        path: resolve(SCREENSHOT_DIR, `${section.id}.png`),
        animations: "disabled"
      });
    } catch {
      await page.screenshot({
        path: resolve(SCREENSHOT_DIR, `${section.id}.png`),
        fullPage: false
      });
    }
    if (!onlyScreenshots) {
      // Slow-pan effect: gentle scroll while we dwell.
      const totalSteps = Math.max(2, Math.round(section.dwellSeconds * 2));
      for (let i = 0; i < totalSteps; i += 1) {
        await page.mouse.wheel(0, 30);
        await page.waitForTimeout((section.dwellSeconds * 1000) / totalSteps);
      }
    }
  }

  // Closing pan back to the top.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await page.waitForTimeout(2000);

  await page.close();
  if (!onlyScreenshots) {
    const video = page.video();
    if (video) {
      const rawWebm = await video.path();
      // eslint-disable-next-line no-console
      console.log(`[record] raw webm at ${rawWebm}`);
    }
  }
  await context.close();
  await browser.close();

  if (!onlyScreenshots) {
    // Move newest webm in artifacts/video/raw to artifacts/video/dashboard-walkthrough.webm
    const rawDir = resolve(OUTPUT_DIR, "raw");
    const fs = await import("node:fs/promises");
    const candidates = (await fs.readdir(rawDir)).filter((f) => f.endsWith(".webm"));
    candidates.sort();
    const newest = candidates.at(-1);
    if (newest) {
      const targetWebm = resolve(OUTPUT_DIR, "dashboard-walkthrough.webm");
      const targetMp4 = resolve(OUTPUT_DIR, "dashboard-walkthrough.mp4");
      await fs.copyFile(resolve(rawDir, newest), targetWebm);
      // eslint-disable-next-line no-console
      console.log(`[record] wrote ${targetWebm}`);
      const ok = await tryConvertWebmToMp4(targetWebm, targetMp4);
      if (ok) {
        // eslint-disable-next-line no-console
        console.log(`[record] wrote ${targetMp4}`);
      } else if (existsSync(targetMp4)) {
        // eslint-disable-next-line no-console
        console.log(`[record] mp4 conversion skipped (no ffmpeg). Existing ${targetMp4} kept.`);
      } else {
        // eslint-disable-next-line no-console
        console.log("[record] mp4 conversion skipped (no ffmpeg). The webm is the canonical output.");
      }
    }
  }

  // eslint-disable-next-line no-console
  console.log(`[record] screenshots in ${SCREENSHOT_DIR}`);
  // eslint-disable-next-line no-console
  console.log("[record] done");
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
