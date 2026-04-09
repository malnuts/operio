/**
 * Deterministic automation pipelines — separated from generative agent jobs.
 *
 * These are non-AI, rule-based operations for repetitive content maintenance.
 * They run synchronously and produce typed results, not AI-generated text.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Automation job types
// ---------------------------------------------------------------------------

export const automationJobTypeSchema = z.enum([
  "metadata_tagging",
  "schema_qa",
  "terminology_check",
  "localization_draft",
  "dataset_validation",
]);
export type AutomationJobType = z.infer<typeof automationJobTypeSchema>;

export const automationResultSchema = z.object({
  type: automationJobTypeSchema,
  passed: z.boolean(),
  issues: z.array(z.object({
    path: z.string(),
    message: z.string(),
    severity: z.enum(["error", "warning", "info"]),
  })),
  summary: z.string(),
});
export type AutomationResult = z.infer<typeof automationResultSchema>;

// ---------------------------------------------------------------------------
// Metadata tagging — auto-suggest tags and categories
// ---------------------------------------------------------------------------

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Restorative: ["filling", "composite", "restoration", "cavity", "crown", "veneer"],
  Surgical: ["extraction", "flap", "implant", "surgery", "suture"],
  Endodontic: ["root canal", "pulp", "endodontic", "obturation", "k-file"],
  Periodontic: ["scaling", "root planing", "periodontal", "gingival", "probing"],
  Prosthodontic: ["denture", "bridge", "prosthetic", "impression", "abutment"],
  Preventive: ["sealant", "fluoride", "prophylaxis", "cleaning", "hygiene"],
};

export const suggestCategory = (text: string): string | null => {
  const lower = text.toLowerCase();
  let best: string | null = null;
  let bestCount = 0;
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const count = keywords.filter((kw) => lower.includes(kw)).length;
    if (count > bestCount) {
      best = category;
      bestCount = count;
    }
  }
  return best;
};

export const suggestTags = (text: string): string[] => {
  const lower = text.toLowerCase();
  const tags: string[] = [];
  for (const keywords of Object.values(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw) && !tags.includes(kw)) {
        tags.push(kw);
      }
    }
  }
  return tags.slice(0, 10);
};

// ---------------------------------------------------------------------------
// Schema QA — validate procedure/post JSON against expected schemas
// ---------------------------------------------------------------------------

export const runSchemaQA = (
  data: Record<string, unknown>,
  schema: z.ZodType,
): AutomationResult => {
  const result = schema.safeParse(data);
  if (result.success) {
    return {
      type: "schema_qa",
      passed: true,
      issues: [],
      summary: "Schema validation passed.",
    };
  }
  return {
    type: "schema_qa",
    passed: false,
    issues: result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
      severity: "error" as const,
    })),
    summary: `Schema validation failed with ${result.error.issues.length} issue(s).`,
  };
};

// ---------------------------------------------------------------------------
// Terminology check — flag non-standard product terms
// ---------------------------------------------------------------------------

const TERMINOLOGY_RULES: Array<{ pattern: RegExp; suggestion: string }> = [
  { pattern: /\bquiz\b/gi, suggestion: "Use 'assessment' instead of 'quiz'" },
  { pattern: /\btest\s+prep\b/gi, suggestion: "Use 'assessment reinforcement' instead of 'test prep'" },
  { pattern: /\bsimulation\s+game\b/gi, suggestion: "Use 'procedure' instead of 'simulation game'" },
  { pattern: /\bblog\s+post\b/gi, suggestion: "Use 'clinical post' instead of 'blog post'" },
  { pattern: /\bstudent\b/gi, suggestion: "Use 'learner' instead of 'student' in platform copy" },
  { pattern: /\bteacher\b/gi, suggestion: "Use 'creator' instead of 'teacher' in platform copy" },
];

export const runTerminologyCheck = (text: string): AutomationResult => {
  const issues: AutomationResult["issues"] = [];
  for (const rule of TERMINOLOGY_RULES) {
    const matches = text.match(rule.pattern);
    if (matches) {
      issues.push({
        path: "text",
        message: rule.suggestion,
        severity: "warning",
      });
    }
  }
  return {
    type: "terminology_check",
    passed: issues.length === 0,
    issues,
    summary: issues.length === 0
      ? "Terminology check passed."
      : `Found ${issues.length} terminology suggestion(s).`,
  };
};

// ---------------------------------------------------------------------------
// Localization support — flag untranslated keys
// ---------------------------------------------------------------------------

export const findMissingTranslations = (
  baseLocale: Record<string, string>,
  targetLocale: Record<string, string>,
): AutomationResult => {
  const missing = Object.keys(baseLocale).filter((key) => !(key in targetLocale));
  return {
    type: "localization_draft",
    passed: missing.length === 0,
    issues: missing.map((key) => ({
      path: key,
      message: `Missing translation for key "${key}"`,
      severity: "warning",
    })),
    summary: missing.length === 0
      ? "All keys are translated."
      : `${missing.length} key(s) missing translation.`,
  };
};

// ---------------------------------------------------------------------------
// Dataset validation — check consistency of launch dataset files
// ---------------------------------------------------------------------------

export const validateDatasetEntry = (
  entry: Record<string, unknown>,
  requiredFields: string[],
): AutomationResult => {
  const issues: AutomationResult["issues"] = [];
  for (const field of requiredFields) {
    if (!(field in entry) || entry[field] === null || entry[field] === undefined || entry[field] === "") {
      issues.push({
        path: field,
        message: `Required field "${field}" is missing or empty`,
        severity: "error",
      });
    }
  }
  return {
    type: "dataset_validation",
    passed: issues.length === 0,
    issues,
    summary: issues.length === 0
      ? "Dataset entry is valid."
      : `${issues.length} field(s) missing or empty.`,
  };
};
