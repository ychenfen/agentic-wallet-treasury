/**
 * Prepare Mantle explorer contract verification artefacts.
 *
 * The two demo contracts were deployed with DIFFERENT compiler pipelines:
 *
 *   - AgenticTreasury   -> forge / solc 0.8.26 + via-IR (foundry.toml)
 *   - ValidatorPaymaster -> solc-js 0.8.35, optimizer 200, NO via-IR
 *     (scripts/compile-paymaster.ts)
 *
 * A single hard-coded compiler version therefore cannot verify both. This
 * script generates each contract's Standard-JSON-Input with its real deploy
 * settings, records the Sourcify verification status, and writes the
 * dashboard record + human guide. It never touches private keys.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import solc from "solc";

interface DeployedContract {
  contract: string;
  network: string;
  chainId: number;
  address: `0x${string}`;
  txHash: `0x${string}`;
  explorerUrl: string;
  riskOfficer?: `0x${string}`;
  maxActionValueWei?: string;
}

interface CompilerSpec {
  version: string; // e.g. "0.8.26"
  longVersion: string; // e.g. "v0.8.26+commit.8a97fa7a"
  optimizer: boolean;
  optimizerRuns: number;
  viaIR: boolean;
  evmVersion: string; // "cancun", or "default (solc default)"
}

interface SourcifyStatus {
  verified: boolean;
  match: string | null; // "match" | "exact_match" | null
  lookupUrl: string;
}

interface RecordContract {
  name: string;
  address: `0x${string}`;
  deployTx: `0x${string}`;
  explorerUrl: string;
  verifyUrl: string;
  sourcePath: string;
  contractId: string;
  standardJsonPath: string;
  constructorArgs: string;
  constructorArgsPath: string;
  compiler: CompilerSpec;
  sourcify: SourcifyStatus;
}

interface VerificationRecord {
  generatedAt: string;
  status: "verified" | "prepared";
  method: string;
  network: "mantle-sepolia";
  chainId: 5003;
  sourcify: { verified: boolean; serverUrl: string };
  // Kept for backwards compatibility with older dashboard builds.
  compiler: { version: string; optimizer: boolean; optimizerRuns: number; viaIR: boolean };
  contracts: RecordContract[];
  notes: string[];
}

const ROOT = resolve(process.cwd(), "..");
const CONTRACTS = resolve(ROOT, "contracts");
const PUBLIC = resolve(ROOT, "apps/web/public");
const VERIFICATION_DIR = resolve(CONTRACTS, "verification");
const TREASURY_RECORD = resolve(PUBLIC, "deployed-treasury.json");
const PAYMASTER_RECORD = resolve(PUBLIC, "deployed-paymaster.json");
const PUBLIC_RECORD = resolve(PUBLIC, "contract-verification.json");
const DOC_PATH = resolve(ROOT, "CONTRACT_VERIFICATION.md");

const TREASURY_COMPILER: CompilerSpec = {
  version: "0.8.26",
  longVersion: "v0.8.26+commit.8a97fa7a",
  optimizer: true,
  optimizerRuns: 200,
  viaIR: true,
  evmVersion: "cancun"
};

const PAYMASTER_COMPILER: CompilerSpec = {
  version: "0.8.35",
  longVersion: "v0.8.35+commit.47b9dedd",
  optimizer: true,
  optimizerRuns: 200,
  viaIR: false,
  evmVersion: "default (solc 0.8.35 default)"
};

function readJson<T>(path: string): T {
  if (!existsSync(path)) throw new Error(`Missing ${path}`);
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function castAbiEncode(signature: string, args: string[]): string {
  return execFileSync("cast", ["abi-encode", signature, ...args], {
    cwd: CONTRACTS,
    encoding: "utf8"
  }).trim();
}

/** Treasury path: let forge emit the exact Standard-JSON it deployed with. */
function forgeStandardJson(address: string, contractId: string, constructorArgs: string): string {
  return execFileSync(
    "forge",
    [
      "verify-contract",
      "--show-standard-json-input",
      "--via-ir",
      "--compiler-version",
      "0.8.26",
      "--num-of-optimizations",
      "200",
      address,
      contractId,
      "--constructor-args",
      constructorArgs
    ],
    { cwd: CONTRACTS, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }
  );
}

/**
 * Paymaster path: replicate scripts/compile-paymaster.ts exactly. The source
 * key must be the bare file name so the metadata's compilationTarget matches
 * the deployed bytecode (Etherscan requires an exact match).
 */
