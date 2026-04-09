import { z } from "zod";

// ---------------------------------------------------------------------------
// Provider configuration
// ---------------------------------------------------------------------------

export const agentProviderIdSchema = z.enum(["stub", "gemini"]);
export type AgentProviderId = z.infer<typeof agentProviderIdSchema>;

export const agentProviderConfigSchema = z.object({
  id: agentProviderIdSchema,
  model: z.string(),
  async: z.boolean().default(true),
  maxLatencyMs: z.number().default(30_000),
});
export type AgentProviderConfig = z.infer<typeof agentProviderConfigSchema>;

// ---------------------------------------------------------------------------
// Provenance — tracks how content was generated and reviewed
// ---------------------------------------------------------------------------

export const provenanceStatusSchema = z.enum([
  "pending_review",
  "approved",
  "rejected",
  "revised_by_human",
]);
export type ProvenanceStatus = z.infer<typeof provenanceStatusSchema>;

export const provenanceRecordSchema = z.object({
  id: z.string(),
  sourcePrompt: z.string(),
  generatedAt: z.string(),
  modelId: z.string(),
  providerId: agentProviderIdSchema,
  humanEdits: z.array(z.object({
    editedAt: z.string(),
    fieldPath: z.string(),
    summary: z.string(),
  })).default([]),
  status: provenanceStatusSchema.default("pending_review"),
  reviewedAt: z.string().optional(),
  reviewedBy: z.string().optional(),
});
export type ProvenanceRecord = z.infer<typeof provenanceRecordSchema>;

// ---------------------------------------------------------------------------
// Job types — the narrow set of agent capabilities
// ---------------------------------------------------------------------------

export const agentJobTypeSchema = z.enum([
  "procedure_draft",
  "assessment_draft",
  "post_draft",
]);
export type AgentJobType = z.infer<typeof agentJobTypeSchema>;

export const agentJobStatusSchema = z.enum([
  "queued",
  "running",
  "succeeded",
  "failed",
]);
export type AgentJobStatus = z.infer<typeof agentJobStatusSchema>;

// ---------------------------------------------------------------------------
// Job input schemas — structured briefs for each job type
// ---------------------------------------------------------------------------

export const procedureDraftInputSchema = z.object({
  topic: z.string().min(1),
  learningObjective: z.string().min(1),
  audienceLevel: z.enum(["Beginner", "Intermediate", "Advanced"]),
  sourceNotes: z.string().default(""),
  format: z.enum(["simulation", "video"]).default("simulation"),
});
export type ProcedureDraftInput = z.infer<typeof procedureDraftInputSchema>;

export const assessmentDraftInputSchema = z.object({
  procedureId: z.string().optional(),
  topic: z.string().min(1),
  questionCount: z.number().min(1).max(20).default(5),
  includeExplanations: z.boolean().default(true),
  includeDistractorRationale: z.boolean().default(true),
});
export type AssessmentDraftInput = z.infer<typeof assessmentDraftInputSchema>;

export const postDraftInputSchema = z.object({
  topic: z.string().min(1),
  notes: z.string().min(1),
  tags: z.array(z.string()).default([]),
  targetLength: z.enum(["short", "medium", "long"]).default("medium"),
});
export type PostDraftInput = z.infer<typeof postDraftInputSchema>;

export type AgentJobInput =
  | { type: "procedure_draft"; input: ProcedureDraftInput }
  | { type: "assessment_draft"; input: AssessmentDraftInput }
  | { type: "post_draft"; input: PostDraftInput };

// ---------------------------------------------------------------------------
// Job record — persisted per job execution
// ---------------------------------------------------------------------------

export const agentJobRecordSchema = z.object({
  id: z.string(),
  type: agentJobTypeSchema,
  status: agentJobStatusSchema,
  input: z.record(z.unknown()),
  output: z.record(z.unknown()).nullable().default(null),
  error: z.string().nullable().default(null),
  provenance: provenanceRecordSchema.nullable().default(null),
  createdAt: z.string(),
  completedAt: z.string().nullable().default(null),
});
export type AgentJobRecord = z.infer<typeof agentJobRecordSchema>;

// ---------------------------------------------------------------------------
// Acceptance criteria — testable per job type
// ---------------------------------------------------------------------------

export interface AcceptanceCriteria {
  type: AgentJobType;
  description: string;
  check: (output: Record<string, unknown>) => boolean;
}

export const procedureDraftCriteria: AcceptanceCriteria[] = [
  {
    type: "procedure_draft",
    description: "Output contains a valid title",
    check: (o) => typeof o.title === "string" && (o.title as string).length > 0,
  },
  {
    type: "procedure_draft",
    description: "Output contains a summary",
    check: (o) => typeof o.summary === "string" && (o.summary as string).length > 0,
  },
  {
    type: "procedure_draft",
    description: "Output contains at least one step or chapter",
    check: (o) => Array.isArray(o.steps) && o.steps.length > 0,
  },
  {
    type: "procedure_draft",
    description: "Output contains decision point placeholders",
    check: (o) => Array.isArray(o.decisionPoints) && o.decisionPoints.length > 0,
  },
  {
    type: "procedure_draft",
    description: "Provenance must be attached before publish",
    check: (_o, ) => true, // checked at the job record level
  },
];

export const assessmentDraftCriteria: AcceptanceCriteria[] = [
  {
    type: "assessment_draft",
    description: "Output contains at least one question",
    check: (o) => Array.isArray(o.questions) && o.questions.length > 0,
  },
  {
    type: "assessment_draft",
    description: "Each question has a stem and options",
    check: (o) =>
      Array.isArray(o.questions) &&
      (o.questions as Array<Record<string, unknown>>).every(
        (q) => typeof q.stem === "string" && Array.isArray(q.options),
      ),
  },
];

export const postDraftCriteria: AcceptanceCriteria[] = [
  {
    type: "post_draft",
    description: "Output contains a title and body",
    check: (o) =>
      typeof o.title === "string" &&
      (o.title as string).length > 0 &&
      typeof o.body === "string" &&
      (o.body as string).length > 0,
  },
];

export const allAcceptanceCriteria: AcceptanceCriteria[] = [
  ...procedureDraftCriteria,
  ...assessmentDraftCriteria,
  ...postDraftCriteria,
];

export const checkAcceptanceCriteria = (
  type: AgentJobType,
  output: Record<string, unknown>,
): { passed: boolean; results: Array<{ description: string; ok: boolean }> } => {
  const criteria = allAcceptanceCriteria.filter((c) => c.type === type);
  const results = criteria.map((c) => ({ description: c.description, ok: c.check(output) }));
  return { passed: results.every((r) => r.ok), results };
};
