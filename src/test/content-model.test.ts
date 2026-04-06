import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  assessmentQuestionSetSchema,
  clinicalPostSchema,
  creatorProfileSchema,
  procedureSchema,
  reviewRecordSchema,
} from "@/types/content";

const readJson = (relativePath: string) =>
  JSON.parse(readFileSync(new URL(relativePath, import.meta.url), "utf-8"));

describe("shared content model schemas", () => {
  it("validates the current simulation procedure payload", () => {
    const payload = readJson("../../public/data/procedures/cavity-filling.json");

    expect(() => procedureSchema.parse(payload)).not.toThrow();
  });

  it("validates the current video procedure payload", () => {
    const payload = readJson("../../public/data/procedures/sample-video-procedure.json");

    expect(() => procedureSchema.parse(payload)).not.toThrow();
  });

  it("validates the current assessment question payload", () => {
    const payload = readJson("../../public/data/questions/cavity-filling-questions.json");

    expect(() => assessmentQuestionSetSchema.parse(payload)).not.toThrow();
  });

  it("supports future posts, creators, and review records", () => {
    expect(() =>
      clinicalPostSchema.parse({
        id: "post-composite-isolation",
        title: {
          en: "Moisture Control For Composite Isolation",
          uz: "Kompozit izolyatsiyasi uchun namlik nazorati",
        },
        excerpt: "A practical walkthrough for improving posterior isolation.",
        body: {
          en: "Rubber dam isolation improves bond reliability and visibility.",
          uz: "Rubber dam izolyatsiyasi bog'lanish ishonchliligini oshiradi.",
        },
        author: {
          id: "dr-lee",
          name: "Dr. Mina Lee",
          institution: "Operio Academy",
        },
        field: "Dentistry",
        topic: "Restorative",
        tags: ["isolation", "adhesive"],
        publishDate: "2026-04-04",
        platformMetadata: {
          contentType: "post",
          status: "published",
          visibility: "free",
          locale: "en",
          translations: ["uz"],
        },
        domainMetadata: {
          domain: "dental",
          specialty: "restorative-dentistry",
          launchDataset: true,
        },
      })
    ).not.toThrow();

    expect(() =>
      creatorProfileSchema.parse({
        id: "creator-dr-lee",
        displayName: "Dr. Mina Lee",
        bio: {
          en: "Restorative educator focused on practical clinical workflows.",
          uz: "Amaliy klinik ish jarayonlariga yo'naltirilgan restorativ o'qituvchi.",
        },
        institution: "Operio Academy",
        specialty: "Restorative Dentistry",
        expertise: ["posterior composites", "adhesive dentistry"],
        platformMetadata: {
          verified: true,
          visibility: "premium",
        },
      })
    ).not.toThrow();

    expect(() =>
      reviewRecordSchema.parse({
        id: "review-cf-q1",
        contentId: "cavity-filling",
        contentType: "procedure",
        questionId: "cf-q1",
        completionState: "in_progress",
        score: 0.75,
        attempts: 2,
        notes: {
          en: "Review differential diagnosis before the next attempt.",
          uz: "Keyingi urinishdan oldin differensial tashxisni ko'rib chiqing.",
        },
        platformMetadata: {
          source: "local",
          locale: "en",
        },
      })
    ).not.toThrow();
  });
});
