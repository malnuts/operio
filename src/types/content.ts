import { z } from "zod";

export const localizedTextSchema = z.union([
  z.string(),
  z.record(z.string(), z.string()),
]);

export const contentStatusSchema = z.enum(["draft", "published", "archived"]);

export const difficultyLevelSchema = z.enum(["Beginner", "Intermediate", "Advanced"]);

export const contentVisibilitySchema = z.enum(["free", "paid", "premium"]);

export const procedureFormatSchema = z.enum(["simulation", "video"]);

export const assetKindSchema = z.enum(["image", "video", "model", "document", "audio"]);

export const authorAttributionSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  institution: z.string().optional(),
  specialty: z.string().optional(),
  photoUrl: z.string().nullable().optional(),
  procedureCount: z.number().optional(),
  rating: z.number().optional(),
});

export const contentMediaSchema = z.object({
  id: z.string().optional(),
  kind: assetKindSchema,
  url: z.string(),
  thumbnailUrl: z.string().optional(),
  alt: localizedTextSchema.optional(),
  caption: localizedTextSchema.optional(),
});

export const referenceInstrumentSchema = z.object({
  name: z.string(),
  description: z.string(),
  imageId: z.string().optional(),
});

export const referenceContentSchema = z.object({
  instrument: referenceInstrumentSchema.optional(),
  anatomy: z.string().optional(),
  technique: z.string().optional(),
});

export const modelStateSchema = z.object({
  highlight: z.array(z.string()).optional(),
  colors: z.record(z.string(), z.string()).optional(),
});

export const decisionPointSchema = z.object({
  id: z.string().optional(),
  questionId: z.string(),
  chapterId: z.string().optional(),
  stepId: z.string().optional(),
  timestamp: z.number().optional(),
  prompt: localizedTextSchema.optional(),
  stepDescription: localizedTextSchema.optional(),
});

export const procedureChapterSchema = z.object({
  id: z.string().optional(),
  title: localizedTextSchema.optional(),
  narration: z.string().optional(),
  actionDescription: localizedTextSchema.optional(),
  timestamp: z.number().optional(),
  durationSeconds: z.number().optional(),
  instrumentId: z.string().optional(),
  isDecisionPoint: z.boolean().optional(),
  questionId: z.string().optional(),
  decisionPointId: z.string().optional(),
  modelState: modelStateSchema.optional(),
  referenceContent: referenceContentSchema.optional(),
  instrumentTrayOptions: z.array(z.string()).optional(),
  media: z.array(contentMediaSchema).optional(),
});

export const platformMetadataSchema = z.object({
  contentType: z.enum(["procedure", "post", "assessment"]),
  status: contentStatusSchema.optional(),
  visibility: contentVisibilitySchema.optional(),
  locale: z.string().optional(),
  translations: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

export const domainMetadataSchema = z.object({
  domain: z.string().optional(),
  specialty: z.string().optional(),
  region: z.string().optional(),
  concepts: z.array(z.string()).optional(),
  launchDataset: z.boolean().optional(),
  clinicalCodes: z.record(z.string(), z.string()).optional(),
}).catchall(z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]));

export const procedureSchema = z.object({
  id: z.string(),
  type: procedureFormatSchema,
  title: localizedTextSchema,
  description: localizedTextSchema,
  summary: localizedTextSchema.optional(),
  difficulty: difficultyLevelSchema.optional(),
  duration: z.number().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  author: authorAttributionSchema.optional(),
  thumbnailUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  modelPath: z.string().optional(),
  cameraAngle: z.number().optional(),
  chapters: z.array(procedureChapterSchema).optional(),
  steps: z.array(procedureChapterSchema).optional(),
  decisionPoints: z.array(decisionPointSchema).optional(),
  platformMetadata: platformMetadataSchema.optional(),
  domainMetadata: domainMetadataSchema.optional(),
}).superRefine((value, ctx) => {
  if (value.type === "simulation" && !value.steps?.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Simulation procedures require a non-empty steps array.",
      path: ["steps"],
    });
  }

  if (value.type === "video" && !value.videoUrl) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Video procedures require a videoUrl.",
      path: ["videoUrl"],
    });
  }

  if (value.type === "video" && !value.chapters?.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Video procedures require a chapters array.",
      path: ["chapters"],
    });
  }
});

