# 赛道 5：AI DevTools ⭐ 推荐

## 官方定义

> Smart gas optimisation tools and Mantle-specific audit assistants.

## 关键词解构

- **smart gas optimisation tools**：自动找出合约里的 gas 浪费
- **Mantle-specific audit assistants**：针对 Mantle 特有特性（modular DA、blob 切换、sequencer 行为）的审计助手

## 为什么这条赛道是金矿

1. **冷门**：大多数黑客松选手扎堆做产品，做工具的少
2. **AI 编码现成的最佳应用**：Codex / Claude Code 写 lint / parser / static analysis tools 又快又干净
3. **评委（Tencent Cloud / DoraHacks / Allora）会真的用你的工具**，长期价值大
4. **门槛清晰**：只要工具有效，就是赢，不需要病毒裂变 / 商业模式

## 评审会重点看

1. **真有人用**——你能不能现场让评委粘贴一段合约，立刻看到 gas 优化建议
2. 准确率（误报率）
3. 是否针对 Mantle 特定优化（不是通用 EVM 工具的换皮）
4. 是否开源 + 能集成到 CI

## 项目方向（按推荐度）

| 方向 | 一句话 | 难度 |
|---|---|---|
| **Mantle Gas Optimizer Agent** | 输入 Solidity 合约，输出针对 Mantle gas 模型的优化 patch（带 diff 和 before/after gas 报告） | 中 |
| **Mantle Audit Co-pilot** | 针对 Mantle 特性（DA 切换、blob 兼容、sequencer 重组风险）的专家级审计 LLM agent | 中高 |
| **Foundry / Hardhat plugin** | 一行命令跑 AI 审计 + 自动 PR 修复 | 中 |
| **DeFi Protocol Diff Auditor** | 输入两个版本的合约，AI 解释差异和潜在风险 | 中 |
| **MEV / Sandwich Detection for Mantle** | 检测 Mantle sequencer 下的 MEV 模式，提供保护建议 | 中高 |

## 竞争烈度

🟢 **低-中**。预计 10-20 个项目，做出能用的工具就能进前 5。

## 你用 Codex/Claude Code 能打到的程度

- **天花板**：赛道前 3（甚至第一名）
- **AI 编码契合度**：⭐⭐⭐⭐⭐ —— 这是 Codex / Claude Code 最擅长的领域
- **关键**：用大量真实合约做评测，不要只做 demo

## 必读资源

- Slither：<https://github.com/crytic/slither>（Solidity 静态分析的标准）
- Foundry book：<https://book.getfoundry.sh>
- solhint：<https://github.com/protofire/solhint>
- Cyfrin Solodit（典型审计案例库）
