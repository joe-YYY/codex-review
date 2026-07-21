import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { scanCodex } from "../scripts/adapters/codex.mjs";
import { groupUsage } from "../scripts/core/grouping.mjs";
import { analyzePrompt, classifyCategory } from "../scripts/core/prompt-analysis.mjs";
import { normalizeReport, validateReport } from "../scripts/core/report-schema.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "codex-review-test-"));

try {
  testPromptAnalysis();
  testCategoryClassification();
  testGroupingAndArtifactOwnership();
  testCodexAdapter();
  testSchemaAndReportBuild();
  console.log("Codex Review tests passed.");
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

function testPromptAnalysis() {
  const complete = analyzePrompt([
    "请基于现有源码生成一个设置页面，只改 settings 模块，必须保持接口不变，完成后运行测试并截图验收。",
  ], "代码开发");
  assert.equal(complete.level, "green");
  assert.deepEqual(complete.promptAssessment.missing, []);

  const incomplete = analyzePrompt(["帮我看看这个", "不对，改成表格", "还是不对，重新做"], "其他任务");
  assert.equal(incomplete.level, "red");
  assert.ok(incomplete.promptAssessment.missing.includes("最终交付物"));
}

function testCategoryClassification() {
  assert.equal(classifyCategory("创建每周一运行的 launchd 定时任务"), "系统自动化");
  assert.equal(classifyCategory("把这个能力整理成 SKILL.md 和脚本"), "Skill 与工具");
  assert.equal(classifyCategory("输出 PRD 和交互原型"), "产品与设计");
}

function testGroupingAndArtifactOwnership() {
  const now = Date.now();
  const sessions = [
    session("a", "/work", "请修改 alpha 项目并生成 README", now, ["alpha"]),
    session("b", "/work", "请分析 beta 的需求边界", now + 60_000, ["beta"]),
    { ...session("synthetic", "/tmp/hermes-test", "说一个1到100的随机数", now, []), isSynthetic: true },
  ];
  const artifacts = [
    { relative: "alpha/README.md", modifiedAt: new Date(now + 30_000).toISOString() },
    { relative: "beta/prd.md", modifiedAt: new Date(now + 90_000).toISOString() },
  ];
  const projects = groupUsage({ sessions, artifacts });
  assert.equal(projects.reduce((sum, item) => sum + item.artifacts.length, 0), 2);
  assert.equal(projects.reduce((sum, item) => sum + item.sessionCount, 0), 2);
  assert.ok(projects.some((item) => item.name === "alpha"));
  assert.ok(projects.some((item) => item.name === "beta"));

  const workspaceRoot = session("root", "/home/团队工作区", "请分析 gamma 需求", now, ["gamma"]);
  const rootProjects = groupUsage({ sessions: [workspaceRoot], artifacts: [] });
  assert.notEqual(rootProjects[0].name, "团队工作区");
}

function testCodexAdapter() {
  const codexHome = path.join(temp, "codex");
  const workspace = path.join(temp, "workspace");
  const sessionDir = path.join(codexHome, "sessions", "2026", "07", "20");
  fs.mkdirSync(sessionDir, { recursive: true });
  fs.mkdirSync(path.join(codexHome, "archived_sessions"), { recursive: true });
  fs.mkdirSync(path.join(codexHome, "skills"), { recursive: true });
  fs.mkdirSync(path.join(codexHome, "automations"), { recursive: true });
  fs.mkdirSync(path.join(workspace, "demo"), { recursive: true });
  const start = Date.now() - 5 * 60_000;
  const events = [
    { type: "session_meta", payload: { id: "demo", cwd: workspace } },
    { timestamp: new Date(start - 120_000).toISOString(), type: "event_msg", payload: { type: "token_count", info: { total_token_usage: { total_tokens: 40, input_tokens: 30, output_tokens: 10 } } } },
    { timestamp: new Date(start).toISOString(), type: "event_msg", payload: { type: "user_message", message: "请更新 API_KEY: 1234567890abcdef" } },
    { timestamp: new Date(start + 60_000).toISOString(), type: "event_msg", payload: { type: "token_count", info: { total_token_usage: { total_tokens: 100, input_tokens: 80, output_tokens: 20 } } } },
  ];
  fs.writeFileSync(path.join(sessionDir, "demo.jsonl"), `${events.map(JSON.stringify).join("\n")}\n`);
  fs.writeFileSync(path.join(workspace, "demo", "result.md"), "done\n");
  const diagnostics = [];
  const result = scanCodex({
    codexHome,
    workspace,
    since: new Date(start - 60_000),
    until: new Date(start + 120_000),
    outputFile: path.join(temp, "scan.json"),
    diagnostics,
  });
  assert.equal(result.sessions.length, 1);
  assert.equal(result.sessions[0].token.total_tokens, 60);
  assert.ok(result.sessions[0].userMessages[0].includes("[已隐藏]"));
  assert.equal(result.artifacts.length, 1);
}

function testSchemaAndReportBuild() {
  const fixture = path.join(root, "examples", "sample_scan.json");
  const report = normalizeReport(JSON.parse(fs.readFileSync(fixture, "utf8")));
  assert.deepEqual(validateReport(report), []);
  const output = path.join(temp, "sample_report.html");
  const built = spawnSync(process.execPath, [
    path.join(root, "scripts", "build_report.mjs"),
    "--input", fixture,
    "--output", output,
    "--no-open",
  ], { encoding: "utf8" });
  assert.equal(built.status, 0, built.stderr);
  const html = fs.readFileSync(output, "utf8");
  assert.match(html, /Codex 使用复盘/);
  assert.match(html, /Prompt 诊断/);
  assert.match(html, /客户工作台改版/);
  assert.doesNotMatch(html, /维护者专属项目|真实私人路径/);

  const broken = path.join(temp, "broken.json");
  fs.writeFileSync(broken, "{broken");
  const failed = spawnSync(process.execPath, [path.join(root, "scripts", "build_report.mjs"), "--input", broken, "--no-open"], { encoding: "utf8" });
  assert.notEqual(failed.status, 0);
  assert.match(failed.stderr, /扫描结果已损坏/);
}

function session(id, cwd, message, time, topNames) {
  return {
    id,
    cwd,
    title: "",
    isAuxiliary: false,
    isSynthetic: false,
    start: new Date(time).toISOString(),
    end: new Date(time + 120_000).toISOString(),
    minutes: 2,
    token: { total_tokens: 100, input_tokens: 80, cached_input_tokens: 0, output_tokens: 20, reasoning_output_tokens: 0 },
    userMessages: [message, ...topNames],
    activityTimes: [time, time + 60_000],
  };
}
