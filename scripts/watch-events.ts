/**
 * Subscribe to ERC-8004 + AgenticTreasury events on Mantle Sepolia and write a
 * rolling event log to apps/web/public/events.json. The dashboard renders the
 * last N events so judges can see chain activity unfold during the demo.
 *
 * On startup the script also back-fills the last few thousand blocks so the
 * dashboard has something to show immediately even before new events occur.
 *
 * Required env: MANTLE_SEPOLIA_RPC_URL (any HTTPS RPC works for getLogs;
 * subscriptions fall back to short polling if the RPC does not support
 * eth_subscribe — viem handles this transparently).
 *
 * Optional env:
 *   WATCH_LOOKBACK_BLOCKS = number of past blocks to backfill (default 5000)
 *   WATCH_INTERVAL_MS     = subscribe poll interval (default 12000)
 *   WATCH_MAX_EVENTS      = cap on stored events (default 100)
 *   WATCH_ONCE=1          = backfill, write, and exit (no live subscription)
 *   WATCH_FIXTURE=1       = write a synthetic events.json without hitting any RPC
 *                           (useful when offline or for the dashboard preview)
 */

import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createPublicClient, decodeEventLog, http, type Log } from "viem";
import { mantleSepoliaTestnet as mantleSepolia } from "viem/chains";
import {
  ERC8004,
  erc8004IdentityAbi,
  erc8004ReputationAbi,
  erc8004ValidationAbi,
  validatorPaymasterAbi
} from "@clawdao/core";
import { loadProjectEnv, type AgentIdsFile } from "@clawdao/core/node";

const ROOT = resolve(process.cwd(), "..");
const EVENTS_PATH = resolve(ROOT, "apps/web/public/events.json");
const AGENT_IDS_PATH = resolve(ROOT, "apps/web/public/agent-ids.json");
const TREASURY_RECORD_PATH = resolve(ROOT, "apps/web/public/deployed-treasury.json");
const PAYMASTER_RECORD_PATH = resolve(ROOT, "apps/web/public/deployed-paymaster.json");

interface EventRecord {
  source: "identity" | "reputation" | "validation" | "treasury" | "paymaster";
  name: string;
  blockNumber: number;
  txHash: `0x${string}`;
  logIndex: number;
  observedAt: string;
  agentId?: number;
  agentName?: string;
  /** Free-form structured args for rendering. */
  args: Record<string, string | number | boolean>;
  explorerUrl: string;
}

interface EventsFile {
  generatedAt: string;
  network: { name: string; chainId: number; explorer: string };
  events: EventRecord[];
}

