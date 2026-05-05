/**
 * Generate SUBMISSION_HASHES.md from the artefacts produced during a real
 * on-chain rehearsal. Run this AFTER:
 *
 *   npm run deploy-treasury
 *   npm run register
 *   EXECUTOR=mantle-sepolia npm run demo
 *   npm run feedback
 *   npm run validate
 *   WATCH_ONCE=1 npm run watch-events
 *
 * It scrapes:
 *   apps/web/public/deployed-treasury.json
 *   apps/web/public/agent-ids.json
 *   apps/web/public/demo-run.json
 *   apps/web/public/events.json
 *
 * and writes SUBMISSION_HASHES.md at the repo root with explorer links.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { mantleSepoliaTestnet as mantleSepolia } from "viem/chains";
import { loadProjectEnv } from "@clawdao/core/node";
import type { AgentIdsFile } from "@clawdao/core/node";
import type { DemoRun } from "@clawdao/core";

interface DeployedTreasury {
  contract: string;
  network: string;
  chainId: number;
  address: `0x${string}`;
  owner: `0x${string}`;
  riskOfficer: `0x${string}`;
  maxActionValueWei: string;
  deployedAt: string;
  txHash: `0x${string}`;
  explorerUrl: string;
}

interface ChainEvent {
  source: string;
  name: string;
  blockNumber: number;
  txHash: `0x${string}`;
  logIndex: number;
  observedAt: string;
  agentId?: number;
  agentName?: string;
  args: Record<string, unknown>;
  explorerUrl: string;
}

interface EventsFile {
  generatedAt: string;
  network: { name: string; chainId: number; explorer: string };
  events: ChainEvent[];
  warning?: string;
}

const ROOT = resolve(process.cwd(), "..");
const PUBLIC = resolve(ROOT, "apps/web/public");
const TREASURY = resolve(PUBLIC, "deployed-treasury.json");
const PAYMASTER = resolve(PUBLIC, "deployed-paymaster.json");
const AGENT_IDS = resolve(PUBLIC, "agent-ids.json");
const DEMO_RUN = resolve(PUBLIC, "demo-run.json");
const EVENTS = resolve(PUBLIC, "events.json");
const OUTPUT = resolve(ROOT, "SUBMISSION_HASHES.md");

function readJson<T>(path: string): T | undefined {
  if (!existsSync(path)) return undefined;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return undefined;
  }
}

const explorer = "https://sepolia.mantlescan.xyz";

function txLink(hash: string | undefined): string {
  return hash ? `[${hash.slice(0, 10)}…${hash.slice(-6)}](${explorer}/tx/${hash})` : "_pending_";
}

function addressLink(address: string | undefined): string {
  return address
    ? `[${address.slice(0, 6)}…${address.slice(-4)}](${explorer}/address/${address})`
    : "_pending_";
}

function fmtArgs(args: Record<string, unknown>): string {
  const filtered = Object.entries(args)
    .filter(([k]) => !["agentURI", "feedbackURI", "responseURI", "requestURI", "newURI"].includes(k))
    .map(([k, v]) => {
      const val = typeof v === "string" && v.length > 18 ? `${v.slice(0, 8)}…${v.slice(-4)}` : `${v}`;
      return `${k}=${val}`;
    })
    .slice(0, 4);
  return filtered.join(" · ");
}

function bullet(label: string, body: string): string {
  return `- **${label}** — ${body}`;
}

function main(): void {
  loadProjectEnv({ includeGenerated: true });

  const treasury = readJson<DeployedTreasury>(TREASURY);
  const paymaster = readJson<DeployedTreasury>(PAYMASTER);
  const ids = readJson<AgentIdsFile>(AGENT_IDS);
  const run = readJson<DemoRun>(DEMO_RUN);
  const eventsFile = readJson<EventsFile>(EVENTS);

  const lines: string[] = [];
  lines.push("# Submission Hashes — Agentic Wallet Treasury");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("This file enumerates every on-chain artefact the project produced");
  lines.push("during its Mantle Sepolia rehearsal. It exists so judges can verify");
  lines.push("each claim independently on mantlescan without trusting the dashboard.");
  lines.push("");

  // Section 1 — Treasury deployment.
  lines.push("## 1. AgenticTreasury contract");
  lines.push("");
  if (treasury) {
    lines.push(bullet("Address", `${addressLink(treasury.address)} on ${treasury.network} (chainId ${treasury.chainId})`));
    lines.push(bullet("Deployer / Owner", addressLink(treasury.owner)));
    lines.push(bullet("Risk Officer (Guard)", addressLink(treasury.riskOfficer)));
    lines.push(bullet("Max action value (wei)", treasury.maxActionValueWei));
    lines.push(bullet("Deploy tx", txLink(treasury.txHash)));
    lines.push(bullet("Deployed at", treasury.deployedAt));
  } else {
    lines.push(bullet("Status", "_not deployed yet — run `npm run deploy-treasury`_"));
  }
  lines.push("");

  // Section 2 — ValidatorPaymaster deployment.
  lines.push("## 2. ValidatorPaymaster x402 escrow");
  lines.push("");
  if (paymaster) {
    lines.push(bullet("Address", `${addressLink(paymaster.address)} on ${paymaster.network} (chainId ${paymaster.chainId})`));
    lines.push(bullet("Deployer / Owner", addressLink(paymaster.owner)));
    lines.push(bullet("Deploy tx", txLink(paymaster.txHash)));
    if (run?.validation.payment) {
      const p = run.validation.payment;
      lines.push(bullet("Latest validation fee", `${p.feePaidWei} wei from ${addressLink(p.payerAddress)} to Sentinel ${addressLink(p.validatorAddress)}`));
      lines.push(bullet("Payment tx", txLink(p.paymentTx)));
      lines.push(bullet("Linked requestHash", run.validation.requestHash));
    }
  } else {
    lines.push(bullet("Status", "_not deployed yet — run `npm run deploy-paymaster`_"));
  }
  lines.push("");

  // Section 3 — Agent identities.
  lines.push("## 3. ERC-8004 agent identities");
  lines.push("");
  if (ids && ids.agents.length > 0) {
    lines.push(`Registry: ${addressLink(ids.registry)} on ${ids.network}`);
    lines.push("");
    lines.push("| Slug | agentId | Owner | Register tx |");
    lines.push("|---|---:|---|---|");
    for (const a of ids.agents) {
      lines.push(
        `| ${a.slug} | #${a.agentId} | ${addressLink(a.ownerAddress)} | ${txLink(a.txHash)} |`
      );
    }
  } else {
    lines.push("_No real agentIds yet — run `npm run register` after funding the five wallets._");
  }
  lines.push("");

  // Section 4 — Latest cycle.
  lines.push("## 4. Latest cycle");
  lines.push("");
  if (run) {
    lines.push(bullet("Cycle #", `${run.cycle} (scenario \`${run.scenarioId}\`)`));
    lines.push(bullet("Proposal", `${run.proposal.title} — $${run.proposal.amountUsd} ${run.proposal.assetIn}→${run.proposal.assetOut}`));
    lines.push(bullet("Verdict", `${run.verdict.approved ? "approved" : "blocked"} (${run.verdict.score}/100)`));
    lines.push(bullet("Execution", `${run.execution.adapter} · ${run.execution.status} · tx ${txLink(run.execution.txHash)}`));
    lines.push(bullet("Validation", `${run.validation.response}/100 (${run.validation.passed ? "passed" : "rejected"}) · request hash ${run.validation.requestHash}`));
    if (run.validation.payment) {
      lines.push(bullet("x402 validator fee", `${run.validation.payment.feePaidWei} wei · paymaster ${addressLink(run.validation.payment.paymaster)} · tx ${txLink(run.validation.payment.paymentTx)}`));
    }
    if (run.validation.reSimulation) {
      const r = run.validation.reSimulation;
      lines.push(bullet("Sentinel re-sim", `adapter=${r.adapter} · realized ${r.hints.realizedSlippageBps} bps vs ${r.hints.toleranceBps} bps · pool=${r.hints.poolDepth} · score ${r.score}/${r.passThreshold}`));
    }
  } else {
    lines.push("_No demo-run.json — run `npm run demo` first._");
  }
  lines.push("");

  // Section 5 — Recent on-chain events.
  lines.push("## 5. Recent on-chain events");
  lines.push("");
  if (eventsFile && eventsFile.events.length > 0) {
    lines.push("| Block | Source | Event | Agent | Args | Tx |");
    lines.push("|---:|---|---|---|---|---|");
    for (const e of eventsFile.events.slice(0, 15)) {
      const agentLabel = e.agentName ? `${e.agentName} #${e.agentId ?? "?"}` : e.agentId ? `#${e.agentId}` : "—";
      lines.push(
        `| ${e.blockNumber} | ${e.source} | \`${e.name}\` | ${agentLabel} | ${fmtArgs(e.args)} | ${txLink(e.txHash)} |`
      );
    }
  } else {
    lines.push("_No events backfilled — run `WATCH_ONCE=1 npm run watch-events` after registration._");
    if (eventsFile?.warning) {
      lines.push("");
      lines.push(`Warning recorded: ${eventsFile.warning}`);
    }
  }
  lines.push("");

  // Section 6 — Verification commands.
  lines.push("## 6. Reproduce these claims");
  lines.push("");
  lines.push("```bash");
  lines.push("npm run verify          # reads tokenURI / ownerOf / getSummary on-chain for every agent");
  lines.push("npm run preflight       # confirms local artefacts and env match expectations");
  lines.push("npm run watch-events    # streams new events into the dashboard event log");
  lines.push("```");
  lines.push("");
  lines.push("For independent verification, click any address or tx link above to open mantlescan.");

  const output = lines.join("\n") + "\n";
  writeFileSync(OUTPUT, output, "utf8");
  // eslint-disable-next-line no-console
  console.log(`[report] wrote ${OUTPUT} (${output.length} bytes)`);
  // eslint-disable-next-line no-console
  console.log(
    `Sections: treasury=${treasury ? "ok" : "pending"} · ids=${ids?.agents.length ?? 0} · cycle=${run?.cycle ?? "—"} · events=${eventsFile?.events.length ?? 0}`
  );
}

main();
