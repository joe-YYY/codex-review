# Contributing to Codex Review

Thank you for helping improve Codex Review. Contributions should keep the skill
local-first, understandable to non-technical users, and honest about estimated
time, Token usage, and project grouping.

## Before You Start

- Search existing issues before opening a new one.
- Keep changes focused on one problem or improvement.
- Do not include real session records, reports, credentials, or private project
  content in commits or issue descriptions.
- Preserve the read-only default for scanning workflows.

## Development Workflow

1. Fork the repository and create a focused branch.
2. Make the smallest change that fully solves the problem.
3. Update both `README.md` and `README.en.md` when user-facing behavior changes.
4. Run the validation commands below.
5. Open a pull request that explains the problem, the change, and the checks run.

## Validation

```bash
node --check scripts/scan_usage.mjs
node --check scripts/build_report.mjs

node scripts/scan_usage.mjs \
  --workspace "$PWD" \
  --output /tmp/codex_review_scan.json

node scripts/build_report.mjs \
  --input /tmp/codex_review_scan.json \
  --output /tmp/codex_review_report.html \
  --no-open

git diff --check
```

## Pull Request Checklist

- The change matches the documented capabilities of the skill.
- Local data remains local unless the user explicitly chooses otherwise.
- Generated reports and intermediate data are not committed.
- Documentation is updated in both languages when needed.
- Validation commands pass.

