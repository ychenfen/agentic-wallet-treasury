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

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createPublicClient, createWalletClient, http } from "viem";
import { mantleSepoliaTestnet as mantleSepolia } from "viem/chains";
import {
  DEFAULT_VALIDATOR_FEE_WEI,
  ERC8004,
  erc8004ValidationAbi,
  validatorPaymasterAbi,
  type DemoRun,
  type ValidationPayment
} from "@clawdao/core";
import { loadAgentWallets, loadProjectEnv } from "@clawdao/core/node";

const DEMO_RUN_PATH = resolve(process.cwd(), "../apps/web/public/demo-run.json");
const PAYMASTER_RECORD_PATH = resolve(process.cwd(), "../apps/web/public/deployed-paymaster.json");
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function loadPaymasterAddress(): `0x${string}` | undefined {
  if (process.env.PAYMASTER_ADDRESS) return process.env.PAYMASTER_ADDRESS as `0x${string}`;
  if (!existsSync(PAYMASTER_RECORD_PATH)) return undefined;
  try {
    const record = JSON.parse(readFileSync(PAYMASTER_RECORD_PATH, "utf8")) as { address?: `0x${string}` };
    return record.address;
  } catch {
    return undefined;
  }
}

function persistPayment(run: DemoRun, payment: ValidationPayment): void {
  run.validation.payment = payment;
  writeFileSync(DEMO_RUN_PATH, `${JSON.stringify(run, null, 2)}\n`, "utf8");
}

async function waitForNonce(
  publicClient: ReturnType<typeof createPublicClient>,
  address: `0x${string}`,
  minNonce: number
): Promise<number> {
  for (let i = 0; i < 12; i += 1) {
    const nonce = await publicClient.getTransactionCount({ address, blockTag: "pending" });
    if (nonce >= minNonce) return nonce;
    await new Promise((resolveWait) => setTimeout(resolveWait, 1_500));
  }
  return publicClient.getTransactionCount({ address, blockTag: "latest" });
}

async function waitForReceipt(
  publicClient: ReturnType<typeof createPublicClient>,
  hash: `0x${string}`
): Promise<void> {
  for (let i = 0; i < 5; i += 1) {
    try {
      await publicClient.waitForTransactionReceipt({ hash, timeout: 45_000 });
      return;
    } catch (error) {
      const message = (error as Error).message;
      if (!message.includes("could not be found") && !message.includes("not be processed")) {
        throw error;
      }
      await new Promise((resolveWait) => setTimeout(resolveWait, 3_000));
    }
  }
  throw new Error(`Timed out waiting for receipt ${hash}`);
}

async function readValidationStatus(
  publicClient: ReturnType<typeof createPublicClient>,
  requestHash: `0x${string}`
): Promise<{
  validatorAddress: `0x${string}`;
  agentId: bigint;
  response: number;
  responseHash: `0x${string}`;
  tag: string;
  lastUpdate: bigint;
}> {
  const status = await publicClient.readContract({
    address: ERC8004.mantleSepolia.validationRegistry,
    abi: erc8004ValidationAbi,
    functionName: "getValidationStatus",
    args: [requestHash]
  });
  const tuple = status as readonly [`0x${string}`, bigint, number, `0x${string}`, string, bigint];
  return {
    validatorAddress: tuple[0],
    agentId: tuple[1],
    response: tuple[2],
    responseHash: tuple[3],
    tag: tuple[4],
    lastUpdate: tuple[5]
  };
}

