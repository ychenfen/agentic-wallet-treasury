# Submission Hashes — Agentic Wallet Treasury

Generated: 2026-05-05T04:03:20.876Z

This file enumerates every on-chain artefact the project produced
during its Mantle Sepolia rehearsal. It exists so judges can verify
each claim independently on mantlescan without trusting the dashboard.

## 1. AgenticTreasury contract

- **Address** — [0x7398…6fe9](https://sepolia.mantlescan.xyz/address/0x739862c3cf9b5f9fe6a8ecd95e75714a20116fe9) on mantle-sepolia (chainId 5003)
- **Deployer / Owner** — [0xeedB…1FdE](https://sepolia.mantlescan.xyz/address/0xeedBcc283BB7964D64274986eEF22b2abb1a1FdE)
- **Risk Officer (Guard)** — [0x0067…4977](https://sepolia.mantlescan.xyz/address/0x0067F734596b61DC4565FbC6242D5E1B3cc74977)
- **Max action value (wei)** — 1000000000000000000
- **Deploy tx** — [0x649656b3…d2f190](https://sepolia.mantlescan.xyz/tx/0x649656b3c701d809bfeac8e2ec70bd459d2fee1af52de1b6bb95bd1b20d2f190)
- **Deployed at** — 2026-05-05T03:48:13.061Z

## 2. ERC-8004 agent identities

Registry: [0x8004…BD9e](https://sepolia.mantlescan.xyz/address/0x8004A818BFB912233c491871b3d84c89A494BD9e) on mantle-sepolia

| Slug | agentId | Owner | Register tx |
|---|---:|---|---|
| researcher | #26 | [0x9430…45a4](https://sepolia.mantlescan.xyz/address/0x9430B096b2B54C49B6C7D495Dd54f78aF8FC45a4) | [0x999a3c96…f22a15](https://sepolia.mantlescan.xyz/tx/0x999a3c96fa65943c0f9a525ee5cbf7188c4c745b5873676d7d44afb8d4f22a15) |
| risk | #27 | [0x0067…4977](https://sepolia.mantlescan.xyz/address/0x0067F734596b61DC4565FbC6242D5E1B3cc74977) | [0x830efbc9…aefbe8](https://sepolia.mantlescan.xyz/tx/0x830efbc9db19b8a77ac1419c4e3abb96e04842cf7fe661f4606a65b4edaefbe8) |
| executor | #28 | [0x14e8…4718](https://sepolia.mantlescan.xyz/address/0x14e8C7ae1B51274fD6A45fBd1c81cBD7e9294718) | [0xa715a983…9edb07](https://sepolia.mantlescan.xyz/tx/0xa715a9833a69975e420b3af81daf0ddb309f32a1a6d06c47c070ed13339edb07) |
| auditor | #29 | [0xeedB…1FdE](https://sepolia.mantlescan.xyz/address/0xeedBcc283BB7964D64274986eEF22b2abb1a1FdE) | [0x9c595429…d2e4a2](https://sepolia.mantlescan.xyz/tx/0x9c5954290cd07294be6f6bb01525f5bf38a495f1f39d9e9a238f7cdd8dd2e4a2) |
| validator | #30 | [0x7161…6385](https://sepolia.mantlescan.xyz/address/0x71615d9cF43E786E20F3D98E32FB001D4fCc6385) | [0xdb8f92d4…5e9594](https://sepolia.mantlescan.xyz/tx/0xdb8f92d47cf3ab309b3d4f15544a7585156b1b6d318ebcb0edd2e56c155e9594) |

## 3. Latest cycle

- **Cycle #** — 11 (scenario `small-stable-rotation`)
- **Proposal** — Move a small treasury slice into a lower-risk Mantle yield action — $125 MNT→USDe
- **Verdict** — approved (92/100)
- **Execution** — mantle-sepolia · submitted · tx [0xa3d26423…a4ca8a](https://sepolia.mantlescan.xyz/tx/0xa3d26423e3ab39e4303009d862d2e3f9f6d50fcc8139f93c3d73821999a4ca8a)
- **Validation** — 92/100 (passed) · request hash 0x19d61659c3fecc08ec4a8559c7f62702e504fa580e063f14c3d118da4596b487
- **Sentinel re-sim** — adapter=mock · realized 18 bps vs 80 bps · pool=deep · score 92/60

## 4. Recent on-chain events

| Block | Source | Event | Agent | Args | Tx |
|---:|---|---|---|---|---|
| 38204513 | validation | `ValidationResponse` | Claw #28 | validatorAddress=0x71615d…6385 · agentId=28 · requestHash=0x19d616…b487 · response=92 | [0xe4897d7e…2cca8d](https://sepolia.mantlescan.xyz/tx/0xe4897d7e5fcc38369eb02b374078416612e6b60c4c77226808962421692cca8d) |
| 38204509 | validation | `ValidationRequest` | Claw #28 | validatorAddress=0x71615d…6385 · agentId=28 · requestHash=0x19d616…b487 | [0x652b7154…c448b6](https://sepolia.mantlescan.xyz/tx/0x652b71548464cdd81913c18ab2cf3a8a691320fa324a3d35416715c90dc448b6) |
| 38204505 | treasury | `TreasuryActionExecuted` | — | actionId=0x952c81…f027 · executor=0x14e8C7…4718 · target=0x739862…6fE9 · value=0 | [0xa3d26423…a4ca8a](https://sepolia.mantlescan.xyz/tx/0xa3d26423e3ab39e4303009d862d2e3f9f6d50fcc8139f93c3d73821999a4ca8a) |
| 38204364 | reputation | `NewFeedback` | Sentinel #30 | agentId=30 · clientAddress=0xeedBcc…1FdE · indexedTag1=0xe61253…bc3a · feedbackIndex=1 | [0xbfb7858f…60c1e0](https://sepolia.mantlescan.xyz/tx/0xbfb7858fd60d08803e6ee2a198a687354be04239fcb4705e099fe41dcb60c1e0) |
| 38204360 | reputation | `NewFeedback` | Ledger #29 | agentId=29 · clientAddress=0x71615d…6385 · indexedTag1=0x35239c…1b43 · feedbackIndex=1 | [0x107bea5e…291cc5](https://sepolia.mantlescan.xyz/tx/0x107bea5e4e8909adb63b445796af299bca72077dd0ddae526d17f5fc50291cc5) |
| 38204356 | reputation | `NewFeedback` | Claw #28 | agentId=28 · clientAddress=0xeedBcc…1FdE · indexedTag1=0x904887…b717 · feedbackIndex=2 | [0x8fe7caa7…a7e215](https://sepolia.mantlescan.xyz/tx/0x8fe7caa7349824576ced19c8f523799ef954b8fbd7e8afd694b92f7b3fa7e215) |
| 38204352 | reputation | `NewFeedback` | Guard #27 | agentId=27 · clientAddress=0xeedBcc…1FdE · indexedTag1=0x0c8418…a47c · feedbackIndex=2 | [0xf22fe746…e265f1](https://sepolia.mantlescan.xyz/tx/0xf22fe746364b579f377b1656010f2cde3f6f5bf8515a20d8405cd84b05e265f1) |
| 38204347 | reputation | `NewFeedback` | Scout #26 | agentId=26 · clientAddress=0xeedBcc…1FdE · indexedTag1=0x9353df…3dce · feedbackIndex=2 | [0x9c54f0c6…9409e6](https://sepolia.mantlescan.xyz/tx/0x9c54f0c603b87cbf87a3e8046cf40ad1ab6c185d6e4503c4c020f7f9eb9409e6) |
| 38204189 | reputation | `NewFeedback` | Claw #28 | agentId=28 · clientAddress=0xeedBcc…1FdE · indexedTag1=0x904887…b717 · feedbackIndex=1 | [0x3fc35a88…8016df](https://sepolia.mantlescan.xyz/tx/0x3fc35a887be4189cfae13bda361992b6ad62c4ea54ba98b522bc74721e8016df) |
| 38204185 | reputation | `NewFeedback` | Guard #27 | agentId=27 · clientAddress=0xeedBcc…1FdE · indexedTag1=0x0c8418…a47c · feedbackIndex=1 | [0xcd37c5ad…ba04b3](https://sepolia.mantlescan.xyz/tx/0xcd37c5ad343f123aed029e8613194eb0dcb5eed9c5a07038a8585cbe91ba04b3) |
| 38204181 | reputation | `NewFeedback` | Scout #26 | agentId=26 · clientAddress=0xeedBcc…1FdE · indexedTag1=0x9353df…3dce · feedbackIndex=1 | [0x602795fd…d1d98c](https://sepolia.mantlescan.xyz/tx/0x602795fdf7edb2183f146bb477b7cf94b12263c844198b68d64cdf923fd1d98c) |
| 38204175 | identity | `Registered` | Sentinel #30 | agentId=30 · owner=0x71615d…6385 | [0xdb8f92d4…5e9594](https://sepolia.mantlescan.xyz/tx/0xdb8f92d47cf3ab309b3d4f15544a7585156b1b6d318ebcb0edd2e56c155e9594) |
| 38204171 | identity | `Registered` | Ledger #29 | agentId=29 · owner=0xeedBcc…1FdE | [0x9c595429…d2e4a2](https://sepolia.mantlescan.xyz/tx/0x9c5954290cd07294be6f6bb01525f5bf38a495f1f39d9e9a238f7cdd8dd2e4a2) |
| 38204167 | identity | `Registered` | Claw #28 | agentId=28 · owner=0x14e8C7…4718 | [0xa715a983…9edb07](https://sepolia.mantlescan.xyz/tx/0xa715a9833a69975e420b3af81daf0ddb309f32a1a6d06c47c070ed13339edb07) |
| 38204163 | identity | `Registered` | Guard #27 | agentId=27 · owner=0x0067F7…4977 | [0x830efbc9…aefbe8](https://sepolia.mantlescan.xyz/tx/0x830efbc9db19b8a77ac1419c4e3abb96e04842cf7fe661f4606a65b4edaefbe8) |

## 5. Reproduce these claims

```bash
npm run verify          # reads tokenURI / ownerOf / getSummary on-chain for every agent
npm run preflight       # confirms local artefacts and env match expectations
npm run watch-events    # streams new events into the dashboard event log
```

For independent verification, click any address or tx link above to open mantlescan.
