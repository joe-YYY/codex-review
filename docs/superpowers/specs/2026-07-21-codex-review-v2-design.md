# Codex Review v2 设计说明

## 产品决策

保留 `codex-review` 的产品名、仓库名、skill 名和安装路径。内部实现重构为“平台无关的复盘核心 + Codex 适配器”。在至少两个 Agent 平台完成开发并通过同一套报告数据结构测试之前，不创建或宣传 `agent-review`。

## 改造目标

- 删除开源默认配置中与维护者个人相关的项目名、路径、Prompt 示例和使用假设。
- 通过可验证的实际能力提升 Reliability、Adaptability、Convention、Effectiveness 和 Trust，而不是只补充宣传文档。
- 保留纯本地、默认只读的工作流和现有 HTML 报告视觉风格。
- 正常使用以自然语言调用 skill 为主，命令行仅作为高级调试方式。
- 为未来增加其他 Agent 适配器预留代码边界，但不宣称当前已经支持。

## 本次不做

- 读取普通 ChatGPT 对话历史。
- 支持 Claude Code、OpenCode、OpenClaw 或其他 Agent。
- 增加云同步、账号系统、联网分析或数据上报。
- 开发可视化分类规则编辑器。
- 承诺 Token 等同官方账单，或时间等同精确人工工时。

## 代码结构

```text
scripts/
├── adapters/
│   └── codex.mjs
├── core/
│   ├── diagnostics.mjs
│   ├── grouping.mjs
│   ├── prompt-analysis.mjs
│   └── report-schema.mjs
├── scan_usage.mjs
└── build_report.mjs
```

- `adapters/codex.mjs`：读取 Codex 会话文件、Token 事件、skills 和自动化状态，输出统一格式的会话与产物数据。
- `core/grouping.mjs`：基于统一数据完成项目归并，不读取 Codex 专属路径和事件名。
- `core/prompt-analysis.mjs`：检查 Prompt 完整度并生成通用优化模板。
- `core/diagnostics.mjs`：统一管理普通用户能理解的错误和可恢复警告。
- `core/report-schema.mjs`：校验 v2 报告数据结构。
- `scan_usage.mjs`：只负责解析参数和组织扫描流程。
- `build_report.mjs`：只渲染统一报告数据，不再根据项目名称猜测任务类型。

## 报告数据结构 v2

顶层字段：

```json
{
  "schemaVersion": 2,
  "platform": "codex",
  "generatedAt": "ISO-8601",
  "range": {},
  "summary": {},
  "projects": [],
  "diagnostics": []
}
```

每个项目包含：

- `name`：识别出的项目名称或中性的兜底名称。
- `category`：稳定的通用任务类型。
- `confidence`：`high`、`medium` 或 `low`。
- `evidence`：简短且不含敏感信息的归并依据。
- `minutes`、`token`、`sessionCount` 和相对产物路径。
- `actions`、`promptAssessment`、`nextPrompt` 和 `level`，必须根据本次真实证据生成，不能套维护者个人模板。

## 通用项目归并

归并优先级：

1. 用户通过 `--config` 或工作区本地配置文件提供的自定义规则。
2. 稳定的 cwd 或项目文件夹名称，过滤 Home、Desktop、workspace、Downloads、临时目录等宽泛名称。
3. 有实际含义的会话标题，以及第一条用户请求中明确出现的项目名。
4. 产物的一级目录和重复出现的文件名主体。
5. 使用通用任务类型作为中性兜底。

默认任务类型：

- 代码开发
- 文档与内容
- 产品与设计
- 数据与表格
- 研究与分析
- 系统自动化
- Skill 与工具
- 视觉素材
- 其他任务

宽泛关键词只能用于判断任务类型，不能凭空生成具体业务项目名。可信度较低时，使用“待确认项目”作为名称，并提示用户人工确认。

## Prompt 分析

分析第一条有效用户请求和后续修正是否包含：

- 最终交付物或输出格式
- 工作范围和排除范围
- 输入材料和事实来源
- 约束与边界
- 验收标准
- 验证方式或证据要求

