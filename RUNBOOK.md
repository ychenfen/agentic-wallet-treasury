# On-chain rehearsal runbook

> Goal: produce a real Mantle Sepolia trail — five ERC-8004 registrations, one
> deployed Treasury, one approved + executed action, five reputation feedbacks,
> one validation request + response — and capture every tx hash into
> `SUBMISSION_HASHES.md` so judges can verify every claim on mantlescan.
>
> Time budget: 30–60 minutes the first time, 10 minutes once you've done it once.

## 0 — Prerequisites

- Node ≥ 20 + npm.
- Optional: Foundry (`curl -L https://foundry.paradigm.xyz | bash && foundryup`) if you want to run the Solidity test suite. Deployment can use the npm `solc` compiler path.
- A browser pointed at the [Mantle Sepolia faucet](https://faucet.sepolia.mantle.xyz/).
- 5 minutes of testnet MNT availability — the public faucet sometimes rate-limits.

## 1 — Generate wallets & sanity-check env

```bash
GENERATE_MNEMONIC=1 npm run wallets
```

This writes `.env.generated` with a fresh `AGENT_MNEMONIC` and prints the five
derived addresses (`m/44'/60'/0'/0/{0..4}`). Copy `.env.generated` to `.env`.

Expected output:

```
researcher   0x...   m/44'/60'/0'/0/0
risk         0x...   m/44'/60'/0'/0/1
executor     0x...   m/44'/60'/0'/0/2
auditor      0x...   m/44'/60'/0'/0/3
validator    0x...   m/44'/60'/0'/0/4
```

Then:

```bash
cp .env.generated .env
echo "MANTLE_SEPOLIA_RPC_URL=https://rpc.sepolia.mantle.xyz" >> .env
```

If the public RPC is rate-limiting you, swap in a paid endpoint (Alchemy /
QuickNode / dRPC).

## 2 — Fund all five wallets

Open the faucet and request testnet MNT for each derived address.

Then verify:

```bash
npm run balance
```

Expected: every wallet ≥ 0.05 MNT, exit code 0. If not, the script tells you
which wallet is short and the explorer link to confirm.

| Failure | Fix |
|---|---|
| All zero | Faucet didn't deliver. Wait 60 s and request again. |
| 4/5 funded | Faucet usually has a per-IP daily cap. Use a different IP or run another faucet. |
| Connection error | RPC down. Switch `MANTLE_SEPOLIA_RPC_URL` to a paid provider. |

## 3 — Deploy AgenticTreasury

```bash
DRY_RUN=1 npm run deploy-treasury    # sanity-check constructor args
npm run deploy-treasury              # broadcasts
```

The script:
1. uses `contracts/out/AgenticTreasury.sol/AgenticTreasury.json`; run `npm run compile-treasury` first if it is missing
2. deploys with `(riskOfficer = Guard address, maxActionValueWei = 1 ether)`
3. waits for receipt
4. writes `apps/web/public/deployed-treasury.json`
5. appends `TREASURY_ADDRESS=0x…` to `.env` (does not overwrite an existing value)

Expected output:

```
[deploy] sending deploy tx from 0x...
[deploy] tx 0x..., waiting for confirmation ...
[deploy] AgenticTreasury deployed at 0x...
```

| Failure | Fix |
|---|---|
| missing artifact | Run `npm run compile-treasury`, then retry deployment. |
| `insufficient funds` | Auditor (Ledger) wallet is short — that's the deployer slot. Top it up. |
| `nonce too low` | Another tx is in flight from the same wallet; wait 30 s, retry. |

## 4 — Register the five agents

```bash
DRY_RUN=1 AGENT_URI_MODE=data npm run register   # prints calldata + base64 URIs
npm run register                                  # broadcasts five register() txs
```

The script broadcasts five `register(string agentURI)` txs, one per wallet,
to `0x8004A818BFB912233c491871b3d84c89A494BD9e` (Mantle Sepolia
IdentityRegistry). On success it writes
`apps/web/public/agent-ids.json` with the real `agentId` decoded from each
`Registered` event.

Expected output:

```
[register] researcher <- 0x... -> tx 0x...
[register] risk       <- 0x... -> tx 0x...
[register] executor   <- 0x... -> tx 0x...
[register] auditor    <- 0x... -> tx 0x...
[register] validator  <- 0x... -> tx 0x...
[register] wrote 5 agent IDs to apps/web/public/agent-ids.json
```

| Failure | Fix |
|---|---|
| `Could not decode Registered event` | RPC ate the receipt. Re-fetch with `npm run verify` or just re-run; the registry rejects duplicate URIs but you'll get a fresh agentId for any new URI. |
| `insufficient funds` | One of the five wallets is short. Run `npm run balance`, top up, retry. |

## 5 — Real on-chain execution

```bash
EXECUTOR=mantle-sepolia npm run demo
```

Now the runner uses the `mantle-sepolia` adapter, which:
1. computes EIP-712 `ApprovedAction` digest
2. Guard wallet signs it
3. Claw wallet calls `executeApprovedAction(approval, data, signature)`
4. tx hash + explorer link end up in `demo-run.json`

Expected output:

```
[demo] cycle=N scenario=… adapter=mantle-sepolia status=submitted validation=…
```

If you see `status=skipped` even with `EXECUTOR=mantle-sepolia`, run
`npm run preflight` — the adapter falls back when prerequisites are missing.

## 6 — Reputation feedback

```bash
DRY_RUN=1 npm run feedback
npm run feedback
```

Five `giveFeedback()` txs. ERC-8004 rejects self-feedback, so Ledger scores
Scout / Guard / Claw / Sentinel, and Sentinel scores Ledger. Confirm with
`npm run verify` afterwards — `feedbackCount` should jump.

## 7 — ValidationRegistry round-trip

```bash
DRY_RUN=1 npm run validate
npm run validate
```

Two txs: `validationRequest` from Claw (the subject agent owner),
`validationResponse` from Sentinel.
On the second run `npm run verify` will report `validationCount > 0` and the
average response per agent.

## 8 — Backfill events into the dashboard

```bash
WATCH_ONCE=1 npm run watch-events
POLL_ONCE=1 npm run poll-chain
```

This fills `events.json` and `live-chain.json` with the txs you just made.
Open `npm run dev` and you'll see them in the Event Log + Live Chain panels.

## 9 — Generate the submission report

```bash
npm run report
```

Writes `SUBMISSION_HASHES.md` at the repo root with:
- Treasury address + deploy tx
- All five agentIds + register txs
- Latest cycle (verdict, execution tx, validation hash)
- Up to 15 most recent on-chain events
- mantlescan links throughout

Pin this file in your DoraHacks submission. It's the artefact judges can audit
without trusting the dashboard.

## 10 — Final preflight before recording

```bash
npm run preflight
npm run check
```

Both should be all green / pass. If anything's yellow, the panel tells you the
exact command to run.

## Troubleshooting cheat sheet

| Symptom | Likely cause | Fix |
|---|---|---|
| Every script says "no .env loaded" | `.env` not present | `cp .env.generated .env` |
| `npm run register` keeps reverting | URI hashing collision: same agentURI as a previous run | Append a counter to your registration title, or rotate `AGENT_MNEMONIC` |
| Validator response not visible | Subject agent must be owned by the requester wallet (auditor) | Ensure both registrations were broadcast from the same auditor key |
| Dashboard shows "events.json not yet populated" | `watch-events` hasn't run | `WATCH_ONCE=1 npm run watch-events` |
| Sepolia outage on demo day | RPC unreachable | Pre-record a clean dashboard pass on the rehearsal day; play it back if needed (storyboard fallback section) |

## Done

You now have a complete on-chain trail. From this point:
- Cycle the dashboard a few times to populate the cycle-history strip with
  green / red / yellow tiles.
- Record the demo video using `strategy/06-demo-storyboard.md`.
- Submit on DoraHacks with `SUBMISSION_HASHES.md` pinned in the BUIDL details.
