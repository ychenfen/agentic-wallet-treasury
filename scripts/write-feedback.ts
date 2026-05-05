/**
 * Write reputation feedback for the five agents.
 *
 * Reads `apps/web/public/demo-run.json` (must be generated first via
 * `npm run demo`) and for each agent in the run submits a giveFeedback tx.
 *
 * ERC-8004 disallows self-feedback, so Ledger scores the other agents and
 * Sentinel scores Ledger.
 *
 * Required env: AGENT_MNEMONIC | LEDGER_PRIVATE_KEY + SENTINEL_PRIVATE_KEY,
 *               MANTLE_SEPOLIA_RPC_URL.
 * DRY_RUN=1 to print the planned txs without broadcasting.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createPublicClient, createWalletClient, http, encodeFunctionData } from "viem";
import { mantleSepoliaTestnet as mantleSepolia } from "viem/chains";
import { ERC8004, erc8004ReputationAbi, type DemoRun } from "@clawdao/core";
import { loadAgentWallets, loadProjectEnv } from "@clawdao/core/node";

const DEMO_RUN_PATH = resolve(process.cwd(), "../apps/web/public/demo-run.json");

function isLedgerAgent(name: string): boolean {
  return name.toLowerCase() === "ledger";
}

async function main(): Promise<void> {
  loadProjectEnv();
  const dryRun = process.env.DRY_RUN === "1";
  const rpcUrl = process.env.MANTLE_SEPOLIA_RPC_URL ?? "https://rpc.sepolia.mantle.xyz";

  const run: DemoRun = JSON.parse(readFileSync(DEMO_RUN_PATH, "utf8"));
  const wallets = loadAgentWallets({ allowEphemeral: dryRun });
  const auditor = wallets.find((w) => w.slug === "auditor");
  const validator = wallets.find((w) => w.slug === "validator");
  if (!auditor || !validator) throw new Error("Auditor and Validator wallets are required.");

  const publicClient = createPublicClient({ chain: mantleSepolia, transport: http(rpcUrl) });

  if (!dryRun && (!auditor.signer || !validator.signer)) {
    throw new Error("Auditor or Validator signer missing. Set AGENT_MNEMONIC or the matching private keys.");
  }
  const clients = {
    auditor: auditor.signer
      ? createWalletClient({ account: auditor.signer, chain: mantleSepolia, transport: http(rpcUrl) })
      : undefined,
    validator: validator.signer
      ? createWalletClient({ account: validator.signer, chain: mantleSepolia, transport: http(rpcUrl) })
      : undefined
  };

  for (const event of run.reputation) {
    if (!event.agentId) {
      // eslint-disable-next-line no-console
      console.warn(`[feedback] skipping ${event.agent}: no agentId on record.`);
      continue;
    }
    const args = [
      BigInt(event.agentId),
      BigInt(event.value),
      0,
      event.tag,
      "demo-cycle",
      run.network.explorer + "/",
      "",
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    ] as const;
    const calldata = encodeFunctionData({
      abi: erc8004ReputationAbi,
      functionName: "giveFeedback",
      args
    });
    if (dryRun) {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({
        agent: event.agent,
        agentId: event.agentId,
        from: isLedgerAgent(event.agent) ? validator.address : auditor.address,
        tag: event.tag,
        value: event.value,
        calldata
      }));
      continue;
    }

    const fromRole = isLedgerAgent(event.agent) ? "validator" : "auditor";
    const walletClient = clients[fromRole];
    const txHash = await walletClient!.writeContract({
      address: ERC8004.mantleSepolia.reputationRegistry,
      abi: erc8004ReputationAbi,
      functionName: "giveFeedback",
      args
    });
    // eslint-disable-next-line no-console
    console.log(`[feedback] ${event.agent} (#${event.agentId}) ${event.tag}=${event.value} from=${fromRole} -> tx ${txHash}`);
    await publicClient.waitForTransactionReceipt({ hash: txHash });
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
