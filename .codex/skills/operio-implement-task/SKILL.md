---
name: operio-implement-task
description: Implement an Operio task from `.claude/tasks/tasks.md` using this repo's React, TypeScript, Tailwind, i18n, and Three.js conventions. Use when asked to implement a numbered task, complete sub-tasks from the project task list, update task checkboxes after code changes, or suggest a task-scoped commit message.
---

# Operio Implement Task

Read [`.claude/tasks/tasks.md`](../../../.claude/tasks/tasks.md) and locate the requested task number or task title before making changes. Read [`CLAUDE.md`](../../../CLAUDE.md) and follow its project rules throughout the task.

## Workflow

1. Find the requested task and its child checklist items in [`.claude/tasks/tasks.md`](../../../.claude/tasks/tasks.md).
2. Read [`CLAUDE.md`](../../../CLAUDE.md) for product framing, stack constraints, i18n rules, and "What Not To Do".
3. Inspect the current codebase for the affected routes, components, hooks, types, and data files before editing.
4. Implement each sub-task using the repo's established patterns.

## Required Conventions

- Use React + TypeScript + Tailwind patterns already present in the repo.
- Use shadcn/ui components where they fit. Do not modify `src/components/ui/` directly.
- Use `t()` from `useI18n()` for user-visible strings. Do not hardcode English in `.ts` or `.tsx`.
- Use vanilla Three.js for 3D work. Do not introduce `@react-three/fiber`.
- Use `@/` imports and functional components.
- Preserve Operio's broader clinical-learning framing. Do not regress the product back to a dental-only or exam-prep-only identity unless the task is explicitly about launch-specific content.

## Completion Rules

After implementation:

1. Run `npm run test`.
2. If relevant, note any blockers or failing sub-tasks instead of silently skipping them.
3. Update [`.claude/tasks/tasks.md`](../../../.claude/tasks/tasks.md) by checking completed sub-tasks as `[x]`.
4. Suggest a commit message prefixed with the task number, in the form `[TASK] Description`.

## Reporting

Report:

- what was implemented
- which task checkboxes were updated
- test results
- any blockers, follow-up work, or assumptions
