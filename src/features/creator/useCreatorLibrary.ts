import { useEffect, useMemo, useState } from "react";

import {
  getCreatorLibrarySummary,
  readCreatorLibrary,
  saveCreatorLibrary,
  upsertCreatorEntry,
} from "@/features/creator/storage";
import type { CreatorEntry, CreatorLibraryState } from "@/features/creator/schema";

export const useCreatorLibrary = () => {
  const [library, setLibrary] = useState<CreatorLibraryState>(() => readCreatorLibrary());

  useEffect(() => {
    saveCreatorLibrary(library);
  }, [library]);

  const summary = useMemo(() => getCreatorLibrarySummary(library), [library]);

  return {
    library,
    entries: library.entries,
    drafts: library.entries.filter((entry) => entry.status === "draft"),
    published: library.entries.filter((entry) => entry.status === "published"),
    summary,
    saveEntry: (entry: CreatorEntry) => {
      setLibrary((current) => {
        const next = upsertCreatorEntry(current, entry);
        saveCreatorLibrary(next);
        return next;
      });
    },
    getEntry: (id: string) => library.entries.find((entry) => entry.id === id) ?? null,
  };
};

export { CREATOR_LIBRARY_STORAGE_KEY } from "@/features/creator/storage";
