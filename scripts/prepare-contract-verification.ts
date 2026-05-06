/**
 * Prepare Mantlescan contract verification artefacts.
 *
 * Mantlescan currently exposes an Etherscan-style browser flow for
 * "Solidity (Standard-Json-Input)". This script creates the exact files and
 * command lines needed to verify the two demo contracts without touching
 * private keys.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

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

interface VerificationRecord {
  generatedAt: string;
  status: "prepared";
  network: "mantle-sepolia";
  chainId: 5003;
  compiler: {
    version: "0.8.26";
    optimizer: true;
    optimizerRuns: 200;
    viaIR: true;
  };
  contracts: Array<{
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
    forgeCommand: string;
  }>;
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

function writeDoc(record: VerificationRecord): void {
  const lines = [
    "# Mantlescan Contract Verification",
    "",
    `Generated: ${record.generatedAt}`,
    "",
    "This file prepares the two Mantle Sepolia contract verifications required by the DoraHacks deployment award.",
    "",
    "## Compiler Settings",
    "",
    "- Compiler: `v0.8.26+commit.8a97fa7a`",
    "- Optimization: `Yes`",
    "- Optimization runs: `200`",
    "- EVM version: `cancun`",
    "- Via IR: `true`",
    "- Verification method: `Solidity (Standard-Json-Input)`",
    "",
    "## Contracts",
    "",
    ...record.contracts.flatMap((contract) => [
      `### ${contract.name}`,
      "",
      `- Address: [${contract.address}](${contract.explorerUrl})`,
      `- Deploy tx: [${contract.deployTx}](https://sepolia.mantlescan.xyz/tx/${contract.deployTx})`,
      `- Mantlescan verify page: [verify ${contract.name}](${contract.verifyUrl})`,
      `- Contract identifier: \`${contract.contractId}\``,
      `- Standard JSON input: \`${contract.standardJsonPath}\``,
      `- ABI-encoded constructor args: \`${contract.constructorArgs}\``,
      `- Constructor args file: \`${contract.constructorArgsPath}\``,
      "",
      "Forge command:",
      "",
      "```bash",
      contract.forgeCommand,
      "```",
      ""
    ]),
    "## Manual Mantlescan Flow",
    "",
    "1. Open the verify page above.",
    "2. Choose `Solidity (Standard-Json-Input)`.",
    "3. Choose compiler `v0.8.26+commit.8a97fa7a`.",
    "4. Enable optimization and set runs to `200`.",
    "5. Paste the matching `*.standard-json-input.json` file contents.",
    "6. Paste constructor args if Mantlescan asks for them.",
    "7. Submit and wait for the green verification result.",
    "",
    "## API Note",
    "",
    "If you add an Etherscan-compatible API key, use the Forge commands above with `--watch`. Without an API key, the browser flow is the reliable path.",
    ""
  ];
  writeFileSync(DOC_PATH, `${lines.join("\n")}\n`, "utf8");
}

function main(): void {
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
  const paymasterCtor = "0x";

  const contracts = [
    {
      deployed: treasury,
      name: "AgenticTreasury",
      sourcePath: "contracts/src/AgenticTreasury.sol",
      contractId: "src/AgenticTreasury.sol:AgenticTreasury",
      constructorArgs: treasuryCtor
    },
    {
      deployed: paymaster,
      name: "ValidatorPaymaster",
      sourcePath: "contracts/src/ValidatorPaymaster.sol",
      contractId: "src/ValidatorPaymaster.sol:ValidatorPaymaster",
      constructorArgs: paymasterCtor
    }
  ] as const;

  const recordContracts: VerificationRecord["contracts"] = [];
  for (const contract of contracts) {
    const standardJson = forgeStandardJson(
      contract.deployed.address,
      contract.contractId,
      contract.constructorArgs
    );
    JSON.parse(standardJson);

    const jsonPath = resolve(VERIFICATION_DIR, `${contract.name}.standard-json-input.json`);
    const argsPath = resolve(VERIFICATION_DIR, `${contract.name}.constructor-args.txt`);
    writeFileSync(jsonPath, `${standardJson}\n`, "utf8");
    writeFileSync(argsPath, `${contract.constructorArgs}\n`, "utf8");

    const forgeCommand = [
      "cd contracts &&",
      "forge verify-contract",
      "--chain 5003",
      "--verifier etherscan",
      "--via-ir",
      "--compiler-version 0.8.26",
      "--num-of-optimizations 200",
      `--constructor-args ${contract.constructorArgs}`,
      `${contract.deployed.address} ${contract.contractId}`,
      "--watch"
    ].join(" ");

    recordContracts.push({
      name: contract.name,
      address: contract.deployed.address,
      deployTx: contract.deployed.txHash,
      explorerUrl: contract.deployed.explorerUrl,
      verifyUrl: `https://sepolia.mantlescan.xyz/verifyContract?a=${contract.deployed.address}`,
      sourcePath: contract.sourcePath,
      contractId: contract.contractId,
      standardJsonPath: `contracts/verification/${contract.name}.standard-json-input.json`,
      constructorArgs: contract.constructorArgs,
      constructorArgsPath: `contracts/verification/${contract.name}.constructor-args.txt`,
      forgeCommand
    });
  }

  const record: VerificationRecord = {
    generatedAt: new Date().toISOString(),
    status: "prepared",
    network: "mantle-sepolia",
    chainId: 5003,
    compiler: {
      version: "0.8.26",
      optimizer: true,
      optimizerRuns: 200,
      viaIR: true
    },
    contracts: recordContracts,
    notes: [
      "Mantlescan V1 API now redirects to Etherscan API V2 and requires an API key for automated source checks.",
      "The generated Standard JSON inputs are the source of truth for browser verification.",
      "ValidatorPaymaster has no constructor; its ABI-encoded constructor args are 0x."
    ]
  };

  writeFileSync(PUBLIC_RECORD, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  writeDoc(record);

  // eslint-disable-next-line no-console
  console.log(`Prepared ${record.contracts.length} verification packages.`);
  for (const contract of record.contracts) {
    // eslint-disable-next-line no-console
    console.log(`- ${contract.name}: ${contract.verifyUrl}`);
  }
  // eslint-disable-next-line no-console
  console.log(`Wrote ${DOC_PATH}`);
  // eslint-disable-next-line no-console
  console.log(`Wrote ${PUBLIC_RECORD}`);
}

main();
