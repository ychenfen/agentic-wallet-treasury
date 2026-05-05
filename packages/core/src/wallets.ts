/**
 * Wallet derivation for the five ERC-8004 agents.
 *
 * Strategy:
 * - Single-mnemonic mode (default): export AGENT_MNEMONIC=... and we derive 4
 *   accounts at standard EVM paths m/44'/60'/0'/0/{0..3}.
 * - Per-agent key mode: export SCOUT_PRIVATE_KEY / GUARD_PRIVATE_KEY /
 *   CLAW_PRIVATE_KEY / LEDGER_PRIVATE_KEY for full isolation.
 * - Fallback (demo only): generates five ephemeral accounts in memory so the
 *   demo runner can produce realistic addresses without on-chain state.
 *
 * Security notes:
 * - This module never writes private keys to disk.
 * - Scripts that need to broadcast transactions must read from process.env
 *   directly; the runner only sees public addresses through `loadAgentWallets`.
 */

import { mnemonicToAccount, privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import type { HDAccount, PrivateKeyAccount } from "viem/accounts";

export type AgentSlug = "researcher" | "risk" | "executor" | "auditor" | "validator";

export type AgentSigner = HDAccount | PrivateKeyAccount;

export interface AgentWallet {
  slug: AgentSlug;
  /** Lower-case hex address. Always defined. */
  address: `0x${string}`;
  /** Signer is undefined when only public address is known. */
  signer?: AgentSigner;
  /** Where the key came from, for diagnostics. */
  source: "mnemonic" | "env" | "ephemeral";
  /** HD path when derived from mnemonic. */
  derivationPath?: string;
}

const SLUGS: AgentSlug[] = ["researcher", "risk", "executor", "auditor", "validator"];

const ENV_KEYS: Record<AgentSlug, string> = {
  researcher: "SCOUT_PRIVATE_KEY",
  risk: "GUARD_PRIVATE_KEY",
  executor: "CLAW_PRIVATE_KEY",
  auditor: "LEDGER_PRIVATE_KEY",
  validator: "SENTINEL_PRIVATE_KEY"
};

function derivationPath(index: number): `m/44'/60'/0'/0/${number}` {
  return `m/44'/60'/0'/0/${index}` as const;
}

function readEnv(key: string): string | undefined {
  const value = process.env[key];
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function asPrivateKey(raw: string): `0x${string}` {
  const value = raw.startsWith("0x") ? raw : `0x${raw}`;
  if (value.length !== 66) {
    throw new Error(`Private key must be 32 bytes hex; got length ${value.length - 2}.`);
  }
  return value as `0x${string}`;
}

/**
 * Resolve five agent wallets from environment.
 *
 * Resolution order, per slot:
 *   1. <SLOT>_PRIVATE_KEY env var (highest priority).
 *   2. AGENT_MNEMONIC derived at the slot's HD path.
 *   3. ephemeral key generated in memory (only if `allowEphemeral`).
 */
export function loadAgentWallets(options: { allowEphemeral?: boolean } = {}): AgentWallet[] {
  const allowEphemeral = options.allowEphemeral ?? true;
  const mnemonic = readEnv("AGENT_MNEMONIC");

  return SLUGS.map((slug, index) => {
    const envValue = readEnv(ENV_KEYS[slug]);
    if (envValue) {
      const signer = privateKeyToAccount(asPrivateKey(envValue));
      return {
        slug,
        address: signer.address,
        signer,
        source: "env" as const
      };
    }

    if (mnemonic) {
      const path = derivationPath(index);
      const signer = mnemonicToAccount(mnemonic, { path });
      return {
        slug,
        address: signer.address,
        signer,
        source: "mnemonic" as const,
        derivationPath: path
      };
    }

    if (!allowEphemeral) {
      throw new Error(
        `No wallet for agent "${slug}". Set ${ENV_KEYS[slug]} or AGENT_MNEMONIC, or pass { allowEphemeral: true }.`
      );
    }
    const signer = privateKeyToAccount(generatePrivateKey());
    return {
      slug,
      address: signer.address,
      signer,
      source: "ephemeral" as const
    };
  });
}

/** Public addresses only — safe to render in UI / commit to JSON. */
export function publicWalletView(wallets: AgentWallet[]): Array<{
  slug: AgentSlug;
  address: `0x${string}`;
  source: AgentWallet["source"];
  derivationPath?: string;
}> {
  return wallets.map(({ slug, address, source, derivationPath }) => ({
    slug,
    address,
    source,
    derivationPath
  }));
}
