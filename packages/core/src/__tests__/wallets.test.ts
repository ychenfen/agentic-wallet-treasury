import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadAgentWallets } from "../wallets.js";

const KEYS = [
  "AGENT_MNEMONIC",
  "SCOUT_PRIVATE_KEY",
  "GUARD_PRIVATE_KEY",
  "CLAW_PRIVATE_KEY",
  "LEDGER_PRIVATE_KEY",
  "SENTINEL_PRIVATE_KEY"
];

describe("loadAgentWallets", () => {
  let saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
    for (const k of KEYS) delete process.env[k];
  });
  afterEach(() => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  it("derives 5 wallets from a mnemonic at standard EVM paths", () => {
    process.env.AGENT_MNEMONIC =
      "test test test test test test test test test test test junk"; // standard hardhat test mnemonic
    const wallets = loadAgentWallets({ allowEphemeral: false });
    expect(wallets).toHaveLength(5);
    expect(wallets.map((w) => w.slug)).toEqual([
      "researcher",
      "risk",
      "executor",
      "auditor",
      "validator"
    ]);
    expect(wallets[0].source).toBe("mnemonic");
    expect(wallets[0].derivationPath).toBe("m/44'/60'/0'/0/0");
    expect(wallets[4].derivationPath).toBe("m/44'/60'/0'/0/4");
    // Hardhat's default mnemonic produces 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 at path 0.
    expect(wallets[0].address.toLowerCase()).toBe(
      "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
    );
    expect(wallets[1].address.toLowerCase()).toBe(
      "0x70997970c51812dc3a010c7d01b50e0d17dc79c8"
    );
  });

  it("allows ephemeral fallback in tests", () => {
    const wallets = loadAgentWallets({ allowEphemeral: true });
    expect(wallets).toHaveLength(5);
    expect(wallets.every((w) => w.source === "ephemeral")).toBe(true);
    expect(new Set(wallets.map((w) => w.address)).size).toBe(5);
  });

  it("throws when neither env nor ephemeral is allowed", () => {
    expect(() => loadAgentWallets({ allowEphemeral: false })).toThrow();
  });

  it("per-agent env keys override mnemonic", () => {
    process.env.AGENT_MNEMONIC =
      "test test test test test test test test test test test junk";
    process.env.SCOUT_PRIVATE_KEY =
      "0x0123456789012345678901234567890123456789012345678901234567890123";
    const wallets = loadAgentWallets({ allowEphemeral: false });
    expect(wallets[0].source).toBe("env");
    expect(wallets[1].source).toBe("mnemonic");
  });
});
