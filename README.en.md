# Codex Review

[简体中文](README.md) | [English](README.en.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
![Codex Skill](https://img.shields.io/badge/Codex-Skill-111827)
![Local First](https://img.shields.io/badge/Data-Local--first-2563eb)

**Turn your recent Codex activity into a local review that helps you work better next week.**

Codex Review is a local usage review skill for Codex users. It reads recent sessions, project artifacts, installed skills, automations, and Token records, then produces a visual HTML report that helps answer four practical questions:

- Which projects received most of your time and attention this week?
- Which prompts, task breakdowns, or unclear goals caused rework?
- Which repeated workflows should become templates, scripts, skills, or automations?
- Which Codex habits should you change next week?

It is not a chat transcript viewer or an exact billing tool. Think of it as a **weekly AI collaboration review** for your personal workflow.

## Core Capabilities

| Capability | What it provides |
| --- | --- |
| Usage overview | Summarizes estimated active time, major projects, artifacts, and approximate Token usage for the last 7 days |
| Project reviews | Organizes completed work, time estimates, important files, and inefficient steps by project |
| Prompt diagnosis | Detects unclear goals, missing constraints, weak acceptance criteria, and repeated corrections |
| Habit analysis | Highlights recurring thinking and collaboration issues with actionable improvements |
| HTML reports | Generates a local, collapsible report with scannable sections and copyable prompts |
| Recurring reviews | Supports weekly Codex automations while avoiding duplicate scheduled tasks |

## What the Report Covers

A typical report includes:

- One high-signal conclusion for the week
- Estimated active time, project count, artifact count, and Token usage
- Task-type and effort distribution
- Project-by-project work, time, outputs, and efficiency issues
- Prompt problems and a better prompt for next time
- A personal usage profile and next-week actions
- Workflows worth turning into templates, scripts, skills, or automations

Time and Token figures come from local records. They are useful for understanding scale and trends, but they are not exact timesheets or official billing data.

## Installation

Clone the repository into your Codex skills directory:

```bash
mkdir -p ~/.codex/skills
git clone https://github.com/joe-YYY/codex-review.git ~/.codex/skills/codex-review
```

You can also download the ZIP archive and extract it to:

```text
~/.codex/skills/codex-review/
```

The installed skill should look like this:

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

## Quick Start

Ask Codex:

```text
Use $codex-review to review my Codex activity from the last 7 days and generate a local HTML report.
```

By default, the workflow will:

1. Scan local Codex usage records in read-only mode
2. Group the main projects and related artifacts
3. Analyze time, Tokens, prompts, and collaboration habits
4. Generate an HTML report
5. Open the report automatically

## Weekly Automation

Ask Codex to create a recurring review:

```text
Use $codex-review to create a weekly Codex usage review every Monday at 09:30.
Review the last 7 days of projects, estimated time, artifacts, approximate Token usage, inefficient steps, prompt problems, and next-week improvements.
Do not create a duplicate automation if a similar one already exists. Open the report when it is ready.
```

## Other Workflows

### Review One Project

```text
Use $codex-review to review my recent Codex activity for "Project Name".
Focus on goal clarity, task breakdown, rework, and a better prompt for next time.
```

### Analyze Prompt Habits

```text
Use $codex-review to analyze my recent prompting habits.
Give me five improvements I can apply next week, with copyable prompt templates.
```

## Manual Usage

Using the skill directly is recommended for normal use. To debug scanning or report generation, run the scripts manually:

```bash
node scripts/scan_usage.mjs \
  --workspace "/path/to/your/workspace" \
  --output /tmp/codex_usage_scan.json

node scripts/build_report.mjs \
  --input /tmp/codex_usage_scan.json \
  --output /tmp/codex_usage_review.html
```

Generate the report without opening a browser:

```bash
node scripts/build_report.mjs \
  --input /tmp/codex_usage_scan.json \
  --output /tmp/codex_usage_review.html \
  --no-open
```

Manual script usage requires Node.js 18 or later.

## Local Data Boundaries

- Scanning is read-only by default and does not delete sessions, caches, project files, or skills
- Reports and intermediate data remain on your machine
- Session records do not need to be sent to an external analytics service
- Token totals come from local session events and may differ from official billing data
- Time totals are estimates derived from session timestamps
- Project grouping uses session and file signals and may occasionally need manual review

Local data that may be read includes:

- Codex session records
- Project files and recent artifacts
- Installed skills
- Automation configuration
- Token usage records

## Repository Structure

```text
.
├── SKILL.md                  # Skill workflow and execution rules
├── agents/openai.yaml        # Codex UI metadata
├── assets/report_template.html
├── references/report-design.md
└── scripts/
    ├── scan_usage.mjs        # Scans and structures local usage data
    └── build_report.mjs      # Generates and opens the HTML report
```

## Roadmap

- Add a sanitized example report and screenshots
- Support more flexible time ranges and project filters
- Improve automatic project grouping
- Improve prompt-problem detection
- Make first-time installation and automation setup easier

## Contributing

Issues, suggestions, and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting changes.

## License

This project is licensed under the [MIT License](LICENSE).

