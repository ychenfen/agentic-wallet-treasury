/**
 * Read-only verifier: walks through `apps/web/public/agent-ids.json` and for
 * every agent prints the on-chain owner, tokenURI, and reputation summary.
 * Useful right before a demo to confirm the chain state matches the dashboard.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createPublicClient, http } from "viem";
import { mantleSepoliaTestnet as mantleSepolia } from "viem/chains";
import { ERC8004, erc8004IdentityAbi, erc8004ReputationAbi } from "@clawdao/core";
import { loadProjectEnv, type AgentIdsFile } from "@clawdao/core/node";

const AGENT_IDS_PATH = resolve(process.cwd(), "../apps/web/public/agent-ids.json");

async function main(): Promise<void> {
  loadProjectEnv();
  const rpcUrl = process.env.MANTLE_SEPOLIA_RPC_URL ?? "https://rpc.sepolia.mantle.xyz";
  const file = JSON.parse(readFileSync(AGENT_IDS_PATH, "utf8")) as AgentIdsFile;

  const client = createPublicClient({ chain: mantleSepolia, transport: http(rpcUrl) });

  // eslint-disable-next-line no-console
  console.log(`Network: ${file.network}, registry ${file.registry}, ${file.agents.length} agents.`);
  for (const agent of file.agents) {
    const owner = await client.readContract({
      address: ERC8004.mantleSepolia.identityRegistry,
      abi: erc8004IdentityAbi,
      functionName: "ownerOf",
      args: [BigInt(agent.agentId)]
    });
    const uri = await client.readContract({
      address: ERC8004.mantleSepolia.identityRegistry,
      abi: erc8004IdentityAbi,
      functionName: "tokenURI",
      args: [BigInt(agent.agentId)]
    });
    const summary = await client.readContract({
      address: ERC8004.mantleSepolia.reputationRegistry,
      abi: erc8004ReputationAbi,
      functionName: "getSummary",
      args: [BigInt(agent.agentId), [], "", ""]
    });
    // eslint-disable-next-line no-console
    console.log(`  #${agent.agentId} ${agent.slug} owner=${owner} uri=${uri.slice(0, 60)}... feedbackCount=${summary[0]}`);
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
