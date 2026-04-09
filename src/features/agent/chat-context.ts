/**
 * Page context model and suggested action derivation for the AI chat assistant.
 *
 * Every page pushes its own context so the assistant knows what the user
 * is viewing without asking. Suggested actions are derived from context
 * rules, not hardcoded per page.
 */

// ---------------------------------------------------------------------------
// Page context — the snapshot of what the user is currently viewing
// ---------------------------------------------------------------------------

export type AgentPageRole = "learner" | "creator";

export type AgentPageType =
  | "home"
  | "procedure"
  | "procedure-library"
  | "post"
  | "post-library"
  | "anatomy"
  | "review"
  | "creator-workspace"
  | "creator-editor"
  | "creator-library"
  | "agent-draft"
  | "agent-review"
  | "pricing"
  | "landing";

export interface AgentPageContext {
  role: AgentPageRole;
  page: AgentPageType;
  contentId?: string;
  contentType?: "procedure" | "post" | "assessment";
  contentTitle?: string;
  currentStep?: {
    id: string;
    narration: string;
    actionDescription?: string;
    index: number;
    total: number;
  };
  currentChapter?: {
    title: string;
    timestamp?: number;
  };
  currentQuestion?: {
    id: string;
    stem: string;
    answeredCorrectly?: boolean;
  };
  referenceContent?: {
    anatomy?: string;
    technique?: string;
    instrument?: string;
  };
  creatorDraft?: {
    kind: string;
    title: string;
    status: string;
  };
  agentJobId?: string;
  procedureType?: "simulation" | "video";
}

const EMPTY_CONTEXT: AgentPageContext = { role: "learner", page: "home" };

export const createEmptyContext = (): AgentPageContext => ({ ...EMPTY_CONTEXT });

// ---------------------------------------------------------------------------
// Chat message types
// ---------------------------------------------------------------------------

export type ChatMessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Suggested actions — derived from page context
// ---------------------------------------------------------------------------

export interface SuggestedAction {
  labelKey: string;
  prompt: string;
}

type ActionRule = {
  match: (ctx: AgentPageContext) => boolean;
  actions: SuggestedAction[];
};

const actionRules: ActionRule[] = [
  // Learner on procedure detail
  {
    match: (ctx) => ctx.role === "learner" && ctx.page === "procedure" && Boolean(ctx.currentStep),
    actions: [
      { labelKey: "agent.chat.action.explainStep", prompt: "Explain the current step in detail." },
      { labelKey: "agent.chat.action.whyInstrument", prompt: "Why is this instrument used for this step?" },
      { labelKey: "agent.chat.action.whatIf", prompt: "What would happen if I chose a different approach?" },
      { labelKey: "agent.chat.action.quizMe", prompt: "Quiz me on the current step." },
    ],
  },
  // Learner on procedure (no step yet — overview)
  {
    match: (ctx) => ctx.role === "learner" && ctx.page === "procedure" && !ctx.currentStep,
    actions: [
      { labelKey: "agent.chat.action.overviewProcedure", prompt: "Give me an overview of this procedure." },
      { labelKey: "agent.chat.action.keyDecisions", prompt: "What are the key decision points in this procedure?" },
      { labelKey: "agent.chat.action.prerequisites", prompt: "What should I know before starting this procedure?" },
    ],
  },
  // Learner on procedure with active question
  {
    match: (ctx) => ctx.role === "learner" && ctx.page === "procedure" && Boolean(ctx.currentQuestion),
    actions: [
      { labelKey: "agent.chat.action.explainQuestion", prompt: "Help me think through this question without giving the answer." },
      { labelKey: "agent.chat.action.clinicalPrinciple", prompt: "What clinical principle is this question testing?" },
    ],
  },
  // Learner on post detail
  {
    match: (ctx) => ctx.role === "learner" && ctx.page === "post",
    actions: [
      { labelKey: "agent.chat.action.summarizePost", prompt: "Summarize the key points of this post." },
      { labelKey: "agent.chat.action.explainConcept", prompt: "Explain the main concept covered in this post." },
      { labelKey: "agent.chat.action.suggestQuestions", prompt: "What questions should I be able to answer after reading this?" },
    ],
  },
  // Learner on review mode
  {
    match: (ctx) => ctx.role === "learner" && ctx.page === "review",
    actions: [
      { labelKey: "agent.chat.action.explainMistakes", prompt: "Explain what I got wrong and why." },
      { labelKey: "agent.chat.action.similarQuestions", prompt: "Give me similar practice questions." },
      { labelKey: "agent.chat.action.weakAreas", prompt: "What are my weakest areas based on my review history?" },
    ],
  },
  // Learner on anatomy
  {
    match: (ctx) => ctx.role === "learner" && ctx.page === "anatomy",
    actions: [
      { labelKey: "agent.chat.action.describeAnatomy", prompt: "Describe the anatomy I'm viewing and its clinical significance." },
      { labelKey: "agent.chat.action.relatedProcedures", prompt: "What procedures involve this anatomical structure?" },
    ],
  },
  // Creator on editor
  {
    match: (ctx) => ctx.role === "creator" && ctx.page === "creator-editor",
    actions: [
      { labelKey: "agent.chat.action.rewriteForAudience", prompt: "Rewrite this content for a beginner audience." },
      { labelKey: "agent.chat.action.suggestDecisionPoints", prompt: "Suggest decision points for this procedure." },
      { labelKey: "agent.chat.action.checkStructure", prompt: "Check my procedure structure for completeness." },
      { labelKey: "agent.chat.action.draftQuestions", prompt: "Draft assessment questions for this content." },
    ],
  },
  // Creator on agent draft
  {
    match: (ctx) => ctx.role === "creator" && ctx.page === "agent-draft",
    actions: [
      { labelKey: "agent.chat.action.refinePrompt", prompt: "Help me write a better brief for the draft generator." },
      { labelKey: "agent.chat.action.suggestTopics", prompt: "Suggest related topics I could create content for." },
    ],
  },
  // Creator on review queue
  {
    match: (ctx) => ctx.role === "creator" && ctx.page === "agent-review",
    actions: [
      { labelKey: "agent.chat.action.summarizeChanges", prompt: "Summarize what this generated draft contains." },
      { labelKey: "agent.chat.action.safetyCheck", prompt: "Is this draft safe to approve for publishing?" },
      { labelKey: "agent.chat.action.regenerateIdea", prompt: "Suggest how to regenerate this with a different approach." },
    ],
  },
  // Learner home — general
  {
    match: (ctx) => ctx.role === "learner" && ctx.page === "home",
    actions: [
      { labelKey: "agent.chat.action.whatToStudy", prompt: "What should I study next?" },
      { labelKey: "agent.chat.action.reviewProgress", prompt: "How am I doing overall?" },
    ],
  },
];

