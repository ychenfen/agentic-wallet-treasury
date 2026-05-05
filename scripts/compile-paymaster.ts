import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import solc from "solc";

const ROOT = resolve(process.cwd(), "..");
const SOURCE_PATH = resolve(ROOT, "contracts/src/ValidatorPaymaster.sol");
const ARTIFACT_PATH = resolve(ROOT, "contracts/out/ValidatorPaymaster.sol/ValidatorPaymaster.json");

interface SolcOutput {
  errors?: Array<{ severity: "error" | "warning"; formattedMessage: string }>;
  contracts?: Record<string, Record<string, { abi: unknown; evm: { bytecode: { object: string } } }>>;
}

async function main(): Promise<void> {
  const source = await readFile(SOURCE_PATH, "utf8");
  const input = {
    language: "Solidity",
    sources: {
      "ValidatorPaymaster.sol": {
        content: source
      }
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode.object"]
        }
      }
    }
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input))) as SolcOutput;
  const errors = output.errors ?? [];
  for (const error of errors) {
    // eslint-disable-next-line no-console
    console.error(error.formattedMessage.trim());
  }
  if (errors.some((error) => error.severity === "error")) {
    throw new Error("Solidity compilation failed.");
  }

  const contract = output.contracts?.["ValidatorPaymaster.sol"]?.ValidatorPaymaster;
  if (!contract) throw new Error("ValidatorPaymaster contract output missing.");

  await mkdir(dirname(ARTIFACT_PATH), { recursive: true });
  await writeFile(
    ARTIFACT_PATH,
    `${JSON.stringify(
      {
        abi: contract.abi,
        bytecode: {
          object: `0x${contract.evm.bytecode.object}`
        }
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  // eslint-disable-next-line no-console
  console.log(`[compile] wrote ${ARTIFACT_PATH}`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
