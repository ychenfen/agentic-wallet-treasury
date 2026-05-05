# 给你的策略 & 下一步动作

## 一、整体判断

| 维度 | 结论 |
|---|---|
| 黑客松难度 | 中上偏高，但**非顶尖**——评委关注「叙事 + 可演示 + agent 真实运行」远胜代码量 |
| 你（全 AI 编码）的天花板 | 进入赛道前 5 / 拿小奖很容易；冲赛道前 1-2 取决于你选哪条 + 是否补足域知识 |
| 时间预算 | 42 天 → 第 1-3 周做 MVP，第 4 周打磨直播/视频，第 5 周做 pitch + 反复彩排 |
| 关键变量 | **赛道选择 > 代码质量 > 视觉 demo > 叙事** |

## 二、推荐赛道（从最优到次优）

### 🥇 第一选择：赛道 6 — Agentic Wallets & Economy

理由：
1. **Byreal Skills CLI 是 LLM-native 接口**，Codex / Claude Code 在这条赛道几乎零阻力
2. ERC-8004 + 多 agent 协作的视觉冲击力，对直播阶段评委最有杀伤
3. Bybit / Byreal 是最大金主之一，他们最重视这条赛道
4. 竞争集中在「能跑通端到端 demo」上，前 2-3 名可冲

### 🥈 第二选择：赛道 5 — AI DevTools

理由：
1. AI 编码本身就是写工具最高效的领域
2. 冷门赛道，预计 10-20 个项目
3. 评委（Tencent Cloud / DoraHacks / Allora）是工具的真实用户

### 🥉 第三选择：赛道 3 — AI x RWA

理由：
1. Mantle 的战略重心，评委（Hashed / Caladan / Animoca）是 RWA 投资人
2. 门槛高但 AI 可以补齐 80% 的代码量
3. **前提**：你愿意花 3-5 天读懂 USDY / USDe / mETH 的真实业务逻辑

### ⚠️ 不建议
- **赛道 1 (AI Trading)**：竞争最激烈，没有量化背景几乎没机会冲前 3
- **赛道 2 (Alpha & Data)** 和 **赛道 4 (Consumer)**：可以做但天花板低于上面三条

## 三、推荐项目（Top 3）

### Pitch Idea #1 ⭐⭐⭐ —— "ClawDAO": Multi-Agent Hedge Fund on Mantle
**赛道**：6（同时蹭赛道 1、3 的论调）
**一句话**：四个 ERC-8004 身份的 agent 组成一个链上对冲基金——PM 分配资金、3 个策略 agent 在 Byreal/Mantle 上各自跑策略、validator agent 验证和打分、reputation 影响下一轮分配
**为什么赢**：
- 同时命中 ERC-8004 三件套（identity / reputation / validation）
- 用 Byreal Skills CLI 做执行层，正中赛道命题
- 直播效果炸裂：4 个 agent 的实时仪表盘
- 评委一看就懂："agent economy" 的最具象表达

### Pitch Idea #2 ⭐⭐ —— "Mantle Audit Co-pilot"
**赛道**：5
**一句话**：针对 Mantle 特性（DA 切换、blob、sequencer 重组）的 AI 审计 agent，输入合约地址或源码，输出风险报告 + Foundry 验证脚本
**为什么赢**：
- Codex / Claude Code 的甜蜜点
- 评委可以现场粘贴一段合约，立刻看到结果
- 长期价值高，Mantle 团队会想留下来用

### Pitch Idea #3 ⭐⭐ —— "Yield Architect": AI RWA Vault
**赛道**：3
**一句话**：ERC-4626 vault，agent 根据宏观信号在 USDY / USDe / mETH / fBTC 之间动态分配；用户给定风险偏好，每周自动 rebalance；ERC-8004 身份累积业绩声誉
**为什么赢**：
- 完全契合 Mantle 战略叙事
- 即便代码做得普通，故事和合规叙事都很硬
- AI 可以把 80% 的合约和前端写出来

## 四、具体执行 Roadmap（按 Pitch #1 ClawDAO 写）

### Week 1（5/4 - 5/10）：Foundation + 学习
- Day 1-2：完整读 ERC-8004 spec、Byreal Skills CLI README、SKILL.md（重点）；安装 byreal-cli，本地跑一遍 catalog
- Day 3：在 Mantle Sepolia 上手动 mint 一个 ERC-8004 身份（直接调已部署的 IdentityRegistry），跑通"agent 注册→设置 wallet→更新 metadata"全流程
- Day 4-5：用 Codex / Claude Code 搭脚手架（Python + LangGraph + ethers.js），把 4 个 agent 角色的骨架敲出来
- Day 6-7：让其中一个策略 agent 真的能在 Mantle Sepolia 上做一笔 swap（哪怕用现成的 UniswapV2 fork）

