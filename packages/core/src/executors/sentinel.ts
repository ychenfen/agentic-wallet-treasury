/**
 * Sentinel re-simulation.
 *
 * Sentinel is an independent validator. Instead of trusting Claw's reported
 * outcome, Sentinel runs its own quote of the same proposal and compares the
 * realized slippage against its tolerance. The score it posts to
 * ValidationRegistry is computed arithmetic — not a hardcoded scenario value.
 *
 * Modes (selected by BYREAL_MODE):
 *   mock (default)   pure deterministic math from the supplied ReSimHints
 *   real             actually shell out to `byreal-cli swap execute --dry-run`
 *                    and use its output to derive realizedSlippageBps before
 *                    feeding the same scoring function.
 *
 * The "real" branch is mostly forward-looking — today's public byreal-cli
 * targets Solana CLMM. When a Mantle build of byreal-cli ships, Sentinel
 * picks it up automatically; the rest of the pipeline does not change.
 */

import { spawn } from "node:child_process";
import type { Proposal, ReSimHints, ReSimResult } from "../index.js";

export interface SentinelOptions {
  /** Override BYREAL_MODE for tests. */
  mode?: "real" | "mock";
  /** byreal-cli binary path. Defaults to PATH lookup. */
  binary?: string;
  /** Score >= passThreshold counts as a passed validation. Default 60. */
  passThreshold?: number;
  /** Where Sentinel publishes the raw quote, if anywhere. */
  evidenceBaseURI?: string;
  /** Hard timeout for the real CLI call. */
  timeoutMs?: number;
}

/** Pure scoring function. Exposed so tests can pin numbers. */
export function computeReSimScore(
  hints: ReSimHints,
  passThreshold: number = 60
): { score: number; notes: string[] } {
  const { realizedSlippageBps, toleranceBps, poolDepth, feeBps } = hints;
  const notes: string[] = [];
  const ratio = realizedSlippageBps / Math.max(1, toleranceBps);

  let baseScore: number;
  if (ratio <= 1) {
    baseScore = 95 - 25 * ratio;
    notes.push(
      `Realized slippage ${realizedSlippageBps} bps is within Sentinel's ${toleranceBps} bps tolerance (ratio ${ratio.toFixed(2)}).`
    );
  } else {
    baseScore = Math.max(20, 70 - (ratio - 1) * 30);
    notes.push(
      `Realized slippage ${realizedSlippageBps} bps exceeds Sentinel's ${toleranceBps} bps tolerance by ${(ratio * 100 - 100).toFixed(0)}%.`
    );
  }

  let poolBonus = 0;
  if (poolDepth === "deep") poolBonus = 3;
  if (poolDepth === "moderate") poolBonus = 0;
  if (poolDepth === "thin") poolBonus = -3;
  if (poolBonus !== 0) {
    notes.push(`Pool depth ${poolDepth} adjusts the score by ${poolBonus > 0 ? "+" : ""}${poolBonus}.`);
  }

  notes.push(`Pool fee ${feeBps} bps recorded but does not affect Sentinel's score directly.`);

  const score = Math.max(0, Math.min(100, Math.round(baseScore + poolBonus)));
  notes.push(
    score >= passThreshold
      ? `Score ${score}/100 ≥ pass threshold ${passThreshold}: validation PASSED.`
      : `Score ${score}/100 < pass threshold ${passThreshold}: validation REJECTED.`
  );
  return { score, notes };
}

interface ByrealQuote {
  expectedOutputUsd: number;
  observedOutputUsd: number;
  priceImpactBps: number;
}

function chooseMode(opts: SentinelOptions): "real" | "mock" {
  if (opts.mode) return opts.mode;
  return process.env.BYREAL_MODE === "real" ? "real" : "mock";
}

function buildCliArgs(proposal: Proposal, hints: ReSimHints): string[] {
  if (hints.byrealCommandOverride) return hints.byrealCommandOverride;
  if (proposal.action === "hold") return ["overview"];
  return [
    "swap",
    "execute",
    "--input-symbol",
    proposal.assetIn,
    "--output-symbol",
    proposal.assetOut,
    "--amount-usd",
    proposal.amountUsd.toString(),
    "--dry-run"
  ];
}

