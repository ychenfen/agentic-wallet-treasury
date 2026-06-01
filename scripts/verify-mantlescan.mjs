/**
 * Verify both contracts on Mantlescan via the Etherscan V2 unified API.
 *
 * Mantlescan is an Etherscan-family explorer. Etherscan API V2 covers every
 * chain (including Mantle Sepolia, chainid 5003) through one endpoint and one
 * free key. This reads the already-generated Standard-JSON packages and each
 * contract's real compiler version, then submits + polls.
 *
 * Usage:
 *   ETHERSCAN_API_KEY=<key> node scripts/verify-mantlescan.mjs
 *
 * Get a free key at https://etherscan.io/myapikey (no funds, no contract
 * ownership proof needed for source verification).
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

// Use curl for HTTP so the system HTTP(S)_PROXY is honored (Node fetch ignores
// proxy env vars by default, which times out behind a local proxy).
const pexec = promisify(execFile);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const API = "https://api.etherscan.io/v2/api";
const CHAIN_ID = "5003";

/** Read ETHERSCAN_API_KEY / MANTLESCAN_API_KEY straight from the gitignored
 *  .env so the key never has to be exported or pasted anywhere. */
function keyFromEnvFile() {
  const envPath = resolve(ROOT, ".env");
  if (!existsSync(envPath)) return undefined;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*(?:ETHERSCAN_API_KEY|MANTLESCAN_API_KEY)\s*=\s*(.+?)\s*$/);
    if (m) return m[1].replace(/^["']|["']$/g, "");
  }
  return undefined;
}

const KEY = process.env.ETHERSCAN_API_KEY || process.env.MANTLESCAN_API_KEY || keyFromEnvFile();
if (!KEY) {
  console.error(
    "Missing ETHERSCAN_API_KEY. Get a free key at https://etherscan.io/myapikey, then add\n" +
      "  ETHERSCAN_API_KEY=yourkey\n" +
      "to the project .env (gitignored) and re-run."
  );
  process.exit(1);
}

const record = JSON.parse(
  readFileSync(resolve(ROOT, "apps/web/public/contract-verification.json"), "utf8")
);

async function curlJson(args) {
  const { stdout } = await pexec("curl", args, { maxBuffer: 16 * 1024 * 1024 });
  return JSON.parse(stdout);
}

async function submit(contract) {
  const stdPath = resolve(ROOT, contract.standardJsonPath);
  const fields = {
    chainid: CHAIN_ID,
    apikey: KEY,
    module: "contract",
    action: "verifysourcecode",
    codeformat: "solidity-standard-json-input",
    contractaddress: contract.address,
    contractname: contract.contractId,
    compilerversion: contract.compiler.longVersion
  };
  const postUrl = `${API}?chainid=${CHAIN_ID}`; // V2 requires chainid in the query string
  const args = ["-s", "--max-time", "90", "-X", "POST", postUrl, "--data-urlencode", `sourceCode@${stdPath}`];
  for (const [k, v] of Object.entries(fields)) args.push("--data-urlencode", `${k}=${v}`);
  const ctor = (contract.constructorArgs || "").replace(/^0x/, "");
  if (ctor.length > 0) args.push("--data-urlencode", `constructorArguements=${ctor}`);
  return curlJson(args);
}

async function poll(guid) {
  for (let i = 0; i < 12; i++) {
    await sleep(5000);
    const url = `${API}?chainid=${CHAIN_ID}&module=contract&action=checkverifystatus&guid=${guid}&apikey=${KEY}`;
    let data;
    try {
      data = await curlJson(["-s", "--max-time", "30", url]);
    } catch {
      continue;
    }
    const result = String(data.result || "");
    if (result.includes("Pending")) continue;
    return data;
  }
  return { status: "0", result: "timeout polling" };
}

for (const contract of record.contracts) {
  console.log(`\n=== ${contract.name} (${contract.address}) — solc ${contract.compiler.longVersion} ===`);
  const sub = await submit(contract);
  if (sub.status !== "1") {
    // status "1" => accepted with GUID; otherwise message explains why
    if (String(sub.result || "").toLowerCase().includes("already verified")) {
      console.log("Already verified on Mantlescan.");
      continue;
    }
    console.log("submit failed:", sub.message, "-", sub.result);
    continue;
  }
  console.log("submitted, guid:", sub.result);
  const final = await poll(sub.result);
  console.log("result:", final.result);
  console.log("page:", `https://sepolia.mantlescan.xyz/address/${contract.address}#code`);
}
