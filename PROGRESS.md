# Progress

Last updated: 2026-05-06

## Current Status

The project is past "research pack", past "demo skeleton", and past "single
on-chain transaction". It is now an evidence-backed Mantle Sepolia project with
official rubric alignment:

- **Five-agent** demo loop (Scout, Guard, Claw, Ledger, **Sentinel**).
- Full ERC-8004 trio: Identity + Reputation + **Validation** registries.
- Five proposal scenarios that cycle through approved / blocked / rejected /
  hold outcomes so each `npm run demo` shows a different state.
- Cycle history persisted across runs (`demo-history.json`) with cumulative
  per-agent reputation accumulation.
- Live-chain dashboard panel fed by `npm run poll-chain` (snapshots
  Mantle Sepolia state to `live-chain.json` on a configurable interval).
- Production chain scripts: register, feedback, **validate**, verify,
  poll-chain, live-demo, wallets, preflight.
- EIP-712-signed treasury contract with executor / risk separation +
  Foundry test suite.
- ValidatorPaymaster x402-style payment loop.
- Real Byreal RealClaw CLI probe evidence.
- Mantlescan Standard JSON verification packages for both project contracts.
- Official DoraHacks judging criteria captured in
  `hackathon/01-requirements-criteria.md`.
- Full project state and 40-day roadmap in `PROJECT_STATE_AND_ROADMAP.md`.

Selected track: **Track 6 — Agentic Wallets & Economy**.
Project: **Agentic Wallet Treasury**.

Primary award targets:

- Agentic Economy Track — First Prize.
- 20 Project Deployment Award.
- Best UI/UX Award as a secondary target.

Latest public links:

- GitHub: `https://github.com/ychenfen/agentic-wallet-treasury`
- Dashboard: `https://ychenfen.github.io/agentic-wallet-treasury/`
- Evidence report: `SUBMISSION_HASHES.md`
- Contract verification guide: `CONTRACT_VERIFICATION.md`

Core demo loop:

1. Scout proposes a bounded treasury action (one of 5 scenarios).
2. Guard runs the proposal through policy and either approves
   (signing an EIP-712 ApprovedAction in real mode) or blocks.
3. Claw executes through the selected adapter (mock / byreal / mantle-sepolia).
4. Ledger writes structured `giveFeedback` calls to ERC-8004 ReputationRegistry
   and asks Sentinel to validate Claw's tx.
5. Sentinel re-simulates / re-checks Claw's output and posts a
   `validationResponse` (0–100) to the ERC-8004 ValidationRegistry.

## Latest round — x402 paid validation (the agent economy)

- **`ValidatorPaymaster.sol`** — minimal 90-line escrow contract.
  - `depositForRequest(validator, requestHash)` — Claw escrows MNT keyed by
    the same `requestHash` ERC-8004 ValidationRegistry uses.
  - `withdraw(amountWei)` / `withdrawAll()` — Sentinel pulls accumulated MNT.
  - `totalEarned(validator)` — gross-earned tracker, distinct from
    unwithdrawn balance. Useful as on-chain reputation proxy.
  - `receive()` redirects accidental sends back to the sender to make the
    contract foot-gun proof.
- **9 Foundry tests** at `contracts/test/ValidatorPaymaster.t.sol` covering
  happy path, replay protection on requestHash, zero-fee revert, zero-validator
  revert, withdraw, withdrawAll, insufficient balance, deposit event emission,
  receive credit safety, multi-request accumulation.
- **Type system updated**:
  - `ValidationOutcome.payment?: ValidationPayment` carries `paymentTx`,
    `feePaidWei`, `paymaster`, `validatorAddress`, `payerAddress`,
    `explorerUrl`.
  - `DemoHistory.cumulativeEarningsWei?: Record<string, string>` — per-agent
    cumulative MNT earned across cycles (string for JSON safety).
  - `validatorPaymasterAbi` exported from `@clawdao/core` for scripts.
  - `DEFAULT_VALIDATOR_FEE_WEI = 1e15` (0.001 MNT per validation).
- **Demo runner** now records a synthetic x402 payment for every cycle that
  produces a real validation. The fee is not yet broadcast; once the paymaster
  is deployed and `FEE_PAYMENT_MODE=real`, write-validation.ts will replace
  the synthetic record with the actual deposit tx hash.
- **Demo runner aligned with ERC-8004 spec**: validation request is now
  attributed to Claw (the executor / subject agent owner), not Ledger,
  matching what the on-chain script already does and what the registry
  enforces.
