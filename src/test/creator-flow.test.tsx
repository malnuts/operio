import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import App from "@/App";
import {
  creatorPostInputSchema,
  creatorProcedureInputSchema,
} from "@/features/creator/schema";
import {
  buildCreatorEntry,
  CREATOR_LIBRARY_STORAGE_KEY,
  parseCreatorLibrary,
} from "@/features/creator/storage";

describe("creator workflow", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.pushState({}, "", "/");
  });

  it("renders the creator workspace entry page", async () => {
    window.history.pushState({}, "", "/creator");
    render(<App />);

    expect(await screen.findByRole("heading", { name: /build structured learning content for learners/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /new procedure/i })).toHaveAttribute("href", "/creator/new?kind=procedure");
    expect(screen.getByRole("link", { name: /open creator library/i })).toHaveAttribute("href", "/creator/library");
  });

  it("creates a procedure draft with access state and stores it in the creator library", async () => {
    window.history.pushState({}, "", "/creator/new?kind=procedure");
    render(<App />);

    fireEvent.change(await screen.findByLabelText("Title"), { target: { value: "Posterior composite workflow" } });
    fireEvent.change(screen.getByLabelText("Summary"), { target: { value: "A concise restorative workflow for posterior composite treatment." } });
    fireEvent.change(screen.getByLabelText("Chapters"), { target: { value: "Assessment\nIsolation" } });
    fireEvent.change(screen.getByLabelText("Media"), { target: { value: "/videos/procedures/posterior-composite.mp4" } });
    fireEvent.change(screen.getByLabelText("Decision points"), { target: { value: "When should the wedge be placed?" } });
    fireEvent.change(screen.getByLabelText("References"), { target: { value: "Occlusal anatomy checklist" } });
    fireEvent.change(screen.getByLabelText("Access state"), { target: { value: "paid" } });
    expect(screen.getByText(/starting at \$5\/month/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /save draft/i }));

    expect(await screen.findByRole("heading", { name: /manage drafts and published creator content/i })).toBeInTheDocument();
    expect(screen.getByText("Posterior composite workflow")).toBeInTheDocument();
    expect(screen.getAllByText("Draft").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Paid").length).toBeGreaterThan(0);

    const saved = parseCreatorLibrary(window.localStorage.getItem(CREATOR_LIBRARY_STORAGE_KEY));
    expect(saved.entries[0]).toMatchObject({
      kind: "procedure",
      title: "Posterior composite workflow",
      visibility: "paid",
      status: "draft",
      chapters: ["Assessment", "Isolation"],
    });
  });

  it("blocks invalid post submission, then publishes a valid post draft", async () => {
    window.history.pushState({}, "", "/creator/new?kind=post");
    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: /^publish$/i }));
    expect(await screen.findByText(/complete the required fields before saving this creator item/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Rubber dam isolation notes" } });
    fireEvent.change(screen.getByLabelText("Body"), { target: { value: "Rubber dam isolation improves visualization, moisture control, and adhesive predictability in restorative workflows." } });
    fireEvent.change(screen.getByLabelText("Photos"), { target: { value: "/images/posts/rubber-dam-1.jpg" } });
    fireEvent.change(screen.getByLabelText("Tags"), { target: { value: "isolation, restorative" } });
    fireEvent.change(screen.getByLabelText("Linked assessment ID"), { target: { value: "rubber-dam-check" } });
    fireEvent.change(screen.getByLabelText("Access state"), { target: { value: "premium" } });
    expect(screen.getByText(/30% operio platform fee/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^publish$/i }));

    expect(await screen.findByText("Rubber dam isolation notes")).toBeInTheDocument();
    expect(screen.getAllByText("Published").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Premium").length).toBeGreaterThan(0);

    const saved = parseCreatorLibrary(window.localStorage.getItem(CREATOR_LIBRARY_STORAGE_KEY));
    expect(saved.entries[0]).toMatchObject({
      kind: "post",
      title: "Rubber dam isolation notes",
      visibility: "premium",
      status: "published",
      linkedAssessmentId: "rubber-dam-check",
    });
  });

  it("reopens stored creator content for editing from the creator library", async () => {
    const entry = buildCreatorEntry(
      {
        kind: "procedure",
        title: "Endodontic access checklist",
        summary: "A focused structure for access cavity planning.",
        visibility: "free",
        chapters: ["Case selection", "Access outline"],
        media: ["/videos/procedures/access.mp4"],
        decisionPoints: ["When should radiographic verification happen?"],
        references: ["Pulp chamber landmarks"],
      },
      "draft",
    );

    window.localStorage.setItem(CREATOR_LIBRARY_STORAGE_KEY, JSON.stringify({ entries: [entry] }));
    window.history.pushState({}, "", "/creator/library");
    render(<App />);

    fireEvent.click(await screen.findByRole("link", { name: /continue editing/i }));

    expect(await screen.findByDisplayValue("Endodontic access checklist")).toBeInTheDocument();
    expect(screen.getByDisplayValue("A focused structure for access cavity planning.")).toBeInTheDocument();
    expect(screen.getByLabelText("Access state")).toHaveValue("free");
  });
});

describe("creator schemas", () => {
  it("requires full creator procedure structure including access state", () => {
    const result = creatorProcedureInputSchema.safeParse({
      kind: "procedure",
      title: "Procedure draft",
      summary: "Summary",
      visibility: "premium",
      chapters: [],
      media: ["media-item"],
      decisionPoints: ["decision"],
      references: ["reference"],
    });

    expect(result.success).toBe(false);
  });

  it("validates clinical post drafts with premium access metadata", () => {
    const result = creatorPostInputSchema.safeParse({
      kind: "post",
      title: "Posterior isolation refresher",
      body: "Posterior isolation benefits from a predictable clamp, frame, and seal sequence.",
      visibility: "premium",
      photos: ["/images/posts/isolation.jpg"],
      tags: ["isolation", "posterior"],
      linkedAssessmentId: "isolation-review",
    });

    expect(result.success).toBe(true);
  });
});
