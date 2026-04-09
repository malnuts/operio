import { beforeEach, describe, expect, it } from "vitest";

import {
  runSafetyCheck,
} from "@/features/agent/safety";
import {
  checkAcceptanceCriteria,
} from "@/features/agent/types";
import { runAgentJob } from "@/features/agent/runner";
import {
  AGENT_JOBS_STORAGE_KEY,
  getAgentJob,
  getReviewQueue,
  readAgentJobs,
  updateJobReviewStatus,
  addHumanEdit,
} from "@/features/agent/storage";
import {
  suggestCategory,
  suggestTags,
  runTerminologyCheck,
  validateDatasetEntry,
} from "@/features/agent/automation";
import { StubProvider, getProvider, registerProvider } from "@/features/agent/provider";

describe("agent foundation", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  // 11A — Provider and types
  it("stub provider is the default and returns structured output", async () => {
    const provider = getProvider();
    expect(provider.id).toBe("stub");
    const response = await provider.generate({
      type: "procedure_draft",
      prompt: "test",
      input: { topic: "Test Procedure", learningObjective: "Test", audienceLevel: "Beginner", format: "simulation" },
    });
    expect(response.providerId).toBe("stub");
    expect(response.output.title).toBeTruthy();
    expect(response.output.steps).toBeTruthy();
  });

  it("can register and retrieve a custom provider", () => {
    const custom = new StubProvider();
    registerProvider(custom);
    expect(getProvider("stub").id).toBe("stub");
  });

  // 11A — Provenance and acceptance criteria
  it("procedure draft output passes acceptance criteria", async () => {
    const provider = getProvider();
    const response = await provider.generate({
      type: "procedure_draft",
      prompt: "test",
      input: { topic: "Cavity Filling", learningObjective: "Learn filling", audienceLevel: "Intermediate" },
    });
    const result = checkAcceptanceCriteria("procedure_draft", response.output);
    expect(result.passed).toBe(true);
    result.results.forEach((r) => expect(r.ok).toBe(true));
  });

  it("assessment draft output passes acceptance criteria", async () => {
    const provider = getProvider();
    const response = await provider.generate({
      type: "assessment_draft",
      prompt: "test",
      input: { topic: "Anesthesia", questionCount: 3 },
    });
    const result = checkAcceptanceCriteria("assessment_draft", response.output);
    expect(result.passed).toBe(true);
  });

  it("post draft output passes acceptance criteria", async () => {
    const provider = getProvider();
    const response = await provider.generate({
      type: "post_draft",
      prompt: "test",
      input: { topic: "Rubber Dam", notes: "Key clinical notes" },
    });
    const result = checkAcceptanceCriteria("post_draft", response.output);
    expect(result.passed).toBe(true);
  });

  // 11B — Safety checks
  it("safety check passes for clean content", () => {
    const result = runSafetyCheck({ text: "The clinician typically performs this step." });
    expect(result.passed).toBe(true);
  });

  it("safety check flags absolute clinical claims", () => {
    const result = runSafetyCheck({ text: "Always prescribe amoxicillin for this condition." });
    expect(result.passed).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it("safety check flags direct medical advice", () => {
    const result = runSafetyCheck({ text: "You should take ibuprofen 600mg every 8 hours." });
    expect(result.passed).toBe(false);
  });

  // 11B — Review queue and status transitions
  it("running a job persists it with pending_review provenance", async () => {
    const job = await runAgentJob({
      type: "procedure_draft",
      input: { topic: "Extraction", learningObjective: "Learn extraction", audienceLevel: "Intermediate", sourceNotes: "", format: "simulation" },
    });
    expect(job.status).toBe("succeeded");
    expect(job.provenance?.status).toBe("pending_review");

    const stored = getAgentJob(job.id);
    expect(stored).toBeTruthy();
    expect(stored?.provenance?.status).toBe("pending_review");

    const queue = getReviewQueue();
    expect(queue.length).toBeGreaterThanOrEqual(1);
    expect(queue.some((j) => j.id === job.id)).toBe(true);
  });

  it("review status transitions: pending -> approved -> rollback", async () => {
    const job = await runAgentJob({
      type: "procedure_draft",
      input: { topic: "Root Canal", learningObjective: "Learn RCT", audienceLevel: "Advanced", sourceNotes: "", format: "simulation" },
    });

    updateJobReviewStatus(job.id, "approved");
    expect(getAgentJob(job.id)?.provenance?.status).toBe("approved");

    updateJobReviewStatus(job.id, "pending_review");
    expect(getAgentJob(job.id)?.provenance?.status).toBe("pending_review");
  });

  it("can add human edits to a job and track provenance", async () => {
    const job = await runAgentJob({
      type: "post_draft",
      input: { topic: "Pulp Capping", notes: "Clinical notes", tags: [], targetLength: "short" },
    });

    addHumanEdit(job.id, "body", "Rewrote introduction paragraph");
    const updated = getAgentJob(job.id);
    expect(updated?.provenance?.status).toBe("revised_by_human");
    expect(updated?.provenance?.humanEdits.length).toBe(1);
    expect(updated?.provenance?.humanEdits[0].fieldPath).toBe("body");
  });

  it("no publish-without-review path — jobs start as pending_review", async () => {
    const job = await runAgentJob({
      type: "assessment_draft",
      input: { topic: "Pharmacology", questionCount: 2, includeExplanations: true, includeDistractorRationale: true },
    });
    expect(job.provenance?.status).toBe("pending_review");
    // Cannot be published without explicit approval
    expect(job.provenance?.status).not.toBe("approved");
  });

  // 11C — Procedure drafter end-to-end
  it("procedure drafter produces valid schema output with provenance", async () => {
    const job = await runAgentJob({
      type: "procedure_draft",
      input: {
        topic: "Simple Extraction",
        learningObjective: "Perform a closed extraction",
        audienceLevel: "Intermediate",
        sourceNotes: "Maxillary premolar with two roots",
        format: "simulation",
      },
    });

    expect(job.status).toBe("succeeded");
    expect(job.output).toBeTruthy();
    expect(job.provenance).toBeTruthy();
    expect(job.provenance?.sourcePrompt).toContain("Simple Extraction");
    expect(job.provenance?.modelId).toBeTruthy();
    expect(job.provenance?.status).toBe("pending_review");

    // Verify output structure
    const output = job.output!;
    expect(output.title).toBeTruthy();
    expect(output.summary).toBeTruthy();
    expect(Array.isArray(output.steps)).toBe(true);
    expect(Array.isArray(output.decisionPoints)).toBe(true);
  });

  it("safe fallback on generation failure preserves the job record", async () => {
    // Register a provider that throws
    registerProvider({
      id: "stub",
      modelId: "broken",
      async generate() {
        throw new Error("Network timeout");
      },
    });

    const jobs = readAgentJobs().jobs.length;
    try {
      await runAgentJob({
        type: "procedure_draft",
        input: { topic: "Will Fail", learningObjective: "Test", audienceLevel: "Beginner", sourceNotes: "", format: "simulation" },
      });
    } catch {
      // expected
    }

    const allJobs = readAgentJobs().jobs;
    expect(allJobs.length).toBe(jobs + 1);
    const failedJob = allJobs.find((j) => j.input.topic === "Will Fail");
    expect(failedJob?.status).toBe("failed");
    expect(failedJob?.error).toContain("Network timeout");

    // Restore stub provider
    registerProvider(new StubProvider());
  });

  // 11D — Assessment and post drafters
  it("assessment drafter generates questions with explanations", async () => {
    const job = await runAgentJob({
      type: "assessment_draft",
      input: {
        topic: "Local Anesthesia",
        questionCount: 3,
        includeExplanations: true,
        includeDistractorRationale: true,
      },
    });

    expect(job.status).toBe("succeeded");
    const questions = job.output?.questions as Array<Record<string, unknown>>;
    expect(questions.length).toBe(3);
    expect(questions[0].stem).toBeTruthy();
    expect(questions[0].options).toBeTruthy();
    expect(questions[0].explanation).toBeTruthy();
  });

  it("post drafter generates title, body, and tags", async () => {
    const job = await runAgentJob({
      type: "post_draft",
      input: {
        topic: "Rubber Dam Techniques",
        notes: "Key isolation methods for composite bonding",
        tags: ["isolation", "composite"],
        targetLength: "medium",
      },
    });

    expect(job.status).toBe("succeeded");
    expect(job.output?.title).toBeTruthy();
    expect(job.output?.body).toBeTruthy();
    expect(Array.isArray(job.output?.tags)).toBe(true);
  });

  // 11E — Automation pipelines
  it("suggestCategory identifies procedure categories from text", () => {
    expect(suggestCategory("composite filling restoration")).toBe("Restorative");
    expect(suggestCategory("tooth extraction flap surgery")).toBe("Surgical");
    expect(suggestCategory("root canal obturation")).toBe("Endodontic");
  });

  it("suggestTags extracts relevant keywords", () => {
    const tags = suggestTags("This procedure involves composite filling and cavity preparation");
    expect(tags).toContain("composite");
    expect(tags).toContain("filling");
    expect(tags).toContain("cavity");
  });

  it("terminology check flags non-standard product terms", () => {
    const result = runTerminologyCheck("This quiz helps students prepare for test prep");
    expect(result.passed).toBe(false);
    expect(result.issues.length).toBeGreaterThanOrEqual(2);
  });

  it("terminology check passes for standard terms", () => {
    const result = runTerminologyCheck("This assessment helps learners reinforce clinical concepts");
    expect(result.passed).toBe(true);
  });

  it("dataset validation catches missing required fields", () => {
    const result = validateDatasetEntry(
      { id: "test", title: "Test" },
      ["id", "title", "description", "steps"],
    );
    expect(result.passed).toBe(false);
    expect(result.issues.length).toBe(2); // description and steps missing
  });

  it("dataset validation passes for complete entries", () => {
    const result = validateDatasetEntry(
      { id: "test", title: "Test", description: "A test", steps: ["step1"] },
      ["id", "title", "description", "steps"],
    );
    expect(result.passed).toBe(true);
  });
});
