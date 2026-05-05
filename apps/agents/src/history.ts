/**
 * Read / append the cycle history persisted at apps/web/public/demo-history.json.
 * Capped to MAX_CYCLES so the dashboard can render the strip without paging.
 */

import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { CycleSummary, DemoHistory, DemoRun } from "@clawdao/core";

const MAX_CYCLES = 20;
const EMPTY: DemoHistory = { cycles: [], cumulativeReputation: {}, lastCycle: 0 };

export function loadHistory(historyPath: string): DemoHistory {
  if (!existsSync(historyPath)) return { ...EMPTY };
  try {
    const parsed = JSON.parse(readFileSync(historyPath, "utf8")) as DemoHistory;
    return {
      cycles: Array.isArray(parsed.cycles) ? parsed.cycles : [],
      cumulativeReputation: parsed.cumulativeReputation ?? {},
      lastCycle: typeof parsed.lastCycle === "number" ? parsed.lastCycle : 0
    };
  } catch {
    return { ...EMPTY };
  }
}

function summaryFor(run: DemoRun): CycleSummary {
  return {
    cycle: run.cycle,
    runId: run.runId,
    scenarioId: run.scenarioId,
    generatedAt: run.generatedAt,
    proposalTitle: run.proposal.title,
    amountUsd: run.proposal.amountUsd,
    approved: run.verdict.approved,
    executionStatus: run.execution.status,
    validationPassed: run.validation.passed,
    validationResponse: run.validation.response
  };
}

export async function appendCycle(historyPath: string, run: DemoRun): Promise<DemoHistory> {
  const current = loadHistory(historyPath);
  const cumulative = { ...current.cumulativeReputation };
  for (const event of run.reputation) {
    cumulative[event.agent] = (cumulative[event.agent] ?? 0) + event.value;
  }
  const cycles = [summaryFor(run), ...current.cycles].slice(0, MAX_CYCLES);
  const next: DemoHistory = {
    cycles,
    cumulativeReputation: cumulative,
    lastCycle: run.cycle
  };
  await mkdir(dirname(historyPath), { recursive: true });
  await writeFile(historyPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return next;
}
