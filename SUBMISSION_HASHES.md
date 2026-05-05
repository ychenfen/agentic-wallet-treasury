# Submission Hashes — Agentic Wallet Treasury

Generated: 2026-05-05T08:41:53.634Z

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

## 2. ValidatorPaymaster x402 escrow

- **Address** — [0x1b94…7475](https://sepolia.mantlescan.xyz/address/0x1b94af58b27203bc74ab749e4916d854758c7475) on mantle-sepolia (chainId 5003)
- **Deployer / Owner** — [0xeedB…1FdE](https://sepolia.mantlescan.xyz/address/0xeedBcc283BB7964D64274986eEF22b2abb1a1FdE)
- **Deploy tx** — [0x329614a2…66688b](https://sepolia.mantlescan.xyz/tx/0x329614a24ba2b6ab2869a3552bc7e7baa0fc6223e3ab5a7f0097a5d7d766688b)
- **Latest validation fee** — 1000000000000000 wei from [0x14e8…4718](https://sepolia.mantlescan.xyz/address/0x14e8C7ae1B51274fD6A45fBd1c81cBD7e9294718) to Sentinel [0x7161…6385](https://sepolia.mantlescan.xyz/address/0x71615d9cF43E786E20F3D98E32FB001D4fCc6385)
- **Payment tx** — [0x20406118…4e7571](https://sepolia.mantlescan.xyz/tx/0x204061182355170d185995a620a521a2f16b04c32b016f0c7258c5677d4e7571)
- **Linked requestHash** — 0x27bf50c3cfe269388f0363b7737f72cf798b76e3c27efafbf436bb57c17c70c6

## 3. ERC-8004 agent identities

Registry: [0x8004…BD9e](https://sepolia.mantlescan.xyz/address/0x8004A818BFB912233c491871b3d84c89A494BD9e) on mantle-sepolia

| Slug | agentId | Owner | Register tx |
|---|---:|---|---|
| researcher | #26 | [0x9430…45a4](https://sepolia.mantlescan.xyz/address/0x9430B096b2B54C49B6C7D495Dd54f78aF8FC45a4) | [0x999a3c96…f22a15](https://sepolia.mantlescan.xyz/tx/0x999a3c96fa65943c0f9a525ee5cbf7188c4c745b5873676d7d44afb8d4f22a15) |
| risk | #27 | [0x0067…4977](https://sepolia.mantlescan.xyz/address/0x0067F734596b61DC4565FbC6242D5E1B3cc74977) | [0x830efbc9…aefbe8](https://sepolia.mantlescan.xyz/tx/0x830efbc9db19b8a77ac1419c4e3abb96e04842cf7fe661f4606a65b4edaefbe8) |
| executor | #28 | [0x14e8…4718](https://sepolia.mantlescan.xyz/address/0x14e8C7ae1B51274fD6A45fBd1c81cBD7e9294718) | [0xa715a983…9edb07](https://sepolia.mantlescan.xyz/tx/0xa715a9833a69975e420b3af81daf0ddb309f32a1a6d06c47c070ed13339edb07) |
| auditor | #29 | [0xeedB…1FdE](https://sepolia.mantlescan.xyz/address/0xeedBcc283BB7964D64274986eEF22b2abb1a1FdE) | [0x9c595429…d2e4a2](https://sepolia.mantlescan.xyz/tx/0x9c5954290cd07294be6f6bb01525f5bf38a495f1f39d9e9a238f7cdd8dd2e4a2) |
| validator | #30 | [0x7161…6385](https://sepolia.mantlescan.xyz/address/0x71615d9cF43E786E20F3D98E32FB001D4fCc6385) | [0xdb8f92d4…5e9594](https://sepolia.mantlescan.xyz/tx/0xdb8f92d47cf3ab309b3d4f15544a7585156b1b6d318ebcb0edd2e56c155e9594) |

## 4. Latest cycle

- **Cycle #** — 9 (scenario `small-stable-rotation`)
- **Proposal** — Move a small treasury slice into a lower-risk Mantle yield action — $125 MNT→USDe
- **Verdict** — approved (92/100)
- **Execution** — mantle-sepolia · submitted · tx [0xf7d2c2fa…701e2f](https://sepolia.mantlescan.xyz/tx/0xf7d2c2fae3553902ca737ec70eaa54d2b9fbf4e17ab791de01865d9f53701e2f)
- **Validation** — 92/100 (passed) · request hash 0x27bf50c3cfe269388f0363b7737f72cf798b76e3c27efafbf436bb57c17c70c6
- **x402 validator fee** — 1000000000000000 wei · paymaster [0x1b94…7475](https://sepolia.mantlescan.xyz/address/0x1b94af58b27203bc74ab749e4916d854758c7475) · tx [0x20406118…4e7571](https://sepolia.mantlescan.xyz/tx/0x204061182355170d185995a620a521a2f16b04c32b016f0c7258c5677d4e7571)
- **Sentinel re-sim** — adapter=mock · realized 18 bps vs 80 bps · pool=deep · score 92/60

## 5. Recent on-chain events

| Block | Source | Event | Agent | Args | Tx |
|---:|---|---|---|---|---|
| 38212915 | reputation | `NewFeedback` | Sentinel #30 | agentId=30 · clientAddress=0xeedBcc…1FdE · indexedTag1=0xe61253…bc3a · feedbackIndex=2 | [0xc6ad5008…b71974](https://sepolia.mantlescan.xyz/tx/0xc6ad500823293b1423186df71841fc2124de7cc12232c40c3d860c5f82b71974) |
| 38212912 | reputation | `NewFeedback` | Ledger #29 | agentId=29 · clientAddress=0x71615d…6385 · indexedTag1=0x35239c…1b43 · feedbackIndex=2 | [0xb7b0955d…d0e1dc](https://sepolia.mantlescan.xyz/tx/0xb7b0955da1b3c7891b06803494f3276e559292decd80c06c8334767ef8d0e1dc) |
| 38212908 | reputation | `NewFeedback` | Claw #28 | agentId=28 · clientAddress=0xeedBcc…1FdE · indexedTag1=0x904887…b717 · feedbackIndex=3 | [0x21d7fb2d…806996](https://sepolia.mantlescan.xyz/tx/0x21d7fb2d9564d34329e2de6e15811b7d5e8c66533c92388a61a14742ab806996) |
| 38212904 | reputation | `NewFeedback` | Guard #27 | agentId=27 · clientAddress=0xeedBcc…1FdE · indexedTag1=0x0c8418…a47c · feedbackIndex=3 | [0xd0056cdc…2eb0e1](https://sepolia.mantlescan.xyz/tx/0xd0056cdc7533eecd569bfc93175840316641fab6ebd824c8c086b836cb2eb0e1) |
| 38212900 | reputation | `NewFeedback` | Scout #26 | agentId=26 · clientAddress=0xeedBcc…1FdE · indexedTag1=0x9353df…3dce · feedbackIndex=3 | [0xed8c621f…531715](https://sepolia.mantlescan.xyz/tx/0xed8c621f0a17466f408b8845cb2b420243d8908bd9e4cc53babe1bf17b531715) |
| 38212865 | validation | `ValidationResponse` | Claw #28 | validatorAddress=0x71615d…6385 · agentId=28 · requestHash=0x27bf50…70c6 · response=92 | [0x9429939a…fbfd74](https://sepolia.mantlescan.xyz/tx/0x9429939a46e7f860319177dce76a61f0ddcff19b9369611465834102f7fbfd74) |
| 38212793 | validation | `ValidationRequest` | Claw #28 | validatorAddress=0x71615d…6385 · agentId=28 · requestHash=0x27bf50…70c6 | [0x07224443…ce96c9](https://sepolia.mantlescan.xyz/tx/0x0722444347a40a443281f3c6731e3288907eb146c3db99dd4f00508ea6ce96c9) |
| 38212739 | paymaster | `Deposited` | — | validator=0x71615d…6385 · payer=0x14e8C7…4718 · requestHash=0x27bf50…70c6 · amountWei=1000000000000000 | [0x20406118…4e7571](https://sepolia.mantlescan.xyz/tx/0x204061182355170d185995a620a521a2f16b04c32b016f0c7258c5677d4e7571) |
| 38212699 | treasury | `TreasuryActionExecuted` | — | actionId=0x826892…4c0e · executor=0x14e8C7…4718 · target=0x739862…6fE9 · value=0 | [0xf7d2c2fa…701e2f](https://sepolia.mantlescan.xyz/tx/0xf7d2c2fae3553902ca737ec70eaa54d2b9fbf4e17ab791de01865d9f53701e2f) |
| 38204513 | validation | `ValidationResponse` | Claw #28 | validatorAddress=0x71615d…6385 · agentId=28 · requestHash=0x19d616…b487 · response=92 | [0xe4897d7e…2cca8d](https://sepolia.mantlescan.xyz/tx/0xe4897d7e5fcc38369eb02b374078416612e6b60c4c77226808962421692cca8d) |
| 38204509 | validation | `ValidationRequest` | Claw #28 | validatorAddress=0x71615d…6385 · agentId=28 · requestHash=0x19d616…b487 | [0x652b7154…c448b6](https://sepolia.mantlescan.xyz/tx/0x652b71548464cdd81913c18ab2cf3a8a691320fa324a3d35416715c90dc448b6) |
| 38204505 | treasury | `TreasuryActionExecuted` | — | actionId=0x952c81…f027 · executor=0x14e8C7…4718 · target=0x739862…6fE9 · value=0 | [0xa3d26423…a4ca8a](https://sepolia.mantlescan.xyz/tx/0xa3d26423e3ab39e4303009d862d2e3f9f6d50fcc8139f93c3d73821999a4ca8a) |
| 38204364 | reputation | `NewFeedback` | Sentinel #30 | agentId=30 · clientAddress=0xeedBcc…1FdE · indexedTag1=0xe61253…bc3a · feedbackIndex=1 | [0xbfb7858f…60c1e0](https://sepolia.mantlescan.xyz/tx/0xbfb7858fd60d08803e6ee2a198a687354be04239fcb4705e099fe41dcb60c1e0) |
| 38204360 | reputation | `NewFeedback` | Ledger #29 | agentId=29 · clientAddress=0x71615d…6385 · indexedTag1=0x35239c…1b43 · feedbackIndex=1 | [0x107bea5e…291cc5](https://sepolia.mantlescan.xyz/tx/0x107bea5e4e8909adb63b445796af299bca72077dd0ddae526d17f5fc50291cc5) |
| 38204356 | reputation | `NewFeedback` | Claw #28 | agentId=28 · clientAddress=0xeedBcc…1FdE · indexedTag1=0x904887…b717 · feedbackIndex=2 | [0x8fe7caa7…a7e215](https://sepolia.mantlescan.xyz/tx/0x8fe7caa7349824576ced19c8f523799ef954b8fbd7e8afd694b92f7b3fa7e215) |

## 6. Reproduce these claims

```bash
npm run verify          # reads tokenURI / ownerOf / getSummary on-chain for every agent
npm run preflight       # confirms local artefacts and env match expectations
npm run watch-events    # streams new events into the dashboard event log
```

For independent verification, click any address or tx link above to open mantlescan.
