import { Axiom, AxiomError } from "@axiom-webmcp/client";

const baseUrl = process.argv[2];
const goal = process.argv[3] ?? "reserve dinner";
if (!baseUrl) {
  process.stderr.write(
    'Usage: node examples/agent-discovery/index.mjs http://127.0.0.1:4000 "reserve dinner"\n',
  );
  process.exitCode = 1;
} else {
  const axiom = new Axiom({ baseUrl, timeoutMs: 15_000 });

  async function resolveUserGoal(intent) {
    const discovery = await axiom.discover({ intent, limit: 5 });
    return discovery.results[0] ?? null;
  }

  try {
    const best = await resolveUserGoal(goal);
    if (!best) {
      process.stdout.write("No matching providers.\n");
    } else {
      const metadata = await axiom.getProvider(best.provider.slug);
      const capabilities = await axiom.getCapabilities(metadata.slug);
      process.stdout.write(
        JSON.stringify({ best, metadata, capabilities }, null, 2) + "\n",
      );
    }
  } catch (error) {
    if (!(error instanceof AxiomError)) throw error;
    process.stderr.write(
      `${error.code}: ${error.message}${error.requestId ? ` (request ${error.requestId})` : ""}\n`,
    );
    process.exitCode = 1;
  }
}
