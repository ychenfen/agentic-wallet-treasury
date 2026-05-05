/**
 * Submission / chain readiness preflight.
 *
 * This is intentionally read-only. It checks local artifacts and environment
 * so we know what still blocks a high-quality DoraHacks submission.
 *
 * --json (or PREFLIGHT_JSON=1) writes apps/web/public/preflight.json so the
 * dashboard's "Submission readiness" panel can render the same status.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { loadAgentIds, loadAgentWallets, loadProjectEnv } from "@clawdao/core/node";
import type { DemoHistory, DemoRun } from "@clawdao/core";

type Level = "pass" | "warn" | "fail";

interface Check {
  level: Level;
  label: string;
  detail: string;
}

const ROOT = resolve(process.cwd(), "..");
const WEB_PUBLIC = resolve(ROOT, "apps/web/public");
const DEMO_RUN = resolve(WEB_PUBLIC, "demo-run.json");
const DEMO_HISTORY = resolve(WEB_PUBLIC, "demo-history.json");
const AGENT_IDS = resolve(WEB_PUBLIC, "agent-ids.json");
const LIVE_CHAIN = resolve(WEB_PUBLIC, "live-chain.json");
const EVENTS = resolve(WEB_PUBLIC, "events.json");
const TREASURY_RECORD = resolve(WEB_PUBLIC, "deployed-treasury.json");
const PAYMASTER_RECORD = resolve(WEB_PUBLIC, "deployed-paymaster.json");
const BYREAL_PROBE = resolve(WEB_PUBLIC, "byreal-probe.json");
const LOGO = resolve(ROOT, "assets/buidl-logo-480.png");
const PREFLIGHT_JSON = resolve(WEB_PUBLIC, "preflight.json");

function readJson<T>(path: string): T | undefined {
  if (!existsSync(path)) return undefined;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return undefined;
  }
}

function statusIcon(level: Level): string {
  if (level === "pass") return "[PASS]";
  if (level === "warn") return "[WARN]";
  return "[FAIL]";
}

function main(): void {
  const loadedEnv = loadProjectEnv();
  const checks: Check[] = [];

  const run = readJson<DemoRun>(DEMO_RUN);
  checks.push(
    run
      ? {
          level: run.identities.length === 5 ? "pass" : "fail",
          label: "demo-run.json",
          detail: `${run.identities.length} identities, scenario=${run.scenarioId}, execution=${run.execution.status}, validation=${run.validation.response}/100`
        }
      : {
          level: "fail",
          label: "demo-run.json",
          detail: "Missing. Run npm run demo."
        }
  );

  const history = readJson<DemoHistory>(DEMO_HISTORY);
  checks.push(
    history
      ? {
          level: history.cycles.length >= 5 ? "pass" : "warn",
          label: "demo-history.json",
          detail: `${history.cycles.length} cycles recorded. Five or more gives a stronger dashboard history.`
        }
      : {
          level: "warn",
          label: "demo-history.json",
          detail: "Missing. Run npm run demo several times."
        }
  );

  checks.push(
    existsSync(LOGO)
      ? {
          level: "pass",
          label: "BUIDL logo",
          detail: "assets/buidl-logo-480.png exists."
        }
      : {
          level: "warn",
          label: "BUIDL logo",
          detail: "Missing assets/buidl-logo-480.png."
        }
  );

  const ids = loadAgentIds(AGENT_IDS);
  checks.push(
    ids.source === "file"
      ? {
          level: ids.raw?.agents.length === 5 ? "pass" : "fail",
          label: "ERC-8004 agent IDs",
          detail: `${ids.raw?.agents.length ?? 0} real agent IDs found in agent-ids.json.`
        }
      : {
          level: "warn",
          label: "ERC-8004 agent IDs",
          detail: "Using placeholder IDs 8101-8105. Run npm run register after funding wallets."
        }
  );

  const chain = readJson<{ agents: unknown[]; warning?: string }>(LIVE_CHAIN);
  checks.push(
    chain && chain.agents.length > 0
      ? {
          level: "pass",
          label: "live-chain.json",
          detail: `${chain.agents.length} on-chain agent snapshots available.`
        }
      : {
          level: "warn",
          label: "live-chain.json",
          detail: chain?.warning ?? "No chain state yet. Run POLL_ONCE=1 npm run poll-chain after registration."
        }
  );

  try {
    const wallets = loadAgentWallets({ allowEphemeral: false });
    checks.push({
      level: wallets.length === 5 ? "pass" : "fail",
      label: "agent wallets",
      detail: `${wallets.length} wallets resolved from env.`
    });
  } catch (error) {
    checks.push({
      level: "warn",
      label: "agent wallets",
      detail: `${(error as Error).message} Generate with GENERATE_MNEMONIC=1 npm run wallets.`
    });
  }

  checks.push({
    level: process.env.TREASURY_ADDRESS ? "pass" : "warn",
    label: "TREASURY_ADDRESS",
    detail: process.env.TREASURY_ADDRESS
      ? "Treasury address configured."
      : "Missing. Deploy AgenticTreasury before real mantle-sepolia execution."
  });

  checks.push({
    level: loadedEnv.length > 0 ? "pass" : "warn",
    label: ".env",
    detail: loadedEnv.length > 0
      ? `Loaded ${loadedEnv.join(", ")}.`
      : "No .env loaded. Copy .env.generated or .env.example to .env before broadcasting."
  });

  checks.push({
    level: process.env.MANTLE_SEPOLIA_RPC_URL ? "pass" : "warn",
    label: "MANTLE_SEPOLIA_RPC_URL",
    detail: process.env.MANTLE_SEPOLIA_RPC_URL
      ? "RPC URL configured."
      : "Missing. Default RPC may work for reads; set it before broadcasting."
  });

  const events = readJson<{ events: unknown[]; warning?: string }>(EVENTS);
  checks.push(
    events && Array.isArray(events.events) && events.events.length > 0
      ? {
          level: "pass",
          label: "events.json",
          detail: `${events.events.length} chain events backfilled.`
        }
      : {
          level: "warn",
          label: "events.json",
          detail: events?.warning ?? "No events backfilled yet. Run WATCH_ONCE=1 npm run watch-events."
        }
  );

  const treasury = readJson<{ address?: string }>(TREASURY_RECORD);
  checks.push(
    treasury?.address
      ? {
          level: "pass",
          label: "deployed-treasury.json",
          detail: `Treasury record present: ${treasury.address}.`
        }
      : {
          level: "warn",
          label: "deployed-treasury.json",
          detail: "Missing. Run npm run deploy-treasury after funding the deployer wallet."
        }
  );

  const paymaster = readJson<{ address?: string }>(PAYMASTER_RECORD);
  checks.push(
    paymaster?.address
      ? {
          level: "pass",
          label: "deployed-paymaster.json",
          detail: `ValidatorPaymaster record present: ${paymaster.address}.`
        }
      : {
          level: "warn",
          label: "deployed-paymaster.json",
          detail: "Missing. Run npm run deploy-paymaster to turn x402 validation fees into real txs."
        }
  );

  const byreal = readJson<{
    status?: string;
    cliVersion?: string;
    capabilityCount?: number;
    topPools?: unknown[];
  }>(BYREAL_PROBE);
  checks.push(
    byreal?.status === "pass"
      ? {
          level: "pass",
          label: "Byreal Skills CLI",
          detail: `CLI v${byreal.cliVersion ?? "unknown"} probed: ${byreal.capabilityCount ?? 0} capabilities, ${byreal.topPools?.length ?? 0} pools.`
        }
      : {
          level: "warn",
          label: "Byreal Skills CLI",
          detail: "Missing or incomplete. Run npm run byreal-probe to capture real Byreal capability evidence."
        }
  );

  // eslint-disable-next-line no-console
  console.log("Agentic Wallet Treasury preflight\n");
  for (const check of checks) {
    // eslint-disable-next-line no-console
    console.log(`${statusIcon(check.level)} ${check.label}: ${check.detail}`);
  }

  const wantJson = process.argv.includes("--json") || process.env.PREFLIGHT_JSON === "1";
  if (wantJson) {
    const counts = {
      pass: checks.filter((c) => c.level === "pass").length,
      warn: checks.filter((c) => c.level === "warn").length,
      fail: checks.filter((c) => c.level === "fail").length
    };
    const file = {
      generatedAt: new Date().toISOString(),
      summary: counts,
      checks
    };
    mkdirSync(dirname(PREFLIGHT_JSON), { recursive: true });
    writeFileSync(PREFLIGHT_JSON, `${JSON.stringify(file, null, 2)}\n`, "utf8");
    // eslint-disable-next-line no-console
    console.log(`\n[preflight] wrote ${PREFLIGHT_JSON} (${counts.pass} pass, ${counts.warn} warn, ${counts.fail} fail)`);
  }

  const hasFail = checks.some((check) => check.level === "fail");
  process.exit(hasFail ? 1 : 0);
}

main();
