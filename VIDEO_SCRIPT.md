# Demo Video Script

Target length: 2:30–3:00.

Primary link to show:

```text
https://ychenfen.github.io/agentic-wallet-treasury/
```

## 0:00–0:15 — Hook

```text
Most agent wallet demos stop at "an AI can click a button."
Agentic Wallet Treasury focuses on the harder question: how do autonomous agents earn permission, execute under policy, and build reputation on-chain?
```

Show: dashboard top section with project name and five-agent summary.

## 0:15–0:40 — Architecture

```text
The system uses five ERC-8004 agents on Mantle Sepolia.
Scout proposes a bounded treasury action.
Guard checks risk and signs an EIP-712 approval.
Claw executes through the AgenticTreasury contract.
Ledger writes ERC-8004 reputation feedback.
Sentinel independently validates the execution and posts the validation response.
```

Show: agent cards and decision timeline.

## 0:40–1:15 — Live Run

```text
This latest run is a small stable rotation scenario.
Guard approved it because the action passed the allowlist, the trade cap, and the drawdown guard.
Claw then submitted a real Mantle Sepolia transaction through AgenticTreasury.
```

Show:
- Risk Verdict panel.
- Execution Proof panel.
- Click the execution tx link.

Execution tx:

```text
https://sepolia.mantlescan.xyz/tx/0xa3d26423e3ab39e4303009d862d2e3f9f6d50fcc8139f93c3d73821999a4ca8a
```

## 1:15–1:50 — ERC-8004 Evidence

```text
Every agent is a real ERC-8004 identity, not a local placeholder.
The dashboard backfills IdentityRegistry, ReputationRegistry, ValidationRegistry, and Treasury events from Mantle Sepolia.
Judges can click through to Mantlescan or read SUBMISSION_HASHES.md to verify every claim independently.
```

Show:
- Live Chain panel.
- Event Log panel.
- `SUBMISSION_HASHES.md` in GitHub.

Evidence report:

```text
https://github.com/ychenfen/agentic-wallet-treasury/blob/main/SUBMISSION_HASHES.md
```

## 1:50–2:25 — Why This Fits Track 6

```text
This is an agentic wallet economy, not just a trading bot.
The important primitive is the control loop: identity, authorization, execution, verification, and reputation.
That loop can be reused for RWA allocation, DeFi rebalancing, treasury operations, or any wallet where autonomous agents need accountability.
```

Show: Recent cycles + reputation feedback.

## 2:25–2:50 — Close

```text
Agentic Wallet Treasury gives Mantle a verifiable benchmark for wallet agents.
The code is open source, the dashboard is live, and the on-chain trail is already available on Mantle Sepolia.
```

Show:
- GitHub repo.
- Dashboard URL.

## Recording Checklist

- Browser zoom: 100%.
- Use the public dashboard URL, not localhost.
- Keep MetaMask closed during recording.
- Do not show `.env`, `.env.generated`, terminal history with secrets, or wallet seed phrases.
- Open Mantlescan links in separate tabs before recording to avoid loading pauses.
- End on the GitHub repo or evidence report.
