#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const args = parseArgs(process.argv.slice(2));
const days = Number(args.days || 7);
const workspace = path.resolve(args.workspace || process.cwd());
const output = path.resolve(args.output || path.join(workspace, "codex_usage_scan.json"));
const codexHome = path.resolve(args.codexHome || path.join(os.homedir(), ".codex"));
const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

const artifactExt = new Set([".md", ".html", ".xlsx", ".xls", ".csv", ".png", ".jpg", ".jpeg", ".webp", ".zip", ".pdf", ".pptx", ".docx"]);
const tokenKeys = ["total_tokens", "input_tokens", "cached_input_tokens", "output_tokens", "reasoning_output_tokens"];

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) out[key] = true;
    else {
      out[key] = next;
      i += 1;
    }
  }
  return out;
}

function walk(dir, filter = () => true, maxDepth = 8, depth = 0) {
  if (depth > maxDepth || !fs.existsSync(dir)) return [];
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  let out = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out = out.concat(walk(full, filter, maxDepth, depth + 1));
    else if (filter(full)) out.push(full);
  }
  return out;
}

function recent(file) {
  try {
    return fs.statSync(file).mtime >= since;
  } catch {
    return false;
  }
}

function parseJsonl(file) {
  let text = "";
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    return [];
  }
  return text.split("\n").filter(Boolean).map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }).filter(Boolean);
}

function textOf(content) {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((item) => item?.text || item?.input_text || item?.output_text || "").join(" ");
  }
  return "";
}

function addToken(target, usage) {
  if (!usage) return;
  for (const key of tokenKeys) target[key] += Number(usage[key] || 0);
}

function maxToken(target, usage) {
  if (!usage) return;
  for (const key of tokenKeys) target[key] = Math.max(Number(target[key] || 0), Number(usage[key] || 0));
}

function minutesBetween(start, end) {
  if (!start || !end) return 0;
  return Math.max(1, Math.min((end - start) / 60000, 240));
}

function inferProject(text, artifactPaths = []) {
  const hay = `${text}\n${artifactPaths.join("\n")}`;
  if (/README|SKILL\.md|GitHub|使用体检|周度复盘|Codex Review|Token|自动化|report_template|report-design/i.test(hay)) return "Codex Review 产品化";
  if (/ETF|敏感词|昵称|低误伤|english_sensitive|金融营销昵称敏感词库/i.test(hay)) return "ETF 昵称敏感词库";
  if (/邀请|好友|H5|Figma|原型|老带新|invite-summary|ui-mockups|产品经理/i.test(hay)) return "邀请好友 H5 / 老带新需求";
  if (/storage|存储|磁盘|清理空间|storage-analyzer/i.test(hay)) return "存储分析工具";
  if (/^\s*你好\s*$/.test(text)) return "轻量沟通";
  return "其他任务";
}

function projectForArtifact(file) {
  if (/codex-usage-review|codex-review/.test(file)) return "Codex Review 产品化";
  if (/金融营销昵称敏感词库/.test(file)) return "ETF 昵称敏感词库";
  if (/ui-mockups|产品经理|老带新|邀请/.test(file)) return "邀请好友 H5 / 老带新需求";
  if (/storage/i.test(file)) return "存储分析工具";
  return "其他任务";
}

