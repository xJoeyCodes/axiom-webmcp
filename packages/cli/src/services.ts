import { createInterface } from "node:readline/promises";

import { Axiom, type AxiomOptions } from "@axiom-webmcp/client";
import { AxiomPublisher, type AxiomPublisherOptions } from "@axiom-webmcp/sdk";

export interface CliIo {
  readonly stdout: (value: string) => void;
  readonly stderr: (value: string) => void;
}

export interface CliServices {
  readonly cwd: string;
  readonly environment: Readonly<Record<string, string | undefined>>;
  readonly interactive: boolean;
  readonly io: CliIo;
  readonly createPublisher: (
    options: AxiomPublisherOptions,
  ) => Pick<AxiomPublisher, "inspect" | "publish">;
  readonly createClient: (options: AxiomOptions) => Pick<Axiom, "discover">;
  readonly confirm: (question: string) => Promise<boolean>;
}

async function confirm(question: string): Promise<boolean> {
  const prompt = createInterface({
    input: process.stdin,
    output: process.stderr,
  });
  try {
    const answer = (await prompt.question(`${question} (Y/n) `))
      .trim()
      .toLowerCase();
    return answer === "" || answer === "y" || answer === "yes";
  } finally {
    prompt.close();
  }
}

export function defaultServices(): CliServices {
  return {
    cwd: process.cwd(),
    environment: process.env,
    interactive: Boolean(process.stdin.isTTY && process.stderr.isTTY),
    io: {
      stdout: (value) => process.stdout.write(value),
      stderr: (value) => process.stderr.write(value),
    },
    createPublisher: (options) => new AxiomPublisher(options),
    createClient: (options) => new Axiom(options),
    confirm,
  };
}
