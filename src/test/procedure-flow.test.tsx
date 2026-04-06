import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "@/App";
import { LEARNER_PROGRESS_STORAGE_KEY, parseLearnerProgress } from "@/lib/learner-progress";

const manifestPayload = {
  procedures: [
    {
      id: "cavity-filling",
      type: "simulation",
    },
  ],
};

const procedurePayload = {
  id: "cavity-filling",
  type: "simulation",
  title: "Cavity Filling",
  description: "Restore a posterior tooth with composite resin.",
  difficulty: "Beginner",
  duration: 20,
  author: {
    name: "Dr. Ada Patel",
    institution: "Operio Lab",
  },
  tags: ["composite", "posterior"],
  steps: [
    {
      id: "step-1",
      narration: "Review the radiograph and confirm the diagnosis.",
      actionDescription: "Diagnosis and access planning",
      questionId: "cf-q1",
      referenceContent: {
        anatomy: "Enamel and dentin findings guide the access plan.",
        technique: "Confirm cavitation before operative intervention.",
      },
    },
    {
      id: "step-2",
      narration: "Shape the preparation and clean remaining caries.",
      actionDescription: "Preparation refinement",
      referenceContent: {
        technique: "Maintain rounded internal line angles.",
      },
    },
  ],
};

const questionPayload = {
  procedureId: "cavity-filling",
  questions: [
    {
      id: "cf-q1",
      stem: "What is the most appropriate treatment?",
      options: [
        { label: "A", text: "Monitor only", isCorrect: false },
        { label: "B", text: "Restore with composite", isCorrect: true },
      ],
      explanation: {
        correctReasoning: "A cavitated dentin lesion should be restored.",
        clinicalPrinciple: "Operative care is indicated once cavitation is established.",
        boardTip: "Commit to the intervention once the lesion is cavitated into dentin.",
        distractorBreakdowns: [
          {
            label: "A",
            reasoning: "Observation alone is no longer the best choice after confirmed cavitation.",
          },
        ],
      },
    },
  ],
};

describe("procedure experience", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.pushState({}, "", "/");

    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const path = String(input);

        if (path.includes("/data/procedure-manifest.json")) {
          return Promise.resolve({
            ok: true,
            json: async () => manifestPayload,
          });
        }

        if (path.includes("/data/procedures/cavity-filling.json")) {
          return Promise.resolve({
            ok: true,
            json: async () => procedurePayload,
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

  it("renders the procedure library with procedure metadata", async () => {
    window.history.pushState({}, "", "/app/procedures");
    render(<App />);

    expect(await screen.findByRole("heading", { name: /browse procedure-based learning/i })).toBeInTheDocument();
    expect(await screen.findByText("Cavity Filling")).toBeInTheDocument();
    expect(screen.getByText("Beginner")).toBeInTheDocument();
    expect(screen.getByText("20 min")).toBeInTheDocument();
    expect(screen.getByText("Dr. Ada Patel")).toBeInTheDocument();
  });

  it("interrupts playback for decision points and records completion", async () => {
    window.history.pushState({}, "", "/app/procedure/cavity-filling");
    render(<App />);

    expect(await screen.findByText("What is the most appropriate treatment?")).toBeInTheDocument();
    expect(screen.getByText(/reference panel/i)).toBeInTheDocument();
    expect(screen.getByText(/enamel and dentin findings guide the access plan/i)).toBeInTheDocument();

    const nextButton = screen.getByRole("button", { name: /next section/i });
    expect(nextButton).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /restore with composite/i }));
    fireEvent.click(screen.getByRole("button", { name: /submit answer/i }));

    expect(await screen.findByText(/correct answer recorded/i)).toBeInTheDocument();
    expect(screen.getByText(/cavitated dentin lesion should be restored/i)).toBeInTheDocument();
    expect(screen.getByText(/commit to the intervention once the lesion is cavitated into dentin/i)).toBeInTheDocument();
    expect(screen.getByText(/observation alone is no longer the best choice/i)).toBeInTheDocument();

    await waitFor(() => expect(screen.getByRole("button", { name: /next section/i })).not.toBeDisabled());
    fireEvent.click(screen.getByRole("button", { name: /next section/i }));
    expect(await screen.findByRole("heading", { name: "Preparation refinement" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /complete procedure/i }));

    expect(await screen.findByRole("heading", { name: /procedure complete/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to review/i })).toHaveAttribute("href", "/app/review");

    const saved = parseLearnerProgress(window.localStorage.getItem(LEARNER_PROGRESS_STORAGE_KEY));
    expect(saved.procedures["cavity-filling"]?.completed).toBe(true);
    expect(saved.assessmentHistory[0]).toMatchObject({
      questionId: "cf-q1",
      selectedOption: "B",
      isCorrect: true,
    });
  });

  it("records incorrect answers and still shows the full teaching explanation", async () => {
    window.history.pushState({}, "", "/app/procedure/cavity-filling");
    render(<App />);

    expect(await screen.findByText("What is the most appropriate treatment?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /monitor only/i }));
    fireEvent.click(screen.getByRole("button", { name: /submit answer/i }));

    expect(await screen.findByText(/answer recorded\. review the explanation below/i)).toBeInTheDocument();
    expect(screen.getByText(/clinical principle/i)).toBeInTheDocument();
    expect(screen.getByText(/exam strategy/i)).toBeInTheDocument();
    expect(screen.getByText(/option breakdowns/i)).toBeInTheDocument();

    const saved = parseLearnerProgress(window.localStorage.getItem(LEARNER_PROGRESS_STORAGE_KEY));
    expect(saved.assessmentHistory[0]).toMatchObject({
      questionId: "cf-q1",
      selectedOption: "A",
      isCorrect: false,
    });
  });
});
