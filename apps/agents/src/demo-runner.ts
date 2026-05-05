/**
 * Deterministic multi-agent demo runner.
 *
 * Inputs (env):
 *   AGENT_MNEMONIC | SCOUT/GUARD/CLAW/LEDGER/SENTINEL_PRIVATE_KEY  -> agent wallets
 *   EXECUTOR=mock|byreal|mantle-sepolia|auto                       -> execution adapter
 *   TREASURY_ADDRESS                                               -> required for mantle-sepolia
 *   MANTLE_SEPOLIA_RPC_URL                                         -> required for mantle-sepolia
 *   DEMO_SEED                                                      -> deterministic scenario picker
 *   FORCE_SCENARIO=<id>                                            -> override scenario by id
 *
 * Outputs:
 *   apps/web/public/demo-run.json        (latest cycle, full DemoRun)
 *   apps/web/public/demo-history.json    (last 20 cycle summaries + cumulative reputation)
 *   apps/web/public/agents/<slug>.json   (ERC-8004 registration files)
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { encodeFunctionData, keccak256, toBytes } from "viem";
import {
  buildRegistrationFile,
  defaultAgents,
  defaultPolicy,
  erc8004ReputationAbi,
  type AgentIdentity,
  type DemoRun,
  type ExecutionResult,
  type ReSimResult,
  type ReputationEvent,
  type RiskVerdict,
  type ValidationOutcome
} from "@clawdao/core";
import {
  loadProjectEnv,
  loadAgentWallets,
  loadAgentIds,
  selectExecutor,
  buildValidationOutcome,
  noOpValidation,
  skippedValidation,
  runSentinelReSimulation,
  type AgentSlug,
  type AgentWallet,
  type ExecutorChoice
} from "@clawdao/core/node";
import { pickScenario, scenarioById, type Scenario } from "./scenarios.js";
import { appendCycle, loadHistory } from "./history.js";

const outputPath = resolve(process.cwd(), "../web/public/demo-run.json");
const historyPath = resolve(process.cwd(), "../web/public/demo-history.json");
const agentOutputDir = resolve(process.cwd(), "../web/public/agents");
const agentIdsPath = resolve(process.cwd(), "../web/public/agent-ids.json");

function now(): string {
  return new Date().toISOString();
}

function evaluateRisk(scenario: Scenario): RiskVerdict {
  if (scenario.forceVerdict) return scenario.forceVerdict(defaultPolicy);
  const proposal = scenario.proposal;
  const checks = [
    {
      label: "Policy action",
      passed: defaultPolicy.allowedActions.includes(proposal.action),
      detail: `${proposal.action} is in the approved action list.`
    },
    {
      label: "Trade cap",
      passed: proposal.amountUsd <= defaultPolicy.maxTradeUsd,
      detail: `$${proposal.amountUsd} is below the $${defaultPolicy.maxTradeUsd} cap.`
    },
    {
      label: "Drawdown guard",
      passed: defaultPolicy.maxDrawdownBps <= 300,
      detail: `${defaultPolicy.maxDrawdownBps} bps policy cap is within demo limits.`
    },
    {
      label: "Risk approval required",
      passed: defaultPolicy.requiresRiskApproval,
      detail: defaultPolicy.requiresRiskApproval
        ? "Treasury policy mandates a Guard signature before execution."
        : "Risk approval flag is off; executor would proceed unilaterally."
    }
  ];
  const approved = checks.every((c) => c.passed);
  return {
    approved,
    score: approved ? 92 : 41,
    reason: approved
      ? "Guard approved: action is small, policy-compliant, and reversible."
      : "Guard blocked the action because at least one treasury policy failed.",
    checks
  };
}

function policyHashFor(verdict: RiskVerdict): `0x${string}` {
  return keccak256(toBytes(JSON.stringify(verdict.checks)));
}

function slugForAgent(agent: AgentIdentity): AgentSlug {
  if (agent.role === "researcher") return "researcher";
  if (agent.role === "risk") return "risk";
  if (agent.role === "executor") return "executor";
  if (agent.role === "validator") return "validator";
  return "auditor";
}

function buildIdentities(
  realIds: Record<AgentSlug, number>,
  addresses: Record<AgentSlug, `0x${string}`>,
  verdict: RiskVerdict,
  execution: ExecutionResult,
  validation: ValidationOutcome
): AgentIdentity[] {
  return defaultAgents.map((agent) => {
    const slug = slugForAgent(agent);
    let status = agent.status;
    if (slug === "risk") status = verdict.approved ? "approved" : "blocked";
    if (slug === "executor") {
      status = execution.status === "skipped" ? "blocked" : "executed";
    }
    if (slug === "validator") {
      if (execution.status === "skipped") status = "idle";
      else status = validation.passed ? "validated" : "rejected";
    }
    if (slug === "auditor") status = "scored";
    return {
      ...agent,
      agentId: realIds[slug],
      wallet: addresses[slug],
      status
    };
  });
}

function scoreAgents(
  identities: AgentIdentity[],
  verdict: RiskVerdict,
  execution: ExecutionResult,
  validation: ValidationOutcome
): ReputationEvent[] {
  const bySlug = new Map<AgentSlug, AgentIdentity>(
    identities.map((agent) => [slugForAgent(agent), agent])
  );

  const validatorAffirmed = validation.passed && execution.status !== "skipped";

  const events: ReputationEvent[] = [
    {
      agent: bySlug.get("researcher")?.name ?? "Scout",
      agentId: bySlug.get("researcher")?.agentId,
      tag: "proposalQuality",
      value: verdict.approved ? 86 : 55,
      reason: "Proposal included bounded size, target asset, and clear rationale."
    },
    {
      agent: bySlug.get("risk")?.name ?? "Guard",
      agentId: bySlug.get("risk")?.agentId,
      tag: "riskDiscipline",
      value: verdict.score,
      reason: "Risk review checked action allowlist, notional cap, and drawdown policy."
    },
    {
      agent: bySlug.get("executor")?.name ?? "Claw",
      agentId: bySlug.get("executor")?.agentId,
      tag: "executionReliability",
      value:
        execution.status === "submitted"
          ? validatorAffirmed
            ? 95
            : 70
          : execution.status === "simulated"
            ? validatorAffirmed
              ? 86
              : 60
            : 45,
      reason:
        execution.status === "skipped"
          ? "Execution skipped after risk rejection."
          : validatorAffirmed
            ? "Execution validated by Sentinel and produced a verifiable on-chain artifact."
            : "Execution completed but Sentinel flagged the result; reputation penalised."
    },
    {
      agent: bySlug.get("auditor")?.name ?? "Ledger",
      agentId: bySlug.get("auditor")?.agentId,
      tag: "auditCompleteness",
      value: 90,
      reason: "Auditor produced ReputationRegistry feedback and a ValidationRegistry request."
    },
    {
      agent: bySlug.get("validator")?.name ?? "Sentinel",
      agentId: bySlug.get("validator")?.agentId,
      tag: "validationIntegrity",
      value:
        execution.status === "skipped"
          ? 70
          : validatorAffirmed
            ? 90
            : 78,
      reason:
        execution.status === "skipped"
          ? "No execution to validate; Sentinel recorded a clean no-op."
          : validatorAffirmed
            ? "Sentinel ran an independent re-simulation and confirmed Claw's output."
            : "Sentinel detected a slippage breach and rejected the validation."
    }
  ];

  return events.map((event) => ({
    ...event,
    calldata: encodeFunctionData({
      abi: erc8004ReputationAbi,
      functionName: "giveFeedback",
      args: [
        BigInt(event.agentId ?? 0),
        BigInt(event.value),
        0,
        event.tag,
        "demo-cycle",
        "http://localhost:5175/",
        "",
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      ]
    })
  }));
}

async function buildValidation(
  scenario: Scenario,
  validatorWallet: AgentWallet | undefined,
  requesterWallet: AgentWallet | undefined,
  execution: ExecutionResult,
  subjectAgentId: number | undefined
): Promise<ValidationOutcome> {
  if (scenario.proposal.action === "hold") {
    return noOpValidation(scenario.validatorSummary);
  }
  if (execution.status === "skipped") {
    return skippedValidation(execution.summary);
  }
  if (!validatorWallet || !requesterWallet || !subjectAgentId) {
    return skippedValidation("validator wallet, requester wallet, or subject agent missing.");
  }

  // Sentinel re-simulates and computes the score from scenario hints. The
  // adapter shells out to byreal-cli when BYREAL_MODE=real.
  let score = scenario.validatorScore;
  let summary = scenario.validatorSummary;
  let reSimulation: ReSimResult | undefined;
  if (scenario.reSimHints) {
    reSimulation = await runSentinelReSimulation(scenario.proposal, scenario.reSimHints);
    score = reSimulation.score;
    const adapterTag = reSimulation.adapter === "byreal-cli" ? "byreal-cli" : "deterministic math";
    const verdictWord = reSimulation.passed ? "passed" : "rejected";
    summary = `Sentinel ${adapterTag} re-simulation: realized ${reSimulation.hints.realizedSlippageBps} bps slippage vs ${reSimulation.hints.toleranceBps} bps tolerance on a ${reSimulation.hints.poolDepth} pool; score ${reSimulation.score}/100 (${verdictWord}).`;
  }

  return buildValidationOutcome({
    subjectAgentId,
    validatorWallet,
    requesterWallet,
    payload: {
      scenarioId: scenario.id,
      proposalId: scenario.proposal.id,
      execution,
      reSimulation
    },
    tag: "execution-validity",
    requestURI: "",
    responseURI: "",
    response: score,
    summary,
    reSimulation
  });
}

async function main(): Promise<void> {
  loadProjectEnv();
  const generatedAt = now();
  const wallets = loadAgentWallets({ allowEphemeral: true });
  const addresses = Object.fromEntries(
    wallets.map((w) => [w.slug, w.address] as const)
  ) as Record<AgentSlug, `0x${string}`>;
  const ids = loadAgentIds(agentIdsPath);

  // Decide cycle number using persisted history.
  const history = loadHistory(historyPath);
  const cycle = history.lastCycle + 1;

  // Pick scenario.
  const forced = process.env.FORCE_SCENARIO;
  const scenario = forced && scenarioById(forced)
    ? scenarioById(forced)!
    : pickScenario(process.env.DEMO_SEED ?? `cycle-${cycle}`);

  const verdict = evaluateRisk(scenario);
  const policyHash = policyHashFor(verdict);

  const executorWallet = wallets.find((w) => w.slug === "executor");
  const riskWallet = wallets.find((w) => w.slug === "risk");
  const auditorWallet = wallets.find((w) => w.slug === "auditor");
  const validatorWallet = wallets.find((w) => w.slug === "validator");

  const choice = (process.env.EXECUTOR ?? "auto") as ExecutorChoice;
  const adapter = selectExecutor(choice, {
    riskWallet,
    treasuryAddress: process.env.TREASURY_ADDRESS as `0x${string}` | undefined
  });

  const execution = await adapter.execute({
    proposal: scenario.proposal,
    verdict,
    policyHash,
    executorWallet,
    proofSeed: process.env.DEMO_SEED ?? `cycle-${cycle}`
  });

  const validation = await buildValidation(
    scenario,
    validatorWallet,
    auditorWallet,
    execution,
    ids.ids.executor
  );

  const identities = buildIdentities(ids.ids, addresses, verdict, execution, validation);

  const reputation = scoreAgents(identities, verdict, execution, validation);
  const registrationFiles = identities.map((agent) =>
    buildRegistrationFile(agent, { webEndpoint: "http://localhost:5175/" })
  );

  const run: DemoRun = {
    runId: `run-${Date.now()}`,
    cycle,
    scenarioId: scenario.id,
    generatedAt,
    network: {
      name: "Mantle Sepolia",
      chainId: 5003,
      explorer: "https://sepolia.mantlescan.xyz"
    },
    identities,
    policy: defaultPolicy,
    proposal: scenario.proposal,
    verdict,
    execution,
    validation,
    reputation,
    registrationFiles,
    timeline: [
      {
        actor: identities[0].name,
        label: "Proposal",
        detail: scenario.proposal.rationale,
        timestamp: generatedAt
      },
      {
        actor: identities[1].name,
        label: verdict.approved ? "Approved" : "Blocked",
        detail: verdict.reason,
        timestamp: now()
      },
      {
        actor: identities[2].name,
        label: "Execution",
        detail: execution.summary,
        timestamp: now()
      },
      {
        actor: identities[4].name,
        label: validation.passed ? "Validation passed" : "Validation outcome",
        detail: validation.summary,
        timestamp: now()
      },
      {
        actor: identities[3].name,
        label: "Reputation",
        detail: "Structured feedback ready for ERC-8004 ReputationRegistry.",
        timestamp: now()
      }
    ]
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await mkdir(agentOutputDir, { recursive: true });
  await Promise.all(
    identities.map((agent, index) =>
      writeFile(
        resolve(agentOutputDir, `${agent.id}.json`),
        `${JSON.stringify(registrationFiles[index], null, 2)}\n`,
        "utf8"
      )
    )
  );
  await writeFile(outputPath, `${JSON.stringify(run, null, 2)}\n`, "utf8");
  await appendCycle(historyPath, run);

  // eslint-disable-next-line no-console
  console.log(`[demo] cycle=${cycle} scenario=${scenario.id} adapter=${adapter.name} status=${execution.status} validation=${validation.response}/100 (${validation.passed ? "passed" : "rejected"}) agentIdSource=${ids.source}`);
  // eslint-disable-next-line no-console
  console.log(`[demo] -> ${verdict.approved ? "approved" : "blocked"} -> exec=${execution.status} -> validate=${validation.passed ? "ok" : "fail"}`);
  // eslint-disable-next-line no-console
  console.log(`[demo] artifacts at ${outputPath} & ${historyPath}`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
