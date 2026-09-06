import type { $ZodIssue } from "zod/v4/core";

export type CliExitCode = 0 | 1 | 2;

export class CliError extends Error {
  constructor(
    message: string,
    readonly exitCode: Exclude<CliExitCode, 0>,
    readonly details: readonly string[] = [],
  ) {
    super(message);
    this.name = "CliError";
  }
}

export function formatValidationIssues(issues: readonly $ZodIssue[]): string[] {
  return issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "manifest";
    return `${path}\n${issue.message}`;
  });
}
