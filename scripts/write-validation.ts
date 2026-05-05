/**
 * Broadcast the ValidationRegistry request + response for the most recent
 * cycle in apps/web/public/demo-run.json.
 *
 *   1. Subject agent owner (Claw for execution validation) calls validationRequest(...).
 *   2. Validator (Sentinel) wallet calls validationResponse(...).
 *
 * Required env: AGENT_MNEMONIC (or LEDGER_PRIVATE_KEY + SENTINEL_PRIVATE_KEY),
 *               MANTLE_SEPOLIA_RPC_URL.
 * DRY_RUN=1 prints the planned txs.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createPublicClient, createWalletClient, http } from "viem";
import { mantleSepoliaTestnet as mantleSepolia } from "viem/chains";
import { ERC8004, erc8004ValidationAbi, type DemoRun } from "@clawdao/core";
import { loadAgentWallets, loadProjectEnv } from "@clawdao/core/node";

const DEMO_RUN_PATH = resolve(process.cwd(), "../apps/web/public/demo-run.json");

async function main(): Promise<void> {
  loadProjectEnv();
  const dryRun = process.env.DRY_RUN === "1";
  const rpcUrl = process.env.MANTLE_SEPOLIA_RPC_URL ?? "https://rpc.sepolia.mantle.xyz";
  const run: DemoRun = JSON.parse(readFileSync(DEMO_RUN_PATH, "utf8"));

  if (run.execution.status === "skipped") {
    // eslint-disable-next-line no-console
    console.log("[validate] execution was skipped — nothing to validate.");
    return;
  }
  const subjectAgentId = run.validation.subjectAgentId;
  if (!subjectAgentId) {
    // eslint-disable-next-line no-console
    console.log("[validate] subject agentId missing on validation outcome — skip.");
    return;
  }

  const wallets = loadAgentWallets({ allowEphemeral: dryRun });
  const requester = wallets.find((w) => w.slug === "executor");
  const validator = wallets.find((w) => w.slug === "validator");
  if (!requester || !validator) throw new Error("Executor requester + Validator wallets required.");

  if (!dryRun && (!requester.signer || !validator.signer)) {
    throw new Error("Need real signers for both executor (Claw) and validator (Sentinel).");
  }

  const publicClient = createPublicClient({ chain: mantleSepolia, transport: http(rpcUrl) });
  const requesterClient = requester.signer
    ? createWalletClient({ account: requester.signer, chain: mantleSepolia, transport: http(rpcUrl) })
    : undefined;
  const validatorClient = validator.signer
    ? createWalletClient({ account: validator.signer, chain: mantleSepolia, transport: http(rpcUrl) })
    : undefined;

  const requestArgs = [
    validator.address,
    BigInt(subjectAgentId),
    run.validation.requestURI,
    run.validation.requestHash
  ] as const;

  if (dryRun) {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({
      step: "validationRequest",
      from: requester.address,
      to: ERC8004.mantleSepolia.validationRegistry,
      args: {
        validator: validator.address,
        subjectAgentId,
        requestURI: run.validation.requestURI,
        requestHash: run.validation.requestHash
      }
    }, null, 2));
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({
      step: "validationResponse",
      from: validator.address,
      to: ERC8004.mantleSepolia.validationRegistry,
      args: {
        requestHash: run.validation.requestHash,
        response: run.validation.response,
        responseURI: run.validation.responseURI,
        responseHash: run.validation.responseHash,
        tag: run.validation.tag
      }
    }, null, 2));
    return;
  }

  // 1. Subject agent owner requests validation.
  const reqTx = await requesterClient!.writeContract({
    address: ERC8004.mantleSepolia.validationRegistry,
    abi: erc8004ValidationAbi,
    functionName: "validationRequest",
    args: requestArgs
  });
  // eslint-disable-next-line no-console
  console.log(`[validate] request tx ${reqTx}`);
  await publicClient.waitForTransactionReceipt({ hash: reqTx });

  // 2. Validator responds.
  const respTx = await validatorClient!.writeContract({
    address: ERC8004.mantleSepolia.validationRegistry,
    abi: erc8004ValidationAbi,
    functionName: "validationResponse",
    args: [
      run.validation.requestHash,
      run.validation.response,
      run.validation.responseURI,
      run.validation.responseHash,
      run.validation.tag
    ]
  });
  // eslint-disable-next-line no-console
  console.log(`[validate] response tx ${respTx}`);
  await publicClient.waitForTransactionReceipt({ hash: respTx });
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
