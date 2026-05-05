/**
 * Scenario library. Each `npm run demo` picks one (deterministically when
 * DEMO_SEED is set, otherwise round-robin via the persisted cycle counter).
 *
 * Scenarios are intentionally heterogeneous so the dashboard / livestream
 * shows different verdicts and validator outcomes — not just the happy path.
 */

import type { Proposal, ReSimHints, RiskVerdict, TreasuryPolicy } from "@clawdao/core";

export interface Scenario {
  id: string;
  /** One-line label for cycle-history rows. */
  label: string;
  proposal: Proposal;
  /**
   * Override the verdict produced by the policy engine. When omitted, the
   * runner runs the proposal through the standard policy and uses that.
   */
  forceVerdict?: (policy: TreasuryPolicy) => RiskVerdict;
  /**
   * Hints Sentinel uses for its independent re-simulation. When present,
   * the runner asks Sentinel to compute its own score from these inputs
   * (instead of using `validatorScore`). Required for "live" scenarios;
   * absent for hold/blocked scenarios where Sentinel has nothing to do.
   */
  reSimHints?: ReSimHints;
  /**
   * Fallback validator score for scenarios where Sentinel doesn't run a
   * full re-simulation (e.g. hold cycles).
   */
  validatorScore: number;
  /** Validator's free-form summary (rendered in the dashboard). */
  validatorSummary: string;
}

function genericVerdictBuilder(approved: boolean, reason: string, blockerLabel: string): (policy: TreasuryPolicy) => RiskVerdict {
  return (policy: TreasuryPolicy) => ({
    approved,
    score: approved ? 92 : 38,
    reason,
    checks: [
      {
        label: "Policy action",
        passed: true,
        detail: `Action passes the allowlist (${policy.allowedActions.join(", ")}).`
      },
      {
        label: "Trade cap",
        passed: approved,
        detail: approved
          ? `Notional under the $${policy.maxTradeUsd} cap.`
          : `${blockerLabel}.`
      },
      {
        label: "Drawdown guard",
        passed: true,
        detail: `${policy.maxDrawdownBps} bps drawdown cap respected.`
      },
      {
        label: "Risk approval required",
        passed: policy.requiresRiskApproval,
        detail: "Treasury policy requires Guard signature before any execution."
      }
    ]
  });
}

export const SCENARIOS: Scenario[] = [
  {
    id: "small-stable-rotation",
    label: "Rotate $125 of MNT into USDe (small).",
    proposal: {
      id: "small-stable-rotation",
      title: "Move a small treasury slice into a lower-risk Mantle yield action",
      action: "test-swap",
      assetIn: "MNT",
      assetOut: "USDe",
      amountUsd: 125,
      rationale:
        "Scout sees stablecoin demand rising and proposes a capped test action before any larger treasury rebalance.",
      confidence: 0.74
    },
    reSimHints: {
      feeBps: 5,
      realizedSlippageBps: 18,
      toleranceBps: 80,
      poolDepth: "deep"
    },
    validatorScore: 92,
    validatorSummary:
      "Sentinel re-checked Claw's tx: bounded notional, allowed pair, slippage under cap. Validation passed."
  },
  {
    id: "rwa-yield-curve",
    label: "Rebalance into USDY (RWA yield curve).",
    proposal: {
      id: "rwa-yield-curve",
      title: "Rebalance into Ondo USDY for higher RWA yield",
      action: "rebalance",
      assetIn: "USDe",
      assetOut: "USDY",
      amountUsd: 380,
      rationale:
        "Yield curve favours USDY this week; Scout proposes shifting a slice while staying within risk limits.",
      confidence: 0.68
    },
    reSimHints: {
      feeBps: 5,
      realizedSlippageBps: 22,
      toleranceBps: 80,
      poolDepth: "deep"
    },
    validatorScore: 88,
    validatorSummary:
      "Sentinel verified the destination is whitelisted (USDY). Approved with a minor latency note."
  },
  {
    id: "oversized-action",
    label: "BLOCKED — $750 swap exceeds Guard's cap.",
    proposal: {
      id: "oversized-action",
      title: "Aggressive single-tick MNT to mETH rotation",
      action: "rebalance",
      assetIn: "MNT",
      assetOut: "mETH",
      amountUsd: 750,
      rationale:
        "Scout argues for a larger move based on directional conviction, knowing it might breach risk caps.",
      confidence: 0.61
    },
    forceVerdict: genericVerdictBuilder(
      false,
      "Guard blocked: notional $750 exceeds the $500 trade cap.",
      "$750 breaches the $500 single-action cap"
    ),
    validatorScore: 0,
    validatorSummary: "Sentinel had nothing to validate — no execution occurred after Guard blocked the action."
  },
  {
    id: "validator-rejects",
    label: "Approved by Guard, REJECTED by Sentinel (slippage).",
    proposal: {
      id: "validator-rejects",
      title: "Test-swap into a thin Merchant Moe pool",
      action: "test-swap",
      assetIn: "MNT",
      assetOut: "USDe",
      amountUsd: 200,
      rationale:
        "Scout proposes a small swap targeting a less-liquid pool; quotes look tight but the pool is shallow.",
      confidence: 0.55
    },
    reSimHints: {
      feeBps: 30,
      realizedSlippageBps: 150,
      toleranceBps: 80,
      poolDepth: "thin"
    },
    validatorScore: 41,
    validatorSummary:
      "Sentinel re-simulated the swap: realized slippage exceeded the tolerance. Validation rejected. Reputation penalty applied to Claw."
  },
  {
    id: "hold-cycle",
    label: "Hold cycle — no on-chain action.",
    proposal: {
      id: "hold-cycle",
      title: "Hold position; macro signal mixed",
      action: "hold",
      assetIn: "—",
      assetOut: "—",
      amountUsd: 0,
      rationale:
        "Scout reports inconclusive macro signal. The proposal is to do nothing this cycle and re-evaluate next.",
      confidence: 0.81
    },
    validatorScore: 100,
    validatorSummary: "Sentinel acknowledged the no-op cycle. No transaction was expected; bookkeeping recorded."
  }
];

export function pickScenario(seed: string | number): Scenario {
  // Hash to integer index, deterministic for any string/number input.
  const str = typeof seed === "number" ? seed.toString() : seed;
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return SCENARIOS[h % SCENARIOS.length];
}

export function scenarioById(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
