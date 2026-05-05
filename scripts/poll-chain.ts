/**
 * Periodically read on-chain state for every registered agent and write a
 * snapshot to apps/web/public/live-chain.json. The dashboard polls that file
 * on load (or on its Reload button) so judges can see chain state evolve.
 *
 * Usage:
 *   npm run poll-chain                     # default 30 s interval, runs forever
 *   POLL_INTERVAL_MS=10000 npm run poll-chain
 *   POLL_ONCE=1 npm run poll-chain         # one snapshot then exit (CI / smoke test)
 *
 * Reads agent-ids.json. If that file does not exist (no real registration
 * yet), writes a "no chain state" stub so the dashboard renders cleanly.
 */

import { readFileSync, existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createPublicClient, http } from "viem";
import { mantleSepoliaTestnet as mantleSepolia } from "viem/chains";
import { ERC8004, erc8004IdentityAbi, erc8004ReputationAbi, erc8004ValidationAbi } from "@clawdao/core";
import { loadProjectEnv, type AgentIdsFile } from "@clawdao/core/node";

const AGENT_IDS_PATH = resolve(process.cwd(), "../apps/web/public/agent-ids.json");
const SNAPSHOT_PATH = resolve(process.cwd(), "../apps/web/public/live-chain.json");

interface AgentSnapshot {
  slug: string;
  agentId: number;
  address: `0x${string}`;
  tokenURI: string;
  feedbackCount: number;
  summaryValue: number;
  summaryDecimals: number;
  validationCount: number;
  validationAvg: number;
}

interface ChainSnapshot {
  generatedAt: string;
  network: { name: string; chainId: number; explorer: string };
  agents: AgentSnapshot[];
  warning?: string;
}

async function snapshotOnce(): Promise<ChainSnapshot> {
  const rpcUrl = process.env.MANTLE_SEPOLIA_RPC_URL ?? "https://rpc.sepolia.mantle.xyz";

  const network = {
    name: "Mantle Sepolia",
    chainId: mantleSepolia.id,
    explorer: "https://sepolia.mantlescan.xyz"
  };

  if (!existsSync(AGENT_IDS_PATH)) {
    return {
      generatedAt: new Date().toISOString(),
      network,
      agents: [],
      warning: "agent-ids.json not found. Run `npm run register` first."
    };
  }

  const file = JSON.parse(readFileSync(AGENT_IDS_PATH, "utf8")) as AgentIdsFile;
  const client = createPublicClient({ chain: mantleSepolia, transport: http(rpcUrl) });

  const agents: AgentSnapshot[] = [];
  for (const agent of file.agents) {
    const tokenURI = await client
      .readContract({
        address: ERC8004.mantleSepolia.identityRegistry,
        abi: erc8004IdentityAbi,
        functionName: "tokenURI",
        args: [BigInt(agent.agentId)]
      })
      .catch(() => "");
    const feedback = await client
      .readContract({
        address: ERC8004.mantleSepolia.reputationRegistry,
        abi: erc8004ReputationAbi,
        functionName: "getSummary",
        args: [BigInt(agent.agentId), [], "", ""]
      })
      .catch(() => [0n, 0n, 0] as [bigint, bigint, number]);
    const validation = await client
      .readContract({
        address: ERC8004.mantleSepolia.validationRegistry,
        abi: erc8004ValidationAbi,
        functionName: "getSummary",
        args: [BigInt(agent.agentId), [], ""]
      })
      .catch(() => [0n, 0] as [bigint, number]);

    agents.push({
      slug: agent.slug,
      agentId: agent.agentId,
      address: agent.ownerAddress ?? "0x0000000000000000000000000000000000000000",
      tokenURI: typeof tokenURI === "string" ? tokenURI : "",
      feedbackCount: Number(feedback[0]),
      summaryValue: Number(feedback[1]),
      summaryDecimals: Number(feedback[2]),
      validationCount: Number(validation[0]),
      validationAvg: Number(validation[1])
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    network,
    agents
  };
}

async function writeSnapshot(snapshot: ChainSnapshot): Promise<void> {
  await mkdir(dirname(SNAPSHOT_PATH), { recursive: true });
  await writeFile(SNAPSHOT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
}

async function main(): Promise<void> {
  loadProjectEnv();
  const intervalMs = Number(process.env.POLL_INTERVAL_MS ?? 30_000);
  const once = process.env.POLL_ONCE === "1";

  const tick = async () => {
    try {
      const snap = await snapshotOnce();
      await writeSnapshot(snap);
      // eslint-disable-next-line no-console
      console.log(`[poll] ${snap.generatedAt} ${snap.agents.length} agents${snap.warning ? ` (${snap.warning})` : ""}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[poll] error", error);
    }
  };

  await tick();
  if (once) return;
  // eslint-disable-next-line no-console
  console.log(`[poll] running every ${intervalMs}ms — Ctrl+C to stop`);
  setInterval(tick, intervalMs);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
