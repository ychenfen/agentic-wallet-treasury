/**
 * Mantle Sepolia execution adapter.
 *
 * Drives a real on-chain transaction through the AgenticTreasury contract.
 * The flow is split:
 *   1. Risk Officer signs an EIP-712 ApprovedAction off-chain.
 *   2. Executor (Claw) submits executeApprovedAction(approval, signature).
 *   3. We return the resulting tx hash + explorer link as the execution proof.
 *
 * If TREASURY_ADDRESS is not set or the executor wallet is missing, the adapter
 * gracefully degrades into a "skipped" status so demos keep working.
 */

import { createHash } from "node:crypto";
import {
  createPublicClient,
  createWalletClient,
  encodeAbiParameters,
  http,
  keccak256,
  toBytes,
  toHex
} from "viem";
import { mantleSepoliaTestnet as mantleSepolia } from "viem/chains";
import type { Hex } from "viem";
import type { ExecutionAdapter, ExecutionContext } from "./types.js";
import type { ExecutionResult } from "../index.js";
import type { AgentWallet } from "../wallets.js";

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
    name: "DOMAIN_SEPARATOR",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bytes32" }]
  }
] as const;

export interface ApprovedAction {
  actionId: Hex;
  target: `0x${string}`;
  value: bigint;
  dataHash: Hex;
  policyHash: Hex;
  deadline: bigint;
  nonce: bigint;
}

export interface MantleSepoliaAdapterOptions {
  treasuryAddress?: `0x${string}`;
  rpcUrl?: string;
  riskWallet?: AgentWallet;
  /** Optional default target + calldata used when proposal has none. */
  defaultTarget?: `0x${string}`;
  /** Bias for the on-chain value field (in wei). Defaults to 0. */
  defaultValueWei?: bigint;
  /** Seconds until approval deadline. Default: 30 minutes. */
  deadlineWindowSec?: number;
}

function proofHash(input: unknown): Hex {
  return `0x${createHash("sha256").update(JSON.stringify(input, (_k, v) => (typeof v === "bigint" ? v.toString() : v))).digest("hex")}`;
}

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

export function createMantleSepoliaAdapter(opts: MantleSepoliaAdapterOptions = {}): ExecutionAdapter {
  const treasuryAddress = (opts.treasuryAddress ?? (process.env.TREASURY_ADDRESS as `0x${string}` | undefined)) as
    | `0x${string}`
    | undefined;
  const rpcUrl = opts.rpcUrl ?? process.env.MANTLE_SEPOLIA_RPC_URL;
  const deadlineWindow = opts.deadlineWindowSec ?? 60 * 30;

  return {
    name: "mantle-sepolia",
    async execute(context: ExecutionContext): Promise<ExecutionResult> {
      const { proposal, verdict, policyHash } = context;

      if (proposal.action === "hold") {
        return {
          adapter: "mantle-sepolia",
          status: "skipped",
          proofHash: proofHash({ proposal, verdict, hold: true, policyHash }),
          summary: "mantle-sepolia adapter recorded a hold cycle. No treasury transaction was submitted."
        };
      }

      if (!verdict.approved) {
        return {
          adapter: "mantle-sepolia",
          status: "skipped",
          proofHash: proofHash({ proposal, verdict, skipped: true, policyHash }),
          summary: "mantle-sepolia adapter skipped because risk rejected the proposal."
        };
      }

      if (!treasuryAddress || !opts.riskWallet?.signer || !context.executorWallet?.signer || !rpcUrl) {
        return {
          adapter: "mantle-sepolia",
          status: "skipped",
          proofHash: proofHash({
            proposal,
            verdict,
            policyHash,
            missing: {
              treasuryAddress: !treasuryAddress,
              riskSigner: !opts.riskWallet?.signer,
              executorSigner: !context.executorWallet?.signer,
              rpcUrl: !rpcUrl
            }
          }),
          summary:
            "mantle-sepolia adapter is dormant. Set TREASURY_ADDRESS, MANTLE_SEPOLIA_RPC_URL, GUARD_PRIVATE_KEY, and CLAW_PRIVATE_KEY to broadcast real transactions."
        };
      }

      const publicClient = createPublicClient({ chain: mantleSepolia, transport: http(rpcUrl) });
      const executorClient = createWalletClient({
        account: context.executorWallet.signer,
        chain: mantleSepolia,
        transport: http(rpcUrl)
      });

      const target = opts.defaultTarget ?? treasuryAddress;
      const callData: Hex = "0x";
      const valueWei = opts.defaultValueWei ?? 0n;
      const dataHash = keccak256(callData);
      const actionId = keccak256(
        encodeAbiParameters(
          [
            { name: "proposalId", type: "string" },
            { name: "ts", type: "uint256" }
          ],
          [proposal.id, BigInt(Math.floor(Date.now() / 1000))]
        )
      );

      const nonce = await publicClient.readContract({
        address: treasuryAddress,
        abi: treasuryAbi,
        functionName: "nonces",
        args: [opts.riskWallet.address]
      });

      const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineWindow);
      const approval: ApprovedAction = {
        actionId,
        target,
        value: valueWei,
        dataHash,
        policyHash,
        deadline,
        nonce
      };

      const domain = {
        name: "AgenticTreasury",
        version: "1",
        chainId: mantleSepolia.id,
        verifyingContract: treasuryAddress
      } as const;

      const signature = await opts.riskWallet.signer.signTypedData({
        domain,
        types: DOMAIN_TYPES,
        primaryType: "ApprovedAction",
        message: approval
      });

      const txHash = await executorClient.writeContract({
        address: treasuryAddress,
        abi: treasuryAbi,
        functionName: "executeApprovedAction",
        args: [approval, callData, signature]
      });

      return {
        adapter: "mantle-sepolia",
        status: "submitted",
        txHash,
        explorerUrl: `https://sepolia.mantlescan.xyz/tx/${txHash}`,
        proofHash: proofHash({ proposal, verdict, approval, signature, policyHash }),
        summary: `Submitted to AgenticTreasury at ${treasuryAddress} on Mantle Sepolia. Risk: ${opts.riskWallet.address}, Executor: ${context.executorWallet.address}.`
      };
    }
  };
}

/** Helper used by tests to encode the ApprovedAction tuple as the contract sees it. */
export function encodeApprovedAction(approval: ApprovedAction): Hex {
  return encodeAbiParameters(
    [
      {
        name: "approval",
        type: "tuple",
        components: DOMAIN_TYPES.ApprovedAction
      }
    ],
    [approval]
  );
}

export const APPROVED_ACTION_TYPEHASH = keccak256(
  toBytes(
    "ApprovedAction(bytes32 actionId,address target,uint256 value,bytes32 dataHash,bytes32 policyHash,uint256 deadline,uint256 nonce)"
  )
);

export function bytes32ToHex(value: Uint8Array): Hex {
  return toHex(value);
}
