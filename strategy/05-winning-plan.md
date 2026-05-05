# Winning Plan: Agentic Wallet Treasury

Date: 2026-05-04
Target: win a track prize, with a credible path to top 3 in Agentic Wallets & Economy.

## Source Confidence

Verified:
- DoraHacks detail-page content provided by the participant: dates, tracks, partners, judges, event framing.
- ERC-8004 EIP text: identity, reputation, validation registries; agent registration file format; reputation feedback methods.
- ERC-8004 contracts repository: Mantle mainnet and Mantle testnet registry addresses.
- Byreal Agent Skills GitHub README: current public CLI is Solana CLMM-focused and JSON-friendly.

Not yet verified:
- DoraHacks "Requirements & Criteria" page body. Direct fetch is blocked by AWS WAF human verification.
- Exact track scoring rubric and prize split.
- Whether a Mantle-specific Byreal Skills CLI is already available to participants.

Action required:
- Manually copy the DoraHacks Requirements & Criteria page into `hackathon/01-requirements-criteria.md` once available.
- Ask in the official TG/Discord whether Byreal will release a Mantle CLI, private docs, or API key for Phase 2.

## Decision

Choose Track 6: Agentic Wallets & Economy.

Project: Agentic Wallet Treasury.

One-liner:
Five ERC-8004 agents manage a Mantle treasury: Researcher proposes actions, Risk Officer approves or blocks them, Executor performs the on-chain operation, Auditor writes reputation feedback, and Validator posts an ERC-8004 validation response.

Why this is stronger than a pure hedge fund:
- It does not require real trading alpha to be credible.
- It hits the hackathon's stated themes: on-chain agent benchmarking, ERC-8004 identity, reputation, and transparent execution.
- It can demo well in a livestream because the judge sees a full decision cycle.
- It has a fallback if Byreal Mantle tooling is delayed: use Mantle Sepolia EVM transactions and a mocked Byreal adapter, while keeping the interface ready for real Byreal commands.

## Winning Criteria We Optimize For

1. Functional prototype
- A judge can run one command and watch a full agent cycle complete.
- No fragile manual steps during the demo.

2. On-chain proof
- Each agent has an ERC-8004 identity.
- Execution decisions produce Mantle Sepolia transactions.
- Auditor writes reputation feedback on-chain.

3. Agent autonomy
- Agents are role-separated.
- Risk Officer can reject unsafe proposals.
- Auditor scores outcomes using objective metrics, not only LLM text.

4. Sponsor alignment
- Mantle: treasury and DeFi activity happen on Mantle.
- Byreal/Bybit: execution adapter supports Byreal CLI if available.
- ERC-8004 ecosystem: identity + reputation are first-class, not decorative.

5. Demo clarity
- The dashboard shows five live agent cards, proposed action, risk verdict, transaction hash, validation verdict, and reputation delta.
- The README explains the whole system in 30 seconds.

## Architecture

Components:
- `contracts/`
  - Minimal Treasury contract for controlled demo actions.
  - Optional policy guard contract if needed.
- `apps/agents/`
  - Agent runner.
  - Five roles: Researcher, Risk Officer, Executor, Auditor, Validator.
  - Shared event log and execution state.
- `apps/web/`
  - Live dashboard.
  - Agent identity cards, decision timeline, transaction links, reputation table.
- `packages/erc8004/`
  - ABI, addresses, registration scripts, reputation helpers.
- `packages/execution/`
  - Execution interface.
  - `mock` adapter, `mantle-sepolia` adapter, and `byreal` adapter.
- `scripts/`
  - One-command demo setup and one-command demo run.

## MVP Scope

Must have:
- Register five agents on Mantle Sepolia ERC-8004 IdentityRegistry.
- Store or generate valid ERC-8004 registration JSON for each agent.
- Run one complete decision loop:
  1. Researcher proposes "rebalance treasury" or "test swap".
  2. Risk Officer checks limits and approves or rejects.
  3. Executor submits an on-chain action or simulated action with hashable proof.
  4. Auditor writes reputation feedback to ReputationRegistry.
- Web dashboard displays the loop without needing terminal knowledge.
- README includes setup, demo command, architecture diagram, and judging narrative.

Should have:
- Real Mantle Sepolia transaction using an EVM protocol or minimal treasury contract.
- Byreal CLI wrapper behind the same execution interface.
- Deterministic demo mode using seeded decisions.
- Demo video script and pitch deck outline.

Do not build early:
- Complex trading alpha.
- Production custody.
- Mainnet fund management.
- ZK/TEE validation unless a simple integration is already available.

## Fallback Strategy

If Byreal Mantle CLI exists:
- Use it for the Executor's real action.
- Emphasize native Byreal Skills integration in the pitch.

If Byreal Mantle CLI is unavailable:
- Use the Byreal adapter as a documented interface and mock provider.
- Execute real Mantle Sepolia transactions through viem/ethers.
- Pitch this as "Byreal-ready agentic wallet orchestration."

If DeFi integrations are slow:
- Use a Treasury contract with deposit, policy-limited transfer, and event emission.
- The winning proof remains the agent identity + decision + reputation loop.

## Timeline

Phase 1: 2 days
- Create monorepo.
- Add ERC-8004 ABI and Mantle addresses.
- Add registration scripts.
- Build static dashboard shell.

Phase 2: 4 days
- Implement agent runner.
- Implement one decision loop.
- Implement mock execution and event log.
- Show live state in dashboard.

Phase 3: 5 days
- Add Mantle Sepolia transaction.
- Add reputation feedback write.
- Add explorer links and persistent run history.

Phase 4: 5 days
- Add Byreal adapter if possible.
- Improve dashboard clarity.
- Write README, demo script, and submission copy.

Phase 5: final week before submission
- Freeze core code.
- Run demo repeatedly.
- Record video.
- Polish pitch.

## Submission Narrative

Opening:
Today's wallets wait for humans. Agentic Wallet Treasury shows how autonomous agents can manage capital with identity, policy, execution, and reputation on Mantle.

Core proof:
Each agent is registered through ERC-8004. Every task becomes a visible on-chain decision trail: proposal, risk check, execution, audit, and reputation feedback.

Why Mantle:
Mantle is positioning itself as the distribution layer for on-chain finance and RWA. Autonomous treasury agents are a natural primitive for that future.

Why it can win:
The project is not just a chat UI. It is a working agent economy loop with identities, wallet actions, and reputation feedback that judges can inspect.

## Immediate Next Steps

1. Create the repo skeleton under this folder.
2. Add `hackathon/01-requirements-criteria.md` from the official page when the user can copy it.
3. Implement ERC-8004 registration scripts first.
4. Build a deterministic demo loop before integrating external DeFi.
5. Keep all risky integrations behind adapters.
