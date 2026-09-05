import { Command, CommanderError } from "commander";

import { CliError, type CliExitCode } from "./errors.js";
import { resolveBaseUrl } from "./config.js";
import { createManifest, loadManifest } from "./manifest.js";
import { formatInspection, formatPublish, formatSearch } from "./output.js";
import { writeError } from "./presentation.js";
import { defaultServices, type CliServices } from "./services.js";

interface GlobalOptions {
  readonly baseUrl?: string;
  readonly debug?: boolean;
}

interface FileOptions {
  readonly file?: string;
  readonly json?: boolean;
}

function outputJson(services: CliServices, value: unknown): void {
  services.io.stdout(`${JSON.stringify(value, null, 2)}\n`);
}

function publisher(services: CliServices, baseUrl: string) {
  return services.createPublisher({ baseUrl });
}

export async function runCli(
  argv: readonly string[],
  services: CliServices = defaultServices(),
): Promise<CliExitCode> {
  let selectedBaseUrl = resolveBaseUrl(undefined, services.environment);
  const jsonMode = argv.includes("--json");
  const debugMode = argv.includes("--debug");
  const program = new Command()
    .name("axiom")
    .description("Inspect, publish, and test Axiom capability manifests.")
    .version("0.1.0")
    .option("--base-url <url>", "Axiom API base URL")
    .option("--debug", "show diagnostic stack traces")
    .showSuggestionAfterError()
    .exitOverride()
    .configureOutput({
      writeOut: services.io.stdout,
      writeErr: services.io.stderr,
    });

  program
    .command("init")
    .description("create a starter Axiom manifest")
    .option("--file <path>", "manifest path", "axiom.json")
    .option("--json", "write machine-readable JSON")
    .action(async (options: FileOptions) => {
      const result = await createManifest(services.cwd, options.file);
      if (options.json) {
        outputJson(services, {
          status: result.created ? "created" : "exists",
          path: result.path,
        });
        return;
      }
      const displayPath = options.file ?? "axiom.json";
      services.io.stdout(
        result.created
          ? `AXIOM\n\nCreated ${displayPath}\n\nNext:\n\n  axiom inspect --file ${displayPath}\n`
          : `${displayPath} already exists.\n`,
      );
    });

  program
    .command("inspect")
    .description("validate a manifest and preview registry changes")
    .option("--file <path>", "manifest path", "axiom.json")
    .option("--json", "write machine-readable JSON")
    .action(async (options: FileOptions, command: Command) => {
      const global = command.optsWithGlobals<GlobalOptions>();
      selectedBaseUrl = resolveBaseUrl(global.baseUrl, services.environment);
      const loaded = await loadManifest(services.cwd, options.file);
      const result = await publisher(services, selectedBaseUrl).inspect(
        loaded.manifest,
      );
      if (options.json) outputJson(services, result);
      else services.io.stdout(formatInspection(loaded.manifest, result));
    });

  program
    .command("publish")
    .description("inspect and publish an Axiom manifest")
    .option("--file <path>", "manifest path", "axiom.json")
    .option("--yes", "publish without interactive confirmation")
    .option("--json", "write machine-readable JSON")
    .action(
      async (
        options: FileOptions & { readonly yes?: boolean },
        command: Command,
      ) => {
        const global = command.optsWithGlobals<GlobalOptions>();
        selectedBaseUrl = resolveBaseUrl(global.baseUrl, services.environment);
        const loaded = await loadManifest(services.cwd, options.file);
        const sdk = publisher(services, selectedBaseUrl);
        const inspection = await sdk.inspect(loaded.manifest);
        const changes =
          inspection.plan.provider.action !== "unchanged" ||
          inspection.plan.summary.create > 0 ||
          inspection.plan.summary.update > 0;
        if (!changes) {
          if (options.json) {
            outputJson(services, { status: "unchanged", inspection });
          } else {
            services.io.stdout(
              `Everything is up to date.\n\n${inspection.plan.summary.unchanged} capabilities unchanged.\n`,
            );
          }
          return;
        }
        if (!options.json) {
          services.io.stdout(formatInspection(loaded.manifest, inspection));
        }
        if (!options.yes) {
          if (!services.interactive) {
            throw new CliError(
              "Publication confirmation is required in a non-interactive terminal.",
              2,
              ["Run axiom publish --yes."],
            );
          }
          if (!(await services.confirm("Publish these changes?"))) {
            if (options.json) outputJson(services, { status: "cancelled" });
            else services.io.stdout("Publication cancelled.\n");
            return;
          }
        }
        const publication = await sdk.publish(loaded.manifest);
        if (options.json) {
          outputJson(services, { inspection, publication });
        } else {
          services.io.stdout(formatPublish(publication));
        }
      },
    );

  program
    .command("search")
    .description("test capability discovery")
    .argument("<intent>", "natural-language intent")
    .option("--limit <count>", "maximum providers", "5")
    .option("--json", "write machine-readable JSON")
    .action(
      async (
        intent: string,
        options: { readonly limit: string; readonly json?: boolean },
        command: Command,
      ) => {
        const global = command.optsWithGlobals<GlobalOptions>();
        selectedBaseUrl = resolveBaseUrl(global.baseUrl, services.environment);
        if (!/^\d+$/u.test(options.limit)) {
          throw new CliError(
            "Search limit must be an integer from 1 to 50.",
            2,
          );
        }
        const limit = Number(options.limit);
        const result = await services
          .createClient({ baseUrl: selectedBaseUrl })
          .discover({ intent, limit });
        if (options.json) outputJson(services, result);
        else services.io.stdout(formatSearch(result));
      },
    );

  try {
    await program.parseAsync(["node", "axiom", ...argv]);
    if (argv.length === 0) program.outputHelp();
    return 0;
  } catch (error) {
    if (error instanceof CommanderError) {
      if (
        error.code === "commander.helpDisplayed" ||
        error.code === "commander.version"
      ) {
        return 0;
      }
      return 2;
    }
    return writeError(services.io, error, {
      baseUrl: selectedBaseUrl,
      json: jsonMode,
      debug: debugMode,
    });
  }
}
