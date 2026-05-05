# Byreal / RealClaw / Skills CLI 摘要

## 三层关系

```
Byreal (品牌)
├── Byreal DEX —— Solana 上的 CLMM DEX（最早的产品）
├── RealClaw —— Byreal 在 Mantle 上的 AI agent 交易平台（Phase 1 用它）
└── Byreal Agent Skills (Skills CLI) —— 给 AI agent 用的命令行工具集（Phase 2 第 6 赛道核心）
```

> ⚠️ **重要事实**：今天（2026-05）公开仓库里的 Byreal Skills CLI 仍以 Solana CLMM 为主（@byreal-io/byreal-cli）。**Mantle 版的 Skills CLI 是这次 Hackathon 的新载体**，预计在 Phase 2 启动时同步发布扩展或 Mantle 适配版。Phase 1 的"RealClaw on Mantle"已经是先行版。

## 1. RealClaw（Phase 1 的核心战场）

来源：<https://www.byreal.io/en/realclaw/mantle>，Phase 1 已结束。

### 设计理念

- 用户用聊天 / 语音表达 intent，agent 负责执行——把 DeFi 操作从「自己点按钮」变成「告诉 agent 我要什么」
- 入口：**Telegram**，发指令、收 portfolio summary、收 alert
- 钱包基础设施：**Privy 提供的非托管钱包**，私钥用户自管
- 控制流：agent 可执行 swap、调仓、yield、定投，每笔都需要用户在 confirmation flow 中确认

### 支持的链上动作

- 稳定币 yield（不用手动管 position）
- 自动 mirror 顶级 LP 的策略（copy farmer）
- 定投买币 / 买代币化股票
- LP range 偏离时自动 alert + 一键 rebalance
- 自然语言查询账户、余额、收益

### 现状

只对白名单用户开放。

## 2. Byreal Skills CLI（Phase 2 第 6 赛道核心）

GitHub：<https://github.com/byreal-git/byreal-agent-skills>
NPM 包：`@byreal-io/byreal-cli`
Skill 安装：`npx skills add byreal-git/byreal-agent-skills`

### 设计哲学

- **每个命令都返回 JSON**（`-o json`），方便 LLM 直接 parse
- **内置 skill 系统**，AI agent 可自动 discover 所有能力——`byreal-cli skill` 就能拿到完整能力目录
- 私钥本地存储 `~/.config/byreal/keys/`，权限 0600，从不上链/上传

### 命令地图（Solana 版，Mantle 版命令名应类似）

| 类别 | 关键命令 |
|---|---|
| 概览 | `overview` —— 全局 TVL/volume/fees |
| 池子 | `pools list / info / klines / analyze` |
| 代币 | `tokens list / search / price` |
| Swap | `swap execute --dry-run / --confirm` |
| 仓位 | `positions list / open / increase / decrease / close / claim / claim-rewards / analyze / top-positions / copy` |
| 钱包 | `wallet address / balance / setup` |
| 工具 | `setup`、`update check`、`update install` |

### 关键 LLM 友好特性

- `byreal-cli skill` —— 给 LLM 看的完整自描述文档
- `byreal-cli catalog list` —— 结构化能力发现
- `byreal-cli catalog show <capability-id>` —— 单一能力的参数详情
- 所有命令都支持 `-o json`

### 它对你的意义

如果选 **赛道 6 (Agentic Wallets & Economy)**，必须围绕这个 CLI 来构建。典型项目方向：
- 在 Skills CLI 之上套一个 LLM agent，给它任务规划能力
- 用多个 agent 协作（一个找信号、一个执行、一个风控）
- 结合 ERC-8004 给 agent 发身份 NFT，做 reputation 系统

## 3. Perps Agent Skills（2026 新增）

Byreal 还推出了 perpetual futures 版本的 agent skills，可以让 agent 做永续交易。详情见：
<https://www.prnewswire.co.uk/news-releases/byreal-expands-agent-native-trading-to-perpetual-futures-with-byreal-perps-agent-skills-302755625.html>

## 信息源

- Byreal Skills CLI 仓库：<https://github.com/byreal-git/byreal-agent-skills>
- RealClaw on Mantle 入口：<https://www.byreal.io/en/realclaw/mantle>
- RealClaw 公告：<https://www.prnewswire.com/news-releases/bringing-agentic-finance-to-telegram-byreal-debuts-realclaw-transitioning-onchain-finance-to-an-agent-first-economy-302740561.html>
- Perps Skills：<https://www.prnewswire.co.uk/news-releases/byreal-expands-agent-native-trading-to-perpetual-futures-with-byreal-perps-agent-skills-302755625.html>
