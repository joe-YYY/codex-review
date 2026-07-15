# Open-Source Repository Presentation Design

## Goal

Turn the repository into a clear, credible Chinese-first bilingual open-source project page
without overstating the current skill's capabilities or adding empty community
documents merely for appearance.

## Audience

- First-time Codex users looking for a reusable weekly review workflow.
- Existing Codex users who want to inspect local usage patterns and reports.
- Contributors who may improve scanning, report generation, or documentation.

## Public Documentation Structure

- `README.md`: Simplified Chinese default landing page.
- `README.en.md`: complete English version.
- `LICENSE`: MIT License, copyright holder `joe-YYY`.
- `CONTRIBUTING.md`: short contribution and validation guide.

`CODE_OF_CONDUCT.md`, `SECURITY.md`, release notes, issue templates, and CI
badges are intentionally excluded until the project has the corresponding
community process or automation.

## README Information Architecture

The Chinese and English README files use the same section order:

1. Project name, language switch, and one-sentence positioning.
2. What the skill does and the practical questions it answers.
3. Feature overview.
4. Installation with the real GitHub clone URL.
5. Quick start in Codex.
6. Weekly automation prompt.
7. Manual script usage.
8. Local data and privacy boundaries.
9. Repository structure.
10. Contributing, roadmap, and license.

The Chinese README is the repository's default GitHub landing page. Both
language versions should link to each other near the title. The first screen
should prioritize identity, value, and the fastest path to use.
Long explanations, repeated prompt examples, and internal implementation notes
should be reduced.

## Accuracy Rules

- Describe Token totals as approximate local usage records.
- Describe time totals as estimates derived from local session timestamps.
- State that scanning is read-only by default and reports remain local.
- Do not claim cloud synchronization, billing accuracy, or guaranteed project
  classification accuracy.
- Do not copy prose from reference repositories. Reuse only common open-source
  information patterns and the standard MIT License text.

## Validation

- Verify all internal Markdown links and the repository clone URL.
- Check that English and Chinese README files have matching core capabilities.
- Run both Node.js syntax checks and the existing scan/report smoke test.
- Inspect `git diff --check` and confirm no local reports or data are tracked.
- Review the rendered GitHub page after publishing.

## Publication Boundary

Implementation changes may be committed locally after validation. Publishing to
GitHub requires explicit user confirmation before `git push`.
