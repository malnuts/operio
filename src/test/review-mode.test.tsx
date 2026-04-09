import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import enLocale from "../../public/locales/en.json";

import App from "@/App";
import {
  LEARNER_PROGRESS_STORAGE_KEY,
  createEmptyLearnerProgress,
  recordAssessmentAttempt,
  saveLearnerProgress,
} from "@/lib/learner-progress";

const questionPayload = {
  procedureId: "cavity-filling",
  questions: [
    {
      id: "cf-q1",
      stem: "Which restoration is most appropriate?",
      options: [
        { label: "A", text: "Observe", isCorrect: false },
        { label: "B", text: "Composite restoration", isCorrect: true },
      ],
      explanation: {
        correctReasoning: "A cavitated lesion should be restored.",
        clinicalPrinciple: "Restore once the lesion is cavitated.",
      },
    },
    {
      id: "cf-q2",
      stem: "Which liner is indicated here?",
      options: [
        { label: "A", text: "No liner", isCorrect: true },
        { label: "B", text: "Routine zinc phosphate", isCorrect: false },
      ],
      explanation: {
        correctReasoning: "A routine liner is not always necessary in shallow preparations.",
        boardTip: "Match the material choice to the depth and pulpal risk.",
      },
    },
  ],
};

describe("review mode", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.pushState({}, "", "/");

    const seeded = recordAssessmentAttempt(
      recordAssessmentAttempt(createEmptyLearnerProgress(), {
        questionId: "cf-q1",
        contentId: "cavity-filling",
        contentType: "procedure",
        selectedOption: "A",
        isCorrect: false,
        answeredAt: "2026-04-04T10:00:00.000Z",
      }),
      {
        questionId: "cf-q2",
        contentId: "cavity-filling",
        contentType: "procedure",
        selectedOption: "A",
        isCorrect: true,
        answeredAt: "2026-04-04T10:05:00.000Z",
      },
    );

    saveLearnerProgress(seeded);

    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const path = String(input);

        if (path.includes("/locales/manifest.json")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ languages: [{ code: "en", label: "English" }] }),
          });
        }

        if (path.includes("/locales/en.json")) {
          return Promise.resolve({
            ok: true,
            json: async () => enLocale,
          });
        }

        if (path.includes("/data/questions/cavity-filling-questions.json")) {
          return Promise.resolve({
            ok: true,
            json: async () => questionPayload,
          });
        }

        return Promise.resolve({
          ok: false,
          json: async () => ({}),
        });
      }),
    );
  });

  it("builds standalone review sessions from learner history", async () => {
    window.history.pushState({}, "", "/app/review");
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Review" })).toBeInTheDocument();
    await waitFor(() => {
      expect(within(screen.getByText("Answered prompts").closest("div") as HTMLElement).getByText("2")).toBeInTheDocument();
      expect(within(screen.getByText("Needs repetition").closest("div") as HTMLElement).getByText("1")).toBeInTheDocument();
      expect(within(screen.getByText("Latest accuracy").closest("div") as HTMLElement).getByText("50%")).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole("button", { name: /start set/i })[0]);

    expect(await screen.findByRole("heading", { name: /retry missed questions/i })).toBeInTheDocument();
    expect(screen.getByText(/which restoration is most appropriate/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /composite restoration/i }));
    fireEvent.click(screen.getByRole("button", { name: /submit answer/i }));
    fireEvent.click(screen.getByRole("button", { name: /finish assessment/i }));

    expect(await screen.findByRole("heading", { name: /review session complete/i })).toBeInTheDocument();

    const saved = JSON.parse(window.localStorage.getItem(LEARNER_PROGRESS_STORAGE_KEY) ?? "{}");
    expect(saved.assessmentHistory[0]).toMatchObject({
      questionId: "cf-q1",
      contentId: "cavity-filling",
      contentType: "assessment",
      selectedOption: "B",
      isCorrect: true,
    });
  });
});
