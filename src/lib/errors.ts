/**
 * Typed error classes for domain-relevant failure modes.
 * Callers match on type, not message strings.
 */

export class FetchError extends Error {
  readonly url: string;
  readonly status?: number;

  constructor(url: string, status?: number) {
    super(`Failed to load ${url}${status ? ` (${status})` : ""}`);
    this.name = "FetchError";
    this.url = url;
    this.status = status;
  }
}

export class ValidationError extends Error {
  readonly issues: unknown[];

  constructor(message: string, issues: unknown[] = []) {
    super(message);
    this.name = "ValidationError";
    this.issues = issues;
  }
}
