# Design Philosophy

This document describes the thinking behind how this project is built.
Agents should internalize these concepts and let them guide every decision.

---

## Separation of Concerns

Every file and every component has one clearly defined job. It does that job fully, and nothing else. If a piece of code is doing two things, that is a signal it should be two pieces of code. This keeps each unit easy to understand, easy to test, and easy to replace without touching anything else.

## Minimal Footprint

Only write what is actually needed right now. Do not add abstractions, utilities, or components in anticipation of future needs that have not been confirmed. Every line of code is a liability — it has to be read, understood, and maintained. The less code that exists, the healthier the codebase. When in doubt, do less.

## Atomic Design

UIs are built from the smallest meaningful unit upward. Small, self-contained elements compose into slightly larger groups, which compose into full sections, which compose into pages. Nothing at a higher level reimplements what already exists at a lower level. The result is a system where pieces are reusable, predictable, and easy to reason about in isolation.

## Opinionated Scaffolding

The project follows a fixed set of tools, patterns, and conventions — and does not deviate from them. When a problem arises, the answer is almost always already provided by the chosen stack. Agents should not introduce new libraries, invent new patterns, or make structural decisions that conflict with the existing approach. The opinions have already been set. The job is to work within them, not around them.

## Composability Over Configuration

Flexible behavior is achieved by combining simple pieces, not by adding more options to a single complex piece. A component that accepts other components as children is almost always better than a component that accepts a long list of props to control its appearance and behavior. Complexity should emerge from composition, not from configuration.

## No Premature Abstraction

Shared, reusable pieces are only created once a pattern has proven itself by appearing in more than one place. Building abstractions too early creates structure around assumptions that may never be validated. Build the specific thing first. Generalize only when the repetition makes it obvious.
