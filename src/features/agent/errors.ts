/**
 * Typed errors for agent job failures.
 */

export class AgentGenerationError extends Error {
  readonly jobId: string;
  readonly jobType: string;

  constructor(jobId: string, jobType: string, message: string) {
    super(message);
    this.name = "AgentGenerationError";
    this.jobId = jobId;
    this.jobType = jobType;
  }
}

export class AgentSafetyError extends Error {
  readonly violations: string[];

  constructor(violations: string[]) {
    super(`Safety check failed: ${violations.join("; ")}`);
    this.name = "AgentSafetyError";
    this.violations = violations;
  }
}

export class AgentReviewRequiredError extends Error {
  readonly jobId: string;

  constructor(jobId: string) {
    super(`Job "${jobId}" requires human review before publishing.`);
    this.name = "AgentReviewRequiredError";
    this.jobId = jobId;
  }
}