- **Dashboard upgrades**:
  - Hero hook → **"The first wallet that grades its own employees."**
    Subhead lists the registries + treasury count.
  - Hero copy reframed around the agent-economy verbs (proposes, signs,
    executes, gets paid, writes verdicts).
  - StatHero gains a 6th tile: **Validator earnings** in MNT, with
    "x402 escrow" footnote (green tone).
  - New **Agent Earnings (x402)** panel: per-agent cumulative MNT received,
    sorted high-to-low, with idle-state coaching.
  - Validation panel adds an **x402 fee** row showing
    `0.001000 MNT → Sentinel (synthetic)` or with explorer link when real.
- 8 demo cycles produce: Sentinel earned 0.006000 MNT (6 successful cycles
  × 0.001 MNT; oversized-action and hold-cycle correctly do not pay).

## Earlier rounds

- **On-chain rehearsal toolkit**: three new scripts + the operator runbook
  let you go from `npm run wallets` to a fully signed `SUBMISSION_HASHES.md`
  in well under an hour.
  - `npm run balance` — reads MNT balance for every agent wallet on Mantle
    Sepolia, warns when any is below `MIN_BALANCE_MNT` (default 0.05).
  - `npm run report` — scans `deployed-treasury.json`, `agent-ids.json`,
    `demo-run.json`, and `events.json` and writes
    `SUBMISSION_HASHES.md` with mantlescan links for every artefact.
  - `RUNBOOK.md` — step-by-step walkthrough (10 stages) with expected
    outputs and a troubleshooting cheat sheet.

## Earlier rounds

- **Vitest unit tests for Sentinel + agent-uri + wallets.** `npm run test`
  runs 14 test cases. The score function is pinned: 92, 91, 41, 98 (deep
  bonus floor), 17 (thin penalty floor), and pass-threshold flips are
  asserted. Wallet derivation matches the standard Hardhat mnemonic addresses
  and the per-agent env override path is covered. `npm run check` now also
  invokes `npm run test`.
- **README architecture diagram** (Mermaid) renders inline on GitHub and
  shows the full data flow Scout → Guard → Claw → Treasury → Ledger →
  Sentinel → ValidationRegistry, with all five identities + three registries.
- **Stat hero on the dashboard** — five tiles up top: total cycles, validated
  count, blocked/failed count, cumulative reputation, latest validation
  score (green/red).
- **Submission Readiness panel** in the dashboard. `npm run preflight` now
  also writes `apps/web/public/preflight.json`; the dashboard renders 11
  green/yellow/red rows so you can see at a glance what still needs to be
  done before submission.
- **3-minute demo storyboard** at `strategy/06-demo-storyboard.md` with
  per-second voiceover, camera cues, pre-flight checklist, and an offline
  fallback plan.

## What changed earlier

- **Sentinel now does real arithmetic.** `packages/core/src/executors/sentinel.ts`
  exposes `runSentinelReSimulation(proposal, hints, opts)` plus the pure
  `computeReSimScore(hints)` helper. Each scenario now provides
  `reSimHints: { feeBps, realizedSlippageBps, toleranceBps, poolDepth }` and
  Sentinel computes the score from those inputs (not a hardcoded value).
  - `BYREAL_MODE=real` shells out to `byreal-cli swap execute --dry-run` and
    uses its observed price impact in place of the hint, then runs the same
    score function. Graceful degradation back to deterministic math when the
    CLI is missing or returns non-zero.
  - `ValidationOutcome` now carries an optional `reSimulation: ReSimResult`
    with the full breakdown (adapter, hints, score, threshold, notes).
  - Dashboard renders a 4-tile re-sim card (realized/tolerance/fee/depth) and
    a notes list so judges can audit how the score was reached.
- New `scripts/deploy-treasury.ts`: viem-based AgenticTreasury deploy. Auto-runs
  `forge build` if the artifact is missing, writes
  `apps/web/public/deployed-treasury.json`, appends `TREASURY_ADDRESS=` to `.env`.
  Dry-run path skips forge entirely so it works offline.
- New `scripts/watch-events.ts`: backfills the last N blocks and subscribes to
  Identity / Reputation / Validation registries + the deployed Treasury.
  Writes `apps/web/public/events.json`. Graceful degradation when RPC is
  unreachable (writes a stub with a warning). `WATCH_FIXTURE=1` writes a
  synthetic snapshot for offline dashboard preview.
- Dashboard adds `Event Log` panel (last 20 events with source colour,
  agent name, explorer link).
- ABIs extended with `URIUpdated` (Identity) and `NewFeedback` (Reputation)
  event signatures so the watcher can decode them.
