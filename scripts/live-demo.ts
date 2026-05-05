/**
 * One-command demo flow.
 *
 * Steps (each gated by a flag):
 *   1. Print env diagnostics.
 *   2. Always: run agent demo runner (writes demo-run.json + agents/*.json).
 *   3. --deploy:   deploy AgenticTreasury (writes deployed-treasury.json + .env).
 *   4. --register: broadcast register-agents (writes agent-ids.json) and re-run demo.
 *   5. --feedback: broadcast write-feedback.
 *   6. --validate: broadcast write-validation.
 *   7. --watch:    snapshot chain state once (POLL_ONCE) + backfill events once (WATCH_ONCE).
 *
 * Default behaviour (no flags) is safe: no on-chain transactions, just regenerate
 * the local demo state.
 */

import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { loadProjectEnv } from "@clawdao/core/node";

interface CliFlags {
  deploy: boolean;
  register: boolean;
  feedback: boolean;
  validate: boolean;
  watch: boolean;
}

function parseFlags(): CliFlags {
  const args = new Set(process.argv.slice(2));
  return {
    deploy: args.has("--deploy"),
    register: args.has("--register"),
    feedback: args.has("--feedback"),
    validate: args.has("--validate"),
    watch: args.has("--watch")
  };
}

function printEnvSummary(): void {
  const has = (k: string): string => (process.env[k] ? "set" : "—");
  // eslint-disable-next-line no-console
  console.log("== Environment ==");
  // eslint-disable-next-line no-console
  console.log(`  AGENT_MNEMONIC:        ${has("AGENT_MNEMONIC")}`);
  // eslint-disable-next-line no-console
  console.log(`  *_PRIVATE_KEY:         scout=${has("SCOUT_PRIVATE_KEY")} guard=${has("GUARD_PRIVATE_KEY")} claw=${has("CLAW_PRIVATE_KEY")} ledger=${has("LEDGER_PRIVATE_KEY")} sentinel=${has("SENTINEL_PRIVATE_KEY")}`);
  // eslint-disable-next-line no-console
  console.log(`  MANTLE_SEPOLIA_RPC_URL:${has("MANTLE_SEPOLIA_RPC_URL")}`);
  // eslint-disable-next-line no-console
  console.log(`  TREASURY_ADDRESS:      ${has("TREASURY_ADDRESS")}`);
  // eslint-disable-next-line no-console
  console.log(`  EXECUTOR:              ${process.env.EXECUTOR ?? "auto"}`);
  // eslint-disable-next-line no-console
  console.log(`  BYREAL_MODE:           ${process.env.BYREAL_MODE ?? "—"}`);
}

function run(command: string, args: string[], cwd: string, env?: NodeJS.ProcessEnv): Promise<void> {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, { cwd, env: env ?? process.env, stdio: "inherit" });
    child.on("error", rejectRun);
    child.on("close", (code) => {
      if (code === 0) resolveRun();
      else rejectRun(new Error(`${command} ${args.join(" ")} exited with ${code}`));
    });
  });
}

async function main(): Promise<void> {
  loadProjectEnv({ includeGenerated: true });
  const flags = parseFlags();
  printEnvSummary();

  const root = resolve(process.cwd(), "..");
  // eslint-disable-next-line no-console
  console.log("\n== Step 1: regenerate demo run ==");
  await run("npm", ["run", "demo"], root);

  if (flags.deploy) {
    // eslint-disable-next-line no-console
    console.log("\n== Step 2: deploy AgenticTreasury ==");
    await run("npm", ["run", "deploy-treasury"], root);
  }

  if (flags.register) {
    // eslint-disable-next-line no-console
    console.log("\n== Step 3: register agents on Mantle Sepolia ==");
    await run("npm", ["run", "register"], root);

    // eslint-disable-next-line no-console
    console.log("\n== Step 3b: regenerate demo run with real agentIds ==");
    await run("npm", ["run", "demo"], root);
  }

  if (flags.feedback) {
    // eslint-disable-next-line no-console
    console.log("\n== Step 4: write reputation feedback ==");
    await run("npm", ["run", "feedback"], root);
  }

  if (flags.validate) {
    // eslint-disable-next-line no-console
    console.log("\n== Step 5: write validation request + response ==");
    await run("npm", ["run", "validate"], root);
  }

  if (flags.watch) {
    // eslint-disable-next-line no-console
    console.log("\n== Step 6: snapshot chain state + backfill events ==");
    await run("npm", ["run", "poll-chain"], root, { ...process.env, POLL_ONCE: "1" });
    await run("npm", ["run", "watch-events"], root, { ...process.env, WATCH_ONCE: "1" });
  }

  // eslint-disable-next-line no-console
  console.log("\n== Done ==");
  // eslint-disable-next-line no-console
  console.log("Open http://127.0.0.1:5175/   (run `npm run dev` if you have not)");
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
