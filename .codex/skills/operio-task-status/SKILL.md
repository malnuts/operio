---
name: operio-task-status
description: Summarize progress from `.claude/tasks/tasks.md`. Use when asked for project status, percentage complete, remaining tasks, checked versus unchecked sections, or the next unfinished sections and sub-tasks in the Operio task list.
---

# Operio Task Status

Read [`.claude/tasks/tasks.md`](../../../.claude/tasks/tasks.md) and produce a concise progress report.

## Required Output

Count checked `[x]` and unchecked `[ ]` items at both levels:

- top-level sections or numbered task items
- sub-task checklist items nested under those sections

Report:

1. sections completed / total
2. sub-tasks completed / total
3. percentage complete overall
4. the next 3 unfinished sections with the first unfinished sub-task under each

## Constraints

- Keep the report under 20 lines.
- Base the counts on the file contents, not estimates.
- If the task file format changes, explain the ambiguity instead of guessing.
