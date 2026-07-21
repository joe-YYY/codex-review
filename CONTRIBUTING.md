# 参与贡献

Codex Review 的目标是让非技术用户也能稳定完成本地使用复盘。所有改动都应保持：本地优先、只读扫描、通俗错误提示和可验证输出。

## 开始前

- 先搜索已有 Issue，避免重复提交。
- 一次改动只解决一个明确问题。
- 不要提交真实会话、私人报告、凭据、密钥或未脱敏项目内容。
- 不要破坏扫描流程的只读默认行为。
- 用户可见行为变化时，同步更新中英文 README 和相关 references。

## 开发流程

1. Fork 仓库并创建独立分支。
2. 阅读 `SKILL.md` 和相关 `references/`。
3. 用最小范围完成修改。
4. 增加或更新无依赖回归测试。
5. 运行完整验证。
6. 在 Pull Request 中说明问题、改动、验证结果和剩余风险。

## 验证命令

```bash
node --check scripts/core/diagnostics.mjs
node --check scripts/core/report-schema.mjs
node --check scripts/core/prompt-analysis.mjs
node --check scripts/core/grouping.mjs
node --check scripts/adapters/codex.mjs
node --check scripts/scan_usage.mjs
node --check scripts/build_report.mjs
node tests/run.mjs
git diff --check
```

涉及报告样式时，还需要实际生成 `examples/sample_report.html`，检查桌面和移动端布局、长路径换行、折叠区和复制按钮。

## Pull Request 检查

- 没有新增维护者个人项目名、路径或专属 Prompt。
- 同一个产物不会出现在多个项目中。
- 输入损坏、路径错误和权限问题使用普通用户能理解的提示。
- 正常报告不展示调试清单和低价值备注。
- 示例数据完全虚构且不包含真实隐私内容。
- README、SKILL、references、脚本和测试描述一致。
