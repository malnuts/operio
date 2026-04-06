import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "@/App";
import { LEARNER_PROGRESS_STORAGE_KEY, parseLearnerProgress } from "@/lib/learner-progress";

const postManifestPayload = {
  posts: [
    { id: "rubber-dam-isolation", field: "Restorative Dentistry", topic: "Isolation Techniques" },
  ],
};

const postPayload = {
  id: "rubber-dam-isolation",
  title: "Rubber Dam Isolation: Why It Still Matters",
  excerpt: "A practical overview of rubber dam placement for restorative and endodontic procedures.",
  body: "Rubber dam isolation remains one of the most underused yet impactful techniques.\n\n## Why isolate?\n\nMoisture control is critical for adhesive restorations.\n\n- Using a clamp that is too small\n- Failing to check for latex allergies\n\n## Clinical takeaway\n\nRubber dam isolation adds a few minutes to chair time but substantially improves predictability.",
  author: {
    name: "Dr. Sarah Chen",
    institution: "Pacific Dental Institute",
    specialty: "Restorative Dentistry",
  },
  field: "Restorative Dentistry",
  topic: "Isolation Techniques",
  tags: ["rubber dam", "isolation", "adhesive dentistry"],
  publishDate: "2026-03-15",
  linkedAssessmentId: "rubber-dam-isolation-questions",
};

const questionPayload = {
  postId: "rubber-dam-isolation",
  questions: [
    {
      id: "rdi-q1",
      stem: "Which of the following is the primary reason rubber dam isolation is considered the standard of care during endodontic procedures?",
      options: [
        { label: "A", text: "It improves patient comfort during long appointments.", isCorrect: false },
        { label: "B", text: "It prevents aspiration of endodontic instruments and ingestion of irrigants.", isCorrect: true },
        { label: "C", text: "It reduces the total number of radiographs needed during treatment.", isCorrect: false },
        { label: "D", text: "It eliminates the need for local anesthesia supplementation.", isCorrect: false },
      ],
      explanation: {
        correctReasoning: "Rubber dam isolation is the standard of care in endodontics primarily because it prevents aspiration or ingestion of small instruments and caustic irrigants.",
        clinicalPrinciple: "Rubber dam isolation during endodontics is a medicolegal and patient-safety standard.",
      },
    },
    {
      id: "rdi-q2",
      stem: "A clinician notices fluid leaking around the tooth despite rubber dam placement. Which of the following is the most likely cause?",
      options: [
        { label: "A", text: "The clamp was placed too far apically on the root surface.", isCorrect: false },
        { label: "B", text: "The dam edges were not inverted into the gingival sulcus.", isCorrect: true },
      ],
      explanation: {
        correctReasoning: "Failing to invert the rubber dam edges into the gingival sulcus is the most common cause of fluid leakage.",
      },
    },
  ],
};

const procedureManifestPayload = { procedures: [] };

const stubFetch = () =>
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const path = String(input);

      if (path.includes("/data/post-manifest.json")) {
        return Promise.resolve({ ok: true, json: async () => postManifestPayload });
      }

      if (path.includes("/data/posts/rubber-dam-isolation.json")) {
        return Promise.resolve({ ok: true, json: async () => postPayload });
      }

      if (path.includes("/data/questions/rubber-dam-isolation-questions.json")) {
        return Promise.resolve({ ok: true, json: async () => questionPayload });
      }

      if (path.includes("/data/procedure-manifest.json")) {
        return Promise.resolve({ ok: true, json: async () => procedureManifestPayload });
      }

      return Promise.resolve({ ok: false, json: async () => ({}) });
    }),
  );

describe("clinical posts", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.pushState({}, "", "/");
    stubFetch();
  });

  it("renders the post library with post metadata", async () => {
    window.history.pushState({}, "", "/app/posts");
    render(<App />);

    expect(await screen.findByRole("heading", { name: /read clinical posts/i })).toBeInTheDocument();
    expect(await screen.findByText("Rubber Dam Isolation: Why It Still Matters")).toBeInTheDocument();
    expect(screen.getByText("Dr. Sarah Chen")).toBeInTheDocument();
    expect(screen.getByText("Restorative Dentistry")).toBeInTheDocument();
    expect(screen.getByText("Isolation Techniques")).toBeInTheDocument();
    expect(screen.getByText("rubber dam")).toBeInTheDocument();
  });

  it("renders post detail with body content and author attribution", async () => {
    window.history.pushState({}, "", "/app/post/rubber-dam-isolation");
    render(<App />);

    expect(await screen.findByRole("heading", { level: 1, name: /rubber dam isolation/i })).toBeInTheDocument();
    expect(screen.getByText("Dr. Sarah Chen")).toBeInTheDocument();
    expect(screen.getByText(/Pacific Dental Institute/)).toBeInTheDocument();
    expect(screen.getByText(/moisture control is critical/i)).toBeInTheDocument();
    expect(screen.getByText(/why isolate/i)).toBeInTheDocument();
  });

  it("renders linked assessment and records correct answer", async () => {
    window.history.pushState({}, "", "/app/post/rubber-dam-isolation");
    render(<App />);

    expect(await screen.findByText(/primary reason rubber dam isolation/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /prevents aspiration/i }));
    fireEvent.click(screen.getByRole("button", { name: /submit answer/i }));

    expect(await screen.findByText(/correct answer recorded/i)).toBeInTheDocument();

    const saved = parseLearnerProgress(window.localStorage.getItem(LEARNER_PROGRESS_STORAGE_KEY));
    expect(saved.assessmentHistory[0]).toMatchObject({
      questionId: "rdi-q1",
      contentId: "rubber-dam-isolation",
      contentType: "post",
      selectedOption: "B",
      isCorrect: true,
    });
  });

  it("records incorrect answer and shows explanation", async () => {
    window.history.pushState({}, "", "/app/post/rubber-dam-isolation");
    render(<App />);

    expect(await screen.findByText(/primary reason rubber dam isolation/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /improves patient comfort/i }));
    fireEvent.click(screen.getByRole("button", { name: /submit answer/i }));

    expect(await screen.findByText(/answer recorded\. review the explanation below/i)).toBeInTheDocument();
    expect(screen.getByText(/prevents aspiration or ingestion/i)).toBeInTheDocument();

    const saved = parseLearnerProgress(window.localStorage.getItem(LEARNER_PROGRESS_STORAGE_KEY));
    expect(saved.assessmentHistory[0]).toMatchObject({
      questionId: "rdi-q1",
      selectedOption: "A",
      isCorrect: false,
    });
  });

  it("allows navigating to the next linked assessment question", async () => {
    window.history.pushState({}, "", "/app/post/rubber-dam-isolation");
    render(<App />);

    expect(await screen.findByText(/1 of 2/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /prevents aspiration/i }));
    fireEvent.click(screen.getByRole("button", { name: /submit answer/i }));

    await waitFor(() => expect(screen.getByText(/next question/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/next question/i));

    expect(await screen.findByText(/fluid leaking around the tooth/i)).toBeInTheDocument();
    expect(screen.getByText(/2 of 2/)).toBeInTheDocument();
  });
});
