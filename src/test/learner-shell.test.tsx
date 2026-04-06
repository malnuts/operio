import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "@/App";
import {
  LEARNER_PROGRESS_STORAGE_KEY,
  createEmptyLearnerProgress,
  getLearnerProgressSummary,
  parseLearnerProgress,
  recordAssessmentAttempt,
  recordProcedureVisit,
  saveLearnerProgress,
} from "@/lib/learner-progress";

describe("learner shell", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.pushState({}, "", "/");

    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const path = String(input);

        if (path.includes("/data/post-manifest.json")) {
          return Promise.resolve({ ok: true, json: async () => ({ posts: [] }) });
        }

        if (path.includes("/data/procedure-manifest.json")) {
          return Promise.resolve({ ok: true, json: async () => ({ procedures: [] }) });
        }

        return Promise.resolve({ ok: false, json: async () => ({}) });
      }),
    );
  });

  it("renders the learner home route and navigates to learner entry points", async () => {
    window.history.pushState({}, "", "/app");
    render(<App />);

    expect(screen.getByRole("heading", { name: /study procedures first/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: /posts/i }));

    expect(
      await screen.findByRole("heading", { name: /read clinical posts/i }),
    ).toBeInTheDocument();
  });

  it("persists learner progress for procedures and assessments", () => {
    const visited = recordProcedureVisit(createEmptyLearnerProgress(), "cavity-filling", true, "2026-04-04T10:00:00.000Z");
    const updated = recordAssessmentAttempt(visited, {
      questionId: "cf-q1",
      contentId: "cavity-filling",
      contentType: "procedure",
      selectedOption: "B",
      isCorrect: true,
      answeredAt: "2026-04-04T10:05:00.000Z",
    });

    saveLearnerProgress(updated);

    const savedValue = window.localStorage.getItem(LEARNER_PROGRESS_STORAGE_KEY);
    const parsed = parseLearnerProgress(savedValue);
    const summary = getLearnerProgressSummary(parsed);

    expect(parsed.procedures["cavity-filling"]).toMatchObject({
      procedureId: "cavity-filling",
      completed: true,
    });
    expect(parsed.assessmentHistory[0]).toMatchObject({
      questionId: "cf-q1",
      selectedOption: "B",
      isCorrect: true,
    });
    expect(summary).toMatchObject({
      completedProcedures: 1,
      assessmentCount: 1,
      procedureAccuracy: 100,
    });
  });
});
