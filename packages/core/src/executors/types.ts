import type { AgentWallet } from "../wallets.js";
import type { ExecutionResult, Proposal, RiskVerdict } from "../index.js";

export interface ExecutionContext {
  proposal: Proposal;
  verdict: RiskVerdict;
  /** Operator wallet that signs/sends the underlying tx (Claw / executor). */
  executorWallet?: AgentWallet;
  /** Hex bytes32 hash representing the verdict policy snapshot. */
  policyHash: `0x${string}`;
  /** Optional override for hash inputs so tests can seed determinism. */
  proofSeed?: string;
}

export interface ExecutionAdapter {
  readonly name: ExecutionResult["adapter"];
  execute(context: ExecutionContext): Promise<ExecutionResult>;
}
