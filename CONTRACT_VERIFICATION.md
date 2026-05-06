# Mantlescan Contract Verification

Generated: 2026-05-06T08:43:46.191Z

This file prepares the two Mantle Sepolia contract verifications required by the DoraHacks deployment award.

## Compiler Settings

- Compiler: `v0.8.26+commit.8a97fa7a`
- Optimization: `Yes`
- Optimization runs: `200`
- EVM version: `cancun`
- Via IR: `true`
- Verification method: `Solidity (Standard-Json-Input)`

## Contracts

### AgenticTreasury

- Address: [0x739862c3cf9b5f9fe6a8ecd95e75714a20116fe9](https://sepolia.mantlescan.xyz/address/0x739862c3cf9b5f9fe6a8ecd95e75714a20116fe9)
- Deploy tx: [0x649656b3c701d809bfeac8e2ec70bd459d2fee1af52de1b6bb95bd1b20d2f190](https://sepolia.mantlescan.xyz/tx/0x649656b3c701d809bfeac8e2ec70bd459d2fee1af52de1b6bb95bd1b20d2f190)
- Mantlescan verify page: [verify AgenticTreasury](https://sepolia.mantlescan.xyz/verifyContract?a=0x739862c3cf9b5f9fe6a8ecd95e75714a20116fe9)
- Contract identifier: `src/AgenticTreasury.sol:AgenticTreasury`
- Standard JSON input: `contracts/verification/AgenticTreasury.standard-json-input.json`
- ABI-encoded constructor args: `0x0000000000000000000000000067f734596b61dc4565fbc6242d5e1b3cc749770000000000000000000000000000000000000000000000000de0b6b3a7640000`
- Constructor args file: `contracts/verification/AgenticTreasury.constructor-args.txt`

Forge command:

```bash
cd contracts && forge verify-contract --chain 5003 --verifier etherscan --via-ir --compiler-version 0.8.26 --num-of-optimizations 200 --constructor-args 0x0000000000000000000000000067f734596b61dc4565fbc6242d5e1b3cc749770000000000000000000000000000000000000000000000000de0b6b3a7640000 0x739862c3cf9b5f9fe6a8ecd95e75714a20116fe9 src/AgenticTreasury.sol:AgenticTreasury --watch
```

### ValidatorPaymaster

- Address: [0x1b94af58b27203bc74ab749e4916d854758c7475](https://sepolia.mantlescan.xyz/address/0x1b94af58b27203bc74ab749e4916d854758c7475)
- Deploy tx: [0x329614a24ba2b6ab2869a3552bc7e7baa0fc6223e3ab5a7f0097a5d7d766688b](https://sepolia.mantlescan.xyz/tx/0x329614a24ba2b6ab2869a3552bc7e7baa0fc6223e3ab5a7f0097a5d7d766688b)
- Mantlescan verify page: [verify ValidatorPaymaster](https://sepolia.mantlescan.xyz/verifyContract?a=0x1b94af58b27203bc74ab749e4916d854758c7475)
- Contract identifier: `src/ValidatorPaymaster.sol:ValidatorPaymaster`
- Standard JSON input: `contracts/verification/ValidatorPaymaster.standard-json-input.json`
- ABI-encoded constructor args: `0x`
- Constructor args file: `contracts/verification/ValidatorPaymaster.constructor-args.txt`

Forge command:

```bash
cd contracts && forge verify-contract --chain 5003 --verifier etherscan --via-ir --compiler-version 0.8.26 --num-of-optimizations 200 --constructor-args 0x 0x1b94af58b27203bc74ab749e4916d854758c7475 src/ValidatorPaymaster.sol:ValidatorPaymaster --watch
```

## Manual Mantlescan Flow

1. Open the verify page above.
2. Choose `Solidity (Standard-Json-Input)`.
3. Choose compiler `v0.8.26+commit.8a97fa7a`.
4. Enable optimization and set runs to `200`.
5. Paste the matching `*.standard-json-input.json` file contents.
6. Paste constructor args if Mantlescan asks for them.
7. Submit and wait for the green verification result.

## API Note

If you add an Etherscan-compatible API key, use the Forge commands above with `--watch`. Without an API key, the browser flow is the reliable path.