function parseQuote(stdout: string, fallback: ReSimHints): ByrealQuote | undefined {
  try {
    const j = JSON.parse(stdout);
    const expected = Number(j.expectedOutputUsd ?? j.expected ?? j.preview?.expected);
    const observed = Number(j.observedOutputUsd ?? j.observed ?? j.preview?.observed);
    const impact = Number(j.priceImpactBps ?? j.priceImpact ?? j.preview?.priceImpactBps);
    if (Number.isFinite(expected) && Number.isFinite(observed) && Number.isFinite(impact)) {
      return { expectedOutputUsd: expected, observedOutputUsd: observed, priceImpactBps: impact };
    }
  } catch {
    /* fall through */
  }
  void fallback;
  return undefined;
}

function runCli(
  args: string[],
  binary: string,
  timeoutMs: number
): Promise<{ stdout: string; stderr: string; exitCode: number; command: string[] }> {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(binary, [...args, "-o", "json"], {
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      rejectRun(new Error(`byreal-cli timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      rejectRun(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolveRun({ stdout, stderr, exitCode: code ?? -1, command: [binary, ...args, "-o", "json"] });
    });
  });
}

export async function runSentinelReSimulation(
  proposal: Proposal,
  hints: ReSimHints,
  opts: SentinelOptions = {}
): Promise<ReSimResult> {
  const passThreshold = opts.passThreshold ?? 60;
  const mode = chooseMode(opts);

  if (mode === "mock") {
    const { score, notes } = computeReSimScore(hints, passThreshold);
    return {
      score,
      passed: score >= passThreshold,
      passThreshold,
      adapter: "mock",
      hints,
      notes: ["Sentinel ran in mock mode (no byreal-cli call).", ...notes],
      evidenceURI: opts.evidenceBaseURI
        ? `${opts.evidenceBaseURI.replace(/\/+$/, "")}/sentinel/${proposal.id}.json`
        : undefined
    };
  }

  // mode === "real" — try byreal-cli, gracefully degrade if unavailable.
  const args = buildCliArgs(proposal, hints);
  const binary = opts.binary ?? "byreal-cli";
  const timeoutMs = opts.timeoutMs ?? 15_000;
  try {
    const run = await runCli(args, binary, timeoutMs);
    if (run.exitCode === 0) {
      const quote = parseQuote(run.stdout, hints);
      const realized =
        quote && quote.priceImpactBps >= 0 ? quote.priceImpactBps : hints.realizedSlippageBps;
      const enriched: ReSimHints = { ...hints, realizedSlippageBps: realized };
      const { score, notes } = computeReSimScore(enriched, passThreshold);
      return {
        score,
        passed: score >= passThreshold,
        passThreshold,
        adapter: "byreal-cli",
        hints: enriched,
        notes: [
          `byreal-cli returned exit 0; using observed price impact ${realized} bps for the score.`,
          ...notes
        ],
        command: run.command,
        evidenceURI: opts.evidenceBaseURI
          ? `${opts.evidenceBaseURI.replace(/\/+$/, "")}/sentinel/${proposal.id}.json`
          : undefined
      };
    }
    // Non-zero exit: penalize and fall through to mock math with a warning.
    const { score, notes } = computeReSimScore(hints, passThreshold);
    return {
      score: Math.max(0, score - 15),
      passed: score - 15 >= passThreshold,
      passThreshold,
      adapter: "byreal-cli",
      hints,
      notes: [
        `byreal-cli exited ${run.exitCode}: ${run.stderr.trim() || "no stderr"}. Falling back to hint-based math with a -15 penalty.`,
        ...notes
      ],
      command: run.command
    };
  } catch (error) {
    const { score, notes } = computeReSimScore(hints, passThreshold);
    return {
      score,
      passed: score >= passThreshold,
      passThreshold,
      adapter: "mock",
      hints,
      notes: [
        `byreal-cli unavailable in real mode (${(error as Error).message}). Sentinel reverted to deterministic math.`,
        ...notes
      ]
    };
  }
}
