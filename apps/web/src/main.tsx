import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  BadgeCheck,
  CircleCheck,
  CircleDollarSign,
  ExternalLink,
  Eye,
  Fingerprint,
  Gauge,
  Layers,
  ListChecks,
  Radio,
  ShieldCheck,
  Sparkles,
  WalletCards
} from "lucide-react";
import {
  buildRegistrationFile,
  defaultAgents,
  defaultPolicy,
  type AgentIdentity,
  type ByrealProbeSummary,
  type CycleSummary,
  type DemoHistory,
  type DemoRun,
  type ValidationOutcome
} from "@clawdao/core";
import "./styles.css";

function publicAsset(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
}

const SKIPPED_VALIDATION: ValidationOutcome = {
  requestURI: "",
  requestHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
  response: 0,
  tag: "fallback",
  responseURI: "",
  responseHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
  summary: "Sentinel waiting for the next cycle.",
  passed: false
};

const FALLBACK_HISTORY: DemoHistory = {
  cycles: [],
  cumulativeReputation: {},
  lastCycle: 0
};

const FALLBACK_RUN: DemoRun = {
  runId: "fallback-preview",
  cycle: 0,
  scenarioId: "small-stable-rotation",
  generatedAt: new Date().toISOString(),
  network: {
    name: "Mantle Sepolia",
    chainId: 5003,
    explorer: "https://sepolia.mantlescan.xyz"
  },
  identities: defaultAgents,
  policy: defaultPolicy,
  proposal: {
    id: "proposal-preview",
    title: "Move a small treasury slice into a lower-risk Mantle yield action",
    action: "test-swap",
    assetIn: "MNT",
    assetOut: "USDe",
    amountUsd: 125,
    rationale: "Scout proposes a capped test action before any larger treasury rebalance.",
    confidence: 0.74
  },
  verdict: {
    approved: true,
    score: 92,
    reason: "Guard approved the action because it is small, policy-compliant, and reversible.",
    checks: [
      { label: "Policy action", passed: true, detail: "test-swap is allowed." },
      { label: "Trade cap", passed: true, detail: "$125 is below the $500 cap." },
      { label: "Drawdown guard", passed: true, detail: "250 bps is within demo limits." },
      { label: "Risk approval required", passed: true, detail: "Guard signature mandated." }
    ]
  },
  execution: {
    adapter: "mock",
    status: "simulated",
    txHash: "0x8b2f5d4e8f4be2f6e7a0f260d9e33849d87f7a7ef58a2a7b67c1731435d9af11",
    explorerUrl:
      "https://sepolia.mantlescan.xyz/tx/0x8b2f5d4e8f4be2f6e7a0f260d9e33849d87f7a7ef58a2a7b67c1731435d9af11",
    proofHash: "0x2e26759fb45f5b5ef9c91af07623a535f4e41f3be268af0f8195596bd62aa804",
    summary: "Claw executed the approved wallet action in mock mode."
  },
  validation: SKIPPED_VALIDATION,
  registrationFiles: defaultAgents.map((agent) => buildRegistrationFile(agent)),
  reputation: [
    { agent: "Scout", agentId: 8101, tag: "proposalQuality", value: 86, reason: "Bounded and explainable proposal." },
    { agent: "Guard", agentId: 8102, tag: "riskDiscipline", value: 92, reason: "Policy checks passed." },
    { agent: "Claw", agentId: 8103, tag: "executionReliability", value: 80, reason: "Deterministic proof generated." },
    { agent: "Ledger", agentId: 8104, tag: "auditCompleteness", value: 90, reason: "Feedback prepared for registry." },
    { agent: "Sentinel", agentId: 8105, tag: "validationIntegrity", value: 88, reason: "Independent re-simulation matched." }
  ],
  timeline: [
    { actor: "Scout", label: "Proposal", detail: "Scout proposes a capped test action.", timestamp: new Date().toISOString() },
    { actor: "Guard", label: "Approved", detail: "Risk policy passed.", timestamp: new Date().toISOString() },
    { actor: "Claw", label: "Execution", detail: "Execution artifact generated.", timestamp: new Date().toISOString() },
    { actor: "Sentinel", label: "Validation", detail: "Validator confirmation pending.", timestamp: new Date().toISOString() },
    { actor: "Ledger", label: "Reputation", detail: "Structured scores prepared.", timestamp: new Date().toISOString() }
  ]
};

