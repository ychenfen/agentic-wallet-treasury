/**
 * Byreal Skills CLI execution adapter.
 *
 * Today (2026-05) the public byreal-cli targets Solana CLMM. The Mantle build
 * referenced by the hackathon is expected to ship under the same command shape
 * so this adapter is a thin wrapper around `byreal-cli` with a deterministic
 * mock fallback.
 *
 * Modes:
 *   BYREAL_MODE=real    invoke `byreal-cli ...` via child_process.spawn
 *   BYREAL_MODE=mock    return canned JSON (default)
 *
 * The summary string in the returned ExecutionResult deliberately surfaces the
 * exact CLI invocation so judges can copy/paste it after the demo.
 */

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import type { ExecutionAdapter, ExecutionContext } from "./types.js";
import type { ExecutionResult } from "../index.js";

export interface ByrealAdapterOptions {
  /** Override BYREAL_MODE for tests. */
  mode?: "real" | "mock";
  /** Path to byreal-cli binary. Defaults to PATH lookup. */
  binary?: string;
  /** Extra args appended to every command, e.g. ["-o","json"]. */
  extraArgs?: string[];
  /** When mode=real, ms to wait before timing out. */
  timeoutMs?: number;
}

function proofHash(input: unknown): `0x${string}` {
  return `0x${createHash("sha256").update(JSON.stringify(input)).digest("hex")}`;
}

function chooseMode(opts: ByrealAdapterOptions): "real" | "mock" {
  if (opts.mode) return opts.mode;
  const env = process.env.BYREAL_MODE;
  return env === "real" ? "real" : "mock";
}

export interface ByrealRunResult {
  command: string[];
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Execute a raw byreal-cli command. Resolves with stdout regardless of exit
 * code so callers can decide how to react. The promise only rejects if the
 * binary is missing or spawn fails.
 */
export function runByrealCli(
  args: string[],
  opts: ByrealAdapterOptions = {}
): Promise<ByrealRunResult> {
  return new Promise((resolveRun, rejectRun) => {
    const binary = opts.binary ?? "byreal-cli";
    const extra = opts.extraArgs ?? ["-o", "json"];
    const child = spawn(binary, [...args, ...extra], {
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";
    let timer: NodeJS.Timeout | undefined;

    if (opts.timeoutMs) {
      timer = setTimeout(() => {
        child.kill("SIGKILL");
        rejectRun(new Error(`byreal-cli timed out after ${opts.timeoutMs}ms`));
      }, opts.timeoutMs);
    }

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      if (timer) clearTimeout(timer);
      rejectRun(error);
    });
    child.on("close", (code) => {
      if (timer) clearTimeout(timer);
      resolveRun({
        command: [binary, ...args, ...extra],
        stdout,
        stderr,
        exitCode: code ?? -1
      });
    });
  });
}

function buildCommand(context: ExecutionContext): string[] {
  const { proposal } = context;
  switch (proposal.action) {
    case "test-swap":
    case "rebalance":
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
    case "hold":
    default:
      return ["overview"];
  }
}

export function createByrealAdapter(opts: ByrealAdapterOptions = {}): ExecutionAdapter {
  const mode = chooseMode(opts);

  return {
    name: "byreal",
    async execute(context: ExecutionContext): Promise<ExecutionResult> {
      const { proposal, verdict, policyHash } = context;
      const command = buildCommand(context);

      if (proposal.action === "hold") {
        return {
          adapter: "byreal",
          status: "skipped",
          proofHash: proofHash({ proposal, verdict, hold: true, policyHash, command }),
          summary: "byreal-cli hold cycle recorded. No swap command was submitted."
        };
      }

      if (!verdict.approved) {
        return {
          adapter: "byreal",
          status: "skipped",
          proofHash: proofHash({ proposal, verdict, skipped: true, policyHash, command }),
          summary: `byreal-cli skipped (risk blocked). Pending command: byreal-cli ${command.join(" ")}`
        };
      }

      if (mode === "mock") {
        const simulatedTx = proofHash({
          action: proposal.action,
          amountUsd: proposal.amountUsd,
          command,
          mode: "byreal-mock"
        });
        return {
          adapter: "byreal",
          status: "simulated",
          txHash: simulatedTx,
          explorerUrl: `https://sepolia.mantlescan.xyz/tx/${simulatedTx}`,
          proofHash: proofHash({ proposal, verdict, simulatedTx, policyHash, command }),
          summary: `byreal-cli mock executed: ${["byreal-cli", ...command].join(" ")}`
        };
      }

      try {
        const run = await runByrealCli(command, opts);
        const successful = run.exitCode === 0;
        const txMarker = proofHash({ stdout: run.stdout, command, runOk: successful });
        return {
          adapter: "byreal",
          status: successful ? "submitted" : "skipped",
          txHash: txMarker,
          explorerUrl: undefined,
          proofHash: proofHash({ proposal, verdict, run, policyHash }),
          summary: successful
            ? `byreal-cli completed: ${run.command.join(" ")}`
            : `byreal-cli failed (exit ${run.exitCode}): ${run.stderr.trim() || "no stderr"}`
        };
      } catch (error) {
        return {
          adapter: "byreal",
          status: "skipped",
          proofHash: proofHash({ proposal, verdict, error: String(error), policyHash }),
          summary: `byreal-cli unavailable (${(error as Error).message}). Falling back to mock-equivalent state.`
        };
      }
    }
  };
}
