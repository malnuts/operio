# Operio

## What This Is

Operio is a contextual clinical learning platform. The product combines:

- procedure-based learning with expert explanations
- clinical posts with text and photos
- assessment flows that reinforce learning in context

The initial launch scope may remain dental, but the active product framing and architecture should not assume Operio is only a dental or exam-prep product.

## Stack

- **Framework:** React 18 + TypeScript
- **Build:** Vite with SWC (`@vitejs/plugin-react-swc`)
- **Styling:** Tailwind CSS + shadcn/ui
- **Animation:** Framer Motion
- **Icons:** Lucide React
- **3D:** Three.js for visual anatomy/reference modules
- **Routing:** react-router-dom v6
- **State:** React hooks + localStorage
- **Data:** Static JSON files in `public/data/` for current content
- **Tests:** Vitest + React Testing Library
- **Linting:** ESLint + TypeScript-ESLint

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
- Procedures, posts, and assessment content should support the same localization strategy where practical

## Project Structure

```
src/
  main.tsx
  App.tsx
  index.css
  pages/
    Index.tsx
    NotFound.tsx
    AppHome.tsx
    Procedure.tsx
    Anatomy.tsx
    Summary.tsx
    Review.tsx
    Upload.tsx
    Dashboard.tsx
    Pricing.tsx
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

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run test`
- `npm run test:watch`
- `npm run lint`

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
- Prefer product terms that can survive broader healthcare expansion

## Task List

All active implementation tasks live in [`.claude/tasks/tasks.md`](/home/shumtaka/repos/operio/.claude/tasks/tasks.md).

## What Not To Do

- Do not reintroduce active product framing that treats Operio as dental-only unless it is explicitly about launch content
- Do not frame the product as exam-prep-only
- Do not hardcode domain-specific assumptions into shared platform types unless necessary
- Do not hardcode language strings in `.ts` or `.tsx`
- Do not modify `src/components/ui/` directly
- Do not add server-side complexity before the product actually needs it
