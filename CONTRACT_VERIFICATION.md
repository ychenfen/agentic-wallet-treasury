# Mantle Explorer Contract Verification

Generated: 2026-06-01T09:17:31.510Z

Two Mantle Sepolia contracts back the DoraHacks deployment award. Both were
deployed with the npm solc-js 0.8.35 compiler; the Treasury uses via-IR (it is
stack-too-deep otherwise) and the Paymaster does not. Verify each with its own
settings below.

Both are source-verified on Mantlescan (Etherscan V2) and on Sourcify (keyless,
exact match). Run `node scripts/verify-mantlescan.mjs` with a free Etherscan V2
API key to (re)submit the Mantlescan verification.

## Verification Status

| Contract | Compiler | Sourcify | Mantlescan |
|---|---|---|---|
| AgenticTreasury | solc 0.8.35 +viaIR | match | verified |
| ValidatorPaymaster | solc 0.8.35 | exact_match | verified |

## Contracts

### AgenticTreasury

- Address: [0x739862c3cf9b5f9fe6a8ecd95e75714a20116fe9](https://sepolia.mantlescan.xyz/address/0x739862c3cf9b5f9fe6a8ecd95e75714a20116fe9)
- Deploy tx: [0x649656b3c701d809bfeac8e2ec70bd459d2fee1af52de1b6bb95bd1b20d2f190](https://sepolia.mantlescan.xyz/tx/0x649656b3c701d809bfeac8e2ec70bd459d2fee1af52de1b6bb95bd1b20d2f190)
- Compiler: solc `v0.8.35+commit.47b9dedd`, optimizer on (200 runs), via-IR `true`, EVM `default (solc 0.8.35 default)`
- Sourcify: verified (match) — [lookup](https://sourcify.dev/#/lookup/0x739862c3cf9b5f9fe6a8ecd95e75714a20116fe9)
- Mantlescan verify page: [verify AgenticTreasury](https://sepolia.mantlescan.xyz/verifyContract?a=0x739862c3cf9b5f9fe6a8ecd95e75714a20116fe9)
- Contract identifier: `AgenticTreasury.sol:AgenticTreasury`
- Standard JSON input: `contracts/verification/AgenticTreasury.standard-json-input.json`
- ABI-encoded constructor args: `0x0000000000000000000000000067f734596b61dc4565fbc6242d5e1b3cc749770000000000000000000000000000000000000000000000000de0b6b3a7640000`

### ValidatorPaymaster

- Address: [0x1b94af58b27203bc74ab749e4916d854758c7475](https://sepolia.mantlescan.xyz/address/0x1b94af58b27203bc74ab749e4916d854758c7475)
- Deploy tx: [0x329614a24ba2b6ab2869a3552bc7e7baa0fc6223e3ab5a7f0097a5d7d766688b](https://sepolia.mantlescan.xyz/tx/0x329614a24ba2b6ab2869a3552bc7e7baa0fc6223e3ab5a7f0097a5d7d766688b)
- Compiler: solc `v0.8.35+commit.47b9dedd`, optimizer on (200 runs), via-IR `false`, EVM `default (solc 0.8.35 default)`
- Sourcify: verified (exact_match) — [lookup](https://sourcify.dev/#/lookup/0x1b94af58b27203bc74ab749e4916d854758c7475)
- Mantlescan verify page: [verify ValidatorPaymaster](https://sepolia.mantlescan.xyz/verifyContract?a=0x1b94af58b27203bc74ab749e4916d854758c7475)
- Contract identifier: `ValidatorPaymaster.sol:ValidatorPaymaster`
- Standard JSON input: `contracts/verification/ValidatorPaymaster.standard-json-input.json`
- ABI-encoded constructor args: `0x`

## Keyless Sourcify Verification (already done)

```bash
# Treasury (forge / 0.8.26 + via-IR)
cd contracts && forge verify-contract 0x739862c3cf9b5f9fe6a8ecd95e75714a20116fe9 \
  src/AgenticTreasury.sol:AgenticTreasury --chain 5003 --verifier sourcify \
  --constructor-args 0x0000000000000000000000000067f734596b61dc4565fbc6242d5e1b3cc749770000000000000000000000000000000000000000000000000de0b6b3a7640000

# Paymaster (solc-js / 0.8.35, no via-IR) — submitted via scripts/verify-mantlescan.mjs
```

## Mantlescan Green-Check (needs a free Etherscan V2 API key)

1. Get a free key at https://etherscan.io/myapikey (one key covers all chains via API V2).
2. Run `ETHERSCAN_API_KEY=<key> node scripts/verify-mantlescan.mjs` to submit both
   contracts to Mantlescan through the Etherscan V2 Standard-JSON endpoint.
3. Or use the browser flow: open each verify page, choose
   `Solidity (Standard-Json-Input)`, pick the matching compiler above, enable
   optimizer with 200 runs, paste the matching `*.standard-json-input.json`, and submit.

