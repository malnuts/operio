import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "@/App";
import { resolveAssetUrl } from "@/lib/asset-config";

const visualManifestPayload = {
  references: [
    {
      id: "sample",
      label: "Tooth Cross Section",
      description: "Cross-sectional reference showing internal tooth anatomy layers.",
      modelPath: "/models/shared/tooth-cross-section.glb",
      field: "Dental Anatomy",
      tags: ["enamel", "dentin", "pulp"],
    },
  ],
};

const procedureManifestPayload = { procedures: [] };
const postManifestPayload = { posts: [] };

const stubFetch = () =>
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const path = String(input);

      if (path.includes("/data/visual-manifest.json")) {
        return Promise.resolve({ ok: true, json: async () => visualManifestPayload });
      }

      if (path.includes("/data/procedure-manifest.json")) {
        return Promise.resolve({ ok: true, json: async () => procedureManifestPayload });
      }

      if (path.includes("/data/post-manifest.json")) {
        return Promise.resolve({ ok: true, json: async () => postManifestPayload });
      }

      return Promise.resolve({ ok: false, json: async () => ({}) });
    }),
  );

describe("anatomy viewer", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.pushState({}, "", "/");
    stubFetch();
  });

  it("renders the anatomy page with reference metadata", async () => {
    window.history.pushState({}, "", "/app/anatomy/sample");
    render(<App />);

    expect(await screen.findByRole("heading", { level: 1, name: /tooth cross section/i })).toBeInTheDocument();
    expect(screen.getAllByText("Dental Anatomy").length).toBeGreaterThan(0);
    expect(screen.getByText("enamel")).toBeInTheDocument();
    expect(screen.getByText("dentin")).toBeInTheDocument();
  });

  it("shows the back navigation link", async () => {
    window.history.pushState({}, "", "/app/anatomy/sample");
    render(<App />);

    expect(await screen.findByRole("link", { name: /back to learner home/i })).toBeInTheDocument();
  });

  it("shows WebGL fallback in jsdom environment", async () => {
    window.history.pushState({}, "", "/app/anatomy/sample");
    render(<App />);

    // jsdom does not support WebGL, so the fallback renders instead of the canvas
    expect(await screen.findByTestId("model-viewer-fallback")).toBeInTheDocument();
    expect(screen.getByText(/3D rendering is not supported/i)).toBeInTheDocument();
  });

  it("shows error state for unknown reference id", async () => {
    window.history.pushState({}, "", "/app/anatomy/unknown-id");
    render(<App />);

    expect(await screen.findByTestId("anatomy-error")).toBeInTheDocument();
    expect(screen.getByText(/no visual reference found/i)).toBeInTheDocument();
  });

  it("shows error state when manifest fails to load", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: false, json: async () => ({}) })),
    );

    window.history.pushState({}, "", "/app/anatomy/sample");
    render(<App />);

    expect(await screen.findByTestId("anatomy-error")).toBeInTheDocument();
    expect(screen.getByText(/unable to load/i)).toBeInTheDocument();
  });
});

describe("asset URL resolution", () => {
  it("returns absolute URLs unchanged", () => {
    expect(resolveAssetUrl("https://pub-abc.r2.dev/models/tooth.glb")).toBe(
      "https://pub-abc.r2.dev/models/tooth.glb",
    );
  });

  it("prepends base URL for relative paths in local dev", () => {
    const resolved = resolveAssetUrl("/models/shared/tooth-cross-section.glb");
    expect(resolved).toMatch(/models\/shared\/tooth-cross-section\.glb$/);
  });
});
