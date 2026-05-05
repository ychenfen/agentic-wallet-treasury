# 3-Minute Demo Video Storyboard

> Target audience: Mantle Turing Test Hackathon judges. They watch dozens of
> projects per session. The first 20 seconds decides whether they keep watching.

## Pre-flight (do this 30 minutes before recording)

```bash
# 1. Confirm everything is healthy.
npm run preflight -- --json

# 2. Generate a fresh history with a deliberate scenario rotation so the
#    dashboard cycle strip shows variety on camera.
rm -f apps/web/public/demo-history.json apps/web/public/demo-run.json
FORCE_SCENARIO=small-stable-rotation npm run demo
FORCE_SCENARIO=rwa-yield-curve       npm run demo
FORCE_SCENARIO=oversized-action      npm run demo
FORCE_SCENARIO=validator-rejects     npm run demo
FORCE_SCENARIO=hold-cycle            npm run demo
FORCE_SCENARIO=small-stable-rotation npm run demo

# 3. (Optional, only if you have funded wallets) on-chain rehearsal.
#    Skip this if Sepolia faucet is unreliable on demo day.
npm run live-demo -- --register --feedback --validate --watch

# 4. Start the dashboard. Pin port 5175 in OBS / QuickTime.
npm run dev
```

## Camera setup

- **Browser only** for the entire video. No terminal cuts, no IDE cuts.
- 1920×1080 capture, dashboard at ~110% zoom for readability.
- Keep one terminal alive in a window OBS does not capture — for re-running
  `npm run demo` between segments without breaking the screen capture.

## 3-minute structure

| Time | Camera | Voiceover (English) | Action |
|---|---|---|---|
| 0:00–0:10 | Topbar + StatHero | "Agentic Wallet Treasury — five autonomous agents managing a Mantle treasury, each with its own ERC-8004 identity." | Idle on the dashboard. Mouse hovers `Mantle Sepolia` pill. |
| 0:10–0:25 | Agent grid (5 cards) | "Scout proposes. Guard approves with an EIP-712 signature. Claw executes from a different wallet. Ledger writes reputation. Sentinel re-simulates and posts a validation response. Five distinct on-chain identities, every cycle." | Slow pan across the five cards, point to each `agentId #810x`. |
| 0:25–0:50 | Hero + Risk Verdict + Execution Proof | "The current cycle is a rotation into Ondo USDY. Guard checked four policy gates — all passed. Claw produced a tx hash. Notice the EIP-712 ApprovedAction is signed by a different wallet than the one that called the contract." | Click the tx hash, open mantlescan in a side tab, click back. |
| 0:50–1:20 | Sentinel Validation + ReSim block | "This is the part most agent demos skip. Sentinel doesn't just rubber-stamp Claw — it re-simulates the swap. Realized 22 bps slippage versus 80 bps tolerance, deep pool, score 91 out of 100. The math is auditable: every term, every adjustment, written into the dashboard." | Highlight the 4 ReSim tiles, then read the bullet notes one by one. |
| 1:20–1:45 | Cycle History strip | "Here are the last six cycles. Two scenarios show what most projects forget — Guard blocking an oversized action, and Sentinel rejecting an approved-but-thin-pool execution." | Hover the red and orange pills. |
| 1:45–2:10 | Live Chain panel | "Every agent is registered on Mantle Sepolia ERC-8004. Identity, Reputation, and Validation registries — all three. Sentinel's average response, fed straight from the on-chain `getSummary` call." | Click an agent address, mantlescan opens. |
| 2:10–2:30 | Event Log | "And here's the live event stream. Backfilled from Mantle Sepolia: registers, feedback, validation requests, validation responses. Every line clickable, every event auditable." | Scroll through events; click one, show etherscan view. |
| 2:30–2:50 | Submission Readiness panel | "Eleven preflight checks, all green. Tests pass, build passes, on-chain artefacts ready. Built with Codex + Claude Code over 42 days, 5,900 lines of TypeScript and Solidity, zero hand-rolled boilerplate." | Highlight the green check marks. |
| 2:50–3:00 | Topbar with cycle counter | "Agentic Wallet Treasury. Five agents. Three registries. One Mantle treasury. Submitted to the Turing Test Hackathon, Track 6 — Agentic Wallets and Economy." | Closing static frame on the topbar. |

## Recording tips

- Re-run `npm run demo` once between segments 1:20 and 1:45 so the cycle counter
  ticks visibly. Do it from the hidden terminal.
- For the `mantlescan` side tab, pre-open a real tx hash from your latest
  `npm run feedback` broadcast. Don't open it for the first time on camera.
- If the Sepolia RPC is flaky, run `WATCH_FIXTURE=1 npm run watch-events`
  before recording to populate `events.json` with synthetic but plausible
  events. Mention "rehearsal data" only if a judge asks.
- Keep the Sentinel ReSim block on screen for at least 8 seconds. That single
  panel is the project's strongest narrative asset.

## Post-production checklist

- [ ] Add a 1-second title card at 0:00 with project name + Track 6 logo.
- [ ] Caption the EIP-712 segment ("Guard signs, Claw submits — chain enforces").
- [ ] Add a freeze frame on the score 41 cycle with overlay text
      "Sentinel rejected — slippage 150 bps exceeded 80 bps tolerance".
- [ ] Final card with QR code linking to the DoraHacks BUIDL page.
- [ ] Audio: pin gain to -3 dB, normalize, no music under voiceover (judges
      need to hear specifics).
- [ ] Export: 1080p H.264, < 60 MB so DoraHacks lets you upload directly.

## Backup plan if Sepolia is offline on demo day

- Use scripted scenarios only: `EXECUTOR=mock npm run demo` already produces
  visually convincing dashboard state.
- Switch the Live Chain panel narrative from "live values from Mantle" to
  "polled snapshot of last successful broadcast".
- Skip segment 2:10–2:30 (Event Log) if `events.json` is empty; cut from
  Live Chain straight to Submission Readiness.

## What to NOT show

- The terminal output (judges have seen 50 of those today).
- VSCode / source code (your README has the architecture diagram).
- The .env file or anything resembling private keys.
- The mnemonic generator — even when zoomed out.
