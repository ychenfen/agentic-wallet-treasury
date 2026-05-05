import { describe, expect, it } from "vitest";
import { computeReSimScore, runSentinelReSimulation } from "../executors/sentinel.js";
import type { Proposal, ReSimHints } from "../index.js";

const proposal: Proposal = {
  id: "test",
  title: "test swap",
  action: "test-swap",
  assetIn: "MNT",
  assetOut: "USDe",
  amountUsd: 100,
  rationale: "test",
  confidence: 0.5
};

describe("computeReSimScore", () => {
  it("scores small-stable-rotation hints at 92", () => {
    const hints: ReSimHints = {
      feeBps: 5,
      realizedSlippageBps: 18,
      toleranceBps: 80,
      poolDepth: "deep"
    };
    const result = computeReSimScore(hints);
    expect(result.score).toBe(92);
    expect(result.notes).toContain(
      `Realized slippage 18 bps is within Sentinel's 80 bps tolerance (ratio 0.23).`
    );
  });

  it("scores rwa-yield-curve hints at 91", () => {
    expect(
      computeReSimScore({ feeBps: 5, realizedSlippageBps: 22, toleranceBps: 80, poolDepth: "deep" }).score
    ).toBe(91);
  });

  it("scores validator-rejects hints at 41 (below pass threshold)", () => {
    const hints: ReSimHints = {
      feeBps: 30,
      realizedSlippageBps: 150,
      toleranceBps: 80,
      poolDepth: "thin"
    };
    const result = computeReSimScore(hints);
    expect(result.score).toBe(41);
    expect(result.notes.some((n) => /REJECTED/.test(n))).toBe(true);
  });

  it("clamps to 100 when realized slippage is zero", () => {
    expect(
      computeReSimScore({ feeBps: 0, realizedSlippageBps: 0, toleranceBps: 80, poolDepth: "deep" }).score
    ).toBe(98); // 95 + 3 deep bonus
  });

  it("clamps to 20 floor when slippage massively exceeds tolerance", () => {
    expect(
      computeReSimScore({ feeBps: 100, realizedSlippageBps: 5000, toleranceBps: 80, poolDepth: "thin" }).score
    ).toBe(17); // floor 20 - 3 thin = 17
  });

  it("respects custom pass threshold", () => {
    const hints: ReSimHints = {
      feeBps: 5,
      realizedSlippageBps: 60,
      toleranceBps: 80,
      poolDepth: "moderate"
    };
    expect(computeReSimScore(hints, 80).notes.at(-1)).toMatch(/REJECTED/);
    expect(computeReSimScore(hints, 50).notes.at(-1)).toMatch(/PASSED/);
  });

  it("never returns negative score", () => {
    const hints: ReSimHints = {
      feeBps: 0,
      realizedSlippageBps: 100000,
      toleranceBps: 1,
      poolDepth: "thin"
    };
    expect(computeReSimScore(hints).score).toBeGreaterThanOrEqual(0);
  });
});

describe("runSentinelReSimulation (mock)", () => {
  it("returns score, hints, adapter=mock, and notes", async () => {
    const result = await runSentinelReSimulation(proposal, {
      feeBps: 5,
      realizedSlippageBps: 18,
      toleranceBps: 80,
      poolDepth: "deep"
    });
    expect(result.adapter).toBe("mock");
    expect(result.score).toBe(92);
    expect(result.passed).toBe(true);
    expect(result.passThreshold).toBe(60);
    expect(result.notes[0]).toMatch(/mock mode/);
    expect(result.hints.realizedSlippageBps).toBe(18);
  });

  it("includes evidenceURI when evidenceBaseURI is provided", async () => {
    const result = await runSentinelReSimulation(
      proposal,
      { feeBps: 5, realizedSlippageBps: 18, toleranceBps: 80, poolDepth: "deep" },
      { evidenceBaseURI: "https://example.com" }
    );
    expect(result.evidenceURI).toBe("https://example.com/sentinel/test.json");
  });

  it("falls back to deterministic math when byreal-cli is missing in real mode", async () => {
    const result = await runSentinelReSimulation(
      proposal,
      { feeBps: 5, realizedSlippageBps: 18, toleranceBps: 80, poolDepth: "deep" },
      { mode: "real", binary: "/nonexistent/byreal-cli" }
    );
    expect(result.adapter).toBe("mock");
    expect(result.score).toBe(92);
    expect(result.notes[0]).toMatch(/byreal-cli unavailable/);
  });
});
