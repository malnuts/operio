import {
  creatorEntrySchema,
  creatorLibraryStateSchema,
  type CreatorContentInput,
  type CreatorEntry,
  type CreatorLibraryState,
  type CreatorPublicationStatus,
} from "@/features/creator/schema";

export const CREATOR_LIBRARY_STORAGE_KEY = "operio.creator-library";

export const createEmptyCreatorLibrary = (): CreatorLibraryState => ({
  entries: [],
});

const sortEntries = (entries: CreatorEntry[]) =>
  [...entries].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

export const parseCreatorLibrary = (value: string | null): CreatorLibraryState => {
  if (!value) {
    return createEmptyCreatorLibrary();
  }

  try {
    const parsed = creatorLibraryStateSchema.safeParse(JSON.parse(value));
    if (!parsed.success) {
      return createEmptyCreatorLibrary();
    }

    return {
      entries: sortEntries(parsed.data.entries),
    };
  } catch {
    return createEmptyCreatorLibrary();
  }
};

export const readCreatorLibrary = (): CreatorLibraryState => {
  if (typeof window === "undefined") {
    return createEmptyCreatorLibrary();
  }

  return parseCreatorLibrary(window.localStorage.getItem(CREATOR_LIBRARY_STORAGE_KEY));
};

export const saveCreatorLibrary = (value: CreatorLibraryState) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CREATOR_LIBRARY_STORAGE_KEY, JSON.stringify(value));
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40) || "content";

export const buildCreatorEntry = (
  input: CreatorContentInput,
  status: CreatorPublicationStatus,
  existing?: CreatorEntry | null,
): CreatorEntry => {
  const now = new Date().toISOString();
  const base = {
    id: existing?.id ?? `${input.kind}-${slugify(input.title)}-${Date.now().toString(36)}`,
    title: input.title,
    visibility: input.visibility,
    status,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const entry = input.kind === "procedure"
    ? {
        ...base,
        kind: "procedure" as const,
        summary: input.summary,
        chapters: input.chapters,
        media: input.media,
        decisionPoints: input.decisionPoints,
        references: input.references,
      }
    : {
        ...base,
        kind: "post" as const,
        body: input.body,
        photos: input.photos,
        tags: input.tags,
        linkedAssessmentId: input.linkedAssessmentId,
      };

  return creatorEntrySchema.parse(entry);
};

export const upsertCreatorEntry = (
  state: CreatorLibraryState,
  entry: CreatorEntry,
): CreatorLibraryState => ({
  entries: sortEntries([
    entry,
    ...state.entries.filter((current) => current.id !== entry.id),
  ]),
});

export const getCreatorLibrarySummary = (state: CreatorLibraryState) => ({
  total: state.entries.length,
  drafts: state.entries.filter((entry) => entry.status === "draft").length,
  published: state.entries.filter((entry) => entry.status === "published").length,
  procedures: state.entries.filter((entry) => entry.kind === "procedure").length,
  posts: state.entries.filter((entry) => entry.kind === "post").length,
  recentEntry: state.entries[0] ?? null,
});