export const getSuggestedActions = (context: AgentPageContext): SuggestedAction[] => {
  const actions: SuggestedAction[] = [];
  for (const rule of actionRules) {
    if (rule.match(context)) {
      actions.push(...rule.actions);
    }
  }
  return actions;
};

// ---------------------------------------------------------------------------
// System prompt assembly
// ---------------------------------------------------------------------------

export const buildSystemPrompt = (context: AgentPageContext): string => {
  const lines: string[] = [
    "You are a clinical learning assistant inside Operio.",
    "",
    "## Safety rules",
    "- Frame ALL responses as educational guidance, NEVER as medical advice.",
    "- Never provide specific dosage recommendations or treatment plans.",
    "- Use hedged language: 'typically', 'in most cases', 'the standard approach is'.",
    "- If asked a question outside your scope, redirect to the relevant content on screen.",
    "- Reference the specific content the user is viewing rather than general knowledge.",
    "",
    `## Current context`,
    `The user is a **${context.role}** currently on the **${context.page}** page.`,
  ];

  if (context.contentTitle) {
    lines.push(`Content: "${context.contentTitle}" (${context.contentType ?? "unknown type"})`);
  }

  if (context.contentId) {
    lines.push(`Content ID: ${context.contentId}`);
  }

  if (context.procedureType) {
    lines.push(`Procedure format: ${context.procedureType}`);
  }

  if (context.currentStep) {
    lines.push("");
    lines.push("## Active step");
    lines.push(`Step ${context.currentStep.index + 1} of ${context.currentStep.total}: ${context.currentStep.actionDescription ?? ""}`);
    lines.push(`Narration: ${context.currentStep.narration}`);
  }

  if (context.currentChapter) {
    lines.push(`Current chapter: ${context.currentChapter.title}`);
  }

  if (context.currentQuestion) {
    lines.push("");
    lines.push("## Active question");
    lines.push(`Question: ${context.currentQuestion.stem}`);
    if (context.currentQuestion.answeredCorrectly !== undefined) {
      lines.push(`User answered: ${context.currentQuestion.answeredCorrectly ? "correctly" : "incorrectly"}`);
    }
  }

  if (context.referenceContent) {
    lines.push("");
    lines.push("## Reference content on screen");
    if (context.referenceContent.anatomy) lines.push(`Anatomy: ${context.referenceContent.anatomy}`);
    if (context.referenceContent.technique) lines.push(`Technique: ${context.referenceContent.technique}`);
    if (context.referenceContent.instrument) lines.push(`Instrument: ${context.referenceContent.instrument}`);
  }

  if (context.creatorDraft) {
    lines.push("");
    lines.push("## Creator draft");
    lines.push(`Draft type: ${context.creatorDraft.kind}`);
    lines.push(`Title: ${context.creatorDraft.title}`);
    lines.push(`Status: ${context.creatorDraft.status}`);
  }

  lines.push("");
  lines.push("## Behavior");
  if (context.role === "learner") {
    lines.push("- Help the learner understand clinical concepts through the content they are viewing.");
    lines.push("- Explain, clarify, compare, and quiz. Do not do the learner's work for them.");
    lines.push("- When quizzing, guide the learner's thinking rather than revealing answers directly.");
  } else {
    lines.push("- Help the creator improve their educational content.");
    lines.push("- Suggest structural improvements, rewrite for clarity, draft supporting content.");
    lines.push("- Flag potential safety or quality issues in generated content.");
  }

  return lines.join("\n");
};

// ---------------------------------------------------------------------------
// Chat storage
// ---------------------------------------------------------------------------

export const CHAT_STORAGE_KEY = "operio.agent-chat";

export interface ChatState {
  messages: ChatMessage[];
  contextSnapshot: AgentPageContext;
}

export const createEmptyChatState = (): ChatState => ({
  messages: [],
  contextSnapshot: createEmptyContext(),
});

export const readChatState = (): ChatState => {
  if (typeof window === "undefined") return createEmptyChatState();
  try {
    const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return createEmptyChatState();
    return JSON.parse(raw) as ChatState;
  } catch {
    return createEmptyChatState();
  }
};

export const saveChatState = (state: ChatState): void => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(state));
};
