---
name: codex-review
description: >
  本地 Codex 使用体检助手。扫描最近的 Codex 会话、项目产物、skills、自动化任务和
  Token 记录，生成排版清晰、可折叠、Prompt 可复制的 HTML 周度复盘报告，并给出
  提问方式、任务拆解、目标定义、产物沉淀和自动化复盘建议。用户要求 Codex 周度复盘、
  AI 使用体检、Prompt 诊断、Token 消耗统计、个人 AI 协作习惯优化，或希望定期检查
  Codex 使用质量时使用。
metadata:
  short-description: "生成 Codex 使用体检报告"
---

# Codex Review

复盘用户最近如何使用 Codex，产出本地 HTML 报告。流程：扫描 → 归并项目 → 分析低效点 → 生成网页 → 提示自动化。

## 铁律

- **只读扫描。** 不删除会话、缓存、报告、项目文件或 skill。
- **本地优先。** 报告默认写到本地路径，不上传。
- **不写流水账。** 按项目和问题归并，不逐条复述对话。
- **面向普通使用者。** 少术语，不展示内部调试词，不写无意义备注。
- **估算要说清。** 时间和 Token 无法精确时，说明是怎么估算的，不编造。

## Step 1 扫描数据

默认时间范围是最近 7 天，用户指定时按用户要求。

优先运行脚本生成结构化 JSON；不要每次临时手写扫描逻辑。

```bash
node scripts/scan_usage.mjs --workspace <workspace> --output /tmp/codex_usage_scan.json
```

没有脚本时可以临时扫描，但必须在摘要里说明“本次为轻量试跑，项目归并可能不稳定”。

扫描范围：

- Codex 会话记录：会话标题、用户提示词、回复摘要、时间戳、Token 事件。
- 工作区产物：最近新增或修改的文档、表格、HTML、图片、压缩包、原型文件等。
- skills：最近新增或修改的 skill、参考文件、脚本、模板。
- 自动化任务：是否已有周度复盘或同类定时任务。
- 缓存和会话健康状态：只在异常时提示。

不要把扫描到的长对话原文直接放进报告。只提炼项目、行为、产物、问题和建议。

会话 JSONL 解析要优先读取：

- `session_meta.payload`：会话 id、cwd、thread_source、source。
- `event_msg.payload.type = "user_message"`：用户原始消息。
- `response_item.payload.type = "message"`：助手回复和部分用户消息。
- `event_msg.payload.type = "token_count"`：Token 使用情况。

`thread_source = "subagent"` 或 `source.subagent` 的会话要单独统计，不要混入主使用时长。

## Step 2 归并项目

把会话和产物按主要项目聚合，而不是按单次对话罗列。

每个主要项目至少判断：

- 做了什么。
- 大概花了多久。
- 产出了哪些关键文件或结论。
- 是否出现重复劳动、返工、目标后置、约束后补。
- 下一次更好的 Prompt 应该怎么写。

低信号项目可以合并进“其他任务”，不要撑满页面。

项目识别不能只靠会话标题。要综合用户提示词、工作区产物路径、cwd 和关键词。常见归并线索：

- `README` / `SKILL.md` / `GitHub` / `使用体检` / `Codex Review` / `Token`：Codex Review 产品化。
- `ETF` / `敏感词` / `昵称` / `低误伤`：敏感词或策略表格任务。
- `邀请` / `好友` / `H5` / `Figma` / `原型`：邀请或原型需求任务。
- `storage` / `存储` / `磁盘`：存储分析任务。

如果大部分会话都落进“其他任务”，说明扫描或归并失败，要先修正数据解析，不要直接交付正式报告。

## Step 3 分析 Prompt 和协作问题

重点找这些问题：

- 目标不清：没有说最终要交付什么。
- 约束缺失：没有提前说明范围、边界、不要做什么。
- 验收缺失：没有说明什么叫做完成。
- 顺序不稳：先让 Codex 发散，后面多轮补规则。
- 产物意识弱：对话里解决了，但没有沉淀成文件、模板、脚本、skill 或自动化。

