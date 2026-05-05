/**
 * Node-only entrypoint for @clawdao/core.
 *
 * Imports here are allowed to use node:fs, node:crypto, node:child_process,
 * etc. The browser build (apps/web) must NOT import this file.
 */

export * from "./index.js";

export { loadProjectEnv } from "./env.js";

export {
  loadAgentWallets,
  publicWalletView,
  type AgentSigner,
  type AgentWallet
} from "./wallets.js";

export {
  loadAgentIds,
  placeholderAgentIds,
  type AgentIdRecord,
  type AgentIdsFile
} from "./agent-ids.js";

export {
  selectExecutor,
  mockAdapter,
  createByrealAdapter,
  createMantleSepoliaAdapter,
  type ExecutorChoice,
  type ExecutionAdapter,
  type ExecutionContext
} from "./executors/index.js";

export {
  encodeApprovedAction,
  APPROVED_ACTION_TYPEHASH,
  type ApprovedAction,
  type MantleSepoliaAdapterOptions
} from "./executors/mantle-sepolia.js";

export { runByrealCli, type ByrealRunResult } from "./executors/byreal.js";

export {
  buildValidationOutcome,
  noOpValidation,
  skippedValidation,
  syntheticPayment,
  VALIDATION_REGISTRY_ADDRESSES,
  type ValidationInputs
} from "./executors/validation.js";

export {
  computeReSimScore,
  runSentinelReSimulation,
  type SentinelOptions
} from "./executors/sentinel.js";
