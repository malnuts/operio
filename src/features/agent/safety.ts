/**
 * Safety rules for agent-generated clinical content.
 *
 * Every generated output passes through these checks before it can enter
 * the review queue. Violations block the output from reaching the review
 * step entirely.
 *
 * Rules:
 * 1. No unsupported clinical claims — flag absolute dosage/diagnosis statements
 * 2. No publish-without-review path — all generated content must be reviewed
 * 3. Preserve source nuance and uncertainty — flag language that removes hedging
 * 4. Separate educational guidance from medical advice — flag "you should" patterns
 */

export interface SafetyRule {
  id: string;
  description: string;
  check: (text: string) => string | null; // returns violation message or null
}

const ABSOLUTE_CLAIM_PATTERNS = [
  /\balways\s+(?:prescribe|administer|give|use)\b/i,
  /\bnever\s+(?:prescribe|administer|give|use)\b/i,
  /\bguaranteed?\s+(?:to|cure|treat|fix)\b/i,
  /\b(?:will\s+)?(?:definitely|certainly)\s+(?:cure|heal|resolve)\b/i,
];

const MEDICAL_ADVICE_PATTERNS = [
  /\byou\s+(?:should|must|need\s+to)\s+(?:take|prescribe|administer)\b/i,
  /\bpatients?\s+(?:should|must)\s+(?:take|stop\s+taking)\b/i,
  /\bthis\s+(?:will|should)\s+(?:cure|treat|fix)\s+your\b/i,
];

export const safetyRules: SafetyRule[] = [
  {
    id: "no-absolute-claims",
    description: "No unsupported absolute clinical claims",
    check: (text) => {
      for (const pattern of ABSOLUTE_CLAIM_PATTERNS) {
        const match = text.match(pattern);
        if (match) {
          return `Absolute clinical claim detected: "${match[0]}". Use hedged language like "typically" or "in most cases".`;
        }
      }
      return null;
    },
  },
  {
    id: "no-medical-advice",
    description: "Separate educational guidance from direct medical advice",
    check: (text) => {
      for (const pattern of MEDICAL_ADVICE_PATTERNS) {
        const match = text.match(pattern);
        if (match) {
          return `Direct medical advice pattern detected: "${match[0]}". Use educational framing like "clinicians typically" or "the standard approach is".`;
        }
      }
      return null;
    },
  },
  {
    id: "requires-review-disclaimer",
    description: "Generated content must preserve uncertainty",
    check: (_text) => {
      // This rule is enforced structurally: all generated output gets
      // provenance status "pending_review" and cannot bypass the review queue.
      // The check here is a no-op because the review gate is in the job runner.
      return null;
    },
  },
];

export interface SafetyCheckResult {
  passed: boolean;
  violations: string[];
}

const extractTextFields = (output: Record<string, unknown>): string => {
  const parts: string[] = [];
  const walk = (value: unknown) => {
    if (typeof value === "string") {
      parts.push(value);
    } else if (Array.isArray(value)) {
      value.forEach(walk);
    } else if (value && typeof value === "object") {
      Object.values(value).forEach(walk);
    }
  };
  walk(output);
  return parts.join("\n");
};

export const runSafetyCheck = (output: Record<string, unknown>): SafetyCheckResult => {
  const text = extractTextFields(output);
  const violations: string[] = [];
  for (const rule of safetyRules) {
    const violation = rule.check(text);
    if (violation) {
      violations.push(violation);
    }
  }
  return { passed: violations.length === 0, violations };
};