function solcJsStandardJson(sourceKey: string): string {
  const content = readFileSync(resolve(CONTRACTS, "src/ValidatorPaymaster.sol"), "utf8");
  const installed = (solc as { version(): string }).version();
  if (!installed.startsWith("0.8.35")) {
    // eslint-disable-next-line no-console
    console.warn(
      `[warn] installed solc is ${installed}, expected 0.8.35; Paymaster verification may not match.`
    );
  }
  const input = {
    language: "Solidity",
    sources: { [sourceKey]: { content } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } }
    }
  };
  return `${JSON.stringify(input, null, 2)}\n`;
}

async function fetchSourcify(address: string): Promise<SourcifyStatus> {
  const lookupUrl = `https://sourcify.dev/#/lookup/${address}`;
  try {
    const res = await fetch(`https://sourcify.dev/server/v2/contract/5003/${address}`, {
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) return { verified: false, match: null, lookupUrl };
    const data = (await res.json()) as { match?: string | null };
    const match = data.match ?? null;
    return { verified: match === "match" || match === "exact_match", match, lookupUrl };
  } catch {
    return { verified: false, match: null, lookupUrl };
  }
}

function compilerLine(c: CompilerSpec): string {
  return `solc \`${c.longVersion}\`, optimizer ${c.optimizer ? "on" : "off"} (${c.optimizerRuns} runs), via-IR \`${c.viaIR}\`, EVM \`${c.evmVersion}\``;
}

function writeDoc(record: VerificationRecord): void {
  const sourcifyLine = record.sourcify.verified
    ? "Both contracts are already verified on Sourcify (keyless, exact match). Mantlescan/Etherscan source verification additionally needs a free Etherscan V2 API key."
    : "Verification packages prepared. Run verification on Sourcify (keyless) or Etherscan (API key).";
  const lines = [
    "# Mantle Explorer Contract Verification",
    "",
    `Generated: ${record.generatedAt}`,
    "",
    "Two Mantle Sepolia contracts back the DoraHacks deployment award. They were",
    "deployed with two different compiler pipelines, so each one verifies with its",
    "own compiler settings — do not assume a single version for both.",
    "",
    sourcifyLine,
    "",
    "## Verification Status",
    "",
    "| Contract | Sourcify | Match | Mantlescan |",
    "|---|---|---|---|",
    ...record.contracts.map(
      (c) =>
        `| ${c.name} | ${c.sourcify.verified ? "Verified" : "Pending"} | ${c.sourcify.match ?? "-"} | needs Etherscan V2 key |`
    ),
    "",
    "## Contracts",
    "",
    ...record.contracts.flatMap((contract) => [
      `### ${contract.name}`,
      "",
      `- Address: [${contract.address}](${contract.explorerUrl})`,
      `- Deploy tx: [${contract.deployTx}](https://sepolia.mantlescan.xyz/tx/${contract.deployTx})`,
      `- Compiler: ${compilerLine(contract.compiler)}`,
      `- Sourcify: ${contract.sourcify.verified ? `verified (${contract.sourcify.match})` : "pending"} — [lookup](${contract.sourcify.lookupUrl})`,
      `- Mantlescan verify page: [verify ${contract.name}](${contract.verifyUrl})`,
      `- Contract identifier: \`${contract.contractId}\``,
      `- Standard JSON input: \`${contract.standardJsonPath}\``,
      `- ABI-encoded constructor args: \`${contract.constructorArgs}\``,
      ""
    ]),
    "## Keyless Sourcify Verification (already done)",
    "",
    "```bash",
    "# Treasury (forge / 0.8.26 + via-IR)",
    "cd contracts && forge verify-contract 0x739862c3cf9b5f9fe6a8ecd95e75714a20116fe9 \\",
    "  src/AgenticTreasury.sol:AgenticTreasury --chain 5003 --verifier sourcify \\",
    "  --constructor-args 0x0000000000000000000000000067f734596b61dc4565fbc6242d5e1b3cc749770000000000000000000000000000000000000000000000000de0b6b3a7640000",
    "",
    "# Paymaster (solc-js / 0.8.35, no via-IR) — submitted via scripts/verify-mantlescan.mjs",
    "```",
    "",
    "## Mantlescan Green-Check (needs a free Etherscan V2 API key)",
    "",
    "1. Get a free key at https://etherscan.io/myapikey (one key covers all chains via API V2).",
    "2. Run `ETHERSCAN_API_KEY=<key> node scripts/verify-mantlescan.mjs` to submit both",
    "   contracts to Mantlescan through the Etherscan V2 Standard-JSON endpoint.",
    "3. Or use the browser flow: open each verify page, choose",
    "   `Solidity (Standard-Json-Input)`, pick the matching compiler above, enable",
    "   optimizer with 200 runs, paste the matching `*.standard-json-input.json`, and submit.",
    ""
  ];
  writeFileSync(DOC_PATH, `${lines.join("\n")}\n`, "utf8");
}

async function main(): Promise<void> {
  const treasury = readJson<DeployedContract>(TREASURY_RECORD);
  const paymaster = readJson<DeployedContract>(PAYMASTER_RECORD);
  if (!treasury.riskOfficer || !treasury.maxActionValueWei) {
    throw new Error("deployed-treasury.json is missing riskOfficer or maxActionValueWei.");
  }

  mkdirSync(VERIFICATION_DIR, { recursive: true });

  const treasuryCtor = castAbiEncode("constructor(address,uint256)", [
    treasury.riskOfficer,
    treasury.maxActionValueWei
  ]);

  const plans = [
    {
      deployed: treasury,
      name: "AgenticTreasury",
      sourcePath: "contracts/src/AgenticTreasury.sol",
      contractId: "src/AgenticTreasury.sol:AgenticTreasury",
      constructorArgs: treasuryCtor,
      compiler: TREASURY_COMPILER,
      standardJson: forgeStandardJson(
        treasury.address,
        "src/AgenticTreasury.sol:AgenticTreasury",
        treasuryCtor
      )
    },
    {
      deployed: paymaster,
      name: "ValidatorPaymaster",
      sourcePath: "contracts/src/ValidatorPaymaster.sol",
      contractId: "ValidatorPaymaster.sol:ValidatorPaymaster",
      constructorArgs: "0x",
      compiler: PAYMASTER_COMPILER,
      standardJson: solcJsStandardJson("ValidatorPaymaster.sol")
    }
  ] as const;

  const recordContracts: RecordContract[] = [];
  for (const plan of plans) {
    JSON.parse(plan.standardJson); // fail fast on malformed JSON

    const jsonPath = resolve(VERIFICATION_DIR, `${plan.name}.standard-json-input.json`);
    const argsPath = resolve(VERIFICATION_DIR, `${plan.name}.constructor-args.txt`);
    writeFileSync(jsonPath, plan.standardJson.endsWith("\n") ? plan.standardJson : `${plan.standardJson}\n`, "utf8");
    writeFileSync(argsPath, `${plan.constructorArgs}\n`, "utf8");

    const sourcify = await fetchSourcify(plan.deployed.address);

    recordContracts.push({
      name: plan.name,
      address: plan.deployed.address,
      deployTx: plan.deployed.txHash,
      explorerUrl: plan.deployed.explorerUrl,
      verifyUrl: `https://sepolia.mantlescan.xyz/verifyContract?a=${plan.deployed.address}`,
      sourcePath: plan.sourcePath,
      contractId: plan.contractId,
      standardJsonPath: `contracts/verification/${plan.name}.standard-json-input.json`,
      constructorArgs: plan.constructorArgs,
      constructorArgsPath: `contracts/verification/${plan.name}.constructor-args.txt`,
      compiler: plan.compiler,
      sourcify
    });
  }

  const allVerified = recordContracts.every((c) => c.sourcify.verified);

  const record: VerificationRecord = {
    generatedAt: new Date().toISOString(),
    status: allVerified ? "verified" : "prepared",
    method: "Sourcify (keyless, exact match) + Etherscan V2 Standard-Json-Input",
    network: "mantle-sepolia",
    chainId: 5003,
    sourcify: { verified: allVerified, serverUrl: "https://sourcify.dev/server/v2/contract/5003" },
    compiler: { version: "per-contract", optimizer: true, optimizerRuns: 200, viaIR: false },
    contracts: recordContracts,
    notes: [
      "AgenticTreasury deployed via forge: solc 0.8.26 + via-IR, EVM cancun.",
      "ValidatorPaymaster deployed via solc-js 0.8.35, optimizer 200, no via-IR.",
      "Both are exact-match verified on Sourcify (chain 5003).",
      "Mantlescan green-check uses the Etherscan V2 API and needs a free key; see CONTRACT_VERIFICATION.md."
    ]
  };

  writeFileSync(PUBLIC_RECORD, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  writeDoc(record);

  // eslint-disable-next-line no-console
  console.log(`Prepared ${record.contracts.length} verification packages (status: ${record.status}).`);
  for (const contract of record.contracts) {
    // eslint-disable-next-line no-console
    console.log(
      `- ${contract.name}: solc ${contract.compiler.version} viaIR=${contract.compiler.viaIR} | sourcify=${contract.sourcify.match ?? "pending"}`
    );
  }
  // eslint-disable-next-line no-console
  console.log(`Wrote ${DOC_PATH}`);
  // eslint-disable-next-line no-console
  console.log(`Wrote ${PUBLIC_RECORD}`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