### Week 2（5/11 - 5/17）：MVP
- Day 8-9：接通 Byreal Skills CLI（如有 Mantle 适配版用 Mantle 版；没有则把 Solana 版的命令封装成抽象层，以后切换）
- Day 10-11：实现 reputation registry 调用——agent 完成任务后互评写入链上
- Day 12-13：做 dashboard（React + 简单图表）展示 4 个 agent 的实时状态、reputation、PnL
- Day 14：第一次端到端 demo run，记录 bug list

### Week 3（5/18 - 5/24）：打磨 + 引入 validator
- Day 15-17：加入 validator agent（用 zkML 或 TEE 假装做也行，关键是 narrative）
- Day 18-19：写完整 README 和架构图
- Day 20-21：开始测试在直播条件下的稳定性

### Week 4（5/25 - 5/31）：Demo + Pitch
- Day 22-25：录 3 分钟 demo 视频（开场抓住人，30 秒讲清楚 4 个 agent 是谁，60 秒看一轮真实交易，30 秒讲 reputation 累积，30 秒讲愿景）
- Day 26-28：写 pitch deck（10 页：问题 / 现状缺陷 / ClawDAO 解法 / agent 经济模型 / Demo / 数据 / Roadmap / Team / Ask）

### Week 5（6/1 - 6/15）：稳定 + 反复彩排
- 跑至少 7 天的连续 agent 操作，留下完整的链上记录
- 针对评委结构调整 pitch 重点（VC 评委 → 经济模型；技术评委 → ERC-8004 实现细节）
- 提交前 3 天封代码，只优化 demo 视频和 README

## 五、关键的"AI 帮不了你"清单（必须人来做）

1. **赛道选择**——AI 不知道你的背景和评委今年的偏好
2. **产品愿景**——为什么这个 agent 经济能跑通？谁付费？
3. **真实交易判断**——AI 写的策略代码"看起来对但不一定赚钱"
4. **故事线**——demo 视频和 pitch 的开场 30 秒
5. **人际关系**——加 Mantle / DoraHacks / Bybit 团队的 TG 群、参加 office hours、问问题、刷脸
6. **合规直觉（如选赛道 3）**——RWA 的客户是谁、监管风险在哪
7. **直播应变**——出 bug 时怎么 recover

## 六、立即可以开始的动作

1. **今晚就做**：`npm i -g @byreal-io/byreal-cli && byreal-cli skill`，把输出存到 `byreal/skill-output.txt`
2. **今晚就做**：去 Mantle Sepolia 领测试币，调用 IdentityRegistry 的 `register()` mint 你自己的第一个 agentId，发个推文宣告
3. **本周做**：加 Mantle / DoraHacks 黑客松官方 TG / Discord，关注 office hours 时间
4. **本周做**：决定赛道——可以三选一，但别拖到 Week 2
5. **决定赛道后**：在 `outputs/mantle-turing-test/strategy/` 下新建 `05-final-pitch.md`，把你最终方案的 README 和架构图敲出来

## 七、风险提示

- **白名单问题**：RealClaw 仍是白名单产品，注意黑客松是否提供测试 invite
- **Byreal Skills CLI 的 Mantle 适配**：现公开仓库以 Solana 为主，赛道 6 可能需要等官方在比赛期间发布 Mantle 版本——记得每周看 Byreal GitHub 的 release
- **直播现场翻车**：第 4 周后必须要有完整的 fallback demo（录屏版），万一直播挂了不至于 0 分
- **评委疲劳**：100+ 项目，前 30 秒决定生死。不要把最酷的 demo 放在最后

## 八、最后的判断

**真心话**：用 Codex + Claude Code，**赛道 6 你能稳稳进前 5，冲前 2 概率 30-40%，第一名概率 10-15%**。第一名要看你能不能把"agent economy"的故事讲得让评委相信这是新范式。代码部分 AI 都能搞定，叙事部分必须你来。

42 天足够，但前 7 天的方向选择决定你能不能赢。**今天就去 Mantle Sepolia 注册一个 agentId，把心态从"参赛"切到"已经在跑了"。**