function summarizeProject(name) {
  if (name === "Codex Review 产品化") {
    return {
      actions: ["整理 README、SKILL.md、报告设计规范和 HTML 模板。", "验证仅依赖 skill 生成报告的可行性。", "推进定时复盘和 GitHub 发布形态。"],
      issue: "页面样式已能保持一致，但扫描和项目归并需要脚本化，否则不同环境下结果会飘。",
      promptIssue: "产品化任务容易把给人看的 README、给 Codex 看的 SKILL、给脚本跑的规则混在一起。",
      nextPrompt: "请把这个 Codex 使用复盘做成可发布 skill：README 给人看，SKILL.md 给 Codex 看，scripts 负责稳定扫描和生成，assets 负责页面模板。先跑一次测试报告，指出缺口后再改结构。",
      level: "yellow",
    };
  }
  if (name === "ETF 昵称敏感词库") {
    return {
      actions: ["生成多版英文昵称敏感词库 Excel。", "按包含匹配、低误伤、冗余剔除等要求收敛。", "形成更接近生产可用的词库产物。"],
      issue: "第一轮容易先做大词库，再通过多轮补充低误伤和分类规则。",
      promptIssue: "匹配方式、昵称长度、误伤优先级和分类规则应在第一句写清楚。",
      nextPrompt: "场景是 ETF 模拟大赛报名昵称。匹配方式为包含匹配、不区分大小写，昵称最多 7 字符。请按主拦截、人工复核、不建议收录、冗余剔除四类输出 Excel，主库优先低误伤，生成后校验重复、超长、非法字符和包含冗余。",
      level: "green",
    };
  }
  if (name === "邀请好友 H5 / 老带新需求") {
    return {
      actions: ["围绕邀请好友 H5 汇总区做 UI 方案和图片产物。", "读取老带新 Figma 画板并推进需求梳理。", "沉淀部分 PRD / 原型相关材料。"],
      issue: "UI 方向、信息密度和边界状态如果后置，会导致多轮返工。",
      promptIssue: "第一句应锁定只改哪个模块、不要改什么、有哪些 0 数据或极端状态。",
      nextPrompt: "只优化邀请汇总区，不改邀请记录列表。目标是让用户一眼看懂注册、开户、达标三阶段递进和剩余转化空间，内容要少，支持全 0、部分 0、数据较大。先给 3 个信息架构方案，再选最佳方案生成 UI 图。",
      level: "yellow",
    };
  }
  return {
    actions: ["完成少量轻量沟通或辅助任务。"],
    issue: "信息较少，不建议过度拆解。",
    promptIssue: "低频任务可以合并处理，不必单独沉淀长期规则。",
    nextPrompt: "请按项目复盘本周 Codex 使用情况，优先说明产物和下一次可改进的提问方式。",
    level: "green",
  };
}

const sessionRoots = [path.join(codexHome, "sessions"), path.join(codexHome, "archived_sessions")];
const sessionFiles = sessionRoots.flatMap((root) => walk(root, (file) => file.endsWith(".jsonl") && recent(file), 8));
const sessions = [];

for (const file of sessionFiles) {
  const items = parseJsonl(file);
  if (!items.length) continue;
  const meta = items.find((item) => item.type === "session_meta")?.payload || {};
  const times = items.map((item) => item.timestamp).filter(Boolean).map((value) => new Date(value).getTime()).filter(Number.isFinite);
  const token = Object.fromEntries(tokenKeys.map((key) => [key, 0]));
  const userMessages = [];
  const assistantMessages = [];
  for (const item of items) {
    if (item.type === "event_msg" && item.payload?.type === "user_message" && item.payload.message) userMessages.push(item.payload.message);
    if (item.type === "response_item" && item.payload?.type === "message") {
      const role = item.payload.role;
      const text = textOf(item.payload.content);
      if (role === "user" && text) userMessages.push(text);
      if (role === "assistant" && text) assistantMessages.push(text);
    }
    if (item.type === "event_msg" && item.payload?.type === "token_count") {
      maxToken(token, item.payload.info?.total_token_usage);
    }
  }
  const isAuxiliary = meta.thread_source === "subagent" || Boolean(meta.source?.subagent);
  const start = times.length ? Math.min(...times) : fs.statSync(file).mtimeMs;
  const end = times.length ? Math.max(...times) : fs.statSync(file).mtimeMs;
  const text = `${userMessages.join("\n")}\n${assistantMessages.slice(-5).join("\n")}`;
  sessions.push({
    id: meta.id || path.basename(file, ".jsonl"),
    file,
    cwd: meta.cwd || "",
    isAuxiliary,
    start: new Date(start).toISOString(),
    end: new Date(end).toISOString(),
    minutes: minutesBetween(start, end),
    token,
    text,
    userMessages: userMessages.slice(0, 8),
  });
}

