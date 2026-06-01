# 视频制作交接 — 给 Codex（录屏 + 剪映剪辑）

接收方：能操作剪映（CapCut 专业版）的 agent。
目标产出：一支 demo 视频，投 Mantle Turing Test Hackathon 的 DoraHacks 部署奖。

部署奖对视频的硬性要求（必须全中）：
- 时长 ≥ 2 分钟。
- 走一遍核心用例（不是纯画面堆砌）。
- 展示的前端是公开可访问的，不是 localhost。

目标规格：**2:30–3:00，1920×1080，16:9，H.264 mp4，30fps**。清晰度 > 电影感——这是技术 demo，别上复杂调色/定制动效（那些专业软件更合适，性价比低）。

---

## 0. 开始前必须先确认的一件事（决定录哪个地址）

改进版 dashboard（新手流程面板、Byreal 答题、验证绿章、真实 DeFi 动作面板）**目前只在本地和"push 后的公开站"可见**。截至本交接，仓库改动还没 push 到 GitHub Pages，所以公开站 `https://ychenfen.github.io/agentic-wallet-treasury/` 还是旧版。

两条路，二选一：
- **A（推荐）**：先让仓库 owner `git push`，等 GitHub Pages 部署完（1–2 分钟），再录**公开 URL**。地址栏干净、对评委显专业，且满足"公开可访问"硬指标。
- **B（备用）**：录本地 `npm run dev` → `http://127.0.0.1:5175/`。画面一模一样，但**录制时要把浏览器地址栏裁掉或不给特写**，避免出现 localhost。最终视频仍需在描述里给出公开站链接。

录制前可选：`npm run demo` 刷新一轮链上数据，让 dashboard 显示最新 cycle。

---

## 1. 现成素材（仓库里已有，优先复用，别从零做）

| 素材 | 路径 | 用途 |
|---|---|---|
| **逐镜头 + 旁白脚本（以此为准）** | `VIDEO_SCRIPT.md` | 时间轴、旁白文案、每段"Show 什么" |
| **自动录制的无声底片** | `artifacts/video/dashboard-walkthrough.mp4`（1600×900，按脚本时序平移每个区块） | 直接当主轨 B-roll，省去手动录屏 |
| 分段截图 | `artifacts/screenshots/00-…10-*.png` | 封面、补帧、定格强调 |
| 旧旁白（**仅参考，别直接用**） | `artifacts/video/demo-voiceover.{txt,m4a}` | 脚本已更新，旧音频对不上，需重生成 |
| 重新生成无声底片 | `npm run record`（已更新，含 DeFi 面板） | 想要更新/更高质量底片时重跑 |
| 只要分段截图 | `npm run record:screens` | 快速出图，不渲染视频 |

**主轨建议**：直接用 `dashboard-walkthrough.mp4` 当底片（它已按脚本平移过每个区块），在剪映里配旁白 + 字幕 + 强调即可。需要"点击 tx 链接跳 Mantlescan"这类交互镜头时，再单独补录（见 §3）。

---

## 2. 逐镜头时间轴（精简版，完整旁白见 `VIDEO_SCRIPT.md`）

总时长目标 ~2:50。每段对应 dashboard 的一个区块（底片里都有）。

| 时间 | 镜头 | 画面（底片对应段） | 旁白要点 |
|---|---|---|---|
| 0:00–0:12 | 钩子 | 顶部 hero「The first wallet that grades its own employees」 | 大多数 agent 钱包停在"AI 能点按钮"，我们解决更难的：授权、执行、验证、声誉 |
| 0:12–0:32 | 大白话流程 | "What just happened, in plain English" 面板 | 一个 cycle：Scout 提案→Guard 批→Claw 执行→Sentinel 复核拿 MNT→Ledger 写声誉 |
| 0:32–0:44 | 架构 | 5 个 agent 卡片 | 五个 ERC-8004 身份，三个链上注册表 |
| 0:44–1:16 | 实跑 + x402 | Risk Verdict / Execution Proof / Sentinel Validation | Guard 过了 4 项检查；Claw 发真链上 tx；Sentinel 复核打分并拿 x402 MNT 费 |
| 1:16–1:32 | Byreal 能力 | "Byreal Skills Probe" + 必答面板 | 真实 RealClaw CLI，36 能力 / 5 池子，Scout 与 Sentinel 用它做研究 |
| 1:32–1:50 | 真实 DeFi 动作 | "Real Mantle DeFi Action" 面板 | treasury 把 0.01 MNT 包成 WMNT（真实协议），Guard 批、Sentinel 校验余额 +0.01 WMNT |
| 1:50–2:04 | 合约已验证 | "Contract Verification" 绿章 | 两个合约 Sourcify exact-match 验证，源码对得上链上字节码 |
| 2:04–2:30 | 链上证据 | Live Chain / Event Log | 25 条链上事件回填，点 tx 跳 Mantlescan 独立核验 |
| 2:30–2:50 | 收尾 | GitHub + dashboard URL | 开源、公开 dashboard、链上可查，给 Mantle 一个可验证的 agent 钱包基准 |

