# DoraHacks Form Copy

Use this file when filling **Submit BUIDL**.

## Profile

**BUIDL name**

```text
Agentic Wallet Treasury
```

**BUIDL logo**

```text
assets/buidl-logo-480.png
```

**Vision**

```text
Autonomous wallets need a trust layer. Agentic Wallet Treasury makes agent-managed capital verifiable on Mantle: five ERC-8004 agents handle proposal, risk approval, execution, validation, and reputation in one inspectable treasury loop.
```

**Category**

```text
Crypto / Web3
```

**Is this BUIDL an AI Agent?**

```text
Yes
```

**GitHub / GitLab / Bitbucket**

```text
https://github.com/ychenfen/agentic-wallet-treasury
```

**Project website**

```text
https://ychenfen.github.io/agentic-wallet-treasury/
```

**Demo video**

```text
Draft video:
https://github.com/ychenfen/agentic-wallet-treasury/blob/main/artifacts/video/agentic-wallet-treasury-demo-draft.mp4

Final submission TODO:
Upload the MP4 to YouTube or Loom and paste that public URL here so DoraHacks can embed it.
```

**Pitch deck**

```text
https://github.com/ychenfen/agentic-wallet-treasury/blob/main/artifacts/deck/Agentic-Wallet-Treasury-Pitch.pptx
```

**Social link**

```text
TODO: add your X / GitHub profile / Farcaster / personal website.
```

## Details

**Short tagline**

```text
Five ERC-8004 agents coordinate treasury decisions on Mantle: proposal, risk approval, execution, validation, and reputation.
```

**Description**

```text
Agentic Wallet Treasury is a five-agent wallet economy built for Mantle.

Most wallet automation demos hide the hard part: who is allowed to act, how risk is approved, how outcomes are verified, and how an agent builds reputation over time. This project makes that loop explicit and inspectable.

The system has five ERC-8004 agents:

Scout researches the current treasury context (including a real Byreal RealClaw CLI pool probe) and proposes a bounded action.
Guard applies treasury policy and signs an EIP-712 ApprovedAction when the action is safe.
Claw submits the approved action to the AgenticTreasury contract on Mantle Sepolia.
Ledger writes structured feedback to the ERC-8004 ReputationRegistry.
Sentinel independently validates the execution, posts a ValidationRegistry response, and earns an x402-style MNT fee through the ValidatorPaymaster escrow — so validation is a paid job, not a free claim.

The economic loop is the point: agents are paid for honest validation and gain or lose ERC-8004 reputation based on outcomes, so the wallet keeps grading its own employees.

The latest public run includes real Mantle Sepolia evidence: five ERC-8004 registrations, a deployed and source-verified AgenticTreasury contract, a treasury execution transaction, ReputationRegistry feedback, ValidationRegistry request/response, an x402 validation payment, and a live dashboard that backfills chain events.
```

**Which Byreal on-chain capabilities does your project use? What scenario?** (required track question)

```text
Capability: Byreal RealClaw CLI — the real capability catalog plus Byreal CLMM
pool data. Each cycle our agents run the released RealClaw CLI (v0.3.13) to read
36 agent capabilities and 5 live Byreal pools (TVL, 24h volume/fees, APR, pool
depth). The captured probe is stored as byreal-probe.json and shown on the
public dashboard ("Byreal Skills Probe").

Scenario: RealClaw Real-Life Expansion — a Personal CFO / agentic treasury
wallet. Scout uses the Byreal pool probe to ground each treasury proposal in
real liquidity/depth, and Sentinel uses the same data to independently re-check
whether an execution's slippage was realistic before it gets paid and before
reputation is written. So Byreal capability data drives both the proposal and
the validation halves of an accountable wallet control loop on Mantle.

Honest scope: on-chain settlement runs on Mantle Sepolia via our AgenticTreasury
and ValidatorPaymaster contracts; Byreal is used as the real RealClaw capability
and pool-research layer, not as a Mantle execution venue.
```

**Track**

```text
Agentic Wallets & Economy
```

**Technical evidence**

```text
Repository:
https://github.com/ychenfen/agentic-wallet-treasury

Dashboard:
https://ychenfen.github.io/agentic-wallet-treasury/

Evidence report:
https://github.com/ychenfen/agentic-wallet-treasury/blob/main/SUBMISSION_HASHES.md

Project state and roadmap:
https://github.com/ychenfen/agentic-wallet-treasury/blob/main/PROJECT_STATE_AND_ROADMAP.md

Contract verification package:
https://github.com/ychenfen/agentic-wallet-treasury/blob/main/CONTRACT_VERIFICATION.md

AgenticTreasury (source-verified on Sourcify, exact match):
https://sepolia.mantlescan.xyz/address/0x739862c3cf9b5f9fe6a8ecd95e75714a20116fe9
https://sourcify.dev/#/lookup/0x739862C3Cf9b5f9Fe6A8ecd95E75714A20116fE9

ValidatorPaymaster (source-verified on Sourcify, exact match):
https://sepolia.mantlescan.xyz/address/0x1b94af58b27203bc74ab749e4916d854758c7475
https://sourcify.dev/#/lookup/0x1B94Af58b27203bC74ab749e4916d854758c7475

Execution tx:
https://sepolia.mantlescan.xyz/tx/0xa3d26423e3ab39e4303009d862d2e3f9f6d50fcc8139f93c3d73821999a4ca8a

Validation request:
https://sepolia.mantlescan.xyz/tx/0x652b71548464cdd81913c18ab2cf3a8a691320fa324a3d35416715c90dc448b6

Validation response:
https://sepolia.mantlescan.xyz/tx/0xe4897d7e5fcc38369eb02b374078416612e6b60c4c77226808962421692cca8d
```

## Submission Checklist

- GitHub URL added.
- Project website URL added.
- Logo uploaded from `assets/buidl-logo-480.png`.
- Track set to `Agentic Wallets & Economy`.
- `Is this BUIDL an AI Agent?` set to `Yes`.
- Demo video link added before final submission.
- `SUBMISSION_HASHES.md` included in repo.
