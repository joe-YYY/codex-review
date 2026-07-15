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
const until = new Date();

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

function cleanUserMessage(text) {
  let out = String(text || "");
  out = out.replace(/<environment_context>[\s\S]*?<\/environment_context>/g, "").trim();
  if (out.startsWith("# AGENTS.md instructions")) {
    const parts = out.split(/\n---\n/g).map((part) => part.trim()).filter(Boolean);
    out = parts.length > 1 ? parts[parts.length - 1] : "";
  }
  if (out.startsWith("<skill>")) return "";
  if (out === "<turn_aborted>") return "";
  if (!out || out.startsWith("<INSTRUCTIONS>")) return "";
  if (out.startsWith("The following is the Codex agent history whose request action you are assessing.")) return "";
  return out;
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
  if (/818造富节|造富节|主KV|KV图|证券活动板|ui-mockups\/818/i.test(hay)) return "818 造富节主 KV 设计";
  if (/app-map-h5-activity|活动地图|地图.*H5|H5.*地图|homepage-screenshot|prototype\/index\.html/i.test(hay)) return "活动地图 H5 原型";
  if (/image2-gateway|image2|image gateway|图片网关|Nano Banana|Gemini.*Image|SKILL\.md.*gateway/i.test(hay)) return "Image2 Gateway Skill";
  if (/hosts|DNS|one DNS|网络设置|隐私|imsfz|nginx-yjbapi|rpt\.gjzq/i.test(hay)) return "本机网络配置与隐私排查";
  if (/自动浏览器打开|浏览器打开|opened|auto-open/i.test(hay)) return "Codex Review 产品化";
  if (/AI落地|AI 落地|落地场景调研|产品经理.*落地场景|codex辅助梳理需求文档|生成简易demo|生成简易 demo/i.test(hay)) return "产品经理 AI 落地场景调研";
  if (/数仓|数据需求|字段定义|开户流程|邀请人信息|remark|T\+1|老带新/i.test(hay)) return "老带新数仓数据需求";
  if (/每日答题|cms_activity_question|launchd|launchctl|LaunchAgent|0点|00:00|答题成功|活动答题/i.test(hay)) return "每日答题自动化";
  if (/teams\.put|积分榜|波斯尼亚|波黑|库拉索岛|库拉索|净胜|最后 5 场/i.test(hay)) return "赛事积分榜映射核对";
  if (/ETF|敏感词|昵称|低误伤|english_sensitive|金融营销昵称敏感词库/i.test(hay)) return "ETF 昵称敏感词库";
  if (/邀请|好友|H5|Figma|原型|老带新|invite-summary|ui-mockups/i.test(hay)) return "邀请好友 H5 / 老带新需求";
  if (/storage|存储|磁盘|清理空间|storage-analyzer/i.test(hay)) return "存储分析工具";
  if (/命理|紫微|八字|农历|排盘|运势/i.test(hay)) return "命理报告";
  if (/全屋定制|投影面积|斜切|铣槽|PET肤感|乐然居|抽屉|灯带|玻璃门|拉手|柜|报价/i.test(hay)) return "全屋定制报价评估";
  if (/README|SKILL\.md|GitHub|使用体检|周度复盘|Codex Review|Token|自动化|report_template|report-design/i.test(hay)) return "Codex Review 产品化";
  if (/^\s*你好\s*$/.test(text)) return "轻量沟通";
  return "其他任务";
}

function projectForArtifact(file) {
  if (/ui-mockups\/818/.test(file)) return "818 造富节主 KV 设计";
  if (/app-map-h5-activity/.test(file)) return "活动地图 H5 原型";
  if (/image2-gateway/.test(file)) return "Image2 Gateway Skill";
  if (/codex-usage-review|codex-review/.test(file)) return "Codex Review 产品化";
  if (/每日答题|cms_activity_question|LaunchAgent|launchd/i.test(file)) return "每日答题自动化";
  if (/金融营销昵称敏感词库/.test(file)) return "ETF 昵称敏感词库";
  if (/AI落地|AI 落地|落地场景调研|产品经理.*落地场景/.test(file)) return "产品经理 AI 落地场景调研";
  if (/ui-mockups|老带新|邀请/.test(file)) return "邀请好友 H5 / 老带新需求";
  if (/storage/i.test(file)) return "存储分析工具";
  if (/命理|农历|排盘|运势/.test(file)) return "命理报告";
  if (/全屋定制|乐然居|报价|柜/.test(file)) return "全屋定制报价评估";
  return "其他任务";
}

