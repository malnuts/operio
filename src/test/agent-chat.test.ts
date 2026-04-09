import { beforeEach, describe, expect, it } from "vitest";

import {
  buildSystemPrompt,
  CHAT_STORAGE_KEY,
  createEmptyContext,
  getSuggestedActions,
  readChatState,
  saveChatState,
  type AgentPageContext,
  type ChatMessage,
} from "@/features/agent/chat-context";
import { StubProvider, registerProvider } from "@/features/agent/provider";

describe("agent chat context", () => {
  beforeEach(() => {
    window.localStorage.clear();
    registerProvider(new StubProvider());
  });

  // 12.1 — Context model captures page state
  it("captures procedure step state in context", () => {
    const ctx: AgentPageContext = {
      role: "learner",
      page: "procedure",
      contentId: "cavity-filling",
      contentType: "procedure",
      contentTitle: "Cavity Filling",
      procedureType: "simulation",
      currentStep: {
        id: "step-3",
        narration: "Apply the composite material in layers.",
        actionDescription: "Composite layering",
        index: 2,
        total: 6,
      },
      referenceContent: {
        anatomy: "Dentin and enamel layers",
        technique: "Incremental layering to reduce shrinkage",
        instrument: "Composite placement instrument",
      },
    };
    // Context should be fully populated
    expect(ctx.contentId).toBe("cavity-filling");
    expect(ctx.currentStep?.index).toBe(2);
    expect(ctx.referenceContent?.anatomy).toBeTruthy();
  });

  it("captures creator editor state in context", () => {
    const ctx: AgentPageContext = {
      role: "creator",
      page: "creator-editor",
      contentType: "procedure",
      contentTitle: "Root Canal Treatment",
      creatorDraft: {
        kind: "procedure",
        title: "Root Canal Treatment",
        status: "draft",
      },
    };
    expect(ctx.creatorDraft?.kind).toBe("procedure");
    expect(ctx.creatorDraft?.status).toBe("draft");
  });

  it("creates empty context with defaults", () => {
    const ctx = createEmptyContext();
    expect(ctx.role).toBe("learner");
    expect(ctx.page).toBe("home");
    expect(ctx.contentId).toBeUndefined();
  });

  // 12.5 — Suggested actions change based on page and role
  it("returns learner procedure actions when on procedure with step", () => {
    const actions = getSuggestedActions({
      role: "learner",
      page: "procedure",
      currentStep: { id: "s1", narration: "test", index: 0, total: 3 },
    });
    const keys = actions.map((a) => a.labelKey);
    expect(keys).toContain("agent.chat.action.explainStep");
    expect(keys).toContain("agent.chat.action.whyInstrument");
    expect(keys).toContain("agent.chat.action.quizMe");
  });

  it("returns learner procedure overview actions when no step active", () => {
    const actions = getSuggestedActions({
      role: "learner",
      page: "procedure",
    });
    const keys = actions.map((a) => a.labelKey);
    expect(keys).toContain("agent.chat.action.overviewProcedure");
    expect(keys).not.toContain("agent.chat.action.explainStep");
  });

  it("returns question-specific actions when a question is active", () => {
    const actions = getSuggestedActions({
      role: "learner",
      page: "procedure",
      currentQuestion: { id: "q1", stem: "Which instrument?" },
    });
    const keys = actions.map((a) => a.labelKey);
    expect(keys).toContain("agent.chat.action.explainQuestion");
    expect(keys).toContain("agent.chat.action.clinicalPrinciple");
  });

  it("returns post actions for learner on post page", () => {
    const actions = getSuggestedActions({
      role: "learner",
      page: "post",
      contentTitle: "Rubber Dam Isolation",
    });
    const keys = actions.map((a) => a.labelKey);
    expect(keys).toContain("agent.chat.action.summarizePost");
    expect(keys).toContain("agent.chat.action.explainConcept");
  });

  it("returns review actions for learner on review page", () => {
    const actions = getSuggestedActions({
      role: "learner",
      page: "review",
    });
    const keys = actions.map((a) => a.labelKey);
    expect(keys).toContain("agent.chat.action.explainMistakes");
    expect(keys).toContain("agent.chat.action.weakAreas");
  });

  it("returns creator editor actions", () => {
    const actions = getSuggestedActions({
      role: "creator",
      page: "creator-editor",
    });
    const keys = actions.map((a) => a.labelKey);
    expect(keys).toContain("agent.chat.action.rewriteForAudience");
    expect(keys).toContain("agent.chat.action.draftQuestions");
  });

  it("returns creator review queue actions", () => {
    const actions = getSuggestedActions({
      role: "creator",
      page: "agent-review",
    });
    const keys = actions.map((a) => a.labelKey);
    expect(keys).toContain("agent.chat.action.summarizeChanges");
    expect(keys).toContain("agent.chat.action.safetyCheck");
  });

  it("returns home actions for learner", () => {
    const actions = getSuggestedActions({
      role: "learner",
      page: "home",
    });
    const keys = actions.map((a) => a.labelKey);
    expect(keys).toContain("agent.chat.action.whatToStudy");
  });

  it("returns empty actions for pages without rules", () => {
    const actions = getSuggestedActions({
      role: "learner",
      page: "pricing",
    });
    expect(actions).toHaveLength(0);
  });

  // 12.4 — System prompt includes context fields
  it("system prompt includes role and page", () => {
    const prompt = buildSystemPrompt({
      role: "learner",
      page: "procedure",
      contentTitle: "Simple Extraction",
      contentType: "procedure",
    });
    expect(prompt).toContain("learner");
    expect(prompt).toContain("procedure");
    expect(prompt).toContain("Simple Extraction");
  });

  it("system prompt includes step narration", () => {
    const prompt = buildSystemPrompt({
      role: "learner",
      page: "procedure",
      currentStep: {
        id: "s1",
        narration: "Administer local anesthesia",
        actionDescription: "Anesthesia administration",
        index: 1,
        total: 9,
      },
    });
    expect(prompt).toContain("Administer local anesthesia");
    expect(prompt).toContain("Step 2 of 9");
  });

  it("system prompt includes reference content", () => {
    const prompt = buildSystemPrompt({
      role: "learner",
      page: "procedure",
      referenceContent: {
        anatomy: "Maxillary premolar roots",
        technique: "Buccal infiltration",
        instrument: "Dental syringe",
      },
    });
    expect(prompt).toContain("Maxillary premolar roots");
    expect(prompt).toContain("Buccal infiltration");
    expect(prompt).toContain("Dental syringe");
  });

  it("system prompt includes creator draft metadata", () => {
    const prompt = buildSystemPrompt({
      role: "creator",
      page: "creator-editor",
      creatorDraft: { kind: "procedure", title: "New Extraction", status: "draft" },
    });
    expect(prompt).toContain("creator");
    expect(prompt).toContain("New Extraction");
    expect(prompt).toContain("draft");
  });

  // 12.8 — Safety framing in system prompt
  it("system prompt includes safety rules", () => {
    const prompt = buildSystemPrompt({ role: "learner", page: "home" });
    expect(prompt).toContain("NEVER as medical advice");
    expect(prompt).toContain("Never provide specific dosage");
    expect(prompt).toContain("hedged language");
  });

  it("system prompt includes role-specific behavior for learner", () => {
    const prompt = buildSystemPrompt({ role: "learner", page: "procedure" });
    expect(prompt).toContain("Help the learner understand");
    expect(prompt).not.toContain("Help the creator");
  });

  it("system prompt includes role-specific behavior for creator", () => {
    const prompt = buildSystemPrompt({ role: "creator", page: "creator-editor" });
    expect(prompt).toContain("Help the creator");
    expect(prompt).not.toContain("Help the learner");
  });

  // 12.2 — Chat state persistence
  it("persists and reads chat state from localStorage", () => {
    const messages: ChatMessage[] = [
      { id: "m1", role: "user", content: "Hello", timestamp: "2026-01-01T00:00:00Z" },
      { id: "m2", role: "assistant", content: "Hi there!", timestamp: "2026-01-01T00:00:01Z" },
    ];
    saveChatState({ messages, contextSnapshot: createEmptyContext() });
    const restored = readChatState();
    expect(restored.messages).toHaveLength(2);
    expect(restored.messages[0].content).toBe("Hello");
    expect(restored.messages[1].content).toBe("Hi there!");
  });

  it("returns empty state for corrupted localStorage", () => {
    window.localStorage.setItem(CHAT_STORAGE_KEY, "not-json");
    const state = readChatState();
    expect(state.messages).toHaveLength(0);
  });

  // 12.6 — Stub provider returns contextual chat responses
  it("stub provider returns context-aware chat response", async () => {
    const provider = new StubProvider();
    const response = await provider.generate({
      type: "chat" as never,
      prompt: "test",
      input: {
        context: {
          role: "learner",
          page: "procedure",
          contentTitle: "Root Canal",
          currentStep: { id: "s1", narration: "test", actionDescription: "Canal preparation", index: 2, total: 8 },
        },
      },
    });
    expect(response.output.reply).toBeTruthy();
    expect(typeof response.output.reply).toBe("string");
    expect((response.output.reply as string)).toContain("step 3 of 8");
  });

  it("stub provider returns creator-specific response", async () => {
    const provider = new StubProvider();
    const response = await provider.generate({
      type: "chat" as never,
      prompt: "test",
      input: {
        context: { role: "creator", page: "creator-editor", contentTitle: "My Procedure" },
      },
    });
    expect((response.output.reply as string)).toContain("My Procedure");
    expect((response.output.reply as string)).toContain("creator");
  });
});
