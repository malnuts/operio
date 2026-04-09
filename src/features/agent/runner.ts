/**
 * Agent job runner — orchestrates provider calls, safety checks, and storage.
 *
 * Every job follows the same pipeline:
 * 1. Build a prompt from the structured input
 * 2. Call the active provider
 * 3. Run safety checks on the output
 * 4. Attach provenance with status "pending_review"
 * 5. Persist the job record
 *
 * Safety failures mark the job as failed and include violation details.
 * Successful jobs always land in "pending_review" — there is no publish-
 * without-review path.
 */

import { AgentGenerationError, AgentSafetyError } from "./errors";
import { getProvider } from "./provider";
import { runSafetyCheck } from "./safety";
import { upsertAgentJob } from "./storage";
import type {
  AgentJobInput,
  AgentJobRecord,
  AgentJobType,
  ProvenanceRecord,
} from "./types";

const generateId = () => `job-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

const buildPrompt = (jobInput: AgentJobInput): string => {
  switch (jobInput.type) {
    case "procedure_draft":
      return [
        `Generate a structured clinical procedure draft.`,
        `Topic: ${jobInput.input.topic}`,
        `Learning objective: ${jobInput.input.learningObjective}`,
        `Audience level: ${jobInput.input.audienceLevel}`,
        `Format: ${jobInput.input.format}`,
        jobInput.input.sourceNotes ? `Source notes: ${jobInput.input.sourceNotes}` : "",
        `Output must include: title, summary, steps (with narration, actionDescription, referenceContent), and decisionPoints.`,
      ].filter(Boolean).join("\n");

    case "assessment_draft":
      return [
        `Generate a set of clinical assessment questions.`,
        `Topic: ${jobInput.input.topic}`,
        jobInput.input.procedureId ? `Linked procedure: ${jobInput.input.procedureId}` : "",
        `Question count: ${jobInput.input.questionCount}`,
        `Include explanations: ${jobInput.input.includeExplanations}`,
        `Include distractor rationale: ${jobInput.input.includeDistractorRationale}`,
        `Output must include: questions array with id, stem, options (with label, text, isCorrect), and explanation.`,
      ].filter(Boolean).join("\n");

    case "post_draft":
      return [
        `Generate a clinical post draft.`,
        `Topic: ${jobInput.input.topic}`,
        `Notes: ${jobInput.input.notes}`,
        `Tags: ${jobInput.input.tags.join(", ")}`,
        `Target length: ${jobInput.input.targetLength}`,
        `Output must include: title, body, tags, and excerpt.`,
      ].filter(Boolean).join("\n");
  }
};

export const runAgentJob = async (jobInput: AgentJobInput): Promise<AgentJobRecord> => {
  const jobId = generateId();
  const now = new Date().toISOString();

  // Mark as running
  const runningRecord: AgentJobRecord = {
    id: jobId,
    type: jobInput.type,
    status: "running",
    input: jobInput.input as unknown as Record<string, unknown>,
    output: null,
    error: null,
    provenance: null,
    createdAt: now,
    completedAt: null,
  };
  upsertAgentJob(runningRecord);

  try {
    const provider = getProvider();
    const prompt = buildPrompt(jobInput);

    const response = await provider.generate({
      type: jobInput.type,
      prompt,
      input: jobInput.input as unknown as Record<string, unknown>,
    });

    // Safety check
    const safetyResult = runSafetyCheck(response.output);
    if (!safetyResult.passed) {
      throw new AgentSafetyError(safetyResult.violations);
    }

    // Build provenance — always starts as pending_review
    const provenance: ProvenanceRecord = {
      id: `prov-${jobId}`,
      sourcePrompt: prompt,
      generatedAt: new Date().toISOString(),
      modelId: response.modelId,
      providerId: response.providerId,
      humanEdits: [],
      status: "pending_review",
    };

    const succeededRecord: AgentJobRecord = {
      ...runningRecord,
      status: "succeeded",
      output: response.output,
      provenance,
      completedAt: new Date().toISOString(),
    };
    upsertAgentJob(succeededRecord);
    return succeededRecord;
  } catch (err) {
    const errorMessage = err instanceof AgentSafetyError
      ? `Safety violations: ${err.violations.join("; ")}`
      : err instanceof Error
        ? err.message
        : "Unknown generation error";

    const failedRecord: AgentJobRecord = {
      ...runningRecord,
      status: "failed",
      error: errorMessage,
      completedAt: new Date().toISOString(),
    };
    upsertAgentJob(failedRecord);

    if (err instanceof AgentSafetyError) throw err;
    throw new AgentGenerationError(jobId, jobInput.type, errorMessage);
  }
};

export const retryAgentJob = async (
  originalJobId: string,
  jobInput: AgentJobInput,
): Promise<AgentJobRecord> => {
  // Just runs a new job — the original stays in history
  return runAgentJob(jobInput);
};

export type { AgentJobType };
