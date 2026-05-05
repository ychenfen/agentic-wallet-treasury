# 赛道 2：AI Alpha & Data

## 官方定义

> Smart money tracking and on-chain anomaly detection bots via Telegram and Discord.

## 关键词解构

- **smart money tracking**：识别巨鲸 / 早期机构钱包 / 顶级 LP，跟踪他们的动作
- **on-chain anomaly detection**：突发大额转账、合约异常调用、rugpull 信号
- **Telegram / Discord 投递**：交付物是 bot，不一定要做完整 dApp

## 评审会重点看

1. 信号是否真"alpha"——能否提前于市场（用 backtesting 验证）
2. 数据源是否丰富（不能只用单一 API）
3. NLP 解释力——能否把链上事件变成自然语言摘要
4. **Nansen 是评委之一，他们最懂这块**，水分会被一眼看穿

## 技术栈建议

- **数据层**：Nansen API（免费 tier）、Dune（SQL）、Mantle scan API、Allium / Goldsky / Subsquid（subgraph）
- **NLP 层**：GPT-4o / Claude / Z.ai GLM（评委里有 Z.ai，用 GLM 是隐性加分）
- **bot 层**：python-telegram-bot 或 discord.py
- **存储**：PostgreSQL + pgvector（embedding 异常事件做语义搜索）

## 项目方向

| 方向 | 可行性 | 差异化 |
|---|---|---|
| **Mantle 专属聪明钱 leaderboard**：跟踪 Mantle 上 top P&L 钱包，每日推送 | 高 | 中 |
| **跨链 smart money 行为关联**：检测同一聪明钱在 Mantle / Base / Arb 之间的资金流动模式 | 中 | 高 |
| **链上事件解释器**：自动把异常合约调用翻译成自然语言警报 + 风险评级 | 中 | 高 |
| **Mantle RWA 资金流监控**：盯 USDY / mETH 的大额 mint/redeem 事件 | 中 | 高（呼应赛道 3） |

## 竞争烈度

🟡 **中高**。Discord/TG bot 看起来好做，但要做出真正可读、不刷屏、有 alpha 的产品很难。

## 你用 Codex/Claude Code 能打到的程度

- **天花板**：赛道前 5（如果你能选对一个独特的数据切片）
- **建议**：可选，但要避免做"又一个 whale alert bot"

## 必读资源

- Nansen API 文档：<https://docs.nansen.ai>
- Mantle Scan：<https://mantlescan.xyz>
- Goldsky：<https://goldsky.com>
- Subsquid：<https://subsquid.io>