const treasuryActionAbi = [
  {
    type: "event",
    name: "TreasuryActionExecuted",
    inputs: [
      { name: "actionId", type: "bytes32", indexed: true },
      { name: "executor", type: "address", indexed: true },
      { name: "target", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
      { name: "policyHash", type: "bytes32", indexed: false },
      { name: "nonceUsed", type: "uint256", indexed: false }
    ]
  }
] as const;

function loadAgentNameMap(): Record<number, string> {
  if (!existsSync(AGENT_IDS_PATH)) return {};
  try {
    const file = JSON.parse(readFileSync(AGENT_IDS_PATH, "utf8")) as AgentIdsFile;
    const map: Record<number, string> = {};
    for (const a of file.agents) {
      map[a.agentId] = friendlyName(a.slug);
    }
    return map;
  } catch {
    return {};
  }
}

function friendlyName(slug: string): string {
  if (slug === "researcher") return "Scout";
  if (slug === "risk") return "Guard";
  if (slug === "executor") return "Claw";
  if (slug === "auditor") return "Ledger";
  if (slug === "validator") return "Sentinel";
  return slug;
}

function loadTreasuryAddress(): `0x${string}` | undefined {
  if (process.env.TREASURY_ADDRESS) return process.env.TREASURY_ADDRESS as `0x${string}`;
  if (!existsSync(TREASURY_RECORD_PATH)) return undefined;
  try {
    const r = JSON.parse(readFileSync(TREASURY_RECORD_PATH, "utf8")) as { address?: `0x${string}` };
    return r.address;
  } catch {
    return undefined;
  }
}

function loadPaymasterAddress(): `0x${string}` | undefined {
  if (process.env.PAYMASTER_ADDRESS) return process.env.PAYMASTER_ADDRESS as `0x${string}`;
  if (!existsSync(PAYMASTER_RECORD_PATH)) return undefined;
  try {
    const r = JSON.parse(readFileSync(PAYMASTER_RECORD_PATH, "utf8")) as { address?: `0x${string}` };
    return r.address;
  } catch {
    return undefined;
  }
}

function snippet(value: string, max = 56): string {
  if (value.length <= max) return value;
  return value.slice(0, max - 1) + "…";
}

function decodeForRecord(
  log: Log,
  source: EventRecord["source"],
  abi: readonly unknown[],
  agentNameMap: Record<number, string>,
  explorer: string
): EventRecord | undefined {
  try {
    const decoded = decodeEventLog({ abi: abi as never, data: log.data, topics: log.topics });
    const rawArgs = decoded.args as unknown;
    const argsRecord: Record<string, unknown> =
      rawArgs && typeof rawArgs === "object" && !Array.isArray(rawArgs)
        ? (rawArgs as Record<string, unknown>)
        : {};
    const friendly: Record<string, string | number | boolean> = {};
    let agentId: number | undefined;
    for (const [k, v] of Object.entries(argsRecord)) {
      if (typeof v === "bigint") friendly[k] = v.toString();
      else if (typeof v === "number" || typeof v === "string" || typeof v === "boolean") friendly[k] = v;
      else friendly[k] = JSON.stringify(v);
      if (k === "agentId") agentId = Number(v as bigint);
    }
    if ("agentURI" in friendly && typeof friendly.agentURI === "string") {
      friendly.agentURI = snippet(friendly.agentURI);
    }
    if ("requestURI" in friendly && typeof friendly.requestURI === "string") {
      friendly.requestURI = snippet(friendly.requestURI);
    }
    if ("responseURI" in friendly && typeof friendly.responseURI === "string") {
      friendly.responseURI = snippet(friendly.responseURI);
    }
    if ("feedbackURI" in friendly && typeof friendly.feedbackURI === "string") {
      friendly.feedbackURI = snippet(friendly.feedbackURI);
    }
    if ("newURI" in friendly && typeof friendly.newURI === "string") {
      friendly.newURI = snippet(friendly.newURI);
    }
    return {
      source,
      name: decoded.eventName ?? "Unknown",
      blockNumber: Number(log.blockNumber ?? 0n),
      txHash: log.transactionHash ?? "0x",
      logIndex: log.logIndex ?? 0,
      observedAt: new Date().toISOString(),
      agentId,
      agentName: agentId ? agentNameMap[agentId] : undefined,
      args: friendly,
      explorerUrl: log.transactionHash ? `${explorer}/tx/${log.transactionHash}` : explorer
    };
  } catch {
    return undefined;
  }
}

function dedupe(events: EventRecord[]): EventRecord[] {
  const seen = new Set<string>();
  const out: EventRecord[] = [];
  for (const e of events) {
    const key = `${e.txHash}:${e.logIndex}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  return out;
}

async function persistStub(reason: string): Promise<void> {
  const file: EventsFile = {
    generatedAt: new Date().toISOString(),
    network: {
      name: "Mantle Sepolia",
      chainId: mantleSepolia.id,
      explorer: "https://sepolia.mantlescan.xyz"
    },
    events: []
  };
  await mkdir(dirname(EVENTS_PATH), { recursive: true });
  await writeFile(
    EVENTS_PATH,
    `${JSON.stringify({ ...file, warning: reason }, null, 2)}\n`,
    "utf8"
  );
}

function buildFixture(): EventRecord[] {
  const explorer = "https://sepolia.mantlescan.xyz";
  const baseBlock = 12345670;
  const fixture: EventRecord[] = [
    {
      source: "identity",
      name: "Registered",
      blockNumber: baseBlock,
      txHash: "0xfeed11111111111111111111111111111111111111111111111111111111aa01",
      logIndex: 0,
      observedAt: new Date(Date.now() - 5 * 60_000).toISOString(),
      agentId: 8101,
      agentName: "Scout",
      args: { agentId: "8101", agentURI: "data:application/json;base64,eyJ0eXBlIj…", owner: "0xa619…0809b9" },
      explorerUrl: `${explorer}/tx/0xfeed11111111111111111111111111111111111111111111111111111111aa01`
    },
    {
      source: "identity",
      name: "Registered",
      blockNumber: baseBlock + 1,
      txHash: "0xfeed11111111111111111111111111111111111111111111111111111111aa02",
      logIndex: 0,
      observedAt: new Date(Date.now() - 4 * 60_000).toISOString(),
      agentId: 8102,
      agentName: "Guard",
      args: { agentId: "8102", agentURI: "data:application/json;base64,eyJ0eXBlIj…", owner: "0xb131…7688f6" },
      explorerUrl: `${explorer}/tx/0xfeed11111111111111111111111111111111111111111111111111111111aa02`
    },
    {
      source: "reputation",
      name: "NewFeedback",
      blockNumber: baseBlock + 2,
      txHash: "0xfeed11111111111111111111111111111111111111111111111111111111bb01",
      logIndex: 0,
      observedAt: new Date(Date.now() - 3 * 60_000).toISOString(),
      agentId: 8101,
      agentName: "Scout",
      args: { agentId: "8101", clientAddress: "0xcb2e…1bd30", tag1: "proposalQuality", value: "86" },
      explorerUrl: `${explorer}/tx/0xfeed11111111111111111111111111111111111111111111111111111111bb01`
    },
    {
      source: "validation",
      name: "ValidationRequest",
      blockNumber: baseBlock + 3,
      txHash: "0xfeed11111111111111111111111111111111111111111111111111111111cc01",
      logIndex: 0,
      observedAt: new Date(Date.now() - 2 * 60_000).toISOString(),
      agentId: 8103,
      agentName: "Claw",
      args: { validatorAddress: "0x0b22…a657e0", agentId: "8103", requestHash: "0x1d7e…313dc480", requestURI: "" },
      explorerUrl: `${explorer}/tx/0xfeed11111111111111111111111111111111111111111111111111111111cc01`
    },
    {
      source: "paymaster",
      name: "Deposited",
      blockNumber: baseBlock + 4,
      txHash: "0xfeed11111111111111111111111111111111111111111111111111111111dd01",
      logIndex: 0,
      observedAt: new Date(Date.now() - 45_000).toISOString(),
      args: { validator: "0x0b22…a657e0", payer: "0x7aca…b36b10", requestHash: "0x1d7e…313dc480", amountWei: "1000000000000000" },
      explorerUrl: `${explorer}/tx/0xfeed11111111111111111111111111111111111111111111111111111111dd01`
    },
    {
      source: "validation",
      name: "ValidationResponse",
      blockNumber: baseBlock + 3,
      txHash: "0xfeed11111111111111111111111111111111111111111111111111111111cc02",
      logIndex: 1,
      observedAt: new Date(Date.now() - 1 * 60_000).toISOString(),
      agentId: 8103,
      agentName: "Claw",
      args: { validatorAddress: "0x0b22…a657e0", agentId: "8103", response: "92", tag: "execution-validity" },
      explorerUrl: `${explorer}/tx/0xfeed11111111111111111111111111111111111111111111111111111111cc02`
    }
  ];
  return fixture;
}

async function persist(events: EventRecord[]): Promise<void> {
  const max = Number(process.env.WATCH_MAX_EVENTS ?? 100);
  const sorted = events
    .slice()
    .sort((a, b) => b.blockNumber - a.blockNumber || b.logIndex - a.logIndex);
  const trimmed = sorted.slice(0, max);
  const file: EventsFile = {
    generatedAt: new Date().toISOString(),
    network: {
      name: "Mantle Sepolia",
      chainId: mantleSepolia.id,
      explorer: "https://sepolia.mantlescan.xyz"
    },
    events: trimmed
  };
  await mkdir(dirname(EVENTS_PATH), { recursive: true });
  await writeFile(EVENTS_PATH, `${JSON.stringify(file, null, 2)}\n`, "utf8");
}

async function backfill(
  client: ReturnType<typeof createPublicClient>,
  agentNameMap: Record<number, string>,
  explorer: string
): Promise<EventRecord[]> {
  const lookback = BigInt(process.env.WATCH_LOOKBACK_BLOCKS ?? 5000);
  const head = await client.getBlockNumber();
  const from = head > lookback ? head - lookback : 0n;
  const treasury = loadTreasuryAddress();
  const paymaster = loadPaymasterAddress();

  const logsNested = await Promise.all([
    client.getLogs({ address: ERC8004.mantleSepolia.identityRegistry, fromBlock: from }),
    client.getLogs({ address: ERC8004.mantleSepolia.reputationRegistry, fromBlock: from }),
    client.getLogs({ address: ERC8004.mantleSepolia.validationRegistry, fromBlock: from }),
    treasury ? client.getLogs({ address: treasury, fromBlock: from }) : Promise.resolve([]),
    paymaster ? client.getLogs({ address: paymaster, fromBlock: from }) : Promise.resolve([])
  ]);

  const records: EventRecord[] = [];
  const sources: Array<{ source: EventRecord["source"]; abi: readonly unknown[] }> = [
    { source: "identity", abi: erc8004IdentityAbi as unknown as readonly unknown[] },
    { source: "reputation", abi: erc8004ReputationAbi as unknown as readonly unknown[] },
    { source: "validation", abi: erc8004ValidationAbi as unknown as readonly unknown[] },
    { source: "treasury", abi: treasuryActionAbi as unknown as readonly unknown[] },
    { source: "paymaster", abi: validatorPaymasterAbi as unknown as readonly unknown[] }
  ];
  for (let i = 0; i < sources.length; i += 1) {
    const { source, abi } = sources[i];
    for (const log of logsNested[i]) {
      const r = decodeForRecord(log, source, abi, agentNameMap, explorer);
      if (r) records.push(r);
    }
  }
  return records;
}

async function main(): Promise<void> {
  loadProjectEnv({ includeGenerated: true });
  const rpcUrl = process.env.MANTLE_SEPOLIA_RPC_URL ?? "https://rpc.sepolia.mantle.xyz";
  const intervalMs = Number(process.env.WATCH_INTERVAL_MS ?? 12_000);
  const once = process.env.WATCH_ONCE === "1";
  const explorer = "https://sepolia.mantlescan.xyz";

  if (process.env.WATCH_FIXTURE === "1") {
    // eslint-disable-next-line no-console
    console.log("[watch] WATCH_FIXTURE=1, writing synthetic events.json (no RPC).");
    await persist(buildFixture());
    return;
  }

  const client = createPublicClient({ chain: mantleSepolia, transport: http(rpcUrl) });
  const agentNameMap = loadAgentNameMap();

  // eslint-disable-next-line no-console
  console.log(`[watch] backfilling last ${process.env.WATCH_LOOKBACK_BLOCKS ?? 5000} blocks from ${rpcUrl}`);
  let buffer: EventRecord[] = [];
  try {
    buffer = await backfill(client, agentNameMap, explorer);
    buffer = dedupe(buffer);
    await persist(buffer);
    // eslint-disable-next-line no-console
    console.log(`[watch] backfilled ${buffer.length} events -> ${EVENTS_PATH}`);
  } catch (error) {
    const reason = (error as Error).message ?? String(error);
    // eslint-disable-next-line no-console
    console.warn(`[watch] backfill failed (${reason}). Writing empty events.json so the dashboard renders.`);
    await persistStub(`Backfill failed: ${reason}`);
    if (once) return;
  }

  if (once) return;

  const treasury = loadTreasuryAddress();
  const paymaster = loadPaymasterAddress();
  const stops: Array<() => void> = [];

  const subscribe = (
    address: `0x${string}`,
    abi: readonly unknown[],
    source: EventRecord["source"]
  ) => {
    const stop = client.watchContractEvent({
      address,
      abi: abi as never,
      pollingInterval: intervalMs,
      onLogs: async (logs: Log[]) => {
        for (const log of logs) {
          const r = decodeForRecord(log, source, abi, agentNameMap, explorer);
          if (r) buffer.push(r);
        }
        buffer = dedupe(buffer);
        await persist(buffer);
        // eslint-disable-next-line no-console
        console.log(`[watch] +${logs.length} ${source} events (total ${buffer.length})`);
      }
    } as never);
    stops.push(stop);
  };

  subscribe(ERC8004.mantleSepolia.identityRegistry, erc8004IdentityAbi as never, "identity");
  subscribe(ERC8004.mantleSepolia.reputationRegistry, erc8004ReputationAbi as never, "reputation");
  subscribe(ERC8004.mantleSepolia.validationRegistry, erc8004ValidationAbi as never, "validation");
  if (treasury) {
    subscribe(treasury, treasuryActionAbi as never, "treasury");
  }
  if (paymaster) {
    subscribe(paymaster, validatorPaymasterAbi as never, "paymaster");
  }

  // eslint-disable-next-line no-console
  console.log(`[watch] subscribed; polling every ${intervalMs}ms — Ctrl+C to stop`);

  const onExit = () => {
    for (const stop of stops) stop();
    process.exit(0);
  };
  process.on("SIGINT", onExit);
  process.on("SIGTERM", onExit);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
