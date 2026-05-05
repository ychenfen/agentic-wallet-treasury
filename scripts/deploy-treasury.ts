/**
 * Deploy AgenticTreasury to Mantle Sepolia.
 *
 * Reads the Foundry build artifact at contracts/out/AgenticTreasury.sol/
 * AgenticTreasury.json. If the artifact is missing, auto-runs `forge build`
 * inside contracts/. The deployer (msg.sender) becomes the contract owner.
 *
 * Constructor args:
 *   initialRiskOfficer = Guard agent address from loadAgentWallets
 *   initialMaxActionValueWei = MAX_ACTION_VALUE env (default 1 ETH = 1e18 wei)
 *
 * On success the script writes:
 *   apps/web/public/deployed-treasury.json   (canonical record for dashboard)
 *   appends TREASURY_ADDRESS=<addr> to .env (does NOT overwrite existing line)
 *
 * Usage:
 *   npm run deploy-treasury                 # broadcasts
 *   DRY_RUN=1 npm run deploy-treasury       # prints constructor args + bytecode size and exits
 */

import { existsSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { spawn } from "node:child_process";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  type Hex
} from "viem";
import { mantleSepoliaTestnet as mantleSepolia } from "viem/chains";
import { loadAgentWallets, loadProjectEnv } from "@clawdao/core/node";

const ROOT = resolve(process.cwd(), "..");
const CONTRACTS_DIR = resolve(ROOT, "contracts");
const ARTIFACT_PATH = resolve(CONTRACTS_DIR, "out/AgenticTreasury.sol/AgenticTreasury.json");
const RECORD_PATH = resolve(ROOT, "apps/web/public/deployed-treasury.json");
const ENV_PATH = resolve(ROOT, ".env");

interface ForgeArtifact {
  abi: unknown;
  bytecode: { object: Hex } | Hex;
}

async function ensureArtifact(): Promise<ForgeArtifact> {
  if (!existsSync(ARTIFACT_PATH)) {
    // eslint-disable-next-line no-console
    console.log(`[deploy] artifact not found, running 'forge build' in ${CONTRACTS_DIR} ...`);
    await run("forge", ["build"], CONTRACTS_DIR);
  }
  return JSON.parse(readFileSync(ARTIFACT_PATH, "utf8")) as ForgeArtifact;
}

function run(command: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, { cwd, env: process.env, stdio: "inherit" });
    child.on("error", rejectRun);
    child.on("close", (code) => {
      if (code === 0) resolveRun();
      else rejectRun(new Error(`${command} ${args.join(" ")} exited with ${code}`));
    });
  });
}

function bytecodeOf(artifact: ForgeArtifact): Hex {
  const raw = (artifact.bytecode as { object?: Hex } | Hex);
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && raw && "object" in raw && raw.object) return raw.object as Hex;
  throw new Error("Could not find bytecode in forge artifact.");
}

function appendEnv(addr: `0x${string}`): void {
  if (!existsSync(ENV_PATH)) {
    writeFileSync(ENV_PATH, `TREASURY_ADDRESS=${addr}\n`, { encoding: "utf8" });
    return;
  }
  const text = readFileSync(ENV_PATH, "utf8");
  if (text.includes("TREASURY_ADDRESS=")) {
    // eslint-disable-next-line no-console
    console.log(`[deploy] .env already contains TREASURY_ADDRESS; not overwriting. New address: ${addr}`);
    return;
  }
  appendFileSync(ENV_PATH, `${text.endsWith("\n") ? "" : "\n"}TREASURY_ADDRESS=${addr}\n`);
}

async function main(): Promise<void> {
  loadProjectEnv({ includeGenerated: true });
  const dryRun = process.env.DRY_RUN === "1";
  const rpcUrl = process.env.MANTLE_SEPOLIA_RPC_URL ?? "https://rpc.sepolia.mantle.xyz";
  const maxValue = process.env.MAX_ACTION_VALUE
    ? BigInt(process.env.MAX_ACTION_VALUE)
    : parseEther("1");

  const wallets = loadAgentWallets({ allowEphemeral: dryRun });
  const owner = wallets.find((w) => w.slug === "auditor"); // Ledger acts as deployer/owner
  const guard = wallets.find((w) => w.slug === "risk");
  if (!owner || !guard) throw new Error("Need both auditor and risk wallets.");

  if (dryRun) {
    // Dry-run: don't require forge to be installed. Just print what we'd do.
    let bytecodeSizeBytes: number | "unknown" = "unknown";
    if (existsSync(ARTIFACT_PATH)) {
      try {
        const a = JSON.parse(readFileSync(ARTIFACT_PATH, "utf8")) as ForgeArtifact;
        bytecodeSizeBytes = (bytecodeOf(a).length - 2) / 2;
      } catch {
        bytecodeSizeBytes = "unknown";
      }
    }
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({
      mode: "dry-run",
      from: owner.address,
      ownerSlug: "auditor (Ledger)",
      riskOfficer: guard.address,
      riskOfficerSlug: "risk (Guard)",
      maxActionValueWei: maxValue.toString(),
      bytecodeSizeBytes,
      note: "Dry-run skips forge build. Run without DRY_RUN to broadcast."
    }, null, 2));
    return;
  }

  const artifact = await ensureArtifact();
  const bytecode = bytecodeOf(artifact);
  const abi = artifact.abi as readonly unknown[];

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
  console.log(`[deploy] sending deploy tx from ${owner.address} ...`);
  const txHash = await walletClient.deployContract({
    abi: abi as never,
    bytecode,
    args: [guard.address, maxValue]
  });
  // eslint-disable-next-line no-console
  console.log(`[deploy] tx ${txHash}, waiting for confirmation ...`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  if (!receipt.contractAddress) throw new Error("No contractAddress in receipt.");
  const addr = receipt.contractAddress as `0x${string}`;

  // eslint-disable-next-line no-console
  console.log(`[deploy] AgenticTreasury deployed at ${addr}`);

  await mkdir(dirname(RECORD_PATH), { recursive: true });
  await writeFile(
    RECORD_PATH,
    `${JSON.stringify(
      {
        contract: "AgenticTreasury",
        network: "mantle-sepolia",
        chainId: mantleSepolia.id,
        address: addr,
        owner: owner.address,
        riskOfficer: guard.address,
        maxActionValueWei: maxValue.toString(),
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
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
