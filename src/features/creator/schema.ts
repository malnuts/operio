import { z } from "zod";

import { contentVisibilitySchema } from "@/types/content";

export const creatorContentKindSchema = z.enum(["procedure", "post"]);
export const creatorPublicationStatusSchema = z.enum(["draft", "published"]);

const requiredText = z.string().trim().min(1);
const nonEmptyList = z.array(requiredText).min(1);

export const creatorProcedureInputSchema = z.object({
  kind: z.literal("procedure"),
  title: requiredText,
  summary: requiredText,
  visibility: contentVisibilitySchema,
  chapters: nonEmptyList,
  media: nonEmptyList,
  decisionPoints: nonEmptyList,
  references: nonEmptyList,
});

export const creatorPostInputSchema = z.object({
  kind: z.literal("post"),
  title: requiredText,
  body: requiredText,
  visibility: contentVisibilitySchema,
  photos: nonEmptyList,
  tags: nonEmptyList,
  linkedAssessmentId: z.string().trim().optional(),
});

const creatorEntryBaseSchema = z.object({
  id: z.string(),
  title: requiredText,
  visibility: contentVisibilitySchema,
  status: creatorPublicationStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const creatorProcedureEntrySchema = creatorEntryBaseSchema.extend({
  kind: z.literal("procedure"),
  summary: requiredText,
  chapters: nonEmptyList,
  media: nonEmptyList,
  decisionPoints: nonEmptyList,
  references: nonEmptyList,
});

export const creatorPostEntrySchema = creatorEntryBaseSchema.extend({
  kind: z.literal("post"),
  body: requiredText,
  photos: nonEmptyList,
  tags: nonEmptyList,
  linkedAssessmentId: z.string().trim().optional(),
});

export const creatorEntrySchema = z.discriminatedUnion("kind", [
  creatorProcedureEntrySchema,
  creatorPostEntrySchema,
]);

export const creatorLibraryStateSchema = z.object({
  entries: z.array(creatorEntrySchema),
});

export type CreatorContentKind = z.infer<typeof creatorContentKindSchema>;
export type CreatorPublicationStatus = z.infer<typeof creatorPublicationStatusSchema>;
export type CreatorProcedureInput = z.infer<typeof creatorProcedureInputSchema>;
export type CreatorPostInput = z.infer<typeof creatorPostInputSchema>;
export type CreatorContentInput = CreatorProcedureInput | CreatorPostInput;
export type CreatorProcedureEntry = z.infer<typeof creatorProcedureEntrySchema>;
export type CreatorPostEntry = z.infer<typeof creatorPostEntrySchema>;
export type CreatorEntry = z.infer<typeof creatorEntrySchema>;
export type CreatorLibraryState = z.infer<typeof creatorLibraryStateSchema>;
