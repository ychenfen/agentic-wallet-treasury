export type AgentRole = "researcher" | "risk" | "executor" | "auditor" | "validator";

export type AgentStatus =
  | "idle"
  | "thinking"
  | "approved"
  | "blocked"
  | "executed"
  | "scored"
  | "validating"
  | "validated"
  | "rejected";

export interface AgentIdentity {
  id: string;
  role: AgentRole;
  name: string;
  tagline: string;
  wallet: `0x${string}`;
  agentId?: number;
  registry: `eip155:${number}:0x${string}`;
  reputation: number;
  status: AgentStatus;
}

export interface TreasuryPolicy {
  maxTradeUsd: number;
  maxDrawdownBps: number;
  allowedActions: string[];
  requiresRiskApproval: boolean;
}

export interface Proposal {
  id: string;
  title: string;
  action: "rebalance" | "test-swap" | "hold";
  assetIn: string;
  assetOut: string;
  amountUsd: number;
  rationale: string;
  confidence: number;
}

export interface RiskVerdict {
  approved: boolean;
  score: number;
  reason: string;
  checks: Array<{
    label: string;
    passed: boolean;
    detail: string;
  }>;
}

export interface ExecutionResult {
  adapter: "mock" | "mantle-sepolia" | "byreal";
  status: "simulated" | "submitted" | "confirmed" | "skipped";
  txHash?: `0x${string}`;
  explorerUrl?: string;
  proofHash: `0x${string}`;
  summary: string;
}

/**
 * Inputs to Sentinel's independent re-simulation. Scenarios provide these so
 * the demo runner doesn't bake validator scores; Sentinel computes them.
 */
export interface ReSimHints {
  /** Pool fee Claw paid, in basis points (1 bp = 0.01%). */
  feeBps: number;
  /** Realized slippage Claw's tx incurred (Sentinel observes this). */
  realizedSlippageBps: number;
  /** Sentinel's slippage tolerance threshold. */
  toleranceBps: number;
  /** Pool depth shorthand. */
  poolDepth: "deep" | "moderate" | "thin";
  /** Optional: replace the byreal-cli command Sentinel issues for the independent quote. */
  byrealCommandOverride?: string[];
}

/**
 * Output of Sentinel's re-simulation. Contains both the structured math and
 * a human-readable summary so the dashboard can render either.
 */
export interface ReSimResult {
  /** Final score Sentinel posts to ValidationRegistry, 0..100. */
  score: number;
  /** True iff score >= passThreshold (default 60). */
  passed: boolean;
  /** Score threshold for `passed`. */
  passThreshold: number;
  /** Adapter Sentinel actually used to derive its independent view. */
  adapter: "mock" | "byreal-cli";
  /** Inputs the score was computed from. Echoed back so judges can audit. */
  hints: ReSimHints;
  /** Plain-English breakdown of why the score landed where it did. */
  notes: string[];
  /** Optional URI Sentinel published with the raw quote it received. */
  evidenceURI?: string;
  /** Optional command Sentinel actually executed (when adapter=byreal-cli). */
  command?: string[];
}

/**
 * ValidationRegistry response in [0, 100]. 100 = fully approved by validator.
 * Validator can also withhold a response by leaving it as 0.
 */
export interface ValidationOutcome {
  /** What the auditor asked the validator to check. */
  requestURI: string;
  /** keccak256 of the request payload. */
  requestHash: `0x${string}`;
  /** Validator agent (Sentinel). undefined when no validator wallet present. */
  validatorAddress?: `0x${string}`;
  /** Subject agent (Claw). */
  subjectAgentId?: number;
  /** 0..100 — Sentinel's verdict. */
  response: number;
  /** Tag describing the validation kind, e.g. "execution-validity". */
  tag: string;
  /** Optional URI with raw evidence. */
  responseURI: string;
  responseHash: `0x${string}`;
  /** Pre-encoded calldata for both calls (for dashboard / dry-run). */
  requestCalldata?: `0x${string}`;
  responseCalldata?: `0x${string}`;
  /** Off-chain summary the dashboard renders. */
  summary: string;
  /** True when validator response >= 60. */
  passed: boolean;
  /** Optional structured re-simulation breakdown when Sentinel ran one. */
  reSimulation?: ReSimResult;
}

