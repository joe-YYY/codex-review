#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const args = parseArgs(process.argv.slice(2));
if (!args.input) {
  console.error("Usage: node scripts/build_report.mjs --input scan.json --output report.html");
  process.exit(1);
}

const input = path.resolve(args.input);
const output = path.resolve(args.output || input.replace(/\.json$/i, ".html"));
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillDir = path.resolve(args.skillDir || path.join(scriptDir, ".."));
const templatePath = path.resolve(args.template || path.join(skillDir, "assets", "report_template.html"));
const report = JSON.parse(fs.readFileSync(input, "utf8"));
const template = fs.readFileSync(templatePath, "utf8");

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

function esc(value) {
  return String(value ?? "").replace(/[&<>"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  })[char]);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("zh-CN");
}

function formatMinutes(value) {
  if (!value || value < 1) return "<1 分钟";
  const hours = Math.floor(value / 60);
  const minutes = Math.round(value % 60);
  return hours ? `${hours} 小时 ${minutes} 分钟` : `${minutes} 分钟`;
}

function timeLabel(project) {
  if (!project.sessionCount && (!project.minutes || project.minutes < 1)) return "有产物记录";
  return formatMinutes(project.minutes);
}

function percent(value, total) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}

function tagFor(level) {
  if (level === "green") return "继续";
  if (level === "red") return "避免";
  return "调整";
}

function taskTypeForProject(projectName) {
  if (/Codex Review|使用体检|复盘|自动化/.test(projectName)) return "自我复盘/自动化";
  if (/ETF|敏感词|表格|Excel|数据/.test(projectName)) return "表格/数据产物";
  if (/邀请|H5|UI|原型|Figma|老带新/.test(projectName)) return "UI/原型探索";
  if (/storage|存储|磁盘|工具/.test(projectName)) return "工具/电脑问题";
  return "其他任务";
}

function scoreClass(value) {
  if (value === "偏高" || value === "需关注") return "warn";
  if (value === "较高") return "good";
  return "good";
}

const projects = report.projects || [];
const totalMinutes = report.summary?.totalMinutes || 0;
const totalToken = report.summary?.totalToken || {};
const generatedAt = new Date(report.generatedAt || Date.now()).toLocaleString("zh-CN");
const dateRange = `最近 ${report.range?.days || 7} 天`;
const oneLine = projects.length > 1
  ? "本周已经形成多个可复用产物，但产品化任务仍需要用脚本固定扫描和报告生成流程。"
  : "本周使用集中在少数任务上，下一步重点是把流程脚本化，减少每次临时分析。";

const projectRows = projects.map((project) => {
  const share = percent(project.minutes, totalMinutes);
  return `<tr>
    <td>${esc(project.name)}</td>
    <td class="size">${esc(timeLabel(project))}</td>
    <td>${share}%<div class="bar"><i style="width:${share}%"></i></div></td>
    <td class="size">${formatNumber(project.token?.total_tokens)}</td>
    <td><span class="tag ${esc(project.level)}">${tagFor(project.level)}</span> ${esc(project.issue)}</td>
  </tr>`;
}).join("");

const artifactCount = Number(report.summary?.artifactCount || 0);
const outputDensity = totalMinutes ? (artifactCount / Math.max(totalMinutes / 60, 1)).toFixed(1) : "0";
const yellowCount = projects.filter((project) => project.level === "yellow").length;
const returnWorkIndex = yellowCount >= 2 ? "偏高" : yellowCount === 1 ? "正常" : "较低";
const promptClarity = yellowCount >= 2 ? "中等" : "较高";
const tokenEfficiency = Number(totalToken.total_tokens || 0) > 20000000 ? "需关注" : "正常";

const taskTypes = new Map();
for (const project of projects) {
  const type = taskTypeForProject(project.name);
  if (!taskTypes.has(type)) {
    taskTypes.set(type, {
      type,
      minutes: 0,
      count: 0,
      token: 0,
    });
  }
  const item = taskTypes.get(type);
  item.minutes += Number(project.minutes || 0);
  item.count += 1;
  item.token += Number(project.token?.total_tokens || 0);
}

const taskTypeRows = [...taskTypes.values()]
  .sort((a, b) => b.minutes - a.minutes)
  .map((item) => {
    const share = percent(item.minutes, totalMinutes);
    return `<tr>
      <td><span class="tag blue">${esc(item.type)}</span></td>
      <td class="size">${esc(formatMinutes(item.minutes))}</td>
      <td>${share}%<div class="bar"><i style="width:${share}%"></i></div></td>
      <td>${item.count}</td>
      <td class="size">${formatNumber(item.token)}</td>
    </tr>`;
  }).join("");

const projectDetails = projects.map((project, index) => {
  const artifacts = (project.artifacts || []).slice(0, 5);
  const hiddenCount = Math.max(0, (project.artifacts || []).length - artifacts.length);
  return `<details class="${esc(project.level)}" ${index < 3 ? "open" : ""}>
    <summary><span class="summary-name">${esc(project.name)}</span><span class="summary-sub">${esc(timeLabel(project))} · ${project.sessionCount || 0} 个会话</span></summary>
    <div class="body">
      <div class="cols">
        <div class="box"><h3>做了什么</h3><ul>${(project.actions || []).map((item) => `<li>${esc(item)}</li>`).join("")}</ul></div>
        <div class="box"><h3>低效点</h3><p>${esc(project.issue)}</p></div>
      </div>
      <div class="cols" style="margin-top:14px">
        <div class="box"><h3>Prompt 诊断</h3><div class="callout warn">${esc(project.promptIssue)}</div></div>
        <div class="box"><h3>关键产物</h3>${artifacts.length ? `<ul>${artifacts.map((artifact) => `<li><span class="small">${esc(artifact.relative)}</span></li>`).join("")}</ul>${hiddenCount ? `<p class="small">另有 ${hiddenCount} 个产物已折叠。</p>` : ""}` : `<p class="small">主要产出在对话结论中。</p>`}</div>
      </div>
      <div class="box" style="margin-top:14px"><h3>下次推荐 Prompt</h3><div class="prompt"><button class="copy">复制</button>${esc(project.nextPrompt)}</div></div>
    </div>
  </details>`;
}).join("");

const promptTemplates = [
  {
    title: "复杂任务起手",
    text: "这次任务的最终产物是：{文件/页面/结论}。请先确认范围，再执行。必须满足：{硬约束}。不要做：{排除项}。完成后请验证：{验收标准}。",
  },
  {
    title: "产品 / UI 探索",
    text: "只优化{模块}，不改{排除范围}。目标用户需要一眼看懂{核心信息}。内容要少，必须覆盖{边界状态}。先给 3 个信息架构方案，再选最佳方案出图或落成页面。",
  },
  {
    title: "表格 / 策略产物",
    text: "请按真实场景先定规则再生成表格。场景：{场景}。匹配方式：{匹配方式}。硬约束：{限制}。输出分类：主库、人工复核、不建议收录、冗余剔除。生成后校验重复、超长、非法字符和误伤风险。",
  },
].map((item) => `<div class="box"><h3>${esc(item.title)}</h3><div class="prompt"><button class="copy">复制</button>${esc(item.text)}</div></div>`).join("");

const promptRisks = projects
  .filter((project) => project.level !== "green")
  .map((project) => project.promptIssue)
  .slice(0, 4);

const content = `
<h2>一句话结论</h2>
<section class="insight"><strong>本周一句话：</strong>${esc(oneLine)}</section>

<h2>总览</h2>
<section class="grid">
  <div class="card"><div class="k">估算活跃时长</div><div class="v">${esc(formatMinutes(totalMinutes))}</div><div class="note">最近 ${report.range?.days || 7} 天</div></div>
  <div class="card"><div class="k">主要项目</div><div class="v">${projects.length}</div><div class="note">已按项目整理</div></div>
  <div class="card"><div class="k">产物数量</div><div class="v">${formatNumber(report.summary?.artifactCount)}</div><div class="note">近 7 天可识别文件</div></div>
  <div class="card"><div class="k">Token 大致消耗</div><div class="v">${formatNumber(totalToken.total_tokens)}</div><div class="note">本地记录估算</div></div>
</section>

<h2>效率评分卡</h2>
<section class="grid">
  <div class="card"><div class="k">提问清晰度</div><div class="score ${scoreClass(promptClarity)}">${esc(promptClarity)}</div><div class="note">看第一条提示词是否锁定目标和边界</div></div>
  <div class="card"><div class="k">返工指数</div><div class="score ${scoreClass(returnWorkIndex)}">${esc(returnWorkIndex)}</div><div class="note">来自目标后置和多轮补规则</div></div>
  <div class="card"><div class="k">产出密度</div><div class="score good">${esc(outputDensity)} / 小时</div><div class="note">按可识别产物估算</div></div>
  <div class="card"><div class="k">Token 效率</div><div class="score ${scoreClass(tokenEfficiency)}">${esc(tokenEfficiency)}</div><div class="note">看消耗是否换来可复用产物</div></div>
</section>

<h2>Token 使用</h2>
<section class="grid">
  <div class="card"><div class="k">本周大概消耗</div><div class="v">${formatNumber(totalToken.total_tokens)}</div><div class="note">主任务合计</div></div>
  <div class="card"><div class="k">输入消耗</div><div class="v">${formatNumber(totalToken.input_tokens)}</div><div class="note">任务和上下文</div></div>
  <div class="card"><div class="k">输出消耗</div><div class="v">${formatNumber(totalToken.output_tokens)}</div><div class="note">回复和生成内容</div></div>
  <div class="card"><div class="k">思考消耗</div><div class="v">${formatNumber(totalToken.reasoning_output_tokens)}</div><div class="note">复杂任务推理</div></div>
</section>

<h2>任务类型分布</h2>
<table><thead><tr><th>类型</th><th>耗时</th><th>占比</th><th>项目数</th><th>Token</th></tr></thead><tbody>${taskTypeRows}</tbody></table>

<h2>项目排行</h2>
<table><thead><tr><th>项目</th><th>耗时</th><th>占比</th><th>Token</th><th>观察</th></tr></thead><tbody>${projectRows}</tbody></table>

<h2>项目复盘</h2>
${projectDetails || '<section class="card"><p>本周没有读到足够的项目数据。</p></section>'}

<h2>Prompt 诊断</h2>
<section class="card">
  <ul class="habit-list">
    ${(promptRisks.length ? promptRisks : ["本周没有明显高风险提示词问题。"]).map((risk) => `<li>${esc(risk)}</li>`).join("")}
  </ul>
</section>

<h2>使用习惯</h2>
<section class="card">
  <div class="callout action"><div class="label">可以保持</div>持续追问“这个内容应该放在哪里”，有助于把一次性产出变成可复用产品结构。</div>
  <div class="callout warn"><div class="label">下周先改</div>产品化任务第一步先拆清楚：给人看的、给 Codex 看的、给脚本跑的，三者不要混写。</div>
</section>

<h2>个人使用画像</h2>
<section class="card">
  <div class="profile-grid">
    <div class="callout info"><div class="label">主要用途</div>产品判断、执行产物、工具产品化。</div>
    <div class="callout action"><div class="label">有效做法</div>会持续校准结果，把泛方案拉回自己的真实工作场景。</div>
    <div class="callout warn"><div class="label">下周调整</div>把“最终产物、硬约束、不做什么、验收标准”放进第一条提示词。</div>
  </div>
  <div class="callout danger"><div class="label">当前摩擦</div>第一条提示词容易先给方向，关键约束后补，导致前几轮方案偏发散。</div>
</section>

<h2>可复制 Prompt 模板</h2>
<section class="grid3">${promptTemplates}</section>

<h2>产品化建议</h2>
<section class="card">
  <div class="callout info">Codex Review 适合做成 skill，而不是只保留单次脚本：报告模板、扫描脚本、自动打开、定期复盘这些都需要稳定流程。</div>
  <div class="grid3" style="margin-top:14px">
    <div class="box stage" data-step="1"><h3>自用工具</h3><p>继续打磨本地 HTML 报告，重点看你每周是否愿意打开、能否直接改善提问。</p></div>
    <div class="box stage" data-step="2"><h3>封装 Skill</h3><p>把扫描、分析、报告模板和自动化检查放进 skill，让它能在其他工作区复用。</p></div>
    <div class="box stage" data-step="3"><h3>GitHub 项目</h3><p>准备 README、截图、示例报告和安装说明，让第一次使用的人能快速跑起来。</p></div>
  </div>
</section>
`;

const html = template
  .replaceAll("{{title}}", "Codex 使用体检报告")
  .replaceAll("{{date_range}}", dateRange)
  .replaceAll("{{generated_at}}", `生成时间：${generatedAt}`)
  .replace("{{content}}", content);

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, html);

