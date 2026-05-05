# contracts

Minimal Solidity used by the Agentic Wallet Treasury demo.

- `src/AgenticTreasury.sol` — single contract that enforces an EIP-712
  approval from the Risk Officer before the Executor (whoever calls
  `executeApprovedAction`) can run `target.call{value}(data)`.
- `test/AgenticTreasury.t.sol` — Foundry tests for the happy path and every
  revert path (replay, expired deadline, value cap, data-hash mismatch,
  invalid signature, risk-officer rotation).

## First-time setup

```bash
# install foundry once (https://getfoundry.sh)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# pull forge-std so the tests compile without creating a git submodule
cd contracts
forge install foundry-rs/forge-std --no-git --shallow
```

## Run

```bash
forge build
forge test -vv
```

## Deploy to Mantle Sepolia

```bash
export PRIVATE_KEY=0x...                  # owner key
export RISK_OFFICER=0x...                 # Guard wallet address
export MAX_ACTION_VALUE=10000000000000000 # 0.01 ETH equivalent

forge create src/AgenticTreasury.sol:AgenticTreasury \
  --rpc-url https://rpc.sepolia.mantle.xyz \
  --private-key $PRIVATE_KEY \
  --constructor-args $RISK_OFFICER $MAX_ACTION_VALUE

# Copy the deployed address into TREASURY_ADDRESS in .env.
```

## EIP-712 reference

```
EIP712Domain(string name, string version, uint256 chainId, address verifyingContract)
  name              = "AgenticTreasury"
  version           = "1"
  verifyingContract = <treasury address>

ApprovedAction(
  bytes32 actionId,
  address target,
  uint256 value,
  bytes32 dataHash,
  bytes32 policyHash,
  uint256 deadline,
  uint256 nonce
)
```

The `MantleSepolia` execution adapter in `packages/core/src/executors/mantle-sepolia.ts`
matches this exact domain and primary type, so off-chain and on-chain stay in sync.