async function main(): Promise<void> {
  loadProjectEnv();
  const dryRun = process.env.DRY_RUN === "1";
  const rpcUrl = process.env.MANTLE_SEPOLIA_RPC_URL ?? "https://rpc.sepolia.mantle.xyz";
  const run: DemoRun = JSON.parse(readFileSync(DEMO_RUN_PATH, "utf8"));
  const paymaster = loadPaymasterAddress();
  const validatorFeeWei = process.env.VALIDATOR_FEE_WEI
    ? BigInt(process.env.VALIDATOR_FEE_WEI)
    : DEFAULT_VALIDATOR_FEE_WEI;

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

  if (run.execution.txHash && run.execution.txHash !== "0x") {
    // Claw submits the treasury execution and then immediately pays Sentinel.
    // Mantle RPCs can otherwise hand out a stale nonce and reject the payment
    // as an underpriced replacement.
    // eslint-disable-next-line no-console
    console.log(`[validate] waiting for execution tx ${run.execution.txHash} before validator payment ...`);
    await waitForReceipt(publicClient, run.execution.txHash);
  }

  const requestArgs = [
    validator.address,
    BigInt(subjectAgentId),
    run.validation.requestURI,
    run.validation.requestHash
  ] as const;

  if (dryRun) {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({
      step: "payValidator",
      mode: paymaster ? "real" : "skipped-no-paymaster",
      from: requester.address,
      to: paymaster,
      args: {
        validator: validator.address,
        requestHash: run.validation.requestHash,
        valueWei: validatorFeeWei.toString()
      }
    }, null, 2));
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

  // 0. Claw pays Sentinel before requesting validation. This is the x402-style
  // agent-economy leg: the payment tx and ValidationRegistry request share the
  // same requestHash.
  if (paymaster) {
    const alreadyEscrowed = await publicClient.readContract({
      address: paymaster,
      abi: validatorPaymasterAbi,
      functionName: "escrowed",
      args: [run.validation.requestHash]
    });
    const paymentNonce = await waitForNonce(publicClient, requester.address, await publicClient.getTransactionCount({
      address: requester.address,
      blockTag: "pending"
    }));
    if (alreadyEscrowed > 0n) {
      // eslint-disable-next-line no-console
      console.log(`[validate] x402 payment already escrowed for ${run.validation.requestHash}; skipping duplicate deposit.`);
      if (!run.validation.payment?.paymentTx) {
        persistPayment(run, {
          feePaidWei: alreadyEscrowed.toString(),
          paymaster,
          validatorAddress: validator.address,
          payerAddress: requester.address
        });
      }
    } else {
      const paymentTx = await requesterClient!.writeContract({
        address: paymaster,
        abi: validatorPaymasterAbi,
        functionName: "depositForRequest",
        args: [validator.address, run.validation.requestHash],
        value: validatorFeeWei,
        nonce: paymentNonce
      });
      // eslint-disable-next-line no-console
      console.log(`[validate] x402 payment tx ${paymentTx}`);
      await waitForReceipt(publicClient, paymentTx);
      persistPayment(run, {
        paymentTx,
        feePaidWei: validatorFeeWei.toString(),
        paymaster,
        validatorAddress: validator.address,
        payerAddress: requester.address,
        explorerUrl: `https://sepolia.mantlescan.xyz/tx/${paymentTx}`
      });
      await waitForNonce(publicClient, requester.address, paymentNonce + 1);
    }
  } else {
    // eslint-disable-next-line no-console
    console.warn("[validate] PAYMASTER_ADDRESS not configured; validation will proceed without a real x402 payment tx.");
  }

  // 1. Subject agent owner requests validation.
  let status = await readValidationStatus(publicClient, run.validation.requestHash);
  if (status.validatorAddress.toLowerCase() === ZERO_ADDRESS) {
    const requestNonce = await waitForNonce(publicClient, requester.address, 0);
    const reqTx = await requesterClient!.writeContract({
      address: ERC8004.mantleSepolia.validationRegistry,
      abi: erc8004ValidationAbi,
      functionName: "validationRequest",
      args: requestArgs,
      nonce: requestNonce
    });
    // eslint-disable-next-line no-console
    console.log(`[validate] request tx ${reqTx}`);
    await waitForReceipt(publicClient, reqTx);
    status = await readValidationStatus(publicClient, run.validation.requestHash);
  } else {
    // eslint-disable-next-line no-console
    console.log(`[validate] request ${run.validation.requestHash} already exists; skipping validationRequest.`);
  }

  // 2. Validator responds.
  if (status.response === run.validation.response && status.responseHash.toLowerCase() === run.validation.responseHash.toLowerCase()) {
    // eslint-disable-next-line no-console
    console.log(`[validate] response already exists (${status.response}/100); skipping validationResponse.`);
  } else {
    const responseNonce = await waitForNonce(publicClient, validator.address, 0);
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
      ],
      nonce: responseNonce
    });
    // eslint-disable-next-line no-console
    console.log(`[validate] response tx ${respTx}`);
    await waitForReceipt(publicClient, respTx);
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
