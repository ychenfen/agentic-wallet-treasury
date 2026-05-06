# Team Handoff

Last updated: 2026-05-06

This document is for onboarding a teammate to Agentic Wallet Treasury without
leaking private keys or weakening the submission.

## Project Snapshot

Agentic Wallet Treasury is a five-agent wallet economy for the Mantle Turing
Test Hackathon 2026.

The system has five roles:

- Scout researches treasury context and proposes a bounded action.
- Guard checks policy and signs the EIP-712 risk approval.
- Claw executes the approved action through AgenticTreasury.
- Ledger writes ERC-8004 reputation feedback.
- Sentinel validates the result through ERC-8004 and earns an x402-style MNT
  fee through ValidatorPaymaster.

Primary target:

- Agentic Economy Track.

Secondary targets:

- 20 Project Deployment Award.
- Best UI/UX Award.

Public links:

- GitHub: `https://github.com/ychenfen/agentic-wallet-treasury`
- Dashboard: `https://ychenfen.github.io/agentic-wallet-treasury/`
- Evidence report: `SUBMISSION_HASHES.md`
- Project state and roadmap: `PROJECT_STATE_AND_ROADMAP.md`
- Contract verification guide: `CONTRACT_VERIFICATION.md`

## Current State

Completed:

- Five ERC-8004 agent identities on Mantle Sepolia.
- AgenticTreasury deployed on Mantle Sepolia.
- ValidatorPaymaster deployed on Mantle Sepolia.
- Real Mantle Sepolia execution, feedback, validation, and x402 payment
  transactions.
- Byreal RealClaw CLI probe captured and displayed in the dashboard.
- Public GitHub Pages dashboard deployed.
- Mantlescan verification package generated.
- Preflight currently reports 14 pass, 0 warn, 0 fail.

Still required before final DoraHacks submission:

- Complete browser verification of both contracts on Mantlescan.
- Upload a public 2+ minute demo video.
- Fill DoraHacks BUIDL form with the final video URL.
- Optionally run a small mainnet proof later, using a separate wallet and hard
  limits.

## Local Setup

```bash
cd /Users/yuchenxu/Desktop/mantle-hackathon
npm install
npm run check
npm run test:contracts
npm run preflight
npm run dev
```

Local dashboard:

```text
http://127.0.0.1:5175/
```

Important commands:

```bash
npm run demo
npm run byreal-probe
npm run prepare-verification
npm run report
npm run balance
npm run live-demo -- --register --feedback --validate --watch
```

## Secret Handoff Policy

Do not paste private keys, mnemonics, API keys, or wallet passwords into:

- GitHub
- DoraHacks
- Discord / Telegram public channels
- ChatGPT / Claude / Codex chats
- screenshots
- demo videos
- README files

Use one of these instead:

- 1Password / Bitwarden shared vault.
- Age/GPG-encrypted file sent out of band.
- In-person transfer.
- Temporary encrypted note with expiry, then rotate the secret.

Recommended rule:

> If a secret controls real funds, do not share it. Create a fresh limited
> wallet or use a multisig instead.

## Secrets Inventory

The teammate may need access to the following. Fill the actual values only in a
password manager or encrypted handoff channel, never in this file.

| Secret | Needed For | Share? | Safer Alternative |
|---|---|---|---|
| `AGENT_MNEMONIC` | Mantle Sepolia agent wallets | Only if teammate must broadcast testnet txs | Create a fresh testnet mnemonic and re-register agents |
| MetaMask seed phrase | Your browser wallet | No | Add teammate's wallet as collaborator / fund separate wallet |
| `MANTLE_SEPOLIA_RPC_URL` | Chain reads/writes | Yes, if not private billing-sensitive | Use public RPC or create separate API key |
| `TREASURY_ADDRESS` | Demo execution | Public | Already in repo/public JSON |
| `PAYMASTER_ADDRESS` | x402 fee payment | Public | Already in repo/public JSON |
| GitHub token | Deploy/push automation | No | Add teammate to repo or create scoped fine-grained token |
| Mantlescan/Etherscan API key | Optional automated contract verification | Prefer separate key | Browser verification can avoid API key |
| DoraHacks login | Submission management | No | Add teammate to BUIDL/team if DoraHacks supports it |

## Safe Teammate Onboarding Flow

1. Add the teammate to the GitHub repository with the minimum needed role.
2. Ask the teammate to clone the repo and run local checks.
3. Give them public links first: dashboard, evidence report, verification guide.
4. If they need to broadcast testnet transactions, create a fresh testnet-only
   mnemonic or transfer limited testnet MNT to their wallet.
5. If they need to help with DoraHacks submission, add them to the DoraHacks
   team/project rather than sharing your account password.
6. If they need a paid API key, create a separate key with usage limits.
7. After any temporary transfer, rotate the secret or stop using that wallet.

## What To Tell The Teammate

Short version:

```text
We are building Agentic Wallet Treasury for the Mantle Turing Test Hackathon.
It is a five-agent wallet economy on Mantle Sepolia: Scout proposes, Guard
signs, Claw executes, Ledger writes ERC-8004 reputation, and Sentinel validates
while earning an x402-style MNT fee. The repo, dashboard, chain evidence,
Byreal CLI probe, and contract verification package are already public. The
next job is to verify both contracts on Mantlescan, record the final 2+ minute
video, and submit the DoraHacks BUIDL early for the deployment award.
```

Technical version:

```text
The repo is a TypeScript/React/Foundry monorepo. The core package contains
ERC-8004 ABI helpers, wallet derivation, agent metadata, and execution
adapters. The web app renders the public dashboard from JSON artifacts under
apps/web/public. The scripts workspace handles registration, feedback,
validation, chain polling, Byreal CLI probing, deployment reporting, and
Mantlescan verification package generation. The contracts folder contains
AgenticTreasury and ValidatorPaymaster with Foundry tests.
```

Current priority:

```text
Priority 1: complete Mantlescan source verification using CONTRACT_VERIFICATION.md.
Priority 2: record/upload final demo video.
Priority 3: submit/update DoraHacks BUIDL using DORAHACKS_FORM.md.
Priority 4: add one real Mantle DeFi protocol action if time allows.
```

## Files To Read First

1. `PROJECT_STATE_AND_ROADMAP.md`
2. `CONTRACT_VERIFICATION.md`
3. `SUBMISSION_HASHES.md`
4. `DORAHACKS_FORM.md`
5. `README.md`
6. `RUNBOOK.md`
7. `hackathon/01-requirements-criteria.md`

## Do Not Break These

- Do not commit `.env`, `.env.generated`, private keys, seed phrases, or
  terminal screenshots containing secrets.
- Do not rename the deployed contracts unless re-running the whole evidence
  package.
- Do not overclaim profitable trading or mainnet fund management.
- Do not say Byreal Mantle execution is complete. Current Byreal integration is
  a real RealClaw CLI capability/pool probe; Mantle execution remains on Mantle
  Sepolia.
- Do not submit a final DoraHacks form without checking demo video visibility.

## Final Submission Checklist For Teammate

Before final submit:

```bash
npm run check
npm run test:contracts
npm run prepare-verification
npm run preflight
```

Expected:

```text
preflight: 14 pass, 0 warn, 0 fail
vitest: all tests passed
foundry: 19 tests passed
build: successful
```

Then verify:

- Public dashboard loads.
- `contract-verification.json` loads from GitHub Pages.
- Both Mantlescan contract pages are verified.
- Demo video is public.
- DoraHacks form includes GitHub, dashboard, deployed addresses, and evidence
  report.