const artifacts = walk(workspace, (file) => artifactExt.has(path.extname(file)) && recent(file), 5)
  .map((file) => ({
    file,
    relative: path.relative(workspace, file),
    project: projectForArtifact(path.relative(workspace, file)),
    modifiedAt: fs.statSync(file).mtime.toISOString(),
  }))
  .filter((item) => !item.relative.includes("/data/"));

const artifactsByProject = new Map();
for (const artifact of artifacts) {
  if (!artifactsByProject.has(artifact.project)) artifactsByProject.set(artifact.project, []);
  artifactsByProject.get(artifact.project).push(artifact);
}

const projects = new Map();
for (const session of sessions.filter((item) => !item.isAuxiliary)) {
  const nearbyArtifacts = artifacts.filter((artifact) => Math.abs(new Date(artifact.modifiedAt).getTime() - new Date(session.end).getTime()) < 36 * 60 * 60 * 1000);
  const name = inferProject(session.text, nearbyArtifacts.map((item) => item.relative));
  if (!projects.has(name)) {
    projects.set(name, {
      name,
      minutes: 0,
      sessionCount: 0,
      token: Object.fromEntries(tokenKeys.map((key) => [key, 0])),
      userMessageSamples: [],
      artifacts: [],
      ...summarizeProject(name),
    });
  }
  const project = projects.get(name);
  project.minutes += session.minutes;
  project.sessionCount += 1;
  addToken(project.token, session.token);
  project.userMessageSamples.push(...session.userMessages.slice(0, 2));
}

for (const [projectName, projectArtifacts] of artifactsByProject.entries()) {
  if (!projects.has(projectName) && projectName !== "其他任务") {
    projects.set(projectName, {
      name: projectName,
      minutes: 0,
      sessionCount: 0,
      token: Object.fromEntries(tokenKeys.map((key) => [key, 0])),
      userMessageSamples: [],
      artifacts: [],
      ...summarizeProject(projectName),
    });
  }
  if (projects.has(projectName)) projects.get(projectName).artifacts.push(...projectArtifacts);
}

for (const project of projects.values()) {
  const ownArtifacts = artifactsByProject.get(project.name) || [];
  const seen = new Set(project.artifacts.map((item) => item.relative));
  for (const artifact of ownArtifacts) {
    if (!seen.has(artifact.relative)) project.artifacts.push(artifact);
  }
}

const totalToken = Object.fromEntries(tokenKeys.map((key) => [key, 0]));
let totalMinutes = 0;
for (const project of projects.values()) {
  totalMinutes += project.minutes;
  addToken(totalToken, project.token);
}

const automationFiles = walk(path.join(codexHome, "automations"), (file) => path.basename(file) === "automation.toml", 4);
const automationText = automationFiles.map((file) => {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}).join("\n");
const hasWeeklyAutomation = /Codex 周度使用体检|Codex 使用复盘|AI 使用体检|Codex Review/.test(automationText);

const report = {
  generatedAt: new Date().toISOString(),
  range: { days, since: since.toISOString(), until: new Date().toISOString() },
  workspace,
  codexHome,
  summary: {
    mainSessionCount: sessions.filter((item) => !item.isAuxiliary).length,
    auxiliarySessionCount: sessions.filter((item) => item.isAuxiliary).length,
    projectCount: projects.size,
    artifactCount: artifacts.length,
    totalMinutes,
    totalToken,
    hasWeeklyAutomation,
  },
  projects: [...projects.values()].sort((a, b) => b.minutes - a.minutes),
  artifacts,
  automation: {
    files: automationFiles,
    hasWeeklyAutomation,
  },
};

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(report, null, 2));
console.log(JSON.stringify({
  output,
  mainSessionCount: report.summary.mainSessionCount,
  auxiliarySessionCount: report.summary.auxiliarySessionCount,
  projectCount: report.summary.projectCount,
  artifactCount: report.summary.artifactCount,
  hasWeeklyAutomation,
}, null, 2));
