# Codex Review

[简体中文](README.md) | [English](README.en.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
![Codex Skill](https://img.shields.io/badge/Codex-Skill-111827)
![Local First](https://img.shields.io/badge/Data-Local--first-2563eb)
![No Dependencies](https://img.shields.io/badge/Runtime-No_dependencies-00a862)

> Turn scattered Codex sessions and project artifacts into a local weekly review with concrete actions for next week.

Codex Review is a local-first Codex skill. It scans recent sessions, project artifacts, installed skills, automations, and Token events, then generates a collapsible HTML report with copyable prompt templates.

It helps you see:

- Where your time and attention went.
- Which initial prompts missed goals, scope, constraints, or acceptance criteria.
- Which tasks required repeated direction changes.
- Which workflows should become templates, scripts, skills, or automations.
- The one to three habits worth changing next week.

Normal usage does not require the command line. Ask Codex to use `$codex-review`; the skill handles scanning, analysis, report generation, and opening the report.

![Codex Review sample report](examples/sample_report.png)

## Features

| Capability | Output |
| --- | --- |
| Usage overview | Estimated active time, projects, artifacts, and approximate Token usage |
| Project reviews | Work completed, time spent, key files, and efficiency observations |
| Prompt diagnosis | Missing information in the initial request and later corrections |
| Collaboration review | What to keep, what to adjust, and next-week actions |
| Reuse suggestions | Candidates for templates, scripts, skills, or automations |
| HTML report | Local, auto-opened, collapsible, and prompt-copy friendly |
| Weekly review | Recurring reviews without creating duplicate automations |

## Installation

Clone the repository into your Codex skills directory:

```bash
mkdir -p ~/.codex/skills
git clone https://github.com/joe-YYY/codex-review.git ~/.codex/skills/codex-review
```

Restart Codex, then ask:

```text
Use $codex-review to review my Codex activity from the last 7 days and generate a local HTML report.
```

## Common Workflows

### Weekly Review

```text
Use $codex-review to review my Codex activity from the last 7 days.
Generate and open a local HTML report covering projects, estimated time, artifacts, approximate Token usage, inefficient steps, prompt problems, and next-week actions.
```

### One Project

```text
Use $codex-review to review my recent activity for "Project Name".
Focus on goal clarity, task breakdown, rework, and which constraints should be stated earlier next time.
```

### Recurring Review

```text
Use $codex-review to create a weekly review every Monday at 09:30.
Do not create a duplicate automation. Open the report when it is ready.
```

## How It Works

Codex Review uses a platform-neutral review core with a Codex data adapter:

1. Read local Codex session timing, user requests, and Token events.
2. Detect recently modified code, documents, spreadsheets, pages, and images.
3. Group projects using custom rules, working directories, explicit paths, artifact folders, and activity timestamps.
4. Check whether initial requests include deliverables, inputs, scope, constraints, acceptance criteria, and verification.
5. Write a stable report schema and render the local HTML report.

Each artifact belongs to one project only. When evidence is weak, the report uses a neutral task category instead of inventing a project name.

## Custom Project Rules

Create `.codex-review.json` in the workspace root:

```json
{
  "projectRules": [
    {
      "name": "Customer Console",
      "category": "Product and Design",
      "patterns": ["customer-console", "workspace/prd"]
    }
  ]
}
```

See [project grouping rules](references/project-grouping.md) for details.

## Local Data Boundaries

- Scanning is read-only by default.
- Reports and intermediate data stay on the local machine.
- The scan JSON does not persist full raw prompts, secrets, or unnecessary absolute paths by default.
- Obvious synthetic tests and auxiliary threads are excluded from primary active time.
- Active time is estimated from session activity segments, with each idle gap capped at 15 minutes.
- Token totals come from local `token_count` events and may differ from official billing data.

## Development and Validation

The command line is only needed for development and troubleshooting:

```bash
node scripts/scan_usage.mjs --workspace "/path/to/workspace" --output /tmp/codex_review_scan.json
node scripts/build_report.mjs --input /tmp/codex_review_scan.json --output /tmp/codex_review_report.html
node tests/run.mjs
```

The scripts require Node.js 18 or later and have no third-party npm dependencies. See [troubleshooting](references/troubleshooting.md) when a path, permission, Token event, or browser-open problem occurs.

## Repository Structure

```text
codex-review/
├── SKILL.md
├── agents/openai.yaml
├── assets/report_template.html
├── scripts/
│   ├── adapters/codex.mjs
│   ├── core/
│   ├── scan_usage.mjs
│   └── build_report.mjs
├── references/
├── examples/
└── tests/run.mjs
```

## Contributing

Issues and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a change.

## License

Licensed under the [MIT License](LICENSE).
