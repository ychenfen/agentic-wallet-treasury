/**
 * Register all five agents on the Mantle Sepolia ERC-8004 IdentityRegistry,
 * each from their own wallet, and write the resulting agentIds back to
 * apps/web/public/agent-ids.json so the demo runner picks them up next time.
 *
 * Two URI strategies are supported:
 *   AGENT_URI_MODE=data    (default) embed the registration JSON inline as
 *                          data:application/json;base64,...
 *   AGENT_URI_MODE=hosted  use AGENT_URI_BASE/agents/<slug>.json (hosted file)
 *
 * Required env when broadcasting:
 *   AGENT_MNEMONIC | per-agent *_PRIVATE_KEY
 *   MANTLE_SEPOLIA_RPC_URL
 *
 * Dry-run:
 *   DRY_RUN=1   prints the calldata + URI for each agent and exits.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import {
  buildAgentURI,
  buildRegistrationFile,
  defaultAgents,
  ERC8004,
  erc8004IdentityAbi,
  type AgentRegistrationFile
} from "@clawdao/core";
import {
  loadAgentWallets,
  loadProjectEnv,
  type AgentSlug,
  type AgentIdsFile,
  type AgentIdRecord
} from "@clawdao/core/node";
import { createPublicClient, createWalletClient, decodeEventLog, encodeFunctionData, http } from "viem";
import { mantleSepoliaTestnet as mantleSepolia } from "viem/chains";

const AGENT_IDS_PATH = resolve(process.cwd(), "../apps/web/public/agent-ids.json");

interface CliOptions {
  dryRun: boolean;
  rpcUrl: string;
  uriMode: "data" | "hosted";
  hostedBase?: string;
}

function parseOptions(): CliOptions {
  const dryRun = process.env.DRY_RUN === "1";
  const rpcUrl = process.env.MANTLE_SEPOLIA_RPC_URL ?? "https://rpc.sepolia.mantle.xyz";
  const uriMode = process.env.AGENT_URI_MODE === "hosted" ? "hosted" : "data";
  const hostedBase = process.env.AGENT_URI_BASE;
  if (uriMode === "hosted" && !hostedBase) {
    throw new Error("AGENT_URI_MODE=hosted requires AGENT_URI_BASE (e.g. https://my-app.vercel.app).");
  }
  return { dryRun, rpcUrl, uriMode, hostedBase };
}

function slugForAgent(role: AgentSlug): string {
  return role;
}

async function main(): Promise<void> {
  loadProjectEnv();
  const opts = parseOptions();
  const wallets = loadAgentWallets({ allowEphemeral: opts.dryRun });

  // Build registration files for each agent.
  const planned = defaultAgents.map((agent) => {
    const wallet = wallets.find((w) => w.slug === slugForAgent(agent.role as AgentSlug));
    if (!wallet) throw new Error(`No wallet for slug ${agent.role}`);
    const registration: AgentRegistrationFile = buildRegistrationFile(
      { ...agent, wallet: wallet.address, agentId: undefined },
      {
        webEndpoint: opts.hostedBase ?? "http://localhost:5175/",
        mcpBase: opts.hostedBase ? `${opts.hostedBase}/mcp` : undefined
      }
    );
    const agentURI = buildAgentURI(
      registration,
      slugForAgent(agent.role as AgentSlug),
      opts.uriMode === "data"
        ? { kind: "data" }
        : { kind: "hosted", baseUrl: opts.hostedBase! }
    );
    return { agent, wallet, registration, agentURI };
  });

  if (opts.dryRun) {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(
      planned.map((p) => ({
        slug: p.agent.role,
        wallet: p.wallet.address,
        walletSource: p.wallet.source,
        agentURIPreview: p.agentURI.slice(0, 80) + (p.agentURI.length > 80 ? "..." : ""),
        calldata: encodeFunctionData({
          abi: erc8004IdentityAbi,
          functionName: "register",
          args: [p.agentURI]
        })
      })),
      null,
      2
    ));
    return;
  }

  // Real broadcast.
  const publicClient = createPublicClient({ chain: mantleSepolia, transport: http(opts.rpcUrl) });
  const records: AgentIdRecord[] = [];

  for (const item of planned) {
    if (!item.wallet.signer) {
      throw new Error(`Cannot broadcast: agent ${item.agent.role} has no signer (source=${item.wallet.source}).`);
    }
    const walletClient = createWalletClient({
      account: item.wallet.signer,
      chain: mantleSepolia,
      transport: http(opts.rpcUrl)
    });
    const txHash = await walletClient.writeContract({
      address: ERC8004.mantleSepolia.identityRegistry,
      abi: erc8004IdentityAbi,
      functionName: "register",
      args: [item.agentURI]
    });
    // eslint-disable-next-line no-console
    console.log(`[register] ${item.agent.role} <- ${item.wallet.address} -> tx ${txHash}`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    let agentId: number | undefined;
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== ERC8004.mantleSepolia.identityRegistry.toLowerCase()) continue;
      try {
        const decoded = decodeEventLog({
          abi: erc8004IdentityAbi,
          data: log.data,
          topics: log.topics
        });
        if (decoded.eventName === "Registered") {
          agentId = Number((decoded.args as { agentId: bigint }).agentId);
          break;
        }
      } catch {
        /* not the event we want */
      }
    }
    if (agentId === undefined) {
      throw new Error(`Could not decode Registered event for ${item.agent.role} (tx ${txHash}).`);
    }
    records.push({
      slug: item.agent.role as AgentSlug,
      agentId,
      agentURI: item.agentURI,
      txHash,
      registeredAt: new Date().toISOString(),
      ownerAddress: item.wallet.address
    });
  }

  const file: AgentIdsFile = {
    network: "mantle-sepolia",
    registry: ERC8004.mantleSepolia.identityRegistry,
    generatedAt: new Date().toISOString(),
    agents: records
  };
  await mkdir(dirname(AGENT_IDS_PATH), { recursive: true });
  await writeFile(AGENT_IDS_PATH, `${JSON.stringify(file, null, 2)}\n`, "utf8");
  // eslint-disable-next-line no-console
  console.log(`[register] wrote ${records.length} agent IDs to ${AGENT_IDS_PATH}`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
