import type { ExecutionAdapter } from "./types.js";
import { mockAdapter } from "./mock.js";
import { createByrealAdapter } from "./byreal.js";
import { createMantleSepoliaAdapter } from "./mantle-sepolia.js";
import type { AgentWallet } from "../wallets.js";

export type ExecutorChoice = "auto" | "mock" | "byreal" | "mantle-sepolia";

export interface ExecutorFactoryOptions {
  riskWallet?: AgentWallet;
  treasuryAddress?: `0x${string}`;
}

/**
 * Pick an executor adapter.
 *
 * Default behaviour ("auto"):
 *   - If TREASURY_ADDRESS + risk + executor wallets are present  -> mantle-sepolia
 *   - Else if BYREAL_MODE is set                                  -> byreal
 *   - Else                                                        -> mock
 */
export function selectExecutor(
  choice: ExecutorChoice,
  options: ExecutorFactoryOptions = {}
): ExecutionAdapter {
  if (choice === "mock") return mockAdapter;
  if (choice === "byreal") return createByrealAdapter();
  if (choice === "mantle-sepolia") {
    return createMantleSepoliaAdapter({
      riskWallet: options.riskWallet,
      treasuryAddress: options.treasuryAddress
    });
  }

  // auto
  if (process.env.TREASURY_ADDRESS && options.riskWallet?.signer) {
    return createMantleSepoliaAdapter({
      riskWallet: options.riskWallet,
      treasuryAddress: options.treasuryAddress
    });
  }
  if (process.env.BYREAL_MODE) return createByrealAdapter();
  return mockAdapter;
}

export { mockAdapter, createByrealAdapter, createMantleSepoliaAdapter };
export type { ExecutionAdapter, ExecutionContext } from "./types.js";
