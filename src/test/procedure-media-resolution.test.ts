import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildProcedureLibraryItems,
  loadProcedureById,
  resolveProcedureMedia,
} from "@/lib/procedure-data";
import type { Procedure } from "@/types/content";

const procedurePayload: Procedure = {
  id: "video-demo",
  type: "video",
  title: "Video Demo",
  description: "A sample procedure used to verify media URL resolution.",
  videoUrl: "/videos/procedures/video-demo.mp4",
  thumbnailUrl: "/videos/thumbnails/video-demo.jpg",
  chapters: [
    {
      id: "chapter-1",
      title: "Access",
      timestamp: 0,
      media: [
        {
          kind: "image",
          url: "/images/procedures/video-demo-still.jpg",
          thumbnailUrl: "/images/procedures/video-demo-still-thumb.jpg",
          alt: "Procedure still",
        },
      ],
    },
  ],
};

const manifestPayload = {
  procedures: [
    {
      id: "video-demo",
      type: "video" as const,
    },
  ],
};

const stubProcedureFetch = () => {
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

      if (path.includes("/data/procedures/video-demo.json")) {
        return Promise.resolve({
          ok: true,
          json: async () => procedurePayload,
        });
      }

      return Promise.resolve({
        ok: false,
        json: async () => ({}),
      });
    }),
  );
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("procedure media resolution", () => {
  it("uses the default Cloudflare base for procedure media by default", () => {
    const resolved = resolveProcedureMedia(procedurePayload);

    expect(resolved.videoUrl).toBe("https://pub-8e3c30b5230f4f26bef002809026aaa8.r2.dev/assets/video-demo.mp4");
    expect(resolved.thumbnailUrl).toBe("https://pub-8e3c30b5230f4f26bef002809026aaa8.r2.dev/assets/video-demo.jpg");
    expect(resolved.chapters?.[0]?.media?.[0]?.url).toBe(
      "https://pub-8e3c30b5230f4f26bef002809026aaa8.r2.dev/assets/video-demo-still.jpg",
    );
  });

  it("keeps local procedure media paths only when the explicit local-assets flag is enabled", () => {
    vi.stubEnv("VITE_USE_LOCAL_ASSETS", "true");

    const resolved = resolveProcedureMedia(procedurePayload);

    expect(resolved.videoUrl).toBe("/videos/procedures/video-demo.mp4");
    expect(resolved.thumbnailUrl).toBe("/videos/thumbnails/video-demo.jpg");
    expect(resolved.chapters?.[0]?.media?.[0]?.url).toBe("/images/procedures/video-demo-still.jpg");
    expect(resolved.chapters?.[0]?.media?.[0]?.thumbnailUrl).toBe(
      "/images/procedures/video-demo-still-thumb.jpg",
    );
  });

  it("resolves procedure detail media through the configured public R2 base", async () => {
    vi.stubEnv("VITE_R2_PUBLIC_BASE_URL", "https://pub-abc.r2.dev");
    vi.stubEnv("VITE_R2_FLATTEN_KEYS", "false");
    stubProcedureFetch();

    const procedure = await loadProcedureById("video-demo");

    expect(procedure.videoUrl).toBe("https://pub-abc.r2.dev/videos/procedures/video-demo.mp4");
    expect(procedure.thumbnailUrl).toBe("https://pub-abc.r2.dev/videos/thumbnails/video-demo.jpg");
    expect(procedure.chapters?.[0]?.media?.[0]?.url).toBe(
      "https://pub-abc.r2.dev/images/procedures/video-demo-still.jpg",
    );
  });

  it("resolves procedure library thumbnails through the shared media helper", async () => {
    vi.stubEnv("VITE_R2_PUBLIC_BASE_URL", "https://pub-abc.r2.dev");
    vi.stubEnv("VITE_R2_FLATTEN_KEYS", "false");
    stubProcedureFetch();

    const items = await buildProcedureLibraryItems();

    expect(items[0]?.thumbnailUrl).toBe("https://pub-abc.r2.dev/videos/thumbnails/video-demo.jpg");
  });

  it("supports flattened R2 key mapping for procedure media assets", () => {
    vi.stubEnv("VITE_R2_PUBLIC_BASE_URL", "https://pub-abc.r2.dev");
    vi.stubEnv("VITE_R2_FLATTEN_KEYS", "true");

    const resolved = resolveProcedureMedia(procedurePayload);

    expect(resolved.videoUrl).toBe("https://pub-abc.r2.dev/assets/video-demo.mp4");
    expect(resolved.thumbnailUrl).toBe("https://pub-abc.r2.dev/assets/video-demo.jpg");
    expect(resolved.chapters?.[0]?.media?.[0]?.url).toBe(
      "https://pub-abc.r2.dev/assets/video-demo-still.jpg",
    );
  });
});
