# Mantle Network 技术栈摘要

## 它是什么

Mantle 是一个 **EVM 兼容的 Optimistic Rollup L2**，定位「the premier distribution layer」——把 TradFi、机构和 Web3 流动性桥接起来。强调「real-world finance flows on-chain」。

> 一句话：以太坊的 L2，但叙事重心在 RWA + 机构资产 + 大资金分发，不主打高性能。

## 架构关键组件

1. **Execution Layer**：EVM 兼容，Solidity / Vyper / Yul 都能用，Foundry / Hardhat / Remix / Truffle 全部支持。
2. **Sequencing & Batching**：单 sequencer 排序、批量上链。
3. **Data Availability**：早期用 EigenDA / Mantle DA，**2026 年 1 月起改用 Ethereum blobs（EIP-4844）作为主 DA 层**——这是 2026 年最重要的一次架构升级。
4. **Settlement**：将 state root / commitment 提交到 Ethereum，继承 PoS 安全。

## 核心数字（2026 Q1 末）

- 社区拥有资产：$4B+
- DeFi TVL：历史新高 $755M+，单周增长 66%
- Aave 在 Mantle 的市场规模 19 天内冲到 $1B
- Mantle Vault TVL：$200M
- 稳定币 TVL：历史新高
- Phase 1 ClawHack 中已部署 200+ AI agent

## 核心生态产品（必须知道）

| 产品 | 性质 | 你能用它做什么 |
|---|---|---|
| **MNT** | 原生治理代币 | gas、抵押 |
| **mETH** | 流动性质押 ETH | 与 USDY、stETH 类似，用作底层收益资产 |
| **fBTC** | 包装比特币 | 把 BTC 引入 DeFi |
| **MI4** | Mantle 的 institutional index 资产 | 机构组合敞口 |
| **Mantle Vault** | 收益聚合 | 自动化收益策略层 |

## 重点 DeFi 集成（Phase 1 已使用）

| 协议 | 类型 | 用途 |
|---|---|---|
| **Merchant Moe** | DEX (Joe v2 / Liquidity Book) | swap、LP，提供 "bin-style" 集中流动性 |
| **Agni Finance** | UniV3-fork DEX | swap、LP、CLMM |
| **Fluxion** | DEX | swap |
| **Aave (Mantle)** | 借贷 | 杠杆策略、循环借贷 |
| Ethena USDe 集成 | 稳定币 | delta-neutral 策略基础 |
| Ondo USDY 集成 | RWA 国债 | RWA 赛道核心资产 |

> **Phase 1 的 agent 主要在 Merchant Moe / Agni / Fluxion 上做 swap+LP。Phase 2 你大概率也要接这些协议。**

## 链信息（写代码会用到）

- **Mantle Mainnet**：Chain ID `5000`，Block Explorer `mantlescan.xyz`
- **Mantle Sepolia (Testnet)**：Block Explorer `sepolia.mantlescan.xyz`
- 公共 RPC、Hardhat / Foundry 配置都有现成模板（参考 MetaMask 文档）

## ERC-8004 在 Mantle 上的部署（重要！）

ERC-8004 官方合约**已经在 Mantle 主网和 Sepolia 测试网部署**，可以直接调用，**不需要你自己部署 registry**：

- Mantle Mainnet
  - IdentityRegistry: `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
  - ReputationRegistry: `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`
- Mantle Sepolia
  - IdentityRegistry: `0x8004A818BFB912233c491871b3d84c89A494BD9e`
  - ReputationRegistry: `0x8004B663056A597Dffe9eCcC1965A193B7388713`

> 直接 import 这些地址、调 `register()` 就能拿到 agentId NFT。

## 信息源

- Mantle 官网：<https://www.mantle.xyz>
- Mantle 文档：<https://github.com/mantlenetworkio/documents>
- L2BEAT 项目页：<https://l2beat.com/scaling/projects/mantle>
- DefiLlama Mantle 链：<https://defillama.com/chain/Mantle>
- Nansen Mantle Q1 2026 报告：<https://nansen.ai/post/mantle-q1-2026-report>
- Messari State of Mantle Q2 2025：<https://messari.io/report/state-of-mantle-q2-2025>
- MetaMask 开发者文档（Mantle）：<https://docs.metamask.io/services/reference/mantle/>
