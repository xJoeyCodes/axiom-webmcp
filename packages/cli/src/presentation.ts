import { AxiomError } from "@axiom-webmcp/client";
import { AxiomPublisherError } from "@axiom-webmcp/sdk";

import { CliError, type CliExitCode } from "./errors.js";
import type { CliIo } from "./services.js";

interface PresentedError {
  readonly exitCode: Exclude<CliExitCode, 0>;
  readonly message: string;
  readonly details: readonly string[];
  readonly code?: string;
  readonly requestId?: string;
}

function present(error: unknown, baseUrl: string): PresentedError {
  if (error instanceof CliError) {
    return {
      exitCode: error.exitCode,
      message: error.message,
      details: error.details,
    };
  }
  if (error instanceof AxiomError || error instanceof AxiomPublisherError) {
    const configuration =
      error.code === "CONFIGURATION_ERROR" || error.code === "VALIDATION_ERROR";
    const unreachable =
      error.code === "NETWORK_ERROR" || error.code === "TIMEOUT";
    return {
      exitCode: configuration ? 2 : 1,
      message: unreachable ? "Unable to reach Axiom." : error.message,
      details: unreachable
        ? [baseUrl, "Check that the API is running or set AXIOM_BASE_URL."]
        : [],
      code: error.code,
      ...(error.requestId ? { requestId: error.requestId } : {}),
    };
  }
  return { exitCode: 1, message: "Axiom command failed.", details: [] };
}

export function writeError(
  io: CliIo,
  error: unknown,
  options: {
    readonly baseUrl: string;
    readonly json: boolean;
    readonly debug: boolean;
  },
): CliExitCode {
  const value = present(error, options.baseUrl);
  if (options.json) {
    io.stderr(
      `${JSON.stringify({
        error: {
          code: value.code ?? "CLI_ERROR",
          message: value.message,
          details: value.details,
          ...(value.requestId ? { requestId: value.requestId } : {}),
        },
      })}\n`,
    );
  } else {
    io.stderr(
      `${[value.message, ...value.details].filter(Boolean).join("\n\n")}\n`,
    );
  }
  if (options.debug && error instanceof Error && error.stack) {
    io.stderr(`\nDebug\n${error.stack}\n`);
  }
  return value.exitCode;
}