需要插入的"交互特写"（补录或截图）：
- 点 Execution tx → Mantlescan 交易页（tx `0xa3d26423…99a4ca8a`）
- 点 Wrap tx → Mantlescan（tx `0x7a856a4f…234499`，能看到 WMNT Deposit）
- Sourcify 验证页（合约 `0x739862c3…`）

---

## 3. 录屏要求（如果你要补录或重录，而不是用现成底片）

- 分辨率 ≥ 1920×1080，浏览器 100% 缩放。
- 光标移动平稳，停顿处删掉（剪辑时处理）。
- 每个面板停留够读完关键数字（2–4 秒）。
- 滚动要慢、匀速，别甩。
- 补录交互镜头：在新标签页**预先打开** Mantlescan 的 tx / 合约页，避免录到加载白屏。

---

## 4. 剪映里要做的事（对应你列的能力，逐条落到这支片）

**节奏**
- 删掉所有口播停顿、加载白屏、空镜。
- 每段切换用快速硬切或 0.2s 转场，别用花哨转场。

**字幕（口播字幕）**
- 用剪映"识别字幕"自动生成，然后**对照 `VIDEO_SCRIPT.md` 逐句校对**（专有名词机器常错）。
- 关键词高亮（换色/加粗/花字）：`ERC-8004`、`Sourcify verified`、`WMNT`、`x402`、`EIP-712`、`Mantle Sepolia`、`+0.01 WMNT`。
- 字幕底部居中，留安全边距，字号在手机上能看清。

**强调 / B-roll / 关键帧**
- 对这些元素做画面放大（zoom-in 关键帧）2–3 秒突出：tx hash、合约地址、验证绿章、`+0.01 WMNT`、`92/100` 验证分。
- tx 链接点击、绿章出现、`+0.01 WMNT` 出现这三个时刻，配轻"叮"音效卡点。

**音频**
- 旁白：用**更新后的** `VIDEO_SCRIPT.md` 文案，剪映"文本朗读"生成（选沉稳中性声、语速适中），或人声录。**别用旧的 demo-voiceover.m4a**（脚本已变）。
- 配乐：轻科技感 BGM，循环不抢戏。
- 人声降噪 + 音量平衡：旁白比 BGM 高约 6–8 dB，整体响度别爆。

**前 3 秒钩子**
- 开场直接上大字「The first wallet that grades its own employees」+ 一两个关键数字（5 agents / 92/100 validation），抓住完播率。你可以按数据规律优化钩子和信息密度，但别承诺流量结果——这点说清楚就行。

**封面 + 标题**
- 封面：hero 标题 + 「5 ERC-8004 agents · Mantle Sepolia · Sourcify verified」一行小字 + 一个亮眼数字。
- 标题文案（视频内/平台标题）：`Agentic Wallet Treasury — 5 AI agents run an accountable wallet on Mantle`。

**版式 + 导出**
- 主版 16:9，1920×1080，H.264，30fps，AAC 音频，码率 ~10 Mbps，mp4。
- （可选）竖屏 9:16 社媒裁切版：只保留钩子 + 大白话流程 + DeFi 动作 + 收尾，控制在 45–60s。

---

## 5. 红线（必须遵守，来自 `TEAM_HANDOFF.md`，违反会毁提交）

不准出现在画面/字幕/旁白里：
- `.env`、`.env.generated`、助记词、私钥、任何含密钥的终端回滚。
- 钱包密码、API key、登录态。

不准夸大（措辞要诚实）：
- 不说"盈利交易 / alpha 收益"——这是 agent 钱包经济，不是赚钱机器人。
- 不说 Byreal 已在 Mantle 上执行——实际是 **RealClaw CLI 能力 + 池子探针**；链上执行在 **Mantle Sepolia**。
- 不暗示掌管主网真实资金——全程测试网，金额极小（0.01 MNT）。
- WMNT wrap 是测试网真实动作，可以展示，但要说清是 **Mantle Sepolia 测试网**。

---

## 6. 交付物 + 验收清单

交付：
- `final-video.mp4`（1080p，2:30–3:00，16:9）
- 封面 `cover.png`
- （可选）`vertical.mp4`（9:16，≤60s）
- （可选）字幕 `final.srt`

逐项验收（全打勾才算过）：
- [ ] 时长 ≥ 2:00（目标 2:30–3:00）
- [ ] 展示的是公开可访问的 dashboard（或本地录制但已隐藏 localhost 地址栏）
- [ ] 覆盖核心用例：5 agents + 一笔执行 tx + 一笔 x402 支付 + 一笔验证 + WMNT DeFi 动作 + Sourcify 验证绿章
- [ ] 至少点开一个 Mantlescan tx/合约页做"可独立核验"的证明
- [ ] 字幕已对照脚本校对，专有名词无错
- [ ] 前 3 秒有钩子
- [ ] 结尾给出 GitHub 仓库 + dashboard URL
- [ ] 全程零密钥/助记词泄露
- [ ] 措辞无"盈利交易 / Byreal Mantle 执行 / 主网资金"等夸大

完成后把成片放到 `artifacts/video/final/`，并回报：用了哪条录制路线（A 公开站 / B 本地）、最终时长、导出参数。