export const assessmentOptionSchema = z.object({
  label: z.string(),
  text: localizedTextSchema,
  isCorrect: z.boolean(),
});

export const assessmentExplanationSchema = z.object({
  correctReasoning: localizedTextSchema,
  distractorBreakdowns: z.array(z.object({
    label: z.string(),
    reasoning: localizedTextSchema,
  })).optional(),
  clinicalPrinciple: localizedTextSchema.optional(),
  boardTip: localizedTextSchema.optional(),
});

export const assessmentQuestionSchema = z.object({
  id: z.string(),
  stem: localizedTextSchema,
  options: z.array(assessmentOptionSchema).min(2),
  explanation: assessmentExplanationSchema.optional(),
  domainMetadata: domainMetadataSchema.optional(),
});

export const assessmentQuestionSetSchema = z.object({
  procedureId: z.string().optional(),
  postId: z.string().optional(),
  questions: z.array(assessmentQuestionSchema),
  platformMetadata: platformMetadataSchema.optional(),
});

export const clinicalPostSchema = z.object({
  id: z.string(),
  title: localizedTextSchema,
  excerpt: localizedTextSchema.optional(),
  body: localizedTextSchema,
  summary: localizedTextSchema.optional(),
  author: authorAttributionSchema,
  field: z.string().optional(),
  topic: z.string().optional(),
  tags: z.array(z.string()).optional(),
  publishDate: z.string().optional(),
  heroImage: contentMediaSchema.optional(),
  gallery: z.array(contentMediaSchema).optional(),
  linkedAssessmentId: z.string().optional(),
  platformMetadata: platformMetadataSchema.optional(),
  domainMetadata: domainMetadataSchema.optional(),
});

export const creatorProfileSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  bio: localizedTextSchema.optional(),
  institution: z.string().optional(),
  specialty: z.string().optional(),
  avatarUrl: z.string().optional(),
  expertise: z.array(z.string()).optional(),
  socialLinks: z.array(z.object({
    label: z.string(),
    url: z.string(),
  })).optional(),
  platformMetadata: z.object({
    verified: z.boolean().optional(),
    visibility: contentVisibilitySchema.optional(),
  }).optional(),
  domainMetadata: domainMetadataSchema.optional(),
});

export const reviewRecordSchema = z.object({
  id: z.string(),
  learnerId: z.string().optional(),
  contentId: z.string(),
  contentType: z.enum(["procedure", "post", "assessment"]),
  questionId: z.string().optional(),
  completionState: z.enum(["not_started", "in_progress", "completed", "mastered"]),
  score: z.number().optional(),
  lastReviewedAt: z.string().optional(),
  nextReviewAt: z.string().optional(),
  attempts: z.number().optional(),
  notes: localizedTextSchema.optional(),
  platformMetadata: z.object({
    source: z.enum(["local", "synced"]).optional(),
    locale: z.string().optional(),
  }).optional(),
  domainMetadata: domainMetadataSchema.optional(),
});

export type LocalizedText = z.infer<typeof localizedTextSchema>;
export type DecisionPoint = z.infer<typeof decisionPointSchema>;
export type ProcedureChapter = z.infer<typeof procedureChapterSchema>;
export type Procedure = z.infer<typeof procedureSchema>;
export type AssessmentQuestion = z.infer<typeof assessmentQuestionSchema>;
export type ClinicalPost = z.infer<typeof clinicalPostSchema>;
export type CreatorProfile = z.infer<typeof creatorProfileSchema>;
export type ReviewRecord = z.infer<typeof reviewRecordSchema>;
