# Final Submission Checklist

## Submit Now

- BUIDL name: `Agentic Wallet Treasury`
- Logo: `assets/buidl-logo-480.png`
- Category: `Crypto / Web3`
- AI Agent: `Yes`
- Track: `Agentic Wallets & Economy`
- GitHub: https://github.com/ychenfen/agentic-wallet-treasury
- Project website: https://ychenfen.github.io/agentic-wallet-treasury/
- Evidence report: https://github.com/ychenfen/agentic-wallet-treasury/blob/main/SUBMISSION_HASHES.md
- Project state and roadmap: https://github.com/ychenfen/agentic-wallet-treasury/blob/main/PROJECT_STATE_AND_ROADMAP.md
- Contract verification guide: https://github.com/ychenfen/agentic-wallet-treasury/blob/main/CONTRACT_VERIFICATION.md

## Must Add Before Final Deadline

- Demo video URL.
- Real social/profile link.
- Team member profile details.
- Green Mantlescan verification pages for AgenticTreasury and ValidatorPaymaster.

## Do Not Expose

- `.env`
- `.env.generated`
- MetaMask seed phrase
- agent mnemonic
- private keys
- terminal scrollback that includes secrets

## Final Verification Commands

Run these before final submit:

```bash
cd /Users/yuchenxu/Desktop/mantle-hackathon
npm run check
npm run test:contracts
npm run prepare-verification
npm run preflight
curl -fsSL https://ychenfen.github.io/agentic-wallet-treasury/demo-run.json | jq '.execution.status, .execution.txHash'
```

Expected:

```text
"submitted"
"0xa3d26423e3ab39e4303009d862d2e3f9f6d50fcc8139f93c3d73821999a4ca8a"
```

## Submission Strategy

Submit a draft early with GitHub + dashboard + evidence. Add the demo video later.

What to emphasize:

- Track fit: Agentic Wallets & Economy.
- ERC-8004 depth: identity + reputation + validation.
- Verifiability: Mantle Sepolia tx links and dashboard event log.
- Practicality: treasury policy loop can become a real agent wallet control plane.

What not to overclaim:

- Do not say it is profitable trading.
- Do not say Byreal Mantle Skills are fully integrated unless the released CLI is actually used.
- Do not imply mainnet funds are controlled.
