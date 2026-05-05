# 赛道 3：AI x RWA ⭐ 推荐

## 官方定义

> Dynamic yield strategies and automated risk management for assets including USDY and mETH, built on Mantle's RWA infrastructure.

## 关键词解构

- **USDY**：Ondo 的代币化美国国债，年化 4-5%
- **mETH**：Mantle 的 LST，叠加 ETH 质押收益
- **dynamic yield strategies**：根据收益率曲线动态切换敞口
- **automated risk management**：清算预警、自动 deleverage、风险敞口监控

## 为什么这条赛道是「金矿」

1. **Mantle 全公司战略重心就是 RWA + 机构**。整个官网叙事都在 push "real-world finance flows on-chain"。评委里 Animoca / Hashed / Caladan 都是 RWA 投资人。
2. **大多数选手不懂 RWA**——RWA 涉及合规、固收、链下信任，门槛高，竞争少
3. **Mantle 有现成基础设施**：Ondo USDY、Ethena USDe、mETH、fBTC、MI4，你不用造轮子
4. **故事好讲**：把传统机构的 risk parity / barbell 等策略搬上链，自动化运行

## 评审会重点看

1. 是否真的理解收益率曲线、duration、credit risk 等固收概念
2. 是否做了**真实的回测**（用 Ondo 历史 APR 数据）
3. agent 在压力情景（USDe 脱锚、ETH 暴跌）下的反应
4. **合规叙事**——能否说清这个产品对 TradFi 客户的吸引力

## 技术栈建议

- **链上**：Solidity 智能合约（ERC-4626 vault 模板），Foundry 测试
- **核心资产**：USDY、USDe、mETH、fBTC
- **AI 层**：LLM 做 macro 信号 → 把信号映射到再平衡参数
- **风控层**：基于 Pyth / Chainlink 喂价的清算监控
- **前端**：简单的 dashboard 展示当前组合 / APR / risk 指标

## 项目方向（按推荐度）

| 方向 | 一句话 | 难度 | 评委爱程度 |
|---|---|---|---|
| **AI Yield Curator** | 给定风险偏好，agent 在 USDY / USDe / mETH / fBTC 之间动态分配，每周 rebalance | 中 | 🟢🟢🟢 |
| **RWA Risk Sentinel** | 监控 Ondo / Ethena / mETH 链下指标 + 链上数据，提前发出风险警报，必要时自动 redeem | 中高 | 🟢🟢🟢 |
| **Institutional Barbell Vault** | 一个 ERC-4626 vault，把资金按 80% USDY + 20% 风险资产分配，agent 根据 macro 调整比例 | 中 | 🟢🟢🟢 |
| **mETH ↔ USDY 利差自动套利** | 监测 LST yield vs RWA yield 的利差，agent 自动切仓 | 中 | 🟢🟢 |

## 竞争烈度

🟢 **中**。RWA 门槛高，预计认真参赛 15-25 个项目，前 5 完全可冲。

## 你用 Codex/Claude Code 能打到的程度

- **天花板**：赛道前 3（甚至第一名）
- **关键**：你必须自己花 3-5 天读 Ondo / Ethena 文档、理解 RWA 业务，不能糊弄
- **代码量**：Codex/Claude Code 能搞定 80% 的 Solidity vault + 前端，AI 不擅长的部分是策略参数和叙事

## 必读资源

- Ondo Finance USDY：<https://ondo.finance/usdy>
- Ethena Labs USDe：<https://ethena.fi>
- Mantle mETH：<https://www.mantle.xyz/meth>
- ERC-4626 标准：<https://eips.ethereum.org/EIPS/eip-4626>
- Mantle RWA 介绍（搜 Mantle Index 4 / MI4）
