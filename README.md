# Codex Review

[简体中文](README.md) | [English](README.en.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
![Codex Skill](https://img.shields.io/badge/Codex-Skill-111827)
![Local First](https://img.shields.io/badge/Data-Local--first-2563eb)

**把最近的 Codex 使用记录，变成一份真正能改善下周工作方式的本地复盘报告。**

Codex Review 是一个面向 Codex 用户的本地使用体检 skill。它会读取最近的会话记录、项目产物、已安装 skills、自动化任务和 Token 记录，生成一份可视化 HTML 报告，帮助你回答四个问题：

- 这周主要把时间和精力花在了哪些项目上？
- 哪些 Prompt、任务拆解或目标定义导致了返工？
- 哪些重复流程值得沉淀成模板、脚本、skill 或自动化？
- 下周最应该改变哪些 Codex 使用习惯？

它不是聊天流水账，也不是精确计费工具。它更像一份面向个人工作方式的 **AI 协作周报**。

## 核心能力

| 能力 | 说明 |
| --- | --- |
| 使用总览 | 汇总最近 7 天的活跃时长、主要项目、产物数量和 Token 大致消耗 |
| 项目复盘 | 按项目整理做过的事情、投入时间、主要文件和低效步骤 |
| Prompt 诊断 | 识别目标不清、约束缺失、验收标准不足和对话反复修正 |
| 习惯分析 | 总结常见的思维问题、协作问题和可执行的改进建议 |
| HTML 报告 | 生成可折叠、可复制 Prompt、适合快速浏览的本地网页 |
| 周期复盘 | 支持创建每周自动任务，已有同类任务时避免重复创建 |

## 报告内容

生成的报告通常包括：

- 本周一句话结论
- 总时长、项目数、产物数和 Token 大致消耗
- 任务类型和精力分布
- 各项目做了什么、花了多久、哪里效率低
- Prompt 问题与下一次推荐写法
- 个人使用画像与下周行动建议
- 值得模板化、脚本化、skill 化或自动化的流程

时间和 Token 来自本地记录，只用于观察大致规模与趋势，不等同于精确工时或官方账单。

## 安装

将仓库克隆到 Codex skills 目录：

```bash
mkdir -p ~/.codex/skills
git clone https://github.com/joe-YYY/codex-review.git ~/.codex/skills/codex-review
```

也可以下载 ZIP，解压到：

```text
~/.codex/skills/codex-review/
```

安装后的主要目录：

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

## 快速开始

在 Codex 中输入：

```text
使用 $codex-review 复盘我最近 7 天的 Codex 使用情况，并生成本地 HTML 报告。
```

默认流程会：

1. 只读扫描本地 Codex 使用记录
2. 归并主要项目和相关产物
3. 分析时间、Token、Prompt 和协作习惯
4. 生成 HTML 报告
5. 自动打开报告页面

## 每周自动复盘

可以让 Codex 创建每周自动任务：

```text
使用 $codex-review，帮我创建每周一 09:30 的 Codex 使用体检任务。
复盘最近 7 天的主要项目、投入时间、产出文件、Token 大致消耗、低效步骤、Prompt 问题和下周优化建议。
已有同类自动任务时不要重复创建，报告生成后直接打开。
```

## 其他使用方式

### 单项目复盘

```text
使用 $codex-review 复盘我最近在「项目名称」里的 Codex 使用情况。
重点分析目标是否清楚、任务拆解是否合理、哪里发生返工，以及下一次 Prompt 应该怎么写。
```

### 提问习惯分析

```text
使用 $codex-review 分析我最近使用 Codex 的提问习惯。
给出 5 条下周可以立即执行的优化建议，并提供可复制的 Prompt 模板。
```

## 手动运行

日常使用建议直接调用 skill。需要调试扫描或报告生成时，可以运行脚本：

```bash
node scripts/scan_usage.mjs \
  --workspace "/path/to/your/workspace" \
  --output /tmp/codex_usage_scan.json

node scripts/build_report.mjs \
  --input /tmp/codex_usage_scan.json \
  --output /tmp/codex_usage_review.html
```

只生成文件、不自动打开浏览器：

```bash
node scripts/build_report.mjs \
  --input /tmp/codex_usage_scan.json \
  --output /tmp/codex_usage_review.html \
  --no-open
```

手动运行脚本需要 Node.js 18 或更高版本。

## 本地数据边界

- 默认只读扫描，不删除会话、缓存、项目文件或 skill
- 报告和中间数据保存在本地
- 不需要把会话记录上传到外部分析服务
- Token 统计来自本地会话事件，可能与官方计费口径不同
- 时间统计来自会话时间戳，是活跃任务时间的估算值
- 项目归并基于会话和文件线索，必要时仍需人工判断

可能读取的本地内容包括：

- Codex 会话记录
- 项目文件和近期产物
- 已安装的 skills
- 自动化任务配置
- Token 使用记录

## 项目结构

```text
.
├── SKILL.md                  # Skill 工作流与执行约束
├── agents/openai.yaml        # Codex UI 元数据
├── assets/report_template.html
├── references/report-design.md
└── scripts/
    ├── scan_usage.mjs        # 扫描并整理本地使用数据
    └── build_report.mjs      # 生成并打开 HTML 报告
```

## 路线图

- 增加脱敏后的示例报告和截图
- 支持更灵活的时间范围与项目过滤
- 提升项目自动归并准确度
- 提升 Prompt 问题识别质量
- 优化首次安装和自动任务创建体验

## 参与贡献

欢迎提交问题、改进建议和 Pull Request。开始前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 开源协议

本项目采用 [MIT License](LICENSE)。