export interface ReputationEvent {
  agent: string;
  agentId?: number;
  tag: string;
  value: number;
  reason: string;
  calldata?: `0x${string}`;
}

export interface AgentRegistrationFile {
  type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1";
  name: string;
  description: string;
  image: string;
  services: Array<{
    name: string;
    endpoint: string;
    version?: string;
  }>;
  x402Support: boolean;
  active: boolean;
  registrations: Array<{
    agentId: number;
    agentRegistry: string;
  }>;
  supportedTrust: string[];
}

export interface DecisionStep {
  actor: string;
  label: string;
  detail: string;
  timestamp: string;
}

export interface DemoRun {
  runId: string;
  /** Monotonic 1-based cycle counter, persists across runs via demo-history. */
  cycle: number;
  /** Scenario id used to seed the proposal. */
  scenarioId: string;
  generatedAt: string;
  network: {
    name: "Mantle Sepolia";
    chainId: 5003;
    explorer: "https://sepolia.mantlescan.xyz";
  };
  identities: AgentIdentity[];
  policy: TreasuryPolicy;
  proposal: Proposal;
  verdict: RiskVerdict;
  execution: ExecutionResult;
  validation: ValidationOutcome;
  reputation: ReputationEvent[];
  registrationFiles: AgentRegistrationFile[];
  timeline: DecisionStep[];
}

/**
 * One-line cycle entry rendered in the dashboard's history strip.
 * Stored separately from full DemoRun to keep the on-disk file small.
 */
export interface CycleSummary {
  cycle: number;
  runId: string;
  scenarioId: string;
  generatedAt: string;
  proposalTitle: string;
  amountUsd: number;
  approved: boolean;
  executionStatus: ExecutionResult["status"];
  validationPassed: boolean;
  validationResponse: number;
}

export interface DemoHistory {
  /** Most recent first. Cap is enforced by the writer (default 20). */
  cycles: CycleSummary[];
  /** Per-agent cumulative reputation, keyed by agent name. */
  cumulativeReputation: Record<string, number>;
  /** Last cycle number persisted. */
  lastCycle: number;
}

export const ERC8004 = {
  mantleMainnet: {
    chainId: 5000,
    identityRegistry: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
    reputationRegistry: "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63",
    validationRegistry: "0x8004Cc8439f36fd5F9F049D9fF86523Df6dAAB58"
  },
  mantleSepolia: {
    chainId: 5003,
    identityRegistry: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
    reputationRegistry: "0x8004B663056A597Dffe9eCcC1965A193B7388713",
    validationRegistry: "0x8004Cb1BF31DAf7788923b405b754f57acEB4272"
  }
} as const;

export const agentRegistry = `eip155:${ERC8004.mantleSepolia.chainId}:${ERC8004.mantleSepolia.identityRegistry}` as const;

export const defaultAgents: AgentIdentity[] = [
  {
    id: "researcher",
    role: "researcher",
    name: "Scout",
    tagline: "Finds yield and market context before capital moves.",
    wallet: "0x1111111111111111111111111111111111111111",
    agentId: 8101,
    registry: agentRegistry,
    reputation: 82,
    status: "thinking"
  },
  {
    id: "risk",
    role: "risk",
    name: "Guard",
    tagline: "Blocks trades that violate treasury policy.",
    wallet: "0x2222222222222222222222222222222222222222",
    agentId: 8102,
    registry: agentRegistry,
    reputation: 91,
    status: "approved"
  },
  {
    id: "executor",
    role: "executor",
    name: "Claw",
    tagline: "Executes approved wallet actions on Mantle.",
    wallet: "0x3333333333333333333333333333333333333333",
    agentId: 8103,
    registry: agentRegistry,
    reputation: 78,
    status: "executed"
  },
  {
    id: "auditor",
    role: "auditor",
    name: "Ledger",
    tagline: "Scores outcomes and writes reputation feedback.",
    wallet: "0x4444444444444444444444444444444444444444",
    agentId: 8104,
    registry: agentRegistry,
    reputation: 88,
    status: "scored"
  },
  {
    id: "validator",
    role: "validator",
    name: "Sentinel",
    tagline: "Independent validator. Re-checks Claw's execution and posts a ValidationRegistry response.",
    wallet: "0x5555555555555555555555555555555555555555",
    agentId: 8105,
    registry: agentRegistry,
    reputation: 84,
    status: "validating"
  }
];

