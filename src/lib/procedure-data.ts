import { z } from "zod";

import { normalizeContentVisibility } from "@/lib/content-access";
import { resolveAssetUrl } from "@/lib/asset-config";
import { loadValidatedJson, resolveLocalizedText } from "@/lib/content-runtime";
import type { ContentVisibility, Procedure } from "@/types/content";
import { procedureSchema } from "@/types/content";

const procedureManifestEntrySchema = z.object({
  id: z.string(),
  type: z.enum(["simulation", "video"]),
  duration: z.number().optional(),
  thumbnailUrl: z.string().optional(),
  author: z.object({
    name: z.string(),
    institution: z.string().optional(),
  }).optional(),
});

const procedureManifestSchema = z.object({
  procedures: z.array(procedureManifestEntrySchema),
});

const legacyQuestionSetSchema = z.object({
  procedureId: z.string().optional(),
  questions: z.array(
    z.object({
      id: z.string(),
      stem: z.string(),
      options: z.array(
        z.object({
          label: z.string(),
          text: z.string(),
          isCorrect: z.boolean(),
        }),
      ),
      explanation: z.object({
        correctReasoning: z.string().optional(),
        distractorBreakdowns: z.array(
          z.object({
            label: z.string(),
            reasoning: z.string(),
          }),
        ).optional(),
        clinicalPrinciple: z.string().optional(),
        boardTip: z.string().optional(),
      }).optional(),
    }),
  ),
});

const videoQuestionSetSchema = z.object({
  procedureId: z.string().optional(),
  questions: z.array(
    z.object({
      id: z.string(),
      stem: z.string(),
      options: z.array(
        z.object({
          id: z.string(),
          text: z.string(),
        }),
      ),
      correctOptionId: z.string(),
      explanation: z.object({
        correctReasoning: z.string().optional(),
        distractorAnalysis: z.record(z.string(), z.string()).optional(),
        clinicalPrinciple: z.string().optional(),
        boardTip: z.string().optional(),
      }).optional(),
    }),
  ),
});

const procedureQuestionSetSchema = z.union([legacyQuestionSetSchema, videoQuestionSetSchema]);

export type ProcedureManifestEntry = z.infer<typeof procedureManifestEntrySchema>;

export type ProcedureLibraryItem = {
  id: string;
  type: "simulation" | "video";
  title: string;
  description: string;
  visibility: ContentVisibility;
  difficulty?: string;
  duration?: number;
  thumbnailUrl?: string;
  authorName?: string;
  authorInstitution?: string;
  tags: string[];
};

export type NormalizedQuestionOption = {
  id: string;
  label: string;
  text: string;
  isCorrect: boolean;
};

export type NormalizedQuestion = {
  id: string;
  stem: string;
  options: NormalizedQuestionOption[];
  explanation?: {
    correctReasoning?: string;
    distractorBreakdowns?: Array<{ label: string; reasoning: string }>;
    clinicalPrinciple?: string;
    boardTip?: string;
  };
};

export type ProcedurePlaybackUnit = {
  id: string;
  title?: string;
  titleFallback: {
    kind: "chapter" | "step";
    index: number;
  };
  body?: string;
  bodyFallback: "video" | "simulation";
  supportingText?: string;
  questionId?: string;
  referenceContent?: {
    anatomy?: string;
    technique?: string;
    instrument?: {
      name: string;
      description: string;
    };
  };
  cue?:
    | { kind: "videoTimestamp"; seconds: number }
    | { kind: "instrument"; instrumentId: string };
};

type LegacyQuestionSet = z.infer<typeof legacyQuestionSetSchema>;
type VideoQuestionSet = z.infer<typeof videoQuestionSetSchema>;

const isVideoQuestionSet = (payload: LegacyQuestionSet | VideoQuestionSet): payload is VideoQuestionSet =>
  Boolean(payload.questions[0] && "correctOptionId" in payload.questions[0]);

const resolveProcedureChapterMedia = (chapter: NonNullable<Procedure["chapters"]>[number]) => ({
  ...chapter,
  media: chapter.media?.map((asset) => ({
    ...asset,
    url: resolveAssetUrl(asset.url),
    thumbnailUrl: asset.thumbnailUrl ? resolveAssetUrl(asset.thumbnailUrl) : undefined,
  })),
});

export const resolveProcedureMedia = (procedure: Procedure): Procedure => ({
  ...procedure,
  videoUrl: procedure.videoUrl ? resolveAssetUrl(procedure.videoUrl) : undefined,
  thumbnailUrl: procedure.thumbnailUrl ? resolveAssetUrl(procedure.thumbnailUrl) : undefined,
  chapters: procedure.chapters?.map(resolveProcedureChapterMedia),
  steps: procedure.steps?.map(resolveProcedureChapterMedia),
});

