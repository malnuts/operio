import { resolveAssetUrl } from "@/lib/asset-config";
import type { Procedure } from "@/types/content";

export type ProcedureManifestEntry = {
  id: string;
  type: "simulation" | "video";
  duration?: number;
  thumbnailUrl?: string;
  author?: {
    name: string;
    institution?: string;
  };
};

export type ProcedureLibraryItem = {
  id: string;
  type: "simulation" | "video";
  title: string;
  description: string;
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
  title: string;
  body: string;
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
  cue?: string;
};

type LegacyQuestionSet = {
  procedureId?: string;
  questions: Array<{
    id: string;
    stem: string;
    options: Array<{ label: string; text: string; isCorrect: boolean }>;
    explanation?: {
      correctReasoning?: string;
      distractorBreakdowns?: Array<{ label: string; reasoning: string }>;
      clinicalPrinciple?: string;
      boardTip?: string;
    };
  }>;
};

type VideoQuestionSet = {
  procedureId?: string;
  questions: Array<{
    id: string;
    stem: string;
    options: Array<{ id: string; text: string }>;
    correctOptionId: string;
    explanation?: {
      correctReasoning?: string;
      distractorAnalysis?: Record<string, string>;
      clinicalPrinciple?: string;
      boardTip?: string;
    };
  }>;
};

const withBase = (path: string) =>
  `${import.meta.env.BASE_URL.replace(/\/$/, "")}${path}`;

const fetchJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(withBase(path));

  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }

  return response.json() as Promise<T>;
};

const formatDuration = (value?: number) => {
  if (!value) {
    return undefined;
  }

  if (value < 60) {
    return `${value} min`;
  }

  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
};

const isVideoQuestionSet = (payload: LegacyQuestionSet | VideoQuestionSet): payload is VideoQuestionSet =>
  Boolean(payload.questions[0] && "correctOptionId" in payload.questions[0]);

const toText = (value: unknown, fallback: string) => {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && "en" in value && typeof value.en === "string") {
    return value.en;
  }

  return fallback;
};

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
  fetchJson<{ procedures: ProcedureManifestEntry[] }>("/data/procedure-manifest.json");

export const loadProcedureById = async (id: string) =>
  resolveProcedureMedia(await fetchJson<Procedure>(`/data/procedures/${id}.json`));

export const loadQuestionsByProcedureId = async (id: string) =>
  fetchJson<LegacyQuestionSet | VideoQuestionSet>(`/data/questions/${id}-questions.json`);

export const buildProcedureLibraryItems = async (): Promise<ProcedureLibraryItem[]> => {
  const manifest = await loadProcedureManifest();
  const procedures = await Promise.all(manifest.procedures.map((item) => loadProcedureById(item.id)));

  return procedures.map((procedure) => ({
    id: procedure.id,
    type: procedure.type,
    title: toText(procedure.title, procedure.id),
    description: toText(procedure.description, ""),
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
        title: toText(chapter.title, `Chapter ${index + 1}`),
        body: chapter.referenceContent?.technique ?? "Follow the demonstrated procedure flow.",
        supportingText: decisionPoint?.stepDescription
          ? toText(decisionPoint.stepDescription, "")
          : undefined,
        questionId: decisionPoint?.questionId,
        referenceContent: chapter.referenceContent,
        cue: chapter.timestamp !== undefined && chapter.timestamp > 0
          ? `Video cue: ${chapter.timestamp}s`
          : undefined,
      };
    });
  }

  return (procedure.steps ?? []).map((step, index) => ({
    id: step.id ?? `step-${index + 1}`,
    title: `Step ${index + 1}`,
    body: step.narration ?? "Continue through the procedure.",
    supportingText: step.actionDescription ? toText(step.actionDescription, "") : undefined,
    questionId: step.questionId,
    referenceContent: step.referenceContent,
    cue: step.instrumentId ? `Primary instrument: ${step.instrumentId}` : undefined,
  }));
};

export const getProcedureMeta = (item: ProcedureLibraryItem) => [
  item.type === "video" ? "Video procedure" : "Simulation",
  item.difficulty,
  formatDuration(item.duration),
].filter(Boolean) as string[];