const shouldOpen = args.open !== false && args["no-open"] !== true;
const openResult = shouldOpen ? openReport(output) : { opened: false, attempted: false };

console.log(JSON.stringify({ output, ...openResult, projectCount: projects.length, totalMinutes, totalToken }, null, 2));

function openReport(file) {
  const platform = process.platform;
  const fileUrl = pathToFileURL(file).href;
  const fileAttempts = platform === "darwin"
    ? [
        ["open", file],
        ["open", "-a", "Google Chrome", file],
        ["open", "-a", "Safari", file],
        ["agent-browser", "open", fileUrl],
        ["open", fileUrl],
      ]
    : platform === "win32"
      ? [["cmd", "/c", "start", "", fileUrl]]
      : [["xdg-open", fileUrl]];
  const errors = [];
  for (const [command, ...commandArgs] of fileAttempts) {
    const result = spawnSync(command, commandArgs, { encoding: "utf8" });
    const opened = result.status === 0 && !result.error;
    const openCommand = [command, ...commandArgs].join(" ");
    if (opened) {
      return {
        opened: true,
        attempted: true,
        openCommand,
      };
    }
    const error = result.error?.message || result.stderr?.trim() || `${command} exited with ${result.status}`;
    errors.push(`${openCommand}: ${error}`);
  }
  console.error(`报告已生成，但自动打开失败：${errors.join(" | ")}`);
  return {
    opened: false,
    attempted: true,
    openError: errors.join(" | "),
  };
}
