# Operio

Operio is a contextual clinical learning platform combining procedure-based learning, clinical publishing, and assessment.

## Route Map

- `/app` learner home
- `/app/procedures` procedure library
- `/app/procedure/:id` procedure detail
- `/app/posts` clinical posts
- `/app/post/:id` post detail
- `/app/review` review
- `/app/anatomy/:id` anatomy reference
- `/creator` creator workspace
- `/creator/new` new content
- `/creator/library` creator library
- `/pricing` pricing

## Shared Terminology

- `procedure`: structured clinical learning experience
- `post`: educational article or case reflection
- `assessment`: reinforcement inside the learning flow
- `creator`: educator or clinical expert who publishes content
- `learner`: student or clinician consuming content

## Docs

- [Vision](/home/shumtaka/repos/operio/VISION.md)
- [PRD](/home/shumtaka/repos/operio/prd.md)
- [Tasks](/home/shumtaka/repos/operio/.claude/tasks/tasks.md)

## Development

- `conda run -n operio npm run dev`
- `conda run -n operio npm run build`
- `conda run -n operio npm run test`
- `conda run -n operio npm run lint`
