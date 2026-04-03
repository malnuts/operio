# Operio For Codex

## What This Is

Operio is a contextual clinical learning platform. The product combines:

- procedure-based learning with expert explanations
- clinical posts with text and photos
- assessment flows that reinforce learning in context

The initial launch scope may remain dental, but active product framing and architecture should not assume Operio is only a dental or exam-prep product.

## Environment

- Run project commands through the `operio` conda environment: `conda run -n operio <command>`
- Prefer `conda run -n operio npm run <script>` for repo scripts
- Prefer `conda run -n operio python3 ...` for local Python utilities
- If a required runtime or package is missing from `operio`, install it into that env instead of relying on `base`

## Stack

- Framework: React 18 + TypeScript
- Build: Vite with SWC (`@vitejs/plugin-react-swc`)
- Styling: Tailwind CSS + shadcn/ui
- Animation: Framer Motion
- Icons: Lucide React
- 3D: Three.js for visual anatomy/reference modules
- Routing: react-router-dom v6
- State: React hooks + localStorage
- Data: static JSON files in `public/data/`
- Tests: Vitest + React Testing Library
- Linting: ESLint + TypeScript-ESLint

## Product Guidance

- Position Operio as contextual clinical learning first.
- Treat assessments as a reinforcement layer, not the entire identity of the product.
- Keep procedures as the strongest content type.
- Treat clinical posts as a second major content type, not an afterthought.
- Keep launch scope narrow even though the brand is broad.

## i18n Rules

- All user-visible strings should have a key in `public/locales/en.json`
- Each additional language is a file: `public/locales/{lang}.json`
- `public/locales/manifest.json` lists available languages
- `useI18n()` should expose `{ t, lang, setLang, available }`
- Missing keys in the active language should fall back to English
- Do not hardcode language lists in TypeScript
- Do not hardcode user-visible strings in `.ts` or `.tsx`

## Project Structure

```text
src/
  pages/
  components/
    ui/
    viewer/
    sim/
    upload/
  hooks/
  lib/
  types/
public/
  locales/
  data/
  models/
  videos/
```

## Key Commands

- `conda run -n operio npm run dev`
- `conda run -n operio npm run build`
- `conda run -n operio npm run preview`
- `conda run -n operio npm run test`
- `conda run -n operio npm run test:watch`
- `conda run -n operio npm run lint`

## Architecture Patterns

- Pages in `src/pages/` own route-level state
- Reusable components in `src/components/` receive props and callbacks
- Shared types belong in `src/types/`
- Reusable stateful logic belongs in hooks
- UI primitives in `src/components/ui/` should not be modified directly

## Code Conventions

- Functional components only
- Use `@/` imports
- One component per file where practical
- Use `cn()` from `@/lib/utils`
- Use `useI18n()` for user-visible strings
- Use vanilla Three.js for 3D work
- Prefer product terms that can survive broader healthcare expansion

## Task List

All active implementation tasks live in `.claude/tasks/tasks.md`.

## Codex-Specific Notes

- Repo-local Codex skills live in `.codex/skills/`
- Use `rg` for search and prefer non-destructive git commands
- Update `.claude/tasks/tasks.md` when a task workflow explicitly calls for checking completed items

## What Not To Do

- Do not reintroduce product framing that treats Operio as dental-only unless the change is explicitly about launch content
- Do not frame the product as exam-prep-only
- Do not hardcode domain-specific assumptions into shared platform types unless necessary
- Do not modify `src/components/ui/` directly
- Do not add server-side complexity before the product actually needs it
