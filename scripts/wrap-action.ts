/**
 * Phase 3 real Mantle DeFi action: wrap a bounded amount of native MNT into
 * WMNT through the already-deployed, source-verified AgenticTreasury.
 *
 * This proves the treasury drives a real external protocol (canonical WMNT,
 * a WETH9-style wrapper) and not just self-calls:
 *
 *   1. Seed the treasury with the wrap amount of native MNT (receive()).
 *   2. Guard (risk wallet) signs an EIP-712 ApprovedAction whose target is the
 *      real WMNT contract and whose calldata is deposit().
 *   3. Claw (executor wallet) submits executeApprovedAction — the treasury runs
 *      WMNT.deposit{value}() and ends up holding WMNT.
 *   4. Sentinel validates by reading the treasury's WMNT balance delta.
 *
 * Bounded + reversible: default 0.01 MNT, well under the on-chain value cap, and
 * WMNT is unwrappable 1:1. Writes apps/web/public/defi-action.json for the
 * dashboard and evidence report.
 *
 * Usage:  npm run wrap-action            # 0.01 MNT
 *         WRAP_AMOUNT_MNT=0.02 npm run wrap-action
 */

import { resolve } from "node:path";
import { writeFileSync } from "node:fs";
import {
  createPublicClient,
  createWalletClient,
  http,
  encodeFunctionData,
  encodeAbiParameters,
  keccak256,
  parseEther,
  formatEther
} from "viem";
import { mantleSepoliaTestnet as mantleSepolia } from "viem/chains";
import { loadAgentWallets, loadProjectEnv } from "@clawdao/core/node";

const ROOT = resolve(process.cwd(), "..");
const OUT = resolve(ROOT, "apps/web/public/defi-action.json");
const EXPLORER = "https://sepolia.mantlescan.xyz";
const WMNT = "0xc0eecfa24e391e4259b7ef17be54be5139da1ac7" as const; // canonical Wrapped MNT, Mantle Sepolia

const wmntAbi = [
  { type: "function", name: "deposit", stateMutability: "payable", inputs: [], outputs: [] },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  }
] as const;

