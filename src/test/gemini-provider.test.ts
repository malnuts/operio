import { afterEach, describe, expect, it, vi } from "vitest";

import { GeminiProvider } from "@/features/agent/gemini-provider";

describe("gemini provider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses a direct Gemini API key when provided", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: "{\"title\":\"Draft title\"}" }],
            },
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const provider = new GeminiProvider({ apiKey: "test-key" });
    const response = await provider.generate({
      type: "post_draft",
      prompt: "Generate a draft",
      input: { topic: "Isolation" },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent",
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-goog-api-key": "test-key",
        }),
      }),
    );
    expect(response.providerId).toBe("gemini");
    expect(response.output.title).toBe("Draft title");
  });

  it("falls back to the worker proxy when no direct API key is configured", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        output: { title: "Worker draft" },
        modelId: "gemini-2.5-pro",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const provider = new GeminiProvider({ workerUrl: "https://worker.example" });
    const response = await provider.generate({
      type: "post_draft",
      prompt: "Generate a draft",
      input: { topic: "Isolation" },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://worker.example/generate",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(response.providerId).toBe("gemini");
    expect(response.output.title).toBe("Worker draft");
  });
});
