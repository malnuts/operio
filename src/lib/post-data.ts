import { z } from "zod";

import { normalizeContentVisibility } from "@/lib/content-access";
import { loadValidatedJson, resolveLocalizedText } from "@/lib/content-runtime";
import type { NormalizedQuestion } from "@/lib/procedure-data";
import type { ClinicalPost, ContentVisibility } from "@/types/content";
import { assessmentQuestionSetSchema, clinicalPostSchema } from "@/types/content";

const postManifestEntrySchema = z.object({
  id: z.string(),
  field: z.string().optional(),
  topic: z.string().optional(),
});

const postManifestSchema = z.object({
  posts: z.array(postManifestEntrySchema),
});

export type PostManifestEntry = z.infer<typeof postManifestEntrySchema>;

export type PostLibraryItem = {
  id: string;
  title: string;
  excerpt: string;
  visibility: ContentVisibility;
  authorName: string;
  authorInstitution?: string;
  field?: string;
  topic?: string;
  tags: string[];
  publishDate?: string;
  hasLinkedAssessment: boolean;
};

type PostQuestionSet = z.infer<typeof assessmentQuestionSetSchema>;

export const loadPostManifest = async () =>
  loadValidatedJson("/data/post-manifest.json", postManifestSchema);

export const loadPostById = async (id: string) => {
  return loadValidatedJson(`/data/posts/${id}.json`, clinicalPostSchema);
};

export const loadQuestionsByAssessmentId = async (assessmentId: string) =>
  loadValidatedJson(`/data/questions/${assessmentId}.json`, assessmentQuestionSetSchema);

export const normalizePostQuestionSet = (payload: PostQuestionSet): NormalizedQuestion[] =>
  payload.questions.map((question) => ({
    id: question.id,
    stem: resolveLocalizedText(question.stem, question.id),
    options: question.options.map((option) => ({
      id: option.label.toLowerCase(),
      label: option.label,
      text: resolveLocalizedText(option.text, option.label),
      isCorrect: option.isCorrect,
    })),
    explanation: question.explanation
      ? {
          correctReasoning: question.explanation.correctReasoning
            ? resolveLocalizedText(question.explanation.correctReasoning, "")
            : undefined,
          distractorBreakdowns: question.explanation.distractorBreakdowns?.map((item) => ({
            label: item.label,
            reasoning: resolveLocalizedText(item.reasoning, ""),
          })),
          clinicalPrinciple: question.explanation.clinicalPrinciple
            ? resolveLocalizedText(question.explanation.clinicalPrinciple, "")
            : undefined,
          boardTip: question.explanation.boardTip
            ? resolveLocalizedText(question.explanation.boardTip, "")
            : undefined,
        }
      : undefined,
  }));

export const buildPostLibraryItems = async (): Promise<PostLibraryItem[]> => {
  const manifest = await loadPostManifest();
  const posts = await Promise.all(manifest.posts.map((entry) => loadPostById(entry.id)));

  return posts.map((post) => ({
    id: post.id,
    title: resolveLocalizedText(post.title, post.id),
    excerpt: resolveLocalizedText(post.excerpt, resolveLocalizedText(post.body, "").slice(0, 160)),
    visibility: normalizeContentVisibility(post.platformMetadata?.visibility),
    authorName: post.author.name,
    authorInstitution: post.author.institution,
    field: post.field,
    topic: post.topic,
    tags: post.tags ?? [],
    publishDate: post.publishDate,
    hasLinkedAssessment: Boolean(post.linkedAssessmentId),
  }));
};

export const formatPublishDate = (dateString?: string, locale = "en-US") => {
  if (!dateString) return undefined;

  try {
    return new Date(dateString).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
};
