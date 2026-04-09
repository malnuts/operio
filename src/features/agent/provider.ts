/**
 * Pluggable agent provider interface.
 *
 * The user will connect Gemini 2.5 Pro later. This module defines the
 * contract any provider must satisfy. A stub provider ships by default
 * for local development and testing.
 */

import type { AgentJobType, AgentProviderConfig, AgentProviderId } from "./types";

// ---------------------------------------------------------------------------
// Provider interface
// ---------------------------------------------------------------------------

export interface AgentProviderRequest {
  type: AgentJobType;
  prompt: string;
  input: Record<string, unknown>;
}

export interface AgentProviderResponse {
  output: Record<string, unknown>;
  modelId: string;
  providerId: AgentProviderId;
}

export interface AgentProvider {
  readonly id: AgentProviderId;
  readonly modelId: string;
  generate(request: AgentProviderRequest): Promise<AgentProviderResponse>;
}

// ---------------------------------------------------------------------------
// Stub provider — returns deterministic placeholder content for dev/testing
// ---------------------------------------------------------------------------

const stubProcedureDraft = (input: Record<string, unknown>) => ({
  title: `Draft: ${input.topic ?? "Untitled procedure"}`,
  summary: `AI-generated procedure draft for ${input.topic ?? "the requested topic"}. Objective: ${input.learningObjective ?? "not specified"}.`,
  type: input.format ?? "simulation",
  difficulty: input.audienceLevel ?? "Intermediate",
  steps: [
    {
      id: "step-1",
      narration: "Review the clinical scenario and assess the patient presentation.",
      actionDescription: "Initial assessment",
      referenceContent: { technique: "Perform a systematic evaluation before beginning the procedure." },
    },
    {
      id: "step-2",
      narration: "Prepare the necessary instruments and materials for the procedure.",
      actionDescription: "Instrument preparation",
      referenceContent: { technique: "Verify all instruments are sterile and in working order." },
    },
    {
      id: "step-3",
      narration: "Execute the primary procedural step with appropriate technique.",
      actionDescription: "Primary procedure execution",
      isDecisionPoint: true,
      questionId: "dp-q1",
      referenceContent: { technique: "Maintain steady hand positioning and follow established protocols." },
    },
    {
      id: "step-4",
      narration: "Complete the procedure and verify the outcome.",
      actionDescription: "Completion and verification",
      referenceContent: { technique: "Inspect the result and document findings." },
    },
  ],
  decisionPoints: [
    { questionId: "dp-q1", stepId: "step-3", prompt: "What is the most appropriate technique for this step?" },
  ],
  referenceNotes: "This is an AI-generated draft. All clinical content must be reviewed and verified by a qualified professional before publishing.",
});

const stubAssessmentDraft = (input: Record<string, unknown>) => {
  const count = Math.min(Number(input.questionCount) || 3, 5);
  return {
    procedureId: input.procedureId ?? undefined,
    questions: Array.from({ length: count }, (_, i) => ({
      id: `draft-q${i + 1}`,
      stem: `[Draft question ${i + 1}] Regarding ${input.topic ?? "the topic"}, which of the following is most accurate?`,
      options: [
        { label: "A", text: "[Option A — replace with clinical content]", isCorrect: false },
        { label: "B", text: "[Option B — replace with correct answer]", isCorrect: true },
        { label: "C", text: "[Option C — replace with clinical content]", isCorrect: false },
        { label: "D", text: "[Option D — replace with clinical content]", isCorrect: false },
      ],
      explanation: input.includeExplanations !== false
        ? {
            correctReasoning: "[Explain why B is the correct answer]",
            distractorBreakdowns: input.includeDistractorRationale !== false
              ? [
                  { label: "A", reasoning: "[Why A is incorrect]" },
                  { label: "C", reasoning: "[Why C is incorrect]" },
                  { label: "D", reasoning: "[Why D is incorrect]" },
                ]
              : undefined,
            clinicalPrinciple: "[State the clinical principle being tested]",
          }
        : undefined,
    })),
  };
};

const stubPostDraft = (input: Record<string, unknown>) => ({
  title: `Draft: ${input.topic ?? "Untitled post"}`,
  body: `This is an AI-generated clinical post draft based on the following notes:\n\n${input.notes ?? "(no notes provided)"}\n\nThis content requires expert review before publishing.`,
  tags: Array.isArray(input.tags) ? input.tags : [],
  excerpt: `A clinical post about ${input.topic ?? "the requested topic"}.`,
});

const stubChatReply = (input: Record<string, unknown>): Record<string, unknown> => {
  const context = input.context as Record<string, unknown> | undefined;
  const page = context?.page ?? "unknown";
  const role = context?.role ?? "learner";
  const contentTitle = context?.contentTitle ?? "the current content";

  if (role === "creator") {
    return {
      reply: `[Stub assistant] I can help you improve "${contentTitle}". As a creator on the ${page} page, I can assist with rewriting content, suggesting structure improvements, drafting assessment questions, and checking for quality issues. What would you like help with?`,
    };
  }

  const step = context?.currentStep as Record<string, unknown> | undefined;
  if (step) {
    return {
      reply: `[Stub assistant] You're on step ${(step.index as number) + 1} of ${step.total}: "${step.actionDescription ?? step.narration}". I can explain the clinical reasoning behind this step, discuss alternative approaches, or quiz you on the concepts involved. What would you like to know?`,
    };
  }

  return {
    reply: `[Stub assistant] I'm your learning assistant for "${contentTitle}". I can explain concepts, help you understand procedures, quiz you on what you've learned, and clarify anything you're unsure about. What can I help with?`,
  };
};

export class StubProvider implements AgentProvider {
  readonly id = "stub" as const;
  readonly modelId = "stub-v1";

  async generate(request: AgentProviderRequest): Promise<AgentProviderResponse> {
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 300));

    let output: Record<string, unknown>;
    switch (request.type) {
      case "procedure_draft":
        output = stubProcedureDraft(request.input);
        break;
      case "assessment_draft":
        output = stubAssessmentDraft(request.input);
        break;
      case "post_draft":
        output = stubPostDraft(request.input);
        break;
      default:
        // Chat and any future types
        output = stubChatReply(request.input);
        break;
    }

    return { output, modelId: this.modelId, providerId: this.id };
  }
}

// ---------------------------------------------------------------------------
// Provider registry
// ---------------------------------------------------------------------------

const providers = new Map<AgentProviderId, AgentProvider>();
providers.set("stub", new StubProvider());

let activeProviderId: AgentProviderId = "stub";

export const registerProvider = (provider: AgentProvider): void => {
  providers.set(provider.id, provider);
  activeProviderId = provider.id;
};

export const getProvider = (id?: AgentProviderId): AgentProvider => {
  const provider = providers.get(id ?? activeProviderId);
  if (!provider) {
    throw new Error(`Agent provider "${id}" is not registered.`);
  }
  return provider;
};

export const getActiveProviderConfig = (): AgentProviderConfig => ({
  id: activeProviderId,
  model: providers.get(activeProviderId)?.modelId ?? "stub-v1",
  async: true,
  maxLatencyMs: 30_000,
});
