import type { ContentVisibility } from "@/types/content";

export const contentVisibilityOrder: ContentVisibility[] = ["free", "paid", "premium"];

export const normalizeContentVisibility = (
  visibility?: ContentVisibility | null,
): ContentVisibility => visibility ?? "free";

export const getAccessBadgeClassName = (visibility: ContentVisibility) => {
  switch (visibility) {
    case "free":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "paid":
      return "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300";
    case "premium":
      return "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300";
  }
};

export const getAccessSurfaceClassName = (visibility: ContentVisibility) => {
  switch (visibility) {
    case "free":
      return "border-emerald-500/20 bg-emerald-500/5";
    case "paid":
      return "border-sky-500/20 bg-sky-500/5";
    case "premium":
      return "border-amber-500/20 bg-amber-500/5";
  }
};
