import { z } from "zod";

import { loadValidatedJson } from "@/lib/content-runtime";

export const visualReferenceSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  modelPath: z.string(),
  field: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const visualManifestSchema = z.object({
  references: z.array(visualReferenceSchema),
});

export type VisualReference = z.infer<typeof visualReferenceSchema>;

export const loadVisualManifest = () => loadValidatedJson("/data/visual-manifest.json", visualManifestSchema);
