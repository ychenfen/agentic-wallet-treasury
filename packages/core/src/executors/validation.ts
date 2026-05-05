/**
 * Validation flow against the ERC-8004 ValidationRegistry.
 *
 * Two-step protocol per spec:
 *   1. validationRequest(validatorAddress, agentId, requestURI, requestHash)
 *      MUST be called by the owner / operator of agentId.
 *   2. validationResponse(requestHash, response, responseURI, responseHash, tag)
 *      MUST be called by the requested validator.
 *
 * In our demo, the auditor (Ledger) requests validation of the executor
 * (Claw)'s tx, and the validator (Sentinel) signs the response.
 */

import { createHash } from "node:crypto";
import { encodeFunctionData, keccak256, toHex, toBytes, type Hex } from "viem";
import {
  ERC8004,
  erc8004ValidationAbi,
  type ReSimResult,
  type ValidationOutcome
} from "../index.js";
import type { AgentWallet } from "../wallets.js";

export interface ValidationInputs {
  /** Subject agent (the one being validated; usually Claw / executor). */
  subjectAgentId: number;
  /** Validator agent (Sentinel) wallet. Used as recipient of the request. */
  validatorWallet: AgentWallet;
  /** Auditor agent (Ledger) wallet. Owner of the subject agent or its operator. */
  requesterWallet: AgentWallet;
  /** Free-form payload describing what is being validated. */
  payload: Record<string, unknown>;
  /** Tag the validator stamps on its response. */
  tag: string;
  /** Optional URI where the request payload is published. */
  requestURI?: string;
  /** Optional URI where the response payload is published. */
  responseURI?: string;
  /** Validator's verdict in [0,100]. The runner decides this off-chain. */
  response: number;
  /** Off-chain summary string for the dashboard. */
  summary: string;
  /** Optional structured re-simulation Sentinel ran. Echoed into ValidationOutcome. */
  reSimulation?: ReSimResult;
}

function hashJson(obj: unknown): Hex {
  return `0x${createHash("sha256").update(JSON.stringify(obj)).digest("hex")}`;
}

/** Build the encoded request + response calldata + a derived requestHash. */
export function buildValidationOutcome(input: ValidationInputs): ValidationOutcome {
  const requestHash = keccak256(toBytes(JSON.stringify(input.payload)));
  const responsePayload = {
    subjectAgentId: input.subjectAgentId,
    validator: input.validatorWallet.address,
    response: input.response,
    tag: input.tag,
    summary: input.summary
  };
  const responseHash = hashJson(responsePayload);

  const requestCalldata = encodeFunctionData({
    abi: erc8004ValidationAbi,
    functionName: "validationRequest",
    args: [
      input.validatorWallet.address,
      BigInt(input.subjectAgentId),
      input.requestURI ?? "",
      requestHash
    ]
  });
  const responseCalldata = encodeFunctionData({
    abi: erc8004ValidationAbi,
    functionName: "validationResponse",
    args: [
      requestHash,
      input.response,
      input.responseURI ?? "",
      responseHash,
      input.tag
    ]
  });

  return {
    requestURI: input.requestURI ?? "",
    requestHash,
    validatorAddress: input.validatorWallet.address,
    subjectAgentId: input.subjectAgentId,
    response: input.response,
    tag: input.tag,
    responseURI: input.responseURI ?? "",
    responseHash,
    requestCalldata,
    responseCalldata,
    summary: input.summary,
    passed: input.response >= 60,
    reSimulation: input.reSimulation
  };
}

/** Used by tests / scripts to hex-encode an arbitrary buffer. */
export function bufToHex(buf: Uint8Array): Hex {
  return toHex(buf);
}

/** Convenience: produce a placeholder ValidationOutcome when execution was skipped. */
export function skippedValidation(reason: string): ValidationOutcome {
  return {
    requestURI: "",
    requestHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    response: 0,
    tag: "skipped",
    responseURI: "",
    responseHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    summary: `Validation skipped: ${reason}`,
    passed: false
  };
}

/** Hold cycles intentionally submit no transaction; Sentinel can still approve the no-op. */
export function noOpValidation(summary: string): ValidationOutcome {
  return {
    requestURI: "",
    requestHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    response: 100,
    tag: "no-op",
    responseURI: "",
    responseHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    summary,
    passed: true
  };
}

export const VALIDATION_REGISTRY_ADDRESSES = {
  mantleSepolia: ERC8004.mantleSepolia.validationRegistry,
  mantleMainnet: ERC8004.mantleMainnet.validationRegistry
} as const;
