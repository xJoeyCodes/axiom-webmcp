# @axiom-webmcp/client

A small, framework-neutral client for agents to discover WebMCP-enabled providers through Axiom.
It retrieves capability contracts so the caller can decide where to go next.

## Installation

The initial package is prepared for publication; it has not been published in this phase.
After publication:

```bash
npm install @axiom-webmcp/client
```

Inside this repository, run `npm install` and `npm run build:client` to use the workspace package.

## Discovery

```ts
import { Axiom } from "@axiom-webmcp/client";

const axiom = new Axiom({ baseUrl: "http://127.0.0.1:4000" });
const discovery = await axiom.discover({
  intent: "find somewhere to reserve dinner",
  limit: 5,
});

const [best] = discovery.results;
if (best) {
  console.log(best.provider.canonicalUrl);
  for (const match of best.matchedCapabilities) {
    console.log(
      match.capability.name,
      match.capability.inputSchema,
      match.score,
    );
  }
}
```

The result contains `query`, `results`, and `count`. Each provider result contains `provider`,
`score`, and `matchedCapabilities`; each match contains `capability`, `score`, and `matchedTerms`.
These are the existing API field names. Scores measure relevance, not calibrated confidence.
Provider verification is exposed as `verificationStatus`.

`intent` is required (1-500 trimmed characters). `limit` defaults to 10 (maximum 50).
The backend's optional `minimumScore` (0-1) is also supported. Requests are validated locally;
invalid inputs make no network requests. The SDK unwraps the API's outer `data` envelope and
returns ordinary serializable objects with ISO timestamp strings.

## Provider and capability lookup

```ts
const provider = await axiom.getProvider("atlas-dining");
const capabilities = await axiom.getCapabilities(provider.slug);
const reservation = await axiom.getCapability(
  provider.slug,
  "make_reservation",
);
```

`getProvider` retrieves metadata in one request; it does not fetch capabilities or expose the
transport envelope's capability count. `getCapabilities` returns active capabilities in the API's
order. Missing resources throw `AxiomError` with code `NOT_FOUND`. The SDK has no publish or inspect
methods and does not execute capabilities.

## Configuration

```ts
const axiom = new Axiom({
  baseUrl: "https://your-axiom-api.example",
  timeoutMs: 10_000,
  headers: { "X-Agent-Name": "Nova" },
  fetch: globalThis.fetch,
});
```

`baseUrl` is required. Trailing slashes are normalized, and reverse-proxy path prefixes are
preserved. Use HTTPS for deployment; HTTP is supported for local development. Query strings,
fragments, and embedded credentials are rejected. Custom headers are copied; JSON `Accept` and
`Content-Type` are enforced. Authentication headers may be supplied explicitly, but the current
backend does not implement authentication.

The 10-second default deadline covers networking and body reading. There are no automatic retries,
caches, telemetry, environment-variable reads, or browser cookies. Redirects fail instead of
forwarding custom headers to another destination. If a custom fetch ignores cancellation, the SDK
still rejects at the deadline, but it cannot stop that fetch implementation's underlying work.

## Errors

```ts
import { AxiomError } from "@axiom-webmcp/client";

try {
  await axiom.discover({ intent: "compare flights" });
} catch (error) {
  if (!(error instanceof AxiomError)) throw error;
  console.error(error.code, error.status, error.message, error.requestId);
}
```

Structured API errors preserve `code`, `message`, HTTP `status`, optional `details`, and the server's
`requestId`. Backend codes include `VALIDATION_ERROR`, `NOT_FOUND`, `CONFLICT`, `INTERNAL_ERROR`, and
`SERVICE_UNAVAILABLE`. Client failures use `CONFIGURATION_ERROR`, `NETWORK_ERROR`, `TIMEOUT`,
`INVALID_RESPONSE`, or `API_ERROR` for an unstructured HTTP failure. Fetch internals and request
credentials are not included in errors. Successful responses are validated with the shared Zod
schemas; unexpected response formats fail explicitly.

## Agent integration and runtimes

```ts
async function resolveUserGoal(goal: string) {
  const discovery = await axiom.discover({ intent: goal, limit: 5 });
  return discovery.results[0] ?? null;
}
```

The calling agent can use the chosen provider's URL to navigate to its website, where WebMCP can
expose executable tools. Axiom only supplies discovery and metadata. The generic runnable example
is in `examples/agent-discovery`; no LLM or framework dependency is required.

The ESM runtime uses native `fetch`, `Headers`, `URL`, and `AbortController`, with no Node-only
imports. It targets Node.js 18+, modern browsers, and modern edge runtimes offering these Web APIs.
Browser calls require the API's CORS configuration to allow the application's origin. Never embed
server secrets in browser code.

## Build and packaging

```bash
npm run build --workspace @axiom-webmcp/client
npm run typecheck --workspace @axiom-webmcp/client
npm run test --workspace @axiom-webmcp/client
npm pack --workspace @axiom-webmcp/client --dry-run
```

TypeScript compiles the client and the shared contract source modules it imports into `dist`.
This reuses the registry's schemas without depending on the private `@axiom/contracts` package at
installation time. Relative declaration imports remain inside the packed artifact. Zod is the
only runtime dependency. Tests are excluded from the published build. Exports expose only `Axiom`,
`AxiomError`, configuration/error types, and the public discovery/provider/capability types.

The client package is MIT licensed; see `LICENSE`. No registry publication is performed by these build commands.
