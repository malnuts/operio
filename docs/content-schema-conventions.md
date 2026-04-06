# Content Schema Conventions

This document defines the shared JSON conventions for Operio procedures, posts, assessments, creator profiles, and review records.

## Design Rules

- Keep platform metadata separate from launch-specific clinical metadata.
- Support both current procedure formats: `simulation` and `video`.
- Keep multilingual content compatible with the repo's future locale strategy.
- Favor stable IDs and explicit references between content records.

## Shared Conventions

- Every top-level record must have an `id`.
- User-facing content fields may be either:
  - a plain string for single-language seed content
  - an object keyed by language code, for example `{ "en": "...", "uz": "..." }`
- Cross-record references use IDs, for example `questionId`, `linkedAssessmentId`, and `contentId`.
- `platformMetadata` is reserved for app-level concerns such as content type, publication status, visibility, locale, and translation availability.
- `domainMetadata` is reserved for clinical or launch-dataset detail such as domain, specialty, regional conventions, or external codes.

## Procedure Schema

Top-level fields:

- `id: string`
- `type: "simulation" | "video"`
- `title: LocalizedText`
- `description: LocalizedText`
- `difficulty?: "Beginner" | "Intermediate" | "Advanced"`
- `author?: { id?, name, institution?, specialty?, photoUrl?, procedureCount?, rating? }`
- `category?: string`
- `tags?: string[]`
- `platformMetadata?: { contentType: "procedure", status?, visibility?, locale?, translations?, tags? }`
- `domainMetadata?: { domain?, specialty?, region?, concepts?, launchDataset?, clinicalCodes?, ... }`

Simulation procedures:

- Must include `steps`.
- May include `modelPath` and `cameraAngle`.
- Each step follows the shared `ProcedureChapter` shape and may include `narration`, `actionDescription`, `referenceContent`, `modelState`, `instrumentId`, and `questionId`.

Video procedures:

- Must include `videoUrl` and `chapters`.
- May include `thumbnailUrl`, `duration`, and `decisionPoints`.
- Chapters use the same `ProcedureChapter` shape with `timestamp` instead of simulation-only context.

## ProcedureChapter Schema

- `id?: string`
- `title?: LocalizedText`
- `narration?: string`
- `actionDescription?: LocalizedText`
- `timestamp?: number`
- `durationSeconds?: number`
- `instrumentId?: string`
- `isDecisionPoint?: boolean`
- `questionId?: string`
- `decisionPointId?: string`
- `modelState?: { highlight?: string[], colors?: Record<string, string> }`
- `referenceContent?: { instrument?, anatomy?, technique? }`
- `instrumentTrayOptions?: string[]`
- `media?: ContentMedia[]`

## DecisionPoint Schema

- `id?: string`
- `questionId: string`
- `chapterId?: string`
- `stepId?: string`
- `timestamp?: number`
- `prompt?: LocalizedText`
- `stepDescription?: LocalizedText`

Use `DecisionPoint` for explicit question interrupts in video or chapter-based playback. Existing simulation payloads may continue using `isDecisionPoint` and `questionId` inline on steps.

## Assessment Schema

Question set:

- `procedureId?: string`
- `postId?: string`
- `questions: AssessmentQuestion[]`
- `platformMetadata?: { contentType: "assessment", status?, visibility?, locale?, translations?, tags? }`

Question:

- `id: string`
- `stem: LocalizedText`
- `options: { label, text, isCorrect }[]`
- `explanation?: { correctReasoning, distractorBreakdowns?, clinicalPrinciple?, boardTip? }`
- `domainMetadata?: { ... }`

## Clinical Post Schema

- `id: string`
- `title: LocalizedText`
- `excerpt?: LocalizedText`
- `body: LocalizedText`
- `summary?: LocalizedText`
- `author: CreatorProfile summary fields`
- `field?: string`
- `topic?: string`
- `tags?: string[]`
- `publishDate?: string`
- `heroImage?: ContentMedia`
- `gallery?: ContentMedia[]`
- `linkedAssessmentId?: string`
- `platformMetadata?: { contentType: "post", status?, visibility?, locale?, translations?, tags? }`
- `domainMetadata?: { ... }`

## Creator Profile Schema

- `id: string`
- `displayName: string`
- `bio?: LocalizedText`
- `institution?: string`
- `specialty?: string`
- `avatarUrl?: string`
- `expertise?: string[]`
- `socialLinks?: { label, url }[]`
- `platformMetadata?: { verified?, visibility? }`
- `domainMetadata?: { ... }`

## Review Record Schema

- `id: string`
- `learnerId?: string`
- `contentId: string`
- `contentType: "procedure" | "post" | "assessment"`
- `questionId?: string`
- `completionState: "not_started" | "in_progress" | "completed" | "mastered"`
- `score?: number`
- `lastReviewedAt?: string`
- `nextReviewAt?: string`
- `attempts?: number`
- `notes?: LocalizedText`
- `platformMetadata?: { source?: "local" | "synced", locale?: string }`
- `domainMetadata?: { ... }`

## Multilingual Content Rules

- UI copy should stay in `public/locales/{lang}.json` and use `t()` in the app.
- Content payloads may start as plain strings during single-language development.
- When content needs inline localization, upgrade the field to a language-keyed object without changing the field name.
- `platformMetadata.locale` identifies the source/default language for the record.
- `platformMetadata.translations` lists available translated variants without hardcoding supported languages in TypeScript.

## Separation Of Platform And Domain Metadata

Put these in `platformMetadata`:

- content type
- publication status
- access tier
- locale and translation availability
- tags reused across domains

Put these in `domainMetadata`:

- dental or other specialty-specific classifications
- regional clinical context
- launch-only dataset flags
- external taxonomy or billing codes

This split keeps Operio expandable beyond the first clinical vertical while preserving room for launch-specific datasets.