export const loadProcedureManifest = async () =>
  loadValidatedJson("/data/procedure-manifest.json", procedureManifestSchema);

export const loadProcedureById = async (id: string) => {
  return resolveProcedureMedia(await loadValidatedJson(`/data/procedures/${id}.json`, procedureSchema));
};

export const loadQuestionsByProcedureId = async (id: string) =>
  loadValidatedJson(`/data/questions/${id}-questions.json`, procedureQuestionSetSchema);

export const buildProcedureLibraryItems = async (): Promise<ProcedureLibraryItem[]> => {
  const manifest = await loadProcedureManifest();
  const procedures = await Promise.all(manifest.procedures.map((item) => loadProcedureById(item.id)));

  return procedures.map((procedure) => ({
    id: procedure.id,
    type: procedure.type,
    title: resolveLocalizedText(procedure.title, procedure.id),
    description: resolveLocalizedText(procedure.description, ""),
    visibility: normalizeContentVisibility(procedure.platformMetadata?.visibility),
    difficulty: procedure.difficulty,
    duration: procedure.duration,
    thumbnailUrl: procedure.thumbnailUrl,
    authorName: procedure.author?.name,
    authorInstitution: procedure.author?.institution,
    tags: procedure.tags ?? [],
  }));
};

export const normalizeQuestionSet = (payload: LegacyQuestionSet | VideoQuestionSet): NormalizedQuestion[] => {
  if (isVideoQuestionSet(payload)) {
    return payload.questions.map((question) => ({
      id: question.id,
      stem: question.stem,
      options: question.options.map((option, index) => ({
        id: option.id,
        label: String.fromCharCode(65 + index),
        text: option.text,
        isCorrect: option.id === question.correctOptionId,
      })),
      explanation: {
        correctReasoning: question.explanation?.correctReasoning,
        distractorBreakdowns: Object.entries(question.explanation?.distractorAnalysis ?? {}).map(
          ([label, reasoning]) => ({
            label: label.toUpperCase(),
            reasoning,
          }),
        ),
        clinicalPrinciple: question.explanation?.clinicalPrinciple,
        boardTip: question.explanation?.boardTip,
      },
    }));
  }

  return payload.questions.map((question) => ({
    id: question.id,
    stem: question.stem,
    options: question.options.map((option) => ({
      id: option.label.toLowerCase(),
      label: option.label,
      text: option.text,
      isCorrect: option.isCorrect,
    })),
    explanation: question.explanation,
  }));
};

export const buildProcedurePlayback = (procedure: Procedure): ProcedurePlaybackUnit[] => {
  if (procedure.type === "video") {
    return (procedure.chapters ?? []).map((chapter, index, chapters) => {
      const nextTimestamp = chapters[index + 1]?.timestamp ?? Number.POSITIVE_INFINITY;
      const decisionPoint = (procedure.decisionPoints ?? []).find((item) => {
        const timestamp = item.timestamp ?? -1;
        return timestamp >= (chapter.timestamp ?? 0) && timestamp < nextTimestamp;
      });

      return {
        id: chapter.id ?? `chapter-${index + 1}`,
        title: chapter.title ? resolveLocalizedText(chapter.title, "") : undefined,
        titleFallback: {
          kind: "chapter",
          index: index + 1,
        },
        body: chapter.referenceContent?.technique,
        bodyFallback: "video",
        supportingText: decisionPoint?.stepDescription
          ? resolveLocalizedText(decisionPoint.stepDescription, "")
          : undefined,
        questionId: decisionPoint?.questionId,
        referenceContent: chapter.referenceContent,
        cue: chapter.timestamp !== undefined && chapter.timestamp > 0
          ? {
              kind: "videoTimestamp",
              seconds: chapter.timestamp,
            }
          : undefined,
      };
    });
  }

  return (procedure.steps ?? []).map((step, index) => ({
    id: step.id ?? `step-${index + 1}`,
    title: undefined,
    titleFallback: {
      kind: "step",
      index: index + 1,
    },
    body: step.narration,
    bodyFallback: "simulation",
    supportingText: step.actionDescription ? resolveLocalizedText(step.actionDescription, "") : undefined,
    questionId: step.questionId,
    referenceContent: step.referenceContent,
    cue: step.instrumentId
      ? {
          kind: "instrument",
          instrumentId: step.instrumentId,
        }
      : undefined,
  }));
};