const treasuryAbi = [
  {
    type: "function",
    name: "executeApprovedAction",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "approval",
        type: "tuple",
        components: [
          { name: "actionId", type: "bytes32" },
          { name: "target", type: "address" },
          { name: "value", type: "uint256" },
          { name: "dataHash", type: "bytes32" },
          { name: "policyHash", type: "bytes32" },
          { name: "deadline", type: "uint256" },
          { name: "nonce", type: "uint256" }
        ]
      },
      { name: "data", type: "bytes" },
      { name: "signature", type: "bytes" }
    ],
    outputs: [{ name: "result", type: "bytes" }]
  },
  {
    type: "function",
    name: "nonces",
    stateMutability: "view",
    inputs: [{ name: "officer", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "maxActionValueWei",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  }
] as const;

const DOMAIN_TYPES = {
  ApprovedAction: [
    { name: "actionId", type: "bytes32" },
    { name: "target", type: "address" },
    { name: "value", type: "uint256" },
    { name: "dataHash", type: "bytes32" },
    { name: "policyHash", type: "bytes32" },
    { name: "deadline", type: "uint256" },
    { name: "nonce", type: "uint256" }
  ]
} as const;

function txLink(hash: string) {
  return { hash, explorerUrl: `${EXPLORER}/tx/${hash}` };
}

async function main(): Promise<void> {
  loadProjectEnv({ includeGenerated: true });

  const rpcUrl = process.env.MANTLE_SEPOLIA_RPC_URL;
  const treasury = (process.env.TREASURY_ADDRESS ?? "").toLowerCase() as `0x${string}`;
  if (!rpcUrl) throw new Error("MANTLE_SEPOLIA_RPC_URL is required.");
  if (!treasury || treasury.length !== 42) throw new Error("TREASURY_ADDRESS is required.");

  const wallets = loadAgentWallets({ allowEphemeral: false });
  const guard = wallets.find((w) => w.slug === "risk");
  const claw = wallets.find((w) => w.slug === "executor");
  if (!guard?.signer || !claw?.signer) {
    throw new Error("Guard (risk) and Claw (executor) signers are required. Set AGENT_MNEMONIC.");
  }

  const wrapAmount = parseEther(process.env.WRAP_AMOUNT_MNT ?? "0.01");

  const publicClient = createPublicClient({ chain: mantleSepolia, transport: http(rpcUrl) });
  const clawClient = createWalletClient({ account: claw.signer, chain: mantleSepolia, transport: http(rpcUrl) });

  // Safety: never wrap above the on-chain value cap.
  const cap = await publicClient.readContract({ address: treasury, abi: treasuryAbi, functionName: "maxActionValueWei" });
  if (wrapAmount > cap) {
    throw new Error(`Wrap amount ${formatEther(wrapAmount)} MNT exceeds treasury cap ${formatEther(cap)} MNT.`);
  }

  const wmntBefore = await publicClient.readContract({
    address: WMNT,
    abi: wmntAbi,
    functionName: "balanceOf",
    args: [treasury]
  });
  const treasuryMnt = await publicClient.getBalance({ address: treasury });

  console.log(`[wrap] treasury ${treasury}`);
  console.log(`[wrap] amount ${formatEther(wrapAmount)} MNT | treasury MNT ${formatEther(treasuryMnt)} | WMNT before ${formatEther(wmntBefore)}`);

  // Step 1: seed the treasury if it does not already hold enough native MNT.
  let seedTx: { hash: string; explorerUrl: string } | null = null;
  if (treasuryMnt < wrapAmount) {
    const need = wrapAmount - treasuryMnt;
    console.log(`[wrap] seeding treasury with ${formatEther(need)} MNT from Claw ${claw.address}`);
    const hash = await clawClient.sendTransaction({ to: treasury, value: need });
    await publicClient.waitForTransactionReceipt({ hash });
    seedTx = txLink(hash);
    console.log(`[wrap] seed tx ${hash}`);
  }

  // Step 2: Guard signs an ApprovedAction targeting the real WMNT with deposit() calldata.
  const callData = encodeFunctionData({ abi: wmntAbi, functionName: "deposit" }); // 0xd0e30db0
  const dataHash = keccak256(callData);
  const policyHash = keccak256(new TextEncoder().encode("wrap-mnt-to-wmnt-v1"));
  const actionId = keccak256(
    encodeAbiParameters(
      [
        { name: "label", type: "string" },
        { name: "ts", type: "uint256" }
      ],
      ["wmnt-wrap", BigInt(Math.floor(Date.now() / 1000))]
    )
  );
  const nonce = await publicClient.readContract({
    address: treasury,
    abi: treasuryAbi,
    functionName: "nonces",
    args: [guard.address]
  });
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 30 * 60);

  const approval = {
    actionId,
    target: WMNT as `0x${string}`,
    value: wrapAmount,
    dataHash,
    policyHash,
    deadline,
    nonce
  };

  const signature = await guard.signer.signTypedData({
    domain: { name: "AgenticTreasury", version: "1", chainId: mantleSepolia.id, verifyingContract: treasury },
    types: DOMAIN_TYPES,
    primaryType: "ApprovedAction",
    message: approval
  });
  console.log(`[wrap] Guard ${guard.address} signed approval (nonce ${nonce})`);

  // Step 3: Claw executes the approved wrap through the treasury.
  const wrapHash = await clawClient.writeContract({
    address: treasury,
    abi: treasuryAbi,
    functionName: "executeApprovedAction",
    args: [approval, callData, signature]
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash: wrapHash });
  console.log(`[wrap] wrap tx ${wrapHash} (status ${receipt.status})`);

  // Step 4: Sentinel validates the treasury's WMNT balance delta. Poll to
  // tolerate load-balanced RPCs that briefly serve a pre-tx state after the
  // receipt is already available.
  let wmntAfter = wmntBefore;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    wmntAfter = await publicClient.readContract({
      address: WMNT,
      abi: wmntAbi,
      functionName: "balanceOf",
      args: [treasury]
    });
    if (wmntAfter !== wmntBefore) break;
    await new Promise((r) => setTimeout(r, 1500));
  }
  const delta = wmntAfter - wmntBefore;
  const passed = receipt.status === "success" && delta === wrapAmount;

  const record = {
    generatedAt: new Date().toISOString(),
    network: { name: "Mantle Sepolia", chainId: 5003, explorer: EXPLORER },
    protocol: {
      name: "WMNT (Wrapped MNT)",
      address: WMNT,
      explorerUrl: `${EXPLORER}/token/${WMNT}`,
      capability: "WETH9-style deposit() — native MNT wrapped 1:1"
    },
    action: {
      description: `Guard approves wrapping ${formatEther(wrapAmount)} MNT into WMNT; Claw executes it through AgenticTreasury.`,
      amountWei: wrapAmount.toString(),
      amountMnt: formatEther(wrapAmount),
      treasury,
      guard: guard.address,
      executor: claw.address,
      selector: callData.slice(0, 10)
    },
    seedTx,
    wrapTx: txLink(wrapHash),
    validation: {
      validator: wallets.find((w) => w.slug === "validator")?.address ?? null,
      wmntBalanceBeforeWei: wmntBefore.toString(),
      wmntBalanceAfterWei: wmntAfter.toString(),
      deltaWei: delta.toString(),
      deltaMnt: formatEther(delta),
      passed,
      summary: passed
        ? `Sentinel confirmed the treasury received exactly ${formatEther(delta)} WMNT from the approved wrap.`
        : `Validation failed: status ${receipt.status}, observed delta ${formatEther(delta)} WMNT vs expected ${formatEther(wrapAmount)}.`
    }
  };

  writeFileSync(OUT, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  console.log(`[wrap] ${passed ? "PASS" : "FAIL"} — wrote ${OUT}`);
  console.log(`[wrap] wrap tx: ${EXPLORER}/tx/${wrapHash}`);
  if (!passed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
