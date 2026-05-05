/**
 * After running scripts/register-agents.ts, real ERC-8004 agentIds are written
 * to apps/web/public/agent-ids.json. This module loads them at runtime so the
 * demo runner can attach real numeric IDs to each agent.
 *
 * If the file does not exist, we fall back to placeholders 8101-8105 so
 * `npm run demo` never breaks.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { AgentSlug } from "./wallets.js";

export interface AgentIdRecord {
  slug: AgentSlug;
  agentId: number;
  agentURI: string;
  txHash?: `0x${string}`;
  registeredAt?: string;
  ownerAddress?: `0x${string}`;
}

export interface AgentIdsFile {
  network: "mantle-sepolia" | "mantle-mainnet";
  registry: `0x${string}`;
  generatedAt: string;
  agents: AgentIdRecord[];
}

const DEFAULT_PATH = resolve(process.cwd(), "apps/web/public/agent-ids.json");

const PLACEHOLDER_IDS: Record<AgentSlug, number> = {
  researcher: 8101,
  risk: 8102,
  executor: 8103,
  auditor: 8104,
  validator: 8105
};

export function loadAgentIds(filePath: string = DEFAULT_PATH): {
  source: "file" | "placeholder";
  ids: Record<AgentSlug, number>;
  raw?: AgentIdsFile;
} {
  if (!existsSync(filePath)) {
    return { source: "placeholder", ids: { ...PLACEHOLDER_IDS } };
  }
  try {
    const raw = JSON.parse(readFileSync(filePath, "utf8")) as AgentIdsFile;
    const ids: Record<AgentSlug, number> = { ...PLACEHOLDER_IDS };
    for (const agent of raw.agents) {
      ids[agent.slug] = agent.agentId;
    }
    return { source: "file", ids, raw };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`Failed to read agent IDs file at ${filePath}, falling back to placeholders.`, error);
    return { source: "placeholder", ids: { ...PLACEHOLDER_IDS } };
  }
}

export function placeholderAgentIds(): Record<AgentSlug, number> {
  return { ...PLACEHOLDER_IDS };
}
