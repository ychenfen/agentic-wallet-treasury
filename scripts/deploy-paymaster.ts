/**
 * Deploy ValidatorPaymaster to Mantle Sepolia.
 *
 * On success the script writes:
 *   apps/web/public/deployed-paymaster.json
 *   appends PAYMASTER_ADDRESS=<addr> to .env (does NOT overwrite existing line)
 *
 * Usage:
 *   npm run deploy-paymaster
 *   DRY_RUN=1 npm run deploy-paymaster
 */

import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  createPublicClient,
  createWalletClient,
  http,
  type Hex
} from "viem";
import { mantleSepoliaTestnet as mantleSepolia } from "viem/chains";
import { loadAgentWallets, loadProjectEnv } from "@clawdao/core/node";

const ROOT = resolve(process.cwd(), "..");
const ARTIFACT_PATH = resolve(ROOT, "contracts/out/ValidatorPaymaster.sol/ValidatorPaymaster.json");
const RECORD_PATH = resolve(ROOT, "apps/web/public/deployed-paymaster.json");
const ENV_PATH = resolve(ROOT, ".env");

interface Artifact {
  abi: unknown;
  bytecode: { object: Hex } | Hex;
}

function bytecodeOf(artifact: Artifact): Hex {
  const raw = artifact.bytecode;
  if (typeof raw === "string") return raw;
  if (raw?.object) return raw.object;
  throw new Error("Could not find bytecode in artifact.");
}

function appendEnv(addr: `0x${string}`): void {
  if (!existsSync(ENV_PATH)) {
    writeFileSync(ENV_PATH, `PAYMASTER_ADDRESS=${addr}\n`, { encoding: "utf8" });
    return;
  }
  const text = readFileSync(ENV_PATH, "utf8");
  if (text.includes("PAYMASTER_ADDRESS=")) {
    // eslint-disable-next-line no-console
    console.log(`[paymaster] .env already contains PAYMASTER_ADDRESS; not overwriting. New address: ${addr}`);
    return;
  }
  appendFileSync(ENV_PATH, `${text.endsWith("\n") ? "" : "\n"}PAYMASTER_ADDRESS=${addr}\n`);
}

async function main(): Promise<void> {
  loadProjectEnv({ includeGenerated: true });
  const dryRun = process.env.DRY_RUN === "1";
  const rpcUrl = process.env.MANTLE_SEPOLIA_RPC_URL ?? "https://rpc.sepolia.mantle.xyz";

  if (!existsSync(ARTIFACT_PATH)) {
    throw new Error("Missing ValidatorPaymaster artifact. Run npm run compile-paymaster first.");
  }
  const artifact = JSON.parse(readFileSync(ARTIFACT_PATH, "utf8")) as Artifact;
  const bytecode = bytecodeOf(artifact);

  const wallets = loadAgentWallets({ allowEphemeral: dryRun });
  const owner = wallets.find((w) => w.slug === "auditor"); // Ledger deploys infra contracts.
  if (!owner) throw new Error("Need auditor wallet.");

  if (dryRun) {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({
      mode: "dry-run",
      contract: "ValidatorPaymaster",
      from: owner.address,
      ownerSlug: "auditor (Ledger)",
      bytecodeSizeBytes: (bytecode.length - 2) / 2
    }, null, 2));
    return;
  }
  if (!owner.signer) {
    throw new Error("Owner wallet has no signer. Set AGENT_MNEMONIC or LEDGER_PRIVATE_KEY.");
  }

  const publicClient = createPublicClient({ chain: mantleSepolia, transport: http(rpcUrl) });
  const walletClient = createWalletClient({
    account: owner.signer,
    chain: mantleSepolia,
    transport: http(rpcUrl)
  });

  // eslint-disable-next-line no-console
  console.log(`[paymaster] deploying from ${owner.address} ...`);
  const txHash = await walletClient.deployContract({
    abi: artifact.abi as never,
    bytecode
  });
  // eslint-disable-next-line no-console
  console.log(`[paymaster] tx ${txHash}, waiting for confirmation ...`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  if (!receipt.contractAddress) throw new Error("No contractAddress in receipt.");
  const addr = receipt.contractAddress as `0x${string}`;

  await mkdir(dirname(RECORD_PATH), { recursive: true });
  await writeFile(
    RECORD_PATH,
    `${JSON.stringify(
      {
        contract: "ValidatorPaymaster",
        network: "mantle-sepolia",
        chainId: mantleSepolia.id,
        address: addr,
        owner: owner.address,
        deployedAt: new Date().toISOString(),
        txHash,
        explorerUrl: `https://sepolia.mantlescan.xyz/address/${addr}`
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  appendEnv(addr);
  // eslint-disable-next-line no-console
  console.log(`[paymaster] ValidatorPaymaster deployed at ${addr}`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
