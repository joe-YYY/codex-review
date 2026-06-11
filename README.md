# Codex Review 🚀

把你的 Codex 使用记录，变成一份能真正改进下周工作方式的本地体检报告。

**Codex Review** 是一个 Codex skill。它会扫描最近的 Codex 会话、项目产物、已安装 skills、自动化任务和 Token 记录，然后生成一份可视化 HTML 报告。它不是聊天流水账，而是帮你看清：

- 这周主要把 Codex 用在了哪些项目上
- 哪些任务最耗时间和 Token
- 哪些 Prompt 写得不清楚，导致返工
- 哪些流程值得沉淀成模板、脚本、skill 或自动化
- 下周最应该改哪几个提问习惯

一句话：**让 Codex 不只是替你干活，而是反过来帮你升级使用 Codex 的方式。**

## ✨ 能做什么

- 📊 生成最近 7 天 Codex 使用总览
- 🧩 按项目复盘：做了什么、花了多久、产出了什么
- 🧠 诊断 Prompt 问题：目标不清、约束缺失、验收标准缺失
- 🔁 找出重复劳动、返工和低效协作习惯
- 🔢 统计本地记录里的 Token 大致消耗
- 📝 输出可复制的 Prompt 模板
- 🖥️ 生成本地 HTML 报告，并自动打开浏览器
- ⏰ 支持每周自动复盘

## 🖼️ 报告长什么样

报告是本地网页，不是长篇聊天总结。

它会用卡片、表格、折叠区、颜色提示和复制按钮展示信息。你打开后应该能很快看到：

- 本周一句话结论
- 总时长、项目数、产物数、Token 大致消耗
- 任务类型分布
- 项目复盘
- Prompt 诊断
- 个人使用画像
- 下周可直接复制的 Prompt 模板
- 哪些流程值得产品化

## 📦 安装

把这个仓库放到 Codex skills 目录：

```bash
mkdir -p ~/.codex/skills
git clone <your-repo-url> ~/.codex/skills/codex-review
```

如果你是下载 ZIP，也可以解压后放到：

```text
~/.codex/skills/codex-review/
```

最终目录应类似这样：

```text
codex-review/
├── SKILL.md
├── agents/
│   └── openai.yaml
├── scripts/
│   ├── scan_usage.mjs
│   └── build_report.mjs
├── assets/
│   └── report_template.html
└── references/
    └── report-design.md
```

## ⚡ 快速开始

在 Codex 里输入：

```text
使用 $codex-review 复盘我最近 7 天的 Codex 使用情况，并生成本地 HTML 报告。
```

默认会：

1. 只读扫描本地 Codex 使用记录
2. 生成结构化数据
3. 生成 HTML 报告
4. 自动打开浏览器

## ⏰ 每周自动复盘

你可以让 Codex 创建一个每周自动任务：

```text
使用 $codex-review，帮我创建每周一 09:30 的 Codex 使用体检任务。已有类似任务就不要重复创建。
```

建议自动任务的提示词：

```text
使用 $codex-review 复盘我最近 7 天的 Codex 使用情况，生成本地 HTML 报告。
重点看：主要项目、投入时间、产出文件、Token 大致消耗、低效步骤、Prompt 问题、下周优化建议。
已有同类自动化任务时不要重复创建。
```

## 🧪 常用 Prompt

周度复盘：

```text
使用 $codex-review 复盘我最近 7 天的 Codex 使用情况。
重点看：主要项目、投入时间、产出文件、Token 大致消耗、低效步骤、Prompt 问题、下周优化建议。
```

单项目复盘：

```text
使用 $codex-review 复盘我最近在「项目名称」里的 Codex 使用情况。
重点看：目标是否清楚、任务拆解是否合理、哪里返工、下一次提示词怎么写。
```

提问习惯优化：

```text
使用 $codex-review 分析我最近使用 Codex 的提问习惯。
请给出 5 条下周能立刻执行的优化建议，并配可复制的 Prompt 模板。
```

## 🔐 本地边界

- 默认只读扫描
- 不删除会话、缓存、项目文件或 skill
- 报告生成在本地
- Token 统计来自本地记录，只能作为大致消耗参考

可能读取的内容：

- Codex 会话记录
- 本地项目产物
- 已安装的 skills
- 自动化任务配置
- Token 使用记录

## 🛠️ 手动运行

你也可以直接用脚本生成报告：

```bash
node scripts/scan_usage.mjs --workspace "$PWD" --output /tmp/codex_usage_scan.json
node scripts/build_report.mjs --input /tmp/codex_usage_scan.json --output /tmp/codex_usage_review.html
```

只生成文件、不自动打开：

```bash
node scripts/build_report.mjs --input /tmp/codex_usage_scan.json --output /tmp/codex_usage_review.html --no-open
```

## ❓ FAQ

**会删除我的文件吗？**  
不会。Codex Review 的默认流程是只读扫描。

**Token 统计能当账单吗？**  
不能。它读取本地记录，适合看大概消耗和趋势。

**为什么做成 skill？**  
因为复盘不是一次性总结。扫描、归并项目、生成报告、自动打开、定期检查，都适合固化成一套可重复使用的工作流。

## 🗺️ Roadmap

- 增加示例报告截图
- 支持更灵活的时间范围和项目过滤
- 提升项目自动归并准确度
- 提升 Prompt 问题识别质量
- 优化自动化创建体验
