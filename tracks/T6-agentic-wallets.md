# 赛道 6：Agentic Wallets & Economy ⭐⭐ 最推荐

## 官方定义

> Agentic wallet economies built using the Byreal Skills CLI.

## 关键词解构

- **agentic wallet**：钱包本身是一个 agent，能自己执行复杂操作
- **agent economy**：多个 agent 互相付费、互相调用、互相验证
- **Byreal Skills CLI**：交付平台，所有项目以 CLI 命令为接口

## 为什么这条赛道**最适合你**（用 Codex / Claude Code）

1. **Byreal Skills CLI 是 LLM 友好接口**：每个命令返回 JSON、有 catalog、有 skill self-doc。**完美匹配 Codex / Claude Code 的工作方式**——AI 写 AI 调 AI。
2. **赛道是 Byreal 自己定义的，意味着 Byreal/Bybit 评委会重点看这条**
3. **ERC-8004 + 多 agent 协作 = 直播阶段最炸的视觉**：评委直播能看到几个不同身份的 agent 在链上互相调用
4. **是 Phase 1 ClawHack 的自然延续**——评委已经为 agent trading 范式建了完整心智模型

## 评审会重点看

1. agent 是否真的"自治"（不只是脚本调命令）
2. 多 agent 协作的设计（分工、通信、争议处理）
3. ERC-8004 是否被认真用了——身份 + reputation + validation 三件套有没有都接
4. 经济性——不同 agent 之间是否有真实的 token / 付费流（呼应 ERC-8004 的 x402）
5. 在 Byreal Skills CLI 之上加了什么"原生 CLI 没有"的能力

## 项目方向（按推荐度）

| 方向 | 一句话 | 难度 | 评委爱程度 |
|---|---|---|---|
| **Multi-Agent Hedge Fund** | 一个 PM agent 分配资金，多个策略 agent 竞标策略，validator agent 验证业绩，全部 ERC-8004 身份 + 链上 reputation | 中高 | 🟢🟢🟢🟢 |
| **Agent Marketplace on Byreal CLI** | 任何人都能注册自己的 agent skill（包装成 Byreal CLI 子命令），按使用次数收 MNT | 中 | 🟢🟢🟢 |
| **Reputation-Weighted Copy Trading** | 利用 ERC-8004 reputation registry 给 farmer 打分，把高分 agent 的 position 自动 copy | 中 | 🟢🟢🟢 |
| **Agent DAO** | 几个 agent 构成 DAO，每周投票决定金库分配，决议链上记录 | 中 | 🟢🟢 |
| **Telegram-Native Multi-Agent Swarm** | 用户在 TG 群发自然语言指令，多 agent 协同响应，每个 agent 有自己的 ERC-8004 身份和评价 | 中 | 🟢🟢🟢 |

## 竞争烈度

🟢 **中**。预计 20-30 个项目，但能把 ERC-8004 + 多 agent + 经济性同时跑通的不会超过 5 个。

## 你用 Codex/Claude Code 能打到的程度

- **天花板**：赛道前 2（甚至第一名）
- **AI 编码契合度**：⭐⭐⭐⭐⭐ —— 这是用 Codex/Claude Code 最优势的赛道：CLI 自带 LLM 文档，AI 一次就能写对调用代码
- **关键**：你必须先 `byreal-cli skill` 拉一遍完整文档喂给 Codex，再让它生成代码

## 实操要点

1. 先 `npm i -g @byreal-io/byreal-cli`，跑一遍 setup
2. `byreal-cli catalog list -o json` 拿到所有能力清单，存成 context
3. 把 ERC-8004 ABI 和上面 Mantle 部署地址也存成 context
4. 让 Claude Code 围绕「多 agent 角色 + ERC-8004 身份注册 + Byreal 命令 wrapper」架构生成代码
5. 把 demo 视频做成「3 个 agent 各自登场→注册 NFT→执行→互评→reputation 累积」的故事线

## 必读资源

- Byreal Skills CLI 仓库：<https://github.com/byreal-git/byreal-agent-skills>
- ERC-8004 spec：<https://eips.ethereum.org/EIPS/eip-8004>
- A2A 协议（agent 互相通信）：<https://github.com/google/A2A>
