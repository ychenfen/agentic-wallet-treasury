import { createHash } from "node:crypto";
import type { ExecutionAdapter, ExecutionContext } from "./types.js";
import type { ExecutionResult } from "../index.js";

function proofHash(input: unknown): `0x${string}` {
  return `0x${createHash("sha256").update(JSON.stringify(input)).digest("hex")}`;
}

export const mockAdapter: ExecutionAdapter = {
  name: "mock",
  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    const { proposal, verdict, policyHash } = context;
    if (proposal.action === "hold") {
      return {
        adapter: "mock",
        status: "skipped",
        proofHash: proofHash({ proposal, verdict, hold: true, policyHash }),
        summary: "Mock adapter recorded a no-op hold cycle. No transaction should be submitted for this proposal."
      };
    }

    if (!verdict.approved) {
      return {
        adapter: "mock",
        status: "skipped",
        proofHash: proofHash({ proposal, verdict, skipped: true, policyHash }),
        summary: "Mock adapter skipped execution because risk rejected the proposal."
      };
    }

    const simulatedTx = proofHash({
      action: proposal.action,
      assetIn: proposal.assetIn,
      assetOut: proposal.assetOut,
      amountUsd: proposal.amountUsd,
      seed: context.proofSeed ?? "demo"
    });

    return {
      adapter: "mock",
      status: "simulated",
      txHash: simulatedTx,
      explorerUrl: `https://sepolia.mantlescan.xyz/tx/${simulatedTx}`,
      proofHash: proofHash({ proposal, verdict, simulatedTx, policyHash }),
      summary:
        "Mock adapter produced a deterministic proof hash. Swap to mantle-sepolia or byreal for real execution."
    };
  }
};