每个主要问题都要给一个可复制的改写模板。

## Step 4 生成 HTML 报告

报告设计规范读 [references/report-design.md](references/report-design.md)。

如果存在 `assets/report_template.html`，优先沿用模板的页面结构、颜色、卡片、折叠区、复制按钮和移动端样式；不要临时重新设计一套页面。

默认用脚本生成报告：

```bash
node scripts/build_report.mjs --input /tmp/codex_usage_scan.json --output <report.html>
```

报告生成后默认自动打开浏览器。定时任务也要打开报告，让用户知道复盘已经完成。只有用户明确要求静默运行或只生成文件时，才加 `--no-open`：

```bash
node scripts/build_report.mjs --input /tmp/codex_usage_scan.json --output <report.html> --no-open
```

HTML 报告固定阅读流：

1. Header：标题、时间范围、生成时间、说明按钮。
2. Hero Insight：一句话结论。
3. Overview：关键数字卡片。
4. Efficiency：效率评分卡。
5. Token：大致消耗和输入/输出/思考拆分。
6. Task Mix：任务类型和投入分布。
7. Project Ranking：项目排行。
8. Project Reviews：项目折叠复盘。
9. Prompt Diagnosis：跨项目共性问题，不重复项目里的推荐 Prompt。
10. Habit Review：使用习惯和下周行动。
11. Personal Profile：个人使用画像。
12. Copyable Prompt Templates：通用模板，不按项目重复。
13. Productization：是否适合沉淀成 skill、脚本或 GitHub 项目。

页面要像产品仪表盘，不要像长文档。第一屏必须让用户马上看懂“这周最大问题是什么、下周先改什么”。

不要把 `Automation`、`Appendix`、`三色诊断` 做成正文板块。自动化状态只在对话摘要中说明，或在用户明确要求时展示；颜色含义只放在右上角说明按钮里；估算说明只保留在必要的小字里，不单独占一节。

## Step 5 自动化任务

每次执行本 skill 时，都检查是否已有同类自动化任务。

同类任务名称包括：

- `Codex 周度使用体检`
- `Codex 使用复盘`
- `AI 使用体检`
- `Codex Review`

处理规则：

- 已有同类任务：不重复创建，只提示已有任务和执行时间。
- 没有任务，且用户表达“定期 / 每周 / 自动 / 持续检查”：直接创建。
- 没有任务，且用户只是临时复盘：结尾提示可创建每周自动体检。
- 默认时间：每周一 09:30。

自动化任务推荐提示词：

```text
使用 $codex-review 复盘我最近 7 天的 Codex 使用情况，生成本地 HTML 报告。
重点看：主要项目、投入时间、产出文件、Token 大致消耗、低效步骤、Prompt 问题、下周优化建议。
已有同类自动化任务时不要重复创建。
```

创建、查看、更新自动化任务时，必须使用 Codex 自动化工具，不要直接编辑自动化配置文件。

## Step 6 对话摘要

报告生成后，对话里只给简短摘要：

- 本周一句话结论。
- 总时长、主要项目、Token 大致消耗。
- 最值得改的 1-3 个习惯。
- HTML 报告路径。
- 自动化任务状态。

细节让用户看 HTML。

## 个性化规则

根据用户主要用途调整侧重点：

- 产品经理：需求表达、PRD、原型、约束定义、验收标准、评审准备。
- 开发者：代码改动、测试验证、上下文读取、返工原因、风险控制。
- 运营或业务：文案产出、数据整理、执行交接、素材复用。
- 研究型用户：资料来源、证据质量、判断标准、结论可靠性。

只建议保存长期稳定的偏好和协作规则。不要把敏感信息、一次性项目事实、完整原始对话写入长期记忆。
