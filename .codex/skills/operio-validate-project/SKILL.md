---
name: operio-validate-project
description: Run the full Operio validation workflow for this repo. Use when asked to validate the project, check whether the app is clean to ship, run tests/build/lint together, scan for `console.log` in `src/`, or flag hardcoded English text that should use `t()` from `useI18n()`.
---

# Operio Validate Project

Use this skill to perform the repo's standard validation pass and summarize the result clearly.

## Validation Steps

1. Run `npm run test` and capture failures.
2. Run `npm run build` and confirm it succeeds without errors.
3. Run `npm run lint` and capture ESLint or TypeScript-lint failures.
4. Search `src/` for `console.log` statements, excluding test files.
5. Review changed or relevant JSX/TSX for hardcoded English strings that should go through `t()` from `useI18n()`.

## Project-Specific Checks

- Treat missing i18n usage as a validation issue.
- Respect [`CLAUDE.md`](../../../CLAUDE.md): do not suggest changes that modify `src/components/ui/` directly unless explicitly requested.
- Keep Operio's product framing intact when evaluating copy regressions.

## Reporting Format

Return a compact summary with:

- tests: passed or failed
- build: passed or failed
- lint: passed or failed
- `console.log` findings
- i18n or hardcoded-English findings
- the most important failure details and affected files

If a command cannot run, say exactly which command was blocked or failed.
