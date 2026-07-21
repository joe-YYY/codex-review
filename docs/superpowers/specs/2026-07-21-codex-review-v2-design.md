# Codex Review v2 Design

## Decision

Keep the public product, repository, skill name, and install path as
`codex-review`. Refactor the implementation into a platform-neutral review core
and a Codex adapter. Do not create or market an `agent-review` product until at
least two agent platforms are implemented and tested against one report schema.

## Goals

- Remove maintainer-specific project names, paths, prompt examples, and usage
  assumptions from the open-source defaults.
- Improve Reliability, Adaptability, Convention, Effectiveness, and Trust with
  behavior that can be tested rather than documentation-only claims.
- Preserve the current local-first, read-only workflow and HTML report style.
- Make normal skill usage conversational; command-line steps remain an advanced
  debugging path.
- Prepare the codebase for future agent adapters without claiming unsupported
  platforms.

## Non-Goals

- Reading normal ChatGPT conversation history.
- Supporting Claude Code, OpenCode, OpenClaw, or other agents in this release.
- Adding cloud synchronization, analytics, accounts, or network dependencies.
- Building a visual configuration editor.
- Guaranteeing billing-accurate Token totals or exact human working time.

## Architecture

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

- `adapters/codex.mjs` reads Codex session files, Token events, skills, and
  automation state. It returns normalized sessions and artifacts.
- `core/grouping.mjs` groups normalized evidence without reading Codex paths or
  event names.
- `core/prompt-analysis.mjs` evaluates prompt completeness and produces generic
  improvement templates.
- `core/diagnostics.mjs` owns user-facing errors and recoverable warnings.
- `core/report-schema.mjs` validates the normalized v2 report structure.
- `scan_usage.mjs` is a thin CLI coordinator.
- `build_report.mjs` renders only the normalized report and does not infer
  project types from project names.

## Report Schema v2

Top-level fields:

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

Each project includes:

- `name`: derived project label or neutral fallback.
- `category`: one stable generic task category.
- `confidence`: `high`, `medium`, or `low`.
- `evidence`: short non-sensitive reasons for the grouping.
- `minutes`, `token`, `sessionCount`, and relative artifacts.
- `actions`, `promptAssessment`, `nextPrompt`, and `level` derived from current
  evidence rather than maintainer-specific templates.

## Generic Project Grouping

Grouping priority:

1. Optional user configuration supplied through `--config` or a documented
   workspace-local config file.
2. Stable cwd or project folder names, excluding generic folders such as home,
   Desktop, workspace, downloads, and temporary directories.
3. Meaningful session titles and explicit project names in the first user
   request.
4. Top-level artifact directories and repeated file stems.
5. Generic task category as a neutral fallback.

Default categories:

- Code development
- Documents and content
- Product and design
- Data and spreadsheets
- Research and analysis
- System automation
- Skills and tools
- Visual assets
- Other work

Broad keywords may choose a category but must never create a specific business
project name. Low-confidence sessions use a neutral label such as
`Unconfirmed project` / `待确认项目`.

## Prompt Analysis

Analyze the first meaningful user request and later corrections for these
signals:

- Deliverable or output format
- Scope and exclusions
- Inputs and source material
- Constraints and boundaries
- Acceptance criteria
- Verification or evidence requirements

The output explains only issues supported by those signals. Personal profile
text, weekly conclusions, and recommended prompts must be derived from project
data. Static references to product managers, finance activities, invitation
flows, nickname filters, or the maintainer's local paths are prohibited.

## Diagnostics And Error Experience

Hard failures exit non-zero with:

- What could not be completed
- The likely reason
- One concrete next action

Hard-failure cases include invalid arguments, missing input files, malformed
report JSON, missing templates, and unwritable output locations.

Recoverable problems become `diagnostics` entries and do not block the report:

- Unreadable session files or directories
- Malformed JSONL lines
- No sessions in the selected period
- Missing Token events
- Low-confidence project grouping
- Browser-open failure after the report was generated

The HTML shows a compact warning banner only when diagnostics exist. Technical
details stay behind a disclosure; normal reports remain uncluttered.

## Privacy And Trust

- Process prompts locally but do not persist complete raw prompts by default.
- Store relative artifact paths where possible.
- Do not write automation file paths into the report schema.
- Redact home-directory prefixes in user-facing diagnostics.
- Example and test fixtures use invented users, paths, projects, and messages.
- No network request is added to scanning or report generation.

## Repository Completeness

Add:

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

README updates must include the real sample screenshot, normal conversational
usage, supported scope, limitations, troubleshooting, and the optional custom
grouping configuration. English and Chinese documentation remain aligned.

## Compatibility And Migration

- Keep `scripts/scan_usage.mjs` and `scripts/build_report.mjs` CLI names.
- Continue accepting v1 scan JSON in `build_report.mjs` when practical; normalize
  it internally to v2.
- Keep the current report template's visual language unless diagnostics require
  a new warning component.
- After repository validation, synchronize the publishable skill files into
  `~/.codex/skills/codex-review` and verify byte-level parity for shared files.

## Verification

Dependency-free tests cover:

- Generic grouping across at least four task categories.
- Optional custom grouping rules.
- Empty date range.
- Malformed JSONL with recoverable warnings.
- Missing input and malformed report JSON with plain-language failures.
- Report generation from v2 sample data.
- No maintainer-specific names, paths, or prompt text in publishable defaults.
- No complete raw prompt or unnecessary absolute path in generated sample data.
- Repository and installed skill parity.

Run syntax checks, the test runner, a real local smoke scan, report generation,
HTML visual inspection, responsive screenshot checks, and `git diff --check`.

## Agent Review Gate

Create a separate `agent-review` project only when:

1. A second agent adapter is implemented.
2. Both adapters pass the same schema and behavior tests.
3. Cross-platform differences in sessions, Tokens, subagents, and automation are
   documented.
4. The generic name no longer overstates actual support.

Until then, describe the architecture as agent-ready, not agent-universal.

## Neat-Freak Closeout

At implementation completion:

- Reconcile `RULES.md`, README files, SKILL.md, references, examples, and code.
- Remove dead references and duplicated explanations.
- Confirm the root repository and installed skill do not drift.
- Report but do not directly rewrite Codex machine-generated memory files.
- Keep project rules concise and operational rather than turning them into a
  change log.
