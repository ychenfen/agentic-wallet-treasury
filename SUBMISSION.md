# DoraHacks Submission Plan

Last updated: 2026-05-04

## Where To Submit

Open the hackathon page and click **Submit BUIDL**.

Current page from screenshot:

```text
https://dorahacks.io/hackathon/mantleturingtesthackathon2026
```

Expected DoraHacks flow:
1. Click **Submit BUIDL**.
2. Create or select the project BUIDL.
3. Fill project profile, links, media, team, and track.
4. Select the relevant track.
5. Click **Submit for review**.
6. After submission, the BUIDL may show as under review before appearing publicly.

Keep updating the BUIDL until the deadline:

```text
2026-06-15 23:59
```

## Track

Primary track:
- Agentic Wallets & Economy

Secondary narrative overlap:
- AI Trading & Strategy, only as a treasury-action demo.
- AI x RWA, only through the USDY / USDe / mETH scenario narratives.

Do not submit primarily under AI Trading unless we have real trading performance.

## Project Identity

Project name:

```text
Agentic Wallet Treasury
```

Logo upload:

```text
assets/buidl-logo-480.png
```

This file is 480x480 PNG and under 2 MB, matching the DoraHacks recommendation.

Short tagline:

```text
Five ERC-8004 agents coordinate treasury decisions on Mantle: proposal, risk approval, execution, validation, and reputation.
```

One-sentence pitch:

```text
Agentic Wallet Treasury turns a wallet into a verifiable five-agent economy where Scout proposes, Guard signs policy approval, Claw executes, Ledger writes reputation, and Sentinel validates the result through ERC-8004 on Mantle.
```

30-second pitch:

```text
Today's wallets wait for humans to click. Agentic Wallet Treasury shows the next primitive: autonomous agents managing a treasury with on-chain identity, policy, execution, validation, and reputation. Every agent has an ERC-8004 identity. Every cycle is visible: Scout proposes, Guard checks risk and signs an EIP-712 approval, Claw executes on Mantle, Ledger writes ReputationRegistry feedback, and Sentinel posts a ValidationRegistry response. It is not just a chat UI; it is a verifiable agent economy loop on Mantle.
```

## Links To Prepare

Required for a serious submission:

- Public GitHub repository.
- Live dashboard URL.
- Demo video URL.
- Contract address on Mantle Sepolia.
- ERC-8004 IdentityRegistry agent IDs.
- ReputationRegistry transaction hashes.
- ValidationRegistry transaction hashes.
- Short pitch deck or PDF.
- Team profile.

Recommended final link set:

```text
GitHub:
Live demo:
Demo video:
Pitch deck:
AgenticTreasury contract:
Scout ERC-8004 agent:
Guard ERC-8004 agent:
Claw ERC-8004 agent:
Ledger ERC-8004 agent:
Sentinel ERC-8004 agent:
Reputation tx:
Validation request tx:
Validation response tx:
```

## Description Draft

```text
Agentic Wallet Treasury is a five-agent wallet economy built for Mantle.

Most wallet automation demos hide the hard part: who is allowed to act, how risk is approved, how outcomes are verified, and how an agent builds reputation over time. Our project makes that loop explicit and inspectable.

The system has five ERC-8004 agents:

Scout researches the current treasury context and proposes a bounded action.
Guard applies treasury policy and signs an EIP-712 ApprovedAction when the action is safe.
Claw submits the approved action to the AgenticTreasury contract on Mantle Sepolia.
Ledger writes structured feedback to the ERC-8004 ReputationRegistry.
Sentinel independently validates the execution and posts a ValidationRegistry response.

The dashboard shows live cycles, risk checks, execution proofs, validation scores, reputation deltas, and chain state snapshots. The demo rotates through multiple scenarios: approved stable rotation, RWA yield rebalance, blocked oversized action, validator rejection due to slippage, and a no-op hold cycle.

This is designed for Track 6 because it demonstrates an actual agentic wallet economy rather than a single bot. The agents have separate roles, separate wallets, on-chain identities, and a verifiable audit trail.
```

## Technical Summary

```text
Frontend: Vite + React dashboard.
Agent runner: TypeScript deterministic multi-agent cycle runner.
Core chain library: viem, ERC-8004 ABI helpers, wallet derivation, execution adapters.
Execution adapters: mock, Byreal CLI wrapper, Mantle Sepolia EIP-712 treasury execution.
Contracts: AgenticTreasury, an EIP-712 approval contract separating risk signer and executor.
ERC-8004 usage: IdentityRegistry registration, ReputationRegistry giveFeedback, ValidationRegistry validationRequest / validationResponse.
```

