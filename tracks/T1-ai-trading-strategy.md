# 赛道 1：AI Trading & Strategy

## 官方定义

> AI quant bots and macro-driven smart contracts, with Python and Solidity templates and Bybit API support.

## 关键词解构

- **AI quant bots**：用 LLM / RL / 传统量化模型驱动的交易 bot
- **macro-driven smart contracts**：根据宏观信号（利率、宏观新闻、Fear&Greed 指数）触发链上策略
- **Python + Solidity templates**：官方提供脚手架
- **Bybit API support**：可对接中心化交易所做跨场行情 / 套利

## 评审会重点看

1. 策略本身是否有 alpha（不是简单的 momentum 或 SMA 交叉）
2. agent 的"自适应能力"——能否在不同 regime 下自我调整
3. on-chain 部分：是否真的有合约执行而不是纯链下脚本（直播阶段评委要看链上交易）
4. 风控（max drawdown、position sizing、清算保护）
5. 与 ERC-8004 的整合（reputation 累积）

## 技术栈建议

- **链下**：Python + ccxt（Bybit/币安/OKX）+ vectorbt 或 backtrader（回测）+ langgraph 或 CrewAI（多 agent 编排）
- **链上**：Solidity 0.8.x，Foundry 或 Hardhat，部署到 Mantle Sepolia 调试，再上 Mantle 主网做 demo
- **DEX 接口**：Merchant Moe（Trader Joe v2 fork，bin-style CLMM）、Agni（UniV3 fork）、Aave Mantle（杠杆）
- **数据**：Nansen API、Mantle 自带 explorer，Pyth / RedStone 喂价

## 项目方向（按可行性 × 评委口味排序）

| 方向 | 可行性 | 差异化 | 评委吃这一套度 |
|---|---|---|---|
| LLM 驱动的「研究员 + 执行 agent」分离架构，研究员产 thesis，执行 agent 评估并下单 | 高 | 中 | 高（评委是 VC，喜欢叙事） |
| 跨场（Bybit ↔ Mantle DEX）套利 bot，用 LLM 决策何时跨场 | 中 | 高 | 高 |
| Macro signal → 链上一键 rebalance 合约（FED / CPI 数据触发 USDe / mETH 切换） | 中 | 高 | 中 |
| 单纯的链上 momentum bot | 高 | 低 | 低 |

## 竞争烈度

🔴 **最高**。所有"我会写量化"的人都会扎进来，预计 60-80 个项目。要进前 5 必须有真实可验证的回测 + 链上交易记录。

## 你用 Codex/Claude Code 能打到的程度

- **天花板**：赛道前 10
- **前 3 / 第一名**：基本不可能，除非你本身有量化背景
- **建议**：除非你已经有可信的 alpha，否则**别选这条**

## 必读资源

- Bybit API：<https://bybit-exchange.github.io/docs/v5/intro>
- Merchant Moe：<https://merchantmoe.com>
- Agni Finance：<https://www.agni.finance>
