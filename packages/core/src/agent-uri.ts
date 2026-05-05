/**
 * Build agentURIs for ERC-8004 registration.
 *
 * Two paths:
 * - data:application/json;base64,...   fully on-chain registration JSON
 *   (no external hosting, costs more gas, perfect for demos)
 * - https://your-host/agents/<slug>.json   classic hosted file
 *   (cheaper, requires that the file actually be reachable)
 *
 * Phase 0: use data URIs so on-chain registration is self-contained.
 * Phase 1: switch to the hosted URI once you deploy apps/web to Vercel.
 */

import type { AgentRegistrationFile } from "./index.js";

export type AgentURIMode =
  | { kind: "data" }
  | { kind: "hosted"; baseUrl: string };

export function buildAgentURI(
  registrationFile: AgentRegistrationFile,
  slug: string,
  mode: AgentURIMode
): string {
  if (mode.kind === "data") {
    const json = JSON.stringify(registrationFile);
    const base64 = base64Encode(json);
    return `data:application/json;base64,${base64}`;
  }
  // Hosted: assume <baseUrl>/agents/<slug>.json layout used by apps/web/public.
  const trimmed = mode.baseUrl.replace(/\/+$/, "");
  return `${trimmed}/agents/${slug}.json`;
}

export function decodeDataAgentURI(uri: string): AgentRegistrationFile | undefined {
  if (!uri.startsWith("data:application/json;base64,")) return undefined;
  const base64 = uri.slice("data:application/json;base64,".length);
  try {
    const json = base64Decode(base64);
    return JSON.parse(json) as AgentRegistrationFile;
  } catch {
    return undefined;
  }
}

function base64Encode(input: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(input, "utf8").toString("base64");
  }
  // Browser fallback (apps/web). btoa needs binary string; encode UTF-8 first.
  const bytes = new TextEncoder().encode(input);
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = globalThis as any;
  return g.btoa ? g.btoa(bin) : bin;
}

function base64Decode(input: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(input, "base64").toString("utf8");
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = globalThis as any;
  if (!g.atob) throw new Error("No base64 decoder available.");
  const bin: string = g.atob(input);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder("utf-8").decode(bytes);
}
