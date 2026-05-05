/**
 * Balance check for the five agent wallets on Mantle Sepolia.
 *
 * Reads AGENT_MNEMONIC / per-agent keys and prints each wallet's MNT balance.
 * Optional MIN_BALANCE_MNT (default 0.05) sets the warning threshold per wallet.
 *
 * Why this matters:
 *   register / feedback / validate / deploy each cost a small amount of testnet
 *   MNT. Running them with an empty wallet wastes time. This script is the
 *   pre-flight before broadcasting.
 *
 * Outputs:
 *   stdout — human-readable table
 *   apps/web/public/balance-check.json (when --json or BALANCE_JSON=1)
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createPublicClient, http, formatEther } from "viem";
import { mantleSepoliaTestnet as mantleSepolia } from "viem/chains";
import { loadAgentWallets, loadProjectEnv } from "@clawdao/core/node";

const ROOT = resolve(process.cwd(), "..");
const REPORT_PATH = resolve(ROOT, "apps/web/public/balance-check.json");

interface AgentBalance {
  slug: string;
  address: `0x${string}`;
  balanceWei: string;
  balanceMnt: string;
  fundedEnough: boolean;
}

async function main(): Promise<void> {
  loadProjectEnv({ includeGenerated: true });
  const rpcUrl = process.env.MANTLE_SEPOLIA_RPC_URL ?? "https://rpc.sepolia.mantle.xyz";
  const minMnt = Number(process.env.MIN_BALANCE_MNT ?? 0.05);
  const wantJson = process.argv.includes("--json") || process.env.BALANCE_JSON === "1";

  let wallets;
  try {
    wallets = loadAgentWallets({ allowEphemeral: false });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`No agent wallets configured (${(error as Error).message}).`);
    // eslint-disable-next-line no-console
    console.error("Set AGENT_MNEMONIC in .env or run GENERATE_MNEMONIC=1 npm run wallets first.");
    process.exit(2);
  }
  const client = createPublicClient({ chain: mantleSepolia, transport: http(rpcUrl) });

  const results: AgentBalance[] = [];
  for (const w of wallets) {
    let balanceWei = 0n;
    try {
      balanceWei = await client.getBalance({ address: w.address });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`[balance] failed to read ${w.slug} ${w.address}: ${(error as Error).message}`);
    }
    const mnt = Number(formatEther(balanceWei));
    results.push({
      slug: w.slug,
      address: w.address,
      balanceWei: balanceWei.toString(),
      balanceMnt: mnt.toFixed(6),
      fundedEnough: mnt >= minMnt
    });
  }

  // eslint-disable-next-line no-console
  console.log(`Mantle Sepolia balances (threshold ${minMnt} MNT)\n`);
  // eslint-disable-next-line no-console
  console.log("slug        address                                         balance (MNT)     ok");
  // eslint-disable-next-line no-console
  console.log("─────────── ─────────────────────────────────────────── ──────────────── ────");
  for (const r of results) {
    // eslint-disable-next-line no-console
    console.log(
      `${r.slug.padEnd(11)} ${r.address.padEnd(42)} ${r.balanceMnt.padStart(15)}   ${r.fundedEnough ? " ✓" : " ✗"}`
    );
  }

  const allFunded = results.every((r) => r.fundedEnough);
  // eslint-disable-next-line no-console
  console.log(
    `\nResult: ${allFunded ? "all wallets funded" : "some wallets are below threshold — visit a Mantle Sepolia faucet"}`
  );
  // eslint-disable-next-line no-console
  console.log(
    `Faucet: https://faucet.sepolia.mantle.xyz/   (also try the official Mantle Discord)`
  );

  if (wantJson) {
    mkdirSync(dirname(REPORT_PATH), { recursive: true });
    writeFileSync(
      REPORT_PATH,
      `${JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          minMnt,
          chain: { name: "Mantle Sepolia", chainId: mantleSepolia.id },
          balances: results,
          allFunded
        },
        null,
        2
      )}\n`,
      "utf8"
    );
    // eslint-disable-next-line no-console
    console.log(`\n[balance] wrote ${REPORT_PATH}`);
  }

  process.exit(allFunded ? 0 : 1);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