- `npm run live-demo` now supports `--deploy --register --feedback --validate
  --watch` flags; full on-chain rehearsal becomes one command.
- `.env.example`, `.gitignore`, `DEVELOPMENT.md` updated.

## Verified end-to-end

The following commands succeed against the current source tree:

```bash
npm install                  # 4-workspace install
npm run typecheck            # all 4 workspaces type-check
npm run build                # vite production bundle (~216 KB)
npm run demo                 # writes demo-run.json + appends demo-history.json
DRY_RUN=1 npm run register   # prints register() calldata + base64 data URIs (5 agents)
DRY_RUN=1 npm run feedback   # prints giveFeedback calldata (5 agents)
DRY_RUN=1 npm run validate   # prints validationRequest + validationResponse calldata
POLL_ONCE=1 npm run poll-chain  # writes live-chain.json snapshot (or stub if no agents)
GENERATE_MNEMONIC=1 npm run wallets # writes .env.generated, prints public addresses only
npm run preflight              # read-only submission readiness check
```

5 consecutive demo runs produced the expected scenario rotation:

```
cycle=1 scenario=rwa-yield-curve       approved  exec=simulated  validation=88/100  passed
cycle=2 scenario=oversized-action      blocked   exec=skipped    validation=0/100   rejected
cycle=3 scenario=validator-rejects     approved  exec=simulated  validation=41/100  rejected
cycle=4 scenario=hold-cycle            approved  exec=simulated  validation=100/100 passed
cycle=5 scenario=small-stable-rotation approved  exec=simulated  validation=92/100  passed
```

Cumulative reputation after 7 cycles:
Scout 540, Guard 536, Claw 494, Ledger 630, Sentinel 578.

Pending — needs a wallet with Mantle Sepolia testnet MNT:

```bash
npm run register             # broadcasts 5 register(...) txs, writes agent-ids.json
npm run feedback             # broadcasts 5 giveFeedback(...) txs
npm run validate             # broadcasts validationRequest + validationResponse
npm run poll-chain           # streams chain state into live-chain.json
npm run live-demo -- --register --feedback --validate
```

## What changed this session (vs. the May 4 first-pass build)

Engineering:

- Verified ERC-8004 ABIs against
  `github.com/erc-8004/erc-8004-contracts` `abis/` — `register(string)` and
  `giveFeedback(8 args)` match exactly.
- Added the missing useful methods (`tokenURI`, `ownerOf`, `setMetadata`,
  `getMetadata`, `getSummary`, `getClients`, `Registered` event) to the ABI
  exports in `packages/core/src/index.ts`.
- New `packages/core/src/wallets.ts` — derives 5 agent wallets from
  `AGENT_MNEMONIC` (HD path `m/44'/60'/0'/0/{0..4}`) or per-slot env vars,
  with an in-memory ephemeral fallback for safe dry-runs.
- New `packages/core/src/agent-ids.ts` — loads real registry token IDs from
  `apps/web/public/agent-ids.json`, falls back to placeholders 8101–8104 so
  `npm run demo` never breaks.
- New `packages/core/src/agent-uri.ts` — builds either a base64 `data:` URI
  (no hosting required) or a hosted URI from `AGENT_URI_BASE`.
- New executor adapters under `packages/core/src/executors/`:
  - `mock.ts` (deterministic proof hash, no chain).
  - `byreal.ts` (spawns `byreal-cli`; degrades to mock if missing).
  - `mantle-sepolia.ts` (real EIP-712 sign + on-chain execute).
  - `selectExecutor()` picks based on env: defaults to mock, upgrades to
    `mantle-sepolia` when `TREASURY_ADDRESS` + risk wallet are present.
- `packages/core/src/node.ts` keeps node-only modules out of the browser
  build so apps/web stays lean.
- `apps/agents/src/demo-runner.ts` rewritten to consume real wallets, real
  agent IDs, and the executor selector.
- `scripts/` is now its own workspace (`@clawdao/scripts`) with proper deps.
- `scripts/register-agents.ts`, `scripts/write-feedback.ts`,
  `scripts/verify-agents.ts`, `scripts/live-demo.ts` are production scripts
  with structured output and dry-run support.
- `scripts/wallets.ts` generates or reads the five-agent wallet set without
  printing the mnemonic by default; generated secrets go to `.env.generated`
  with 0600 permissions and are gitignored.
- `scripts/preflight.ts` checks demo artifacts, logo, env readiness, real
  agent IDs, live-chain snapshot, and treasury configuration before submission.
