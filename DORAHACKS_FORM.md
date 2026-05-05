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
TODO: add final YouTube / Loom link after recording.
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

Scout researches the current treasury context and proposes a bounded action.
Guard applies treasury policy and signs an EIP-712 ApprovedAction when the action is safe.
Claw submits the approved action to the AgenticTreasury contract on Mantle Sepolia.
Ledger writes structured feedback to the ERC-8004 ReputationRegistry.
Sentinel independently validates the execution and posts a ValidationRegistry response.

The latest public run includes real Mantle Sepolia evidence: five ERC-8004 registrations, a deployed AgenticTreasury contract, a treasury execution transaction, ReputationRegistry feedback, ValidationRegistry request/response, and a live dashboard that backfills chain events.
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

AgenticTreasury:
https://sepolia.mantlescan.xyz/address/0x739862c3cf9b5f9fe6a8ecd95e75714a20116fe9

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
