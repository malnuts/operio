import type { ClinicalPost } from "@/types/content";
import { clinicalPostSchema } from "@/types/content";
import { FetchError } from "@/lib/errors";
import type { NormalizedQuestion } from "@/lib/procedure-data";

export type PostManifestEntry = {
  id: string;
  field?: string;
  topic?: string;
};

export type PostLibraryItem = {
  id: string;
  title: string;
  excerpt: string;
  authorName: string;
  authorInstitution?: string;
  field?: string;
  topic?: string;
  tags: string[];
  publishDate?: string;
  hasLinkedAssessment: boolean;
};

type PostQuestionSet = {
  postId?: string;
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

const withBase = (path: string) =>
  `${import.meta.env.BASE_URL.replace(/\/$/, "")}${path}`;

const fetchJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(withBase(path));

  if (!response.ok) {
    throw new FetchError(path, response.status);
  }

  return response.json() as Promise<T>;
};

const toText = (value: unknown, fallback: string) => {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && "en" in value && typeof value.en === "string") {
    return value.en;
  }

  return fallback;
};

export const loadPostManifest = async () =>
  fetchJson<{ posts: PostManifestEntry[] }>("/data/post-manifest.json");

export const loadPostById = async (id: string) => {
  const raw = await fetchJson<unknown>(`/data/posts/${id}.json`);
  return clinicalPostSchema.parse(raw);
};

export const loadQuestionsByAssessmentId = async (assessmentId: string) =>
  fetchJson<PostQuestionSet>(`/data/questions/${assessmentId}.json`);

export const normalizePostQuestionSet = (payload: PostQuestionSet): NormalizedQuestion[] =>
  payload.questions.map((question) => ({
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

export const buildPostLibraryItems = async (): Promise<PostLibraryItem[]> => {
  const manifest = await loadPostManifest();
  const posts = await Promise.all(manifest.posts.map((entry) => loadPostById(entry.id)));

  return posts.map((post) => ({
    id: post.id,
    title: toText(post.title, post.id),
    excerpt: toText(post.excerpt, toText(post.body, "").slice(0, 160)),
    authorName: post.author.name,
    authorInstitution: post.author.institution,
    field: post.field,
    topic: post.topic,
    tags: post.tags ?? [],
    publishDate: post.publishDate,
    hasLinkedAssessment: Boolean(post.linkedAssessmentId),
  }));
};

export const formatPublishDate = (dateString?: string) => {
  if (!dateString) return undefined;

  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
};

export const getPostMeta = (item: PostLibraryItem) =>
  [item.field, item.topic, item.hasLinkedAssessment ? "Linked assessment" : undefined].filter(
    Boolean,
  ) as string[];