只输出证据能够支持的问题。个人使用画像、本周结论和推荐 Prompt 都必须根据本周项目数据生成。开源默认内容禁止出现产品经理个人项目、金融活动、邀请流程、昵称敏感词或维护者本地路径等固定案例。

## 异常与错误体验

无法继续执行的错误必须返回非零退出码，并用普通人能理解的方式说明：

- 什么没有完成
- 最可能的原因
- 下一步应该怎么处理

必须中止的场景包括：参数无效、输入文件不存在、报告 JSON 损坏、模板缺失、输出目录无法写入。

可以恢复的问题写入 `diagnostics`，同时继续生成有价值的报告：

- 部分会话文件或目录无法读取
- JSONL 中存在损坏行
- 所选时间范围内没有会话
- 没有 Token 事件
- 项目归并可信度较低
- 报告已生成但浏览器打开失败

HTML 只有在存在异常时才展示紧凑的提醒。技术详情放进折叠区，正常报告不增加说明性噪音。

## 隐私与可信边界

- 可以在本地分析 Prompt，但默认不把完整原始 Prompt 写入扫描结果。
- 产物尽量保存相对路径。
- 报告数据中不保存自动化配置文件的绝对路径。
- 面向用户的错误信息隐藏 Home 目录前缀。
- 示例和测试只使用虚构用户、路径、项目和消息。
- 扫描与报告生成不增加任何网络请求。

## 开源仓库完整度

新增：

```text
examples/
├── sample_scan.json
├── sample_report.html
└── sample_report.png

tests/
├── fixtures/
└── run.mjs

references/
├── project-grouping.md
├── report-design.md
└── troubleshooting.md
```

README 需要增加真实示例截图、自然语言使用方法、支持范围、已知限制、故障排查和自定义归并规则。中文和英文文档的核心能力必须一致。

## 兼容与迁移

- 保留 `scripts/scan_usage.mjs` 和 `scripts/build_report.mjs` 两个 CLI 入口名称。
- 在实现成本合理的前提下，`build_report.mjs` 继续兼容 v1 扫描 JSON，并在内部转成 v2。
- 除了异常提醒组件，不随意改变当前报告模板的视觉语言。
- 仓库验证完成后，把可发布的 skill 文件同步到 `~/.codex/skills/codex-review`，并对共享文件做逐字节一致性检查。

## 验证要求

不依赖第三方包的测试必须覆盖：

- 至少四种通用任务类型的归并。
- 用户自定义归并规则。
- 所选时间范围没有会话。
- JSONL 存在损坏行但能生成警告。
- 输入缺失和报告 JSON 损坏时返回通俗错误。
- 使用 v2 示例数据生成报告。
- 可发布默认内容中不存在维护者个人项目名、路径和专属 Prompt。
- 示例扫描数据中不存在完整原始 Prompt和不必要的绝对路径。
- 根仓库与已安装 skill 一致。

最终执行脚本语法检查、测试脚本、真实本地扫描、HTML 生成、页面视觉检查、桌面和移动端截图检查，以及 `git diff --check`。

## Agent Review 启动条件

只有满足以下条件，才单独创建 `agent-review`：

1. 已经实现第二个 Agent 适配器。
2. 两个适配器通过同一套数据结构和行为测试。
3. 已经解释不同平台在会话、Token、子任务和自动化方面的差异。
4. 使用 Agent 通用名称不会夸大实际支持范围。

在此之前，只能称为“为多 Agent 扩展做好结构准备”，不能称为“已支持所有 Agent”。

## Neat-Freak 收尾要求

实现完成后：

- 对齐 `RULES.md`、中英文 README、SKILL.md、references、examples 和代码。
- 删除过期引用和重复说明。
- 确认根仓库与已安装 skill 不再分叉。
- 只报告 Codex 机器生成记忆的问题，不直接重写这些记忆文件。
- 项目规则只保留长期有效的执行约束，不写成变更日志。
