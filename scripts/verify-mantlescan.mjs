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

import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const API = "https://api.etherscan.io/v2/api";
const CHAIN_ID = "5003";

const KEY = process.env.ETHERSCAN_API_KEY || process.env.MANTLESCAN_API_KEY;
if (!KEY) {
  console.error("Missing ETHERSCAN_API_KEY. Get a free key at https://etherscan.io/myapikey");
  process.exit(1);
}

const record = JSON.parse(
  await readFile(resolve(ROOT, "apps/web/public/contract-verification.json"), "utf8")
);

async function submit(contract) {
  const stdJson = await readFile(resolve(ROOT, contract.standardJsonPath), "utf8");
  const body = new URLSearchParams({
    chainid: CHAIN_ID,
    apikey: KEY,
    module: "contract",
    action: "verifysourcecode",
    codeformat: "solidity-standard-json-input",
    sourceCode: stdJson,
    contractaddress: contract.address,
    contractname: contract.contractId,
    compilerversion: contract.compiler.longVersion
  });
  const ctor = (contract.constructorArgs || "").replace(/^0x/, "");
  if (ctor.length > 0) body.set("constructorArguements", ctor);

  const res = await fetch(API, { method: "POST", body });
  const data = await res.json();
  return data;
}

async function poll(guid) {
  for (let i = 0; i < 12; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const url = `${API}?chainid=${CHAIN_ID}&module=contract&action=checkverifystatus&guid=${guid}&apikey=${KEY}`;
    const data = await fetch(url).then((r) => r.json());
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