- `contracts/src/AgenticTreasury.sol` rewritten:
  - EIP-712 `ApprovedAction` typed-data signed by Risk Officer.
  - Anyone can submit; contract `ecrecover`s the signature and only accepts
    the active risk officer.
  - Per-officer nonces prevent replay across rotations.
  - Per-`actionId` flag prevents one approval being used twice.
  - Inline EIP-712 (no OpenZeppelin dependency).
- `contracts/test/AgenticTreasury.t.sol` covers: happy path + event,
  replay protection (nonce + actionId paths), expired deadline, value
  cap, data hash mismatch, signature forgery, risk-officer rotation, and
  owner-only setters.
- `.env.example`, `contracts/README.md`, expanded `.gitignore`.

Documentation:

- `PROGRESS.md` updated (this file).
- `DEVELOPMENT.md` updated with new commands.
- `SUBMISSION.md` added with DoraHacks submission copy, demo script, and award strategy.
- `strategy/05-winning-plan.md` unchanged but still accurate.
- `hackathon/01-requirements-criteria.md` still pending official copy.

## Hackathon evidence

- ABI verified against `erc-8004/erc-8004-contracts/abis/` (May 4, 2026).
- Five ERC-8004 identities, each tied to its own derived EVM account.
- Real Mantle Sepolia transactions are wired up (mock by default; flip
  env to broadcast).
- `executeApprovedAction` is genuinely two-party: a Risk Officer signature
  and a separate Executor caller, so the chain log shows two distinct
  agents per cycle.
- Reputation feedback uses the verified `giveFeedback` shape and is
  ready to broadcast via `npm run feedback`.

## Not Done Yet

- Funded test wallet with Mantle Sepolia testnet MNT (operator action).
- Real `npm run register` broadcast (waiting on funded wallet).
- Real `npm run feedback` broadcast (waiting on registration).
- Treasury contract deployment to Mantle Sepolia (waiting on funded wallet).
- `forge test -vv` (local machine currently has no `forge` command installed;
  install Foundry first, then run `forge install foundry-rs/forge-std --no-commit`
  in the contracts workspace; instructions in `contracts/README.md`).
- DoraHacks Requirements & Criteria page paste into
  `hackathon/01-requirements-criteria.md`.
- 3-minute demo video script + 10-page pitch deck.

## Immediate Next Steps

1. Generate or import an `AGENT_MNEMONIC`; copy to `.env`.
2. Fund the five derived addresses with a few Mantle Sepolia testnet MNT.
3. Run `npm run register` to mint the five ERC-8004 identities for real.
4. Deploy `AgenticTreasury` (see `contracts/README.md`), put the address into
   `TREASURY_ADDRESS`.
5. Run `EXECUTOR=mantle-sepolia npm run demo` to broadcast a real on-chain
   ApprovedAction signed by Guard.
6. Run `npm run feedback` to write real reputation feedback.
7. `npm run verify` to confirm chain state before recording the demo video.

## Key Files (updated)

```
apps/agents/src/demo-runner.ts                5-agent runner, scenario picker
apps/agents/src/scenarios.ts                  5 named scenarios
apps/agents/src/history.ts                    cycle history append + cumulative rep
apps/web/src/main.tsx                         dashboard with cycle strip + chain panel
apps/web/src/styles.css                       includes validator + cycle pill themes
packages/core/src/index.ts                    types + ABIs (Identity/Reputation/Validation)
packages/core/src/node.ts                     node-only re-exports
packages/core/src/wallets.ts                  5-wallet derivation
packages/core/src/agent-ids.ts                placeholder ↔ real ID loader (5 slots)
packages/core/src/agent-uri.ts                data: + hosted URI builder
packages/core/src/executors/{mock,byreal,mantle-sepolia,validation,index,types}.ts
contracts/src/AgenticTreasury.sol             EIP-712 multi-agent treasury
contracts/test/AgenticTreasury.t.sol          Foundry test suite
scripts/register-agents.ts                    multi-wallet ERC-8004 register (5 agents)
scripts/write-feedback.ts                     ReputationRegistry feedback
scripts/write-validation.ts                   ValidationRegistry request + response
scripts/verify-agents.ts                      read-only chain verifier
scripts/poll-chain.ts                         continuous chain state poller
scripts/live-demo.ts                          one-command flow
scripts/wallets.ts                            five-agent address generator/viewer
scripts/preflight.ts                          read-only readiness check
.env.example                                  config template
assets/buidl-logo-480.png                     DoraHacks logo upload
```