## What Judges Should Verify

1. Run local demo:
   ```bash
   npm install
   npm run demo
   npm run dev
   ```
2. Open:
   ```text
   http://127.0.0.1:5175/
   ```
3. Force different scenarios:
   ```bash
   FORCE_SCENARIO=oversized-action npm run demo
   FORCE_SCENARIO=validator-rejects npm run demo
   FORCE_SCENARIO=hold-cycle npm run demo
   ```
4. Inspect generated ERC-8004 metadata:
   ```text
   apps/web/public/agents/*.json
   ```
5. Inspect dry-run chain calldata:
   ```bash
   DRY_RUN=1 npm run register
   DRY_RUN=1 npm run feedback
   DRY_RUN=1 npm run validate
   ```

## Demo Video Script

Target length: 3 minutes.

0:00-0:20 Problem:
```text
Wallet automation is not enough. For autonomous agents to manage capital, we need identity, permissions, validation, and reputation.
```

0:20-0:45 System:
```text
This is Agentic Wallet Treasury: five ERC-8004 agents on Mantle. Scout proposes, Guard approves, Claw executes, Ledger scores, Sentinel validates.
```

0:45-1:30 Live cycle:
- Show dashboard.
- Run `npm run demo`.
- Show proposal, risk verdict, execution proof, validation score, reputation feedback.

1:30-2:05 Chain evidence:
- Show ERC-8004 registration metadata.
- Show IdentityRegistry / ReputationRegistry / ValidationRegistry tx links once real txs are available.
- Show AgenticTreasury contract and EIP-712 approval separation.

2:05-2:35 Failure mode:
- Force `validator-rejects`.
- Show Guard approves but Sentinel rejects due to slippage.
- Explain why this matters: agents are accountable, not blindly trusted.

2:35-3:00 Why Mantle:
```text
Mantle is building the distribution layer for on-chain finance. Agentic Wallet Treasury shows how autonomous wallets can become verifiable financial actors with ERC-8004 identity and reputation.
```

## Award Strategy

To maximize prize odds:

1. Submit under Agentic Wallets & Economy.
2. Make ERC-8004 the first visible technical proof, not a side feature.
3. Show all three registries: Identity, Reputation, Validation.
4. Show one real Mantle Sepolia transaction before final submission.
5. Keep trading claims conservative. Do not claim alpha.
6. Emphasize that the project is an agent economy loop, not a trading bot.
7. Add a short failure demo where Sentinel rejects Claw.
8. Make README and video understandable in 30 seconds.
9. Ask an organizer in DoraHacks/Mantle chat whether Byreal CLI integration is required or optional for Track 6.
10. Submit early, then keep updating the BUIDL before the deadline.

## Must Finish Before Submit

- Public GitHub repo.
- Hosted dashboard.
- Demo video.
- `.env.example` checked and no secrets committed.
- Real ERC-8004 agent IDs or clear dry-run proof if faucet is unavailable.
- Real AgenticTreasury deployment if possible.
- `npm run check` passing.
- `npm run preflight` reviewed.
- Official Requirements & Criteria pasted into `hackathon/01-requirements-criteria.md`.

## BUIDL Form Copy

Profile page:

```text
BUIDL name:
Agentic Wallet Treasury

BUIDL logo:
assets/buidl-logo-480.png

Vision:
Autonomous wallets need a trust layer. Agentic Wallet Treasury makes agent-managed capital verifiable on Mantle: five ERC-8004 agents handle proposal, risk approval, execution, validation, and reputation in one inspectable treasury loop.

Category:
Crypto / Web3

Is this BUIDL an AI Agent?
Yes
```

Category / tags:

```text
AI, Agentic Wallets, ERC-8004, Mantle, On-chain Reputation, Validation, Treasury Automation
```

Problem:

```text
Autonomous wallets need more than execution. They need identity, policy, validation, and reputation so other agents, users, and protocols can trust what happened.
```

Solution:

```text
Agentic Wallet Treasury coordinates five specialized ERC-8004 agents around a Mantle treasury. The system records agent identity, risk approval, execution, validation, and reputation as a visible decision trail.
```

Impact:

```text
This pattern can become the trust layer for agent-managed treasuries, RWA vaults, DAO wallets, and autonomous DeFi strategies on Mantle.
```

Why Mantle:

```text
Mantle is positioned as a distribution layer for on-chain finance and RWA. Agentic wallets are a natural primitive for that future because they can manage capital while leaving verifiable evidence on Mantle.
```