export const defaultPolicy: TreasuryPolicy = {
  maxTradeUsd: 500,
  maxDrawdownBps: 250,
  allowedActions: ["rebalance", "test-swap", "hold"],
  requiresRiskApproval: true
};

// ABI verified against
//   github.com/erc-8004/erc-8004-contracts/blob/main/abis/IdentityRegistry.json
// Only the subset we actually call is exported; full ABI is huge and not needed.
export const erc8004IdentityAbi = [
  {
    type: "function",
    name: "register",
    stateMutability: "nonpayable",
    inputs: [{ name: "agentURI", type: "string" }],
    outputs: [{ name: "agentId", type: "uint256" }]
  },
  {
    type: "function",
    name: "setAgentURI",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "newURI", type: "string" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }]
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }]
  },
  {
    type: "function",
    name: "getAgentWallet",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [{ name: "wallet", type: "address" }]
  },
  {
    type: "function",
    name: "setMetadata",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "metadataKey", type: "string" },
      { name: "metadataValue", type: "bytes" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "getMetadata",
    stateMutability: "view",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "metadataKey", type: "string" }
    ],
    outputs: [{ name: "", type: "bytes" }]
  },
  {
    type: "event",
    name: "Registered",
    inputs: [
      { name: "agentId", type: "uint256", indexed: true },
      { name: "agentURI", type: "string", indexed: false },
      { name: "owner", type: "address", indexed: true }
    ]
  },
  {
    type: "event",
    name: "URIUpdated",
    inputs: [
      { name: "agentId", type: "uint256", indexed: true },
      { name: "newURI", type: "string", indexed: false },
      { name: "updatedBy", type: "address", indexed: true }
    ]
  }
] as const;