function summarizeProject(name) {
  if (name === "818 造富节主 KV 设计") {
    return {
      actions: ["生成 818 造富节活动首页主 KV 方形图。", "根据证券活动板调性色彩和文字精简要求多轮收敛。", "沉淀多版视觉图片，便于后续挑选和复用。"],
      issue: "视觉任务的核心约束后补较多，例如只保留标题、不要按钮、不要其他文字，导致前期方案容易偏营销落地页而不是单张主视觉。",
      promptIssue: "生图任务第一条提示应直接写清画幅、唯一文字、禁用元素、风格参考和用途。",
      nextPrompt: "请生成一张方形活动首页主 KV 图，用于证券活动板。画面唯一文字是“818造富节”，不要报名按钮、不要副标题、不要其他文案。整体参考我给的配色，偏金融活动质感，输出 3 个方向并保存图片文件。",
      level: "yellow",
    };
  }
  if (name === "活动地图 H5 原型") {
    return {
      actions: ["建立活动地图 H5 原型项目规则、README 和 PRD。", "实现可运行原型页面，并保留首页截图作为视觉校验。", "把需求从口头描述沉淀成可继续迭代的项目目录。"],
      issue: "原型产物已经落地，但需求边界、页面状态和验收截图需要在起手阶段就固定，避免后续只凭视觉反馈反复改。",
      promptIssue: "原型任务最容易漏写目标设备、核心路径、必须演示的状态和不需要接真实接口的边界。",
      nextPrompt: "请在 app-map-h5-activity 下做一个本地可运行 H5 原型。第一步先写 RULES.md 和 prd.md，说明目录结构、页面范围、mock 数据和验收标准；第二步实现 prototype/index.html；第三步用截图校验首页视觉，不接真实接口，不改项目外文件。",
      level: "yellow",
    };
  }
  if (name === "Image2 Gateway Skill") {
    return {
      actions: ["排查本机能否高效调用 image2 生图。", "建立 image2-gateway 的项目规则。", "沉淀图片生成/网关相关 skill 说明。"],
      issue: "skill 类项目需要尽早区分用户说明、调用边界、依赖环境和失败处理，否则后续很难稳定复用。",
      promptIssue: "应提前说明这个 skill 解决什么问题、输入输出是什么、哪些动作需要人工确认或禁止自动执行。",
      nextPrompt: "请把 image2-gateway 整理成可复用 Codex skill。先写清 RULES.md，再补 SKILL.md：触发场景、输入参数、输出文件、失败处理、权限边界和验证方式。不要安装全局依赖，不要修改密钥或系统配置。",
      level: "yellow",
    };
  }
  if (name === "本机网络配置与隐私排查") {
    return {
      actions: ["处理 hosts 配置相关请求。", "分析 one DNS / 网络设置可能带来的隐私风险。", "给出本机网络配置排查和处置建议。"],
      issue: "这类任务涉及系统配置和隐私风险，必须把要查看什么、是否修改系统配置、是否需要管理员权限提前写清。",
      promptIssue: "网络配置任务如果只描述现象，Codex 容易不知道是做只读排查、风险解释，还是直接改系统文件。",
      nextPrompt: "请只读排查我本机的 DNS/网络配置隐私风险，不要修改系统设置。请检查当前 DNS、网络扩展、代理/VPN、配置描述文件和 hosts 状态，输出风险等级、我应该保留还是移除、以及手动处理步骤。涉及修改系统配置前必须先问我。",
      level: "yellow",
    };
  }
  if (name === "Codex Review 产品化") {
    return {
      actions: ["整理 README、SKILL.md、报告设计规范和 HTML 模板。", "验证仅依赖 skill 生成报告的可行性。", "推进定时复盘和 GitHub 发布形态。"],
      issue: "页面样式已能保持一致，但扫描和项目归并需要脚本化，否则不同环境下结果会飘。",
      promptIssue: "产品化任务容易把给人看的 README、给 Codex 看的 SKILL、给脚本跑的规则混在一起。",
      nextPrompt: "请把这个 Codex 使用复盘做成可发布 skill：README 给人看，SKILL.md 给 Codex 看，scripts 负责稳定扫描和生成，assets 负责页面模板。先跑一次测试报告，指出缺口后再改结构。",
      level: "yellow",
    };
  }
  if (name === "每日答题自动化") {
    return {
      actions: ["把每日答题脚本从临时手动执行推进到系统级定时执行。", "处理 Codex 自动化、macOS `launchd`、桌面目录权限和执行副本问题。", "通过系统触发方式试跑，并用日志确认答题成功。"],
      issue: "这类本机自动化任务容易在“创建任务”和“真正能被系统后台执行”之间漏掉验证，尤其是目录权限、quarantine 标记和日志路径。",
      promptIssue: "自动化任务第一条提示最好同时给出执行频率、脚本路径、验证方式、日志位置和哪些系统操作需要先确认。",
      nextPrompt: "请把这个脚本设置为每天 00:00 自动执行。脚本路径是 `/Users/caozhengyang/Desktop/默认工作区/每日答题/cms_activity_question.sh`。先确认文件存在和现有自动化是否重复；如 Codex 自动化不适合，请改用 macOS launchd。必须保留原脚本不动，设置日志路径，最后用系统触发方式试跑并确认退出码和日志结果。涉及删除、系统配置或权限扩大前先问我。",
      level: "yellow",
    };
  }
  if (name === "产品经理 AI 落地场景调研") {
    return {
      actions: ["整理产品经理在公司内使用 Codex 的落地场景。", "把需求梳理、PRD、原型 demo、评审准备等场景拆成可执行步骤。", "将 AI 使用方式从单点案例扩展成可汇报的场景清单。"],
      issue: "调研类任务如果只给例子，容易输出成泛泛的能力介绍；最好提前指定受众、汇报用途、颗粒度和交付格式。",
      promptIssue: "应先说明这是给谁看的、要用于调研汇报还是落地执行、每个场景是否需要步骤、产物和风险边界。",
      nextPrompt: "我在做公司内产品经理 AI 落地场景调研。请输出可直接放进汇报的结构化清单：每个场景包含适用工作、输入材料、Codex 操作步骤、产出物、验收标准、风险边界和推荐 Prompt。重点覆盖需求文档、原型 demo、竞品分析、数据口径、评审准备和跨部门交接。",
      level: "green",
    };
  }
  if (name === "全屋定制报价评估") {
    return {
      actions: ["对 A/B 两家全屋定制报价做口径拆解。", "基于 3 套房的 B 厂初步报价表逐项估算差异。", "把灯带、抽屉、玻璃门、斜切/铣槽拉手、PET 肤感等敏感项纳入结算判断。"],
      issue: "报价任务最容易因为假设后补而返工，例如某些工艺是否必做、某项材质是否加钱、三套房是否分别结算。",
      promptIssue: "表格评估任务第一条提示应先锁定 baseline、加价项、必须重算的假设和最终输出口径。",
      nextPrompt: "请以 B 厂 3 个 Excel 初步报价为 baseline，分别评估 3 套房 A/B 两家总价差异。必须把斜切拉手算入，铣槽拉手按可能项单列，灯带、抽屉、玻璃门、PET 肤感、五金差异分别列假设；最后给一版单独结算估价和推荐选择。用户后续修正任何加价项时，只按新假设重算，不保留旧 surcharge。",
      level: "green",
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
  if (name === "命理报告") {
    return {
      actions: ["创建命理报告目录规范和阶段性笔记。", "把一次性分析任务沉淀为可继续补充的项目材料。"],
      issue: "这类内容如果只停留在对话里，后续很难复查依据和版本。",
      promptIssue: "需要在开头锁定报告用途、输入资料、输出格式和是否需要 HTML 可视化。",
      nextPrompt: "请为这个命理分析项目生成可交付报告。输入资料见 notes.md，先检查缺失信息，再按事实、推断、建议三层输出。最终产物要包含可阅读 HTML 和一份可继续维护的 notes.md。",
      level: "green",
    };
  }
  if (name === "老带新数仓数据需求") {
    return {
      actions: ["梳理老带新活动的数仓取数字段和推送口径。", "明确未登录活动页、开户页 remark 透传、T+1 回传等关键链路。"],
      issue: "业务背景讲得清楚，但如果没有直接指定交付格式，容易只得到文字分析而不是可交给数仓的字段表。",
      promptIssue: "应提前说明输出必须包含数据需求描述、字段定义、触发条件、去重口径和异常情况。",
      nextPrompt: "我在写给数仓的数据需求。请输出可直接提交的需求文档，包含背景、取数口径、触发条件、字段定义表、T+1 推送规则、去重规则、异常情况和验收标准。场景：被邀请人未登录活动页，点击去开户后通过 remark 透传员工 ID、邀请人信息和活动 ID。",
      level: "green",
    };
  }
  if (name === "赛事积分榜映射核对") {
    return {
      actions: ["对比赛事积分榜名单和 Java `teams.put` 映射。", "识别中文命名差异，而不是把顺序差异误判成缺漏。"],
      issue: "这类核对任务若不先声明“顺序不算差异”，容易产生低价值差异清单。",
      promptIssue: "应提前指定比较维度：只看队伍是否缺失、多余、中文名称是否不一致。",
      nextPrompt: "请对比以下积分榜队伍和 Java teams.put 映射。只判断三类差异：缺失、多余、中文名称不一致；顺序不同不算差异。输出最终结论和差异表，中文简称/全称要单独标注。",
      level: "green",
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
  const scopedItems = items.filter((item) => {
    if (!item.timestamp) return item.type === "session_meta";
    const time = new Date(item.timestamp).getTime();
    return Number.isFinite(time) && time >= since.getTime() && time <= until.getTime();
  });
  const times = scopedItems.map((item) => item.timestamp).filter(Boolean).map((value) => new Date(value).getTime()).filter(Number.isFinite);
  if (!times.length) continue;
  const token = Object.fromEntries(tokenKeys.map((key) => [key, 0]));
  const userMessages = [];
  const assistantMessages = [];
  for (const item of scopedItems) {
    if (item.type === "event_msg" && item.payload?.type === "user_message" && item.payload.message) {
      const clean = cleanUserMessage(item.payload.message);
      if (clean) userMessages.push(clean);
    }
    if (item.type === "response_item" && item.payload?.type === "message") {
      const role = item.payload.role;
      const text = textOf(item.payload.content);
      if (role === "user" && text) {
        const clean = cleanUserMessage(text);
        if (clean) userMessages.push(clean);
      }
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
    projectHints: [...new Set(userMessages.map((message) => inferProject(message)).filter((name) => name !== "轻量沟通" && name !== "其他任务"))],
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
  let names = session.projectHints.length ? session.projectHints : [inferProject(session.text, nearbyArtifacts.map((item) => item.relative))];
  names = [...new Set(names)];
  const shareMinutes = session.minutes / names.length;
  const shareToken = Object.fromEntries(tokenKeys.map((key) => [key, Math.round((session.token[key] || 0) / names.length)]));
  for (const name of names) {
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
    project.minutes += shareMinutes;
    project.sessionCount += 1;
    addToken(project.token, shareToken);
    project.userMessageSamples.push(...session.userMessages.filter((message) => inferProject(message) === name).slice(0, 2));
  }
}

for (const [projectName, projectArtifacts] of artifactsByProject.entries()) {
  if (!projects.has(projectName)) {
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