interface LiveChainSnapshot {
  generatedAt: string;
  network: { name: string; chainId: number; explorer: string };
  agents: Array<{
    slug: string;
    agentId: number;
    address: `0x${string}`;
    tokenURI: string;
    feedbackCount: number;
    summaryValue: number;
    summaryDecimals: number;
    validationCount: number;
    validationAvg: number;
  }>;
}

interface ChainEvent {
  source: "identity" | "reputation" | "validation" | "treasury" | "paymaster";
  name: string;
  blockNumber: number;
  txHash: `0x${string}`;
  logIndex: number;
  observedAt: string;
  agentId?: number;
  agentName?: string;
  args: Record<string, string | number | boolean>;
  explorerUrl: string;
}

interface EventsFile {
  generatedAt: string;
  network: { name: string; chainId: number; explorer: string };
  events: ChainEvent[];
}

interface PreflightCheck {
  level: "pass" | "warn" | "fail";
  label: string;
  detail: string;
}

interface PreflightFile {
  generatedAt: string;
  summary: { pass: number; warn: number; fail: number };
  checks: PreflightCheck[];
}

function shortHash(value?: string): string {
  if (!value) return "pending";
  if (value.length <= 16) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function roleIcon(role: AgentIdentity["role"]) {
  if (role === "researcher") return <Sparkles size={18} />;
  if (role === "risk") return <ShieldCheck size={18} />;
  if (role === "executor") return <WalletCards size={18} />;
  if (role === "validator") return <Eye size={18} />;
  return <BadgeCheck size={18} />;
}

function AgentCard({
  agent,
  cumulativeRep
}: {
  agent: AgentIdentity;
  cumulativeRep?: number;
}) {
  return (
    <article className="agent-card">
      <div className="agent-topline">
        <span className={`role-mark ${agent.role}`}>{roleIcon(agent.role)}</span>
        <span className="status">{agent.status}</span>
      </div>
      <h3>{agent.name}</h3>
      <p>{agent.tagline}</p>
      <div className="agent-meta">
        <span>agentId #{agent.agentId ?? "pending"}</span>
        <span>{agent.reputation}/100 base</span>
        {cumulativeRep !== undefined && <span>{cumulativeRep} total</span>}
      </div>
    </article>
  );
}

function CycleHistoryStrip({ cycles }: { cycles: CycleSummary[] }) {
  if (cycles.length === 0) {
    return (
      <div className="cycle-empty">
        Run <code>npm run demo</code> a few times to populate the cycle history strip.
      </div>
    );
  }
  return (
    <div className="cycle-strip">
      {cycles.map((c) => {
        const tone = !c.approved
          ? "blocked"
          : c.executionStatus === "skipped"
            ? "skipped"
            : c.validationPassed
              ? "ok"
              : "rejected";
        return (
          <div className={`cycle-pill ${tone}`} key={c.runId}>
            <div className="cycle-num">#{c.cycle}</div>
            <div className="cycle-title">{c.proposalTitle}</div>
            <div className="cycle-meta">
              {c.approved ? "approved" : "blocked"} · exec {c.executionStatus} · valid {c.validationResponse}/100
            </div>
          </div>
        );
      })}
    </div>
  );
}

function summarizeEventArgs(event: ChainEvent): string {
  const a = event.args;
  if (event.name === "Registered") return `agent #${a.agentId} owner=${shortHash(a.owner as string)}`;
  if (event.name === "URIUpdated") return `agent #${a.agentId} updated by ${shortHash(a.updatedBy as string)}`;
  if (event.name === "NewFeedback") return `${a.tag1} = ${a.value} from ${shortHash(a.clientAddress as string)}`;
  if (event.name === "ValidationRequest") return `validator=${shortHash(a.validatorAddress as string)} req=${shortHash(a.requestHash as string)}`;
  if (event.name === "ValidationResponse") return `${a.tag} response=${a.response}/100`;
  if (event.name === "TreasuryActionExecuted") return `target=${shortHash(a.target as string)} value=${a.value}`;
  if (event.name === "Deposited") return `fee=${formatMnt(a.amountWei as string)} MNT req=${shortHash(a.requestHash as string)}`;
  if (event.name === "Withdrawn") return `validator=${shortHash(a.validator as string)} amount=${formatMnt(a.amountWei as string)} MNT`;
  return Object.entries(a).slice(0, 2).map(([k, v]) => `${k}=${typeof v === "string" && v.length > 20 ? shortHash(v) : v}`).join(" · ");
}

function eventTone(event: ChainEvent): string {
  if (event.source === "identity") return "ev-identity";
  if (event.source === "reputation") return "ev-reputation";
  if (event.source === "validation") return "ev-validation";
  if (event.source === "paymaster") return "ev-paymaster";
  return "ev-treasury";
}

function EventLogPanel({ events }: { events: ChainEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="event-panel idle">
        <div className="section-heading">
          <Radio size={18} />
          <h2>Event Log</h2>
        </div>
        <p>
          Run <code>npm run watch-events</code> (or <code>npm run live-demo -- --watch</code>) to backfill
          recent ERC-8004 + AgenticTreasury events from Mantle Sepolia. The dashboard reads{" "}
          <code>/events.json</code> on each load.
        </p>
      </div>
    );
  }
  return (
    <div className="event-panel">
      <div className="section-heading">
        <Radio size={18} />
        <h2>Event Log</h2>
        <span className="cycle-tip">Last {events.length} events · auto-refresh on page reload</span>
      </div>
      <div className="event-rows">
        {events.slice(0, 20).map((e) => (
          <div className={`event-row ${eventTone(e)}`} key={`${e.txHash}-${e.logIndex}`}>
            <div className="event-source">{e.source}</div>
            <div className="event-content">
              <strong>{e.name}</strong>
              <span>
                {e.agentName ? `${e.agentName} ` : ""}
                {e.agentId ? `#${e.agentId} · ` : ""}
                {summarizeEventArgs(e)}
              </span>
            </div>
            <a className="event-tx" href={e.explorerUrl} target="_blank" rel="noreferrer">
              block {e.blockNumber} ↗
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChainPanel({ snapshot }: { snapshot?: LiveChainSnapshot }) {
  if (!snapshot) {
    return (
      <div className="chain-panel idle">
        <div className="section-heading">
          <Layers size={18} />
          <h2>Live Chain</h2>
        </div>
        <p>
          Run <code>npm run register</code> + <code>npm run feedback</code> + <code>npm run poll-chain</code> to
          stream Mantle Sepolia state into this panel. The dashboard is reading{" "}
          <code>/live-chain.json</code> on each load.
        </p>
      </div>
    );
  }
  return (
    <div className="chain-panel">
      <div className="section-heading">
        <Layers size={18} />
        <h2>Live Chain — {snapshot.network.name}</h2>
      </div>
      <div className="chain-rows">
        {snapshot.agents.map((agent) => (
          <div className="chain-row" key={agent.slug}>
            <div>
              <strong>#{agent.agentId} {agent.slug}</strong>
              <span>
                <a
                  href={`${snapshot.network.explorer}/address/${agent.address}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {shortHash(agent.address)}
                </a>
              </span>
            </div>
            <div className="chain-stat">
              <strong>{agent.feedbackCount}</strong>
              <span>feedback</span>
            </div>
            <div className="chain-stat">
              <strong>{agent.validationCount}</strong>
              <span>validations</span>
            </div>
            <div className="chain-stat">
              <strong>{agent.validationAvg}</strong>
              <span>avg</span>
            </div>
          </div>
        ))}
      </div>
      <div className="chain-footnote">Last refreshed {new Date(snapshot.generatedAt).toLocaleString()}</div>
    </div>
  );
}

function formatMnt(weiStr?: string): string {
  if (!weiStr) return "0.000000";
  try {
    const wei = BigInt(weiStr);
    // 18 decimals → keep 6 visible.
    const whole = wei / 1_000_000_000_000_000_000n;
    const frac = wei % 1_000_000_000_000_000_000n;
    const fracStr = (frac + 1_000_000_000_000_000_000n).toString().slice(1, 7);
    return `${whole.toString()}.${fracStr}`;
  } catch {
    return "0.000000";
  }
}

function formatUsd(value?: number): string {
  if (value === undefined || !Number.isFinite(value)) return "n/a";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function totalEarningsWei(history: DemoHistory): bigint {
  const map = history.cumulativeEarningsWei ?? {};
  let sum = 0n;
  for (const v of Object.values(map)) {
    try {
      sum += BigInt(v);
    } catch {
      /* skip malformed */
    }
  }
  return sum;
}

function ByrealProbePanel({ probe }: { probe?: ByrealProbeSummary }) {
  if (!probe) {
    return (
      <div className="byreal-panel idle">
        <div className="section-heading">
          <Gauge size={18} />
          <h2>Byreal Skills Probe</h2>
        </div>
        <p>
          Run <code>npm run byreal-probe</code> to capture the real Byreal RealClaw CLI capability catalog,
          DEX overview, pool list, and pool analysis used by Scout and Sentinel.
        </p>
      </div>
    );
  }

  const overview = probe.dexOverview;
  return (
    <div className="byreal-panel">
      <div className="section-heading">
        <Gauge size={18} />
        <h2>Byreal Skills Probe</h2>
        <span className="cycle-tip">
          CLI v{probe.cliVersion} · {probe.capabilityCount} capabilities · {new Date(probe.generatedAt).toLocaleString()}
        </span>
      </div>
      <div className="byreal-summary">
        <div>
          <span>DEX TVL</span>
          <strong>{formatUsd(overview?.tvl)}</strong>
        </div>
        <div>
          <span>24h volume</span>
          <strong>{formatUsd(overview?.volume24hUsd)}</strong>
        </div>
        <div>
          <span>24h fees</span>
          <strong>{formatUsd(overview?.fee24hUsd)}</strong>
        </div>
        <div>
          <span>Pools</span>
          <strong>{overview?.poolsCount ?? "n/a"}</strong>
        </div>
      </div>
      <p className="byreal-note">{probe.note}</p>
      <div className="byreal-pools">
        {probe.topPools.slice(0, 5).map((pool) => (
          <div className="byreal-pool" key={pool.id}>
            <strong>{pool.pair}</strong>
            <span>{formatUsd(pool.tvlUsd)} TVL</span>
            <span>{pool.totalApr?.toFixed(2) ?? "n/a"}% APR</span>
          </div>
        ))}
      </div>
      {probe.analysis && (
        <div className="byreal-analysis">
          <strong>Top pool analysis: {probe.analysis.pair ?? shortHash(probe.analysis.poolId)}</strong>
          <span>{probe.analysis.rangeCount} ranges tested</span>
          <span>{probe.analysis.riskSummary.join(" · ")}</span>
        </div>
      )}
      <div className="byreal-commands">
        {probe.commands.map((command) => (
          <div className="byreal-command" key={command.label}>
            <strong>{command.label}</strong>
            <code>{command.command.join(" ")}</code>
            <span>{command.summary}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatHero({
  history,
  run
}: {
  history: DemoHistory;
  run: DemoRun;
}) {
  const totalCycles = history.cycles.length || 1;
  const passed = history.cycles.filter((c) => c.validationPassed).length;
  const blocked = history.cycles.filter((c) => !c.approved).length;
  const cumulativeRep = Object.values(history.cumulativeReputation).reduce(
    (a, b) => a + b,
    0
  );
  const totalEarned = totalEarningsWei(history);
  const tone = run.validation.passed ? "ok" : "rejected";
  return (
    <div className="stat-hero">
      <div className="stat-tile">
        <span>Cycles</span>
        <strong>{totalCycles}</strong>
        <em>{run.cycle ? `latest #${run.cycle}` : "preview"}</em>
      </div>
      <div className="stat-tile pass">
        <span>Validated</span>
        <strong>{passed}</strong>
        <em>passed Sentinel re-sim</em>
      </div>
      <div className="stat-tile blocked">
        <span>Blocked / failed</span>
        <strong>{blocked}</strong>
        <em>by Guard or Sentinel</em>
      </div>
      <div className="stat-tile">
        <span>Cumulative reputation</span>
        <strong>{cumulativeRep}</strong>
        <em>{Object.keys(history.cumulativeReputation).length} agents</em>
      </div>
      <div className="stat-tile pass">
        <span>Validator earnings</span>
        <strong>{formatMnt(totalEarned.toString())}</strong>
        <em>MNT paid via x402 escrow</em>
      </div>
      <div className={`stat-tile ${tone}`}>
        <span>Latest validation</span>
        <strong>{run.validation.response}/100</strong>
        <em>{run.scenarioId}</em>
      </div>
    </div>
  );
}

function AgentEarningsPanel({ history }: { history: DemoHistory }) {
  const map = history.cumulativeEarningsWei ?? {};
  const entries = Object.entries(map).sort((a, b) => {
    try {
      return BigInt(b[1]) > BigInt(a[1]) ? 1 : -1;
    } catch {
      return 0;
    }
  });
  if (entries.length === 0) {
    return (
      <div className="earnings-panel idle">
        <div className="section-heading">
          <CircleDollarSign size={18} />
          <h2>Agent Earnings (x402)</h2>
        </div>
        <p>
          Each Sentinel validation requires a fee from Claw, escrowed via the
          on-chain <code>ValidatorPaymaster</code>. Once a few cycles run,
          earnings accumulate here.
        </p>
      </div>
    );
  }
  return (
    <div className="earnings-panel">
      <div className="section-heading">
        <CircleDollarSign size={18} />
        <h2>Agent Earnings (x402)</h2>
        <span className="cycle-tip">
          Sentinel earns MNT for every validation it performs.
        </span>
      </div>
      <div className="earnings-rows">
        {entries.map(([name, wei]) => (
          <div className="earnings-row" key={name}>
            <strong>{name}</strong>
            <span className="earnings-amount">{formatMnt(wei)} MNT</span>
            <span className="earnings-wei">{wei} wei</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreflightPanel({ file }: { file?: PreflightFile }) {
  if (!file) {
    return (
      <div className="preflight-panel idle">
        <div className="section-heading">
          <ListChecks size={18} />
          <h2>Submission Readiness</h2>
        </div>
        <p>
          Run <code>npm run preflight -- --json</code> to populate this panel from
          a single source of truth.
        </p>
      </div>
    );
  }
  return (
    <div className="preflight-panel">
      <div className="section-heading">
        <ListChecks size={18} />
        <h2>Submission Readiness</h2>
        <span className="cycle-tip">
          {file.summary.pass} pass · {file.summary.warn} warn · {file.summary.fail} fail · {new Date(file.generatedAt).toLocaleString()}
        </span>
      </div>
      <div className="preflight-rows">
        {file.checks.map((c) => (
          <div className={`preflight-row ${c.level}`} key={c.label}>
            <span className="preflight-icon">
              <CircleCheck size={14} />
            </span>
            <strong>{c.label}</strong>
            <span>{c.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [run, setRun] = useState<DemoRun>(FALLBACK_RUN);
  const [history, setHistory] = useState<DemoHistory>(FALLBACK_HISTORY);
  const [chain, setChain] = useState<LiveChainSnapshot | undefined>();
  const [events, setEvents] = useState<ChainEvent[]>([]);
  const [preflight, setPreflight] = useState<PreflightFile | undefined>();
  const [byrealProbe, setByrealProbe] = useState<ByrealProbeSummary | undefined>();

  useEffect(() => {
    fetch(publicAsset("demo-run.json"), { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : FALLBACK_RUN))
      .then((data: DemoRun) => setRun(data))
      .catch(() => setRun(FALLBACK_RUN));

    fetch(publicAsset("demo-history.json"), { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : FALLBACK_HISTORY))
      .then((data: DemoHistory) => setHistory(data))
      .catch(() => setHistory(FALLBACK_HISTORY));

    fetch(publicAsset("live-chain.json"), { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : undefined))
      .then((data?: LiveChainSnapshot) => setChain(data))
      .catch(() => setChain(undefined));

    fetch(publicAsset("events.json"), { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { events: [] }))
      .then((data: EventsFile) => setEvents(data.events ?? []))
      .catch(() => setEvents([]));

    fetch(publicAsset("preflight.json"), { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : undefined))
      .then((data?: PreflightFile) => setPreflight(data))
      .catch(() => setPreflight(undefined));

    fetch(publicAsset("byreal-probe.json"), { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : undefined))
      .then((data?: ByrealProbeSummary) => setByrealProbe(data))
      .catch(() => setByrealProbe(undefined));
  }, []);

  const averageRep = useMemo(
    () => Math.round(run.identities.reduce((sum, agent) => sum + agent.reputation, 0) / run.identities.length),
    [run.identities]
  );

  return (
    <main>
      <header className="topbar">
        <div>
          <div className="eyebrow">Mantle Turing Test Hackathon 2026 · cycle #{run.cycle || 1}</div>
          <h1>The first wallet that grades its own employees.</h1>
          <div className="subhead">Agentic Wallet Treasury · five ERC-8004 agents · three on-chain registries · one Mantle treasury</div>
        </div>
        <a className="network-pill" href={run.network.explorer} target="_blank" rel="noreferrer">
          {run.network.name}
          <ExternalLink size={15} />
        </a>
      </header>

      <StatHero history={history} run={run} />

      <section className="hero">
        <div className="hero-copy">
          <p className="lead">
            Scout proposes. Guard signs. Claw executes. Sentinel re-simulates and gets paid in MNT for every validation. Ledger writes the verdicts back to ERC-8004 reputation. The agents earn — or lose — their right to keep working.
          </p>
          <div className="hero-actions">
            <div className="metric"><Fingerprint size={19} /><span>{run.identities.length} agent identities</span></div>
            <div className="metric"><Gauge size={19} /><span>{averageRep}/100 average reputation</span></div>
            <div className="metric"><Activity size={19} /><span>scenario: {run.scenarioId}</span></div>
            <div className="metric"><Eye size={19} /><span>validation {run.validation.response}/100 {run.validation.passed ? "passed" : "rejected"}</span></div>
          </div>
        </div>
        <div className="proposal-panel">
          <div className="panel-label">Current Proposal</div>
          <h2>{run.proposal.title}</h2>
          <p>{run.proposal.rationale}</p>
          <div className="proposal-stats">
            <span>${run.proposal.amountUsd}</span>
            <span>{run.proposal.assetIn} to {run.proposal.assetOut}</span>
            <span>{Math.round(run.proposal.confidence * 100)}% confidence</span>
          </div>
        </div>
      </section>

      <section className="agent-grid" aria-label="Agent identities">
        {run.identities.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            cumulativeRep={history.cumulativeReputation[agent.name]}
          />
        ))}
      </section>

      <section className="workbench">
        <div className="decision-panel">
          <div className="section-heading">
            <ShieldCheck size={18} />
            <h2>Risk Verdict</h2>
          </div>
          <div className={`verdict ${run.verdict.approved ? "approved" : "blocked"}`}>
            {run.verdict.approved ? "Approved" : "Blocked"} · {run.verdict.score}/100
          </div>
          <p>{run.verdict.reason}</p>
          <div className="check-list">
            {run.verdict.checks.map((check) => (
              <div className="check-row" key={check.label}>
                <span className={check.passed ? "dot pass" : "dot fail"} />
                <div>
                  <strong>{check.label}</strong>
                  <span>{check.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="decision-panel">
          <div className="section-heading">
            <CircleDollarSign size={18} />
            <h2>Execution Proof</h2>
          </div>
          <div className="proof-row">
            <span>Adapter</span>
            <strong>{run.execution.adapter}</strong>
          </div>
          <div className="proof-row">
            <span>Tx</span>
            {run.execution.explorerUrl ? (
              <a href={run.execution.explorerUrl} target="_blank" rel="noreferrer">
                {shortHash(run.execution.txHash)}
              </a>
            ) : (
              <strong>{shortHash(run.execution.txHash)}</strong>
            )}
          </div>
          <div className="proof-row">
            <span>Proof</span>
            <strong>{shortHash(run.execution.proofHash)}</strong>
          </div>
          <p>{run.execution.summary}</p>

          <div className="section-heading" style={{ marginTop: 24 }}>
            <Eye size={18} />
            <h2>Sentinel Validation</h2>
          </div>
          <div className={`verdict ${run.validation.passed ? "approved" : "blocked"}`}>
            {run.validation.passed ? "Validated" : "Rejected"} · {run.validation.response}/100
          </div>
          <p>{run.validation.summary}</p>
          {run.validation.reSimulation && (
            <div className="resim-block">
              <div className="resim-header">
                Re-simulation · adapter={run.validation.reSimulation.adapter} · threshold {run.validation.reSimulation.passThreshold}/100
              </div>
              <div className="resim-grid">
                <div>
                  <strong>{run.validation.reSimulation.hints.realizedSlippageBps}</strong>
                  <span>realized slippage (bps)</span>
                </div>
                <div>
                  <strong>{run.validation.reSimulation.hints.toleranceBps}</strong>
                  <span>tolerance (bps)</span>
                </div>
                <div>
                  <strong>{run.validation.reSimulation.hints.feeBps}</strong>
                  <span>pool fee (bps)</span>
                </div>
                <div>
                  <strong>{run.validation.reSimulation.hints.poolDepth}</strong>
                  <span>pool depth</span>
                </div>
              </div>
              <ul className="resim-notes">
                {run.validation.reSimulation.notes.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="proof-row">
            <span>Tag</span>
            <strong>{run.validation.tag}</strong>
          </div>
          <div className="proof-row">
            <span>Request hash</span>
            <strong>{shortHash(run.validation.requestHash)}</strong>
          </div>
          {run.validation.payment && run.validation.payment.feePaidWei !== "0" && (
            <div className="proof-row">
              <span>x402 fee</span>
              {run.validation.payment.explorerUrl ? (
                <a href={run.validation.payment.explorerUrl} target="_blank" rel="noreferrer">
                  {formatMnt(run.validation.payment.feePaidWei)} MNT → Sentinel
                </a>
              ) : (
                <strong>
                  {formatMnt(run.validation.payment.feePaidWei)} MNT → Sentinel{" "}
                  {run.validation.payment.paymentTx ? "(on-chain)" : "(synthetic)"}
                </strong>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="lower-grid">
        <div className="timeline-panel">
          <div className="section-heading">
            <Activity size={18} />
            <h2>Decision Timeline</h2>
          </div>
          {run.timeline.map((step) => (
            <div className="timeline-row" key={`${step.actor}-${step.label}`}>
              <span>{step.actor}</span>
              <div>
                <strong>{step.label}</strong>
                <p>{step.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="timeline-panel">
          <div className="section-heading">
            <BadgeCheck size={18} />
            <h2>Reputation Feedback</h2>
          </div>
          {run.reputation.map((event) => (
            <div className="rep-row" key={`${event.agent}-${event.tag}`}>
              <div>
                <strong>{event.agent}</strong>
                <span>{event.tag}</span>
              </div>
              <meter min="0" max="100" value={event.value} />
              <b>{event.value}</b>
            </div>
          ))}
        </div>
      </section>

      <section className="cycle-history-section" aria-label="Cycle history">
        <div className="section-heading">
          <Activity size={18} />
          <h2>Recent Cycles</h2>
          <span className="cycle-tip">Last {history.cycles.length} cycle{history.cycles.length === 1 ? "" : "s"} · run <code>npm run demo</code> to add another</span>
        </div>
        <CycleHistoryStrip cycles={history.cycles} />
      </section>

      <section className="cycle-history-section" aria-label="Live chain">
        <ChainPanel snapshot={chain} />
      </section>

      <section className="cycle-history-section" aria-label="Byreal Skills probe">
        <ByrealProbePanel probe={byrealProbe} />
      </section>

      <section className="cycle-history-section" aria-label="Event log">
        <EventLogPanel events={events} />
      </section>

      <section className="cycle-history-section" aria-label="Agent earnings">
        <AgentEarningsPanel history={history} />
      </section>

      <section className="cycle-history-section" aria-label="Submission readiness">
        <PreflightPanel file={preflight} />
      </section>

      <section className="evidence-strip" aria-label="ERC-8004 evidence">
        <div>
          <strong>ERC-8004 Identity Registry</strong>
          <span>{run.identities[0]?.registry ?? "pending"}</span>
        </div>
        <div>
          <strong>Registration Files</strong>
          <span>{run.registrationFiles.length} agent metadata files</span>
        </div>
        <div>
          <strong>Feedback Calldata</strong>
          <span>{run.reputation.filter((event) => event.calldata).length} giveFeedback calls prepared</span>
        </div>
        <div>
          <strong>Validation</strong>
          <span>{run.validation.requestCalldata ? "request + response calldata ready" : "skipped"}</span>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