// ABI verified against
//   github.com/erc-8004/erc-8004-contracts/blob/main/abis/ValidationRegistry.json
export const erc8004ValidationAbi = [
  {
    type: "function",
    name: "validationRequest",
    stateMutability: "nonpayable",
    inputs: [
      { name: "validatorAddress", type: "address" },
      { name: "agentId", type: "uint256" },
      { name: "requestURI", type: "string" },
      { name: "requestHash", type: "bytes32" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "validationResponse",
    stateMutability: "nonpayable",
    inputs: [
      { name: "requestHash", type: "bytes32" },
      { name: "response", type: "uint8" },
      { name: "responseURI", type: "string" },
      { name: "responseHash", type: "bytes32" },
      { name: "tag", type: "string" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "getValidationStatus",
    stateMutability: "view",
    inputs: [{ name: "requestHash", type: "bytes32" }],
    outputs: [
      { name: "validatorAddress", type: "address" },
      { name: "agentId", type: "uint256" },
      { name: "response", type: "uint8" },
      { name: "responseHash", type: "bytes32" },
      { name: "tag", type: "string" },
      { name: "lastUpdate", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "getSummary",
    stateMutability: "view",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "validatorAddresses", type: "address[]" },
      { name: "tag", type: "string" }
    ],
    outputs: [
      { name: "count", type: "uint64" },
      { name: "avgResponse", type: "uint8" }
    ]
  },
  {
    type: "event",
    name: "ValidationRequest",
    inputs: [
      { name: "validatorAddress", type: "address", indexed: true },
      { name: "agentId", type: "uint256", indexed: true },
      { name: "requestURI", type: "string", indexed: false },
      { name: "requestHash", type: "bytes32", indexed: true }
    ]
  },
  {
    type: "event",
    name: "ValidationResponse",
    inputs: [
      { name: "validatorAddress", type: "address", indexed: true },
      { name: "agentId", type: "uint256", indexed: true },
      { name: "requestHash", type: "bytes32", indexed: true },
      { name: "response", type: "uint8", indexed: false },
      { name: "responseURI", type: "string", indexed: false },
      { name: "responseHash", type: "bytes32", indexed: false },
      { name: "tag", type: "string", indexed: false }
    ]
  }
] as const;

// ABI verified against
//   github.com/erc-8004/erc-8004-contracts/blob/main/abis/ReputationRegistry.json
export const erc8004ReputationAbi = [
  {
    type: "function",
    name: "giveFeedback",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "value", type: "int128" },
      { name: "valueDecimals", type: "uint8" },
      { name: "tag1", type: "string" },
      { name: "tag2", type: "string" },
      { name: "endpoint", type: "string" },
      { name: "feedbackURI", type: "string" },
      { name: "feedbackHash", type: "bytes32" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "getSummary",
    stateMutability: "view",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "clientAddresses", type: "address[]" },
      { name: "tag1", type: "string" },
      { name: "tag2", type: "string" }
    ],
    outputs: [
      { name: "count", type: "uint64" },
      { name: "summaryValue", type: "int128" },
      { name: "summaryValueDecimals", type: "uint8" }
    ]
  },
  {
    type: "function",
    name: "getClients",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [{ name: "", type: "address[]" }]
  },
  {
    type: "event",
    name: "NewFeedback",
    inputs: [
      { name: "agentId", type: "uint256", indexed: true },
      { name: "clientAddress", type: "address", indexed: true },
      { name: "feedbackIndex", type: "uint64", indexed: false },
      { name: "value", type: "int128", indexed: false },
      { name: "valueDecimals", type: "uint8", indexed: false },
      { name: "indexedTag1", type: "string", indexed: true },
      { name: "tag1", type: "string", indexed: false },
      { name: "tag2", type: "string", indexed: false },
      { name: "endpoint", type: "string", indexed: false },
      { name: "feedbackURI", type: "string", indexed: false },
      { name: "feedbackHash", type: "bytes32", indexed: false }
    ]
  }
] as const;

export interface BuildRegistrationFileOptions {
  /** Public-facing base URL where the dashboard is hosted. */
  webEndpoint?: string;
  /** Optional MCP base URL for service discovery. */
  mcpBase?: string;
}

export function buildRegistrationFile(
  agent: AgentIdentity,
  options: BuildRegistrationFileOptions = {}
): AgentRegistrationFile {
  const webEndpoint = options.webEndpoint ?? "http://localhost:5175/";
  const mcpBase = options.mcpBase ?? "https://agentic-wallet-treasury.local/mcp";
  return {
    type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
    name: agent.name,
    description: `${agent.tagline} Role: ${agent.role}. Part of Agentic Wallet Treasury on Mantle.`,
    image: `${webEndpoint.replace(/\/+$/, "")}/agents/${agent.id}.png`,
    services: [
      { name: "web", endpoint: webEndpoint },
      { name: "MCP", endpoint: `${mcpBase.replace(/\/+$/, "")}/${agent.id}`, version: "2025-06-18" }
    ],
    x402Support: false,
    active: true,
    registrations: agent.agentId
      ? [
          {
            agentId: agent.agentId,
            agentRegistry: agent.registry
          }
        ]
      : [],
    supportedTrust: ["reputation", "policy-validation", "execution-proof"]
  };
}

// Browser-safe re-exports. Anything that needs node:fs / node:child_process
// lives in "@clawdao/core/node" instead so apps/web stays lean.
export { buildAgentURI, decodeDataAgentURI, type AgentURIMode } from "./agent-uri.js";
export type { AgentSlug } from "./wallets.js";
