# @axiom-webmcp/sdk

Typed inspection and publishing for website developers exposing WebMCP capability contracts through
Axiom. The SDK sends data to Axiom's validation and publication pipeline; it does not crawl a site,
execute tools, generate embeddings, or reproduce registry logic locally.

## Installation

The package is prepared for publication and is not published by this phase.

```bash
npm install @axiom-webmcp/sdk
```

## Inspect and publish

```ts
import { AxiomPublisher } from "@axiom-webmcp/sdk";

const axiom = new AxiomPublisher({
  baseUrl: "http://127.0.0.1:4000",
});

const publication = {
  provider: {
    name: "Northstar Commerce",
    domain: "northstar-commerce.example",
    canonicalUrl: "https://northstar-commerce.example",
    description: "Product discovery, cart management, and checkout.",
  },
  capabilities: [
    {
      name: "search_products",
      description: "Search available products.",
      inputSchema: {
        type: "object",
        properties: { query: { type: "string" } },
      },
    },
  ],
};

const preview = await axiom.inspect(publication);
if (preview.plan.summary.create + preview.plan.summary.update > 0) {
  const result = await axiom.publish(publication);
  console.log(result.summary, result.indexing);
}
```

Both methods accept the direct `{ provider, capabilities }` shape, a complete transport request, or
an Axiom manifest object with `version: "1"`. Direct input is wrapped as `source: "api"`; manifest
input is wrapped as `source: "manifest"`. Publishing mode is the backend's non-destructive `merge`.
Requests and responses are validated with the shared Zod contracts.

`inspect()` returns `{ valid, plan, warnings }` and does not persist changes. `publish()` returns the
provider, create/update/unchanged summary, registered capabilities, warnings, and indexing counts.
The server remains authoritative for normalization, diffing, persistence, and semantic indexing.

## Manifest usage

`axiom.json` is an Axiom ingestion convention, not an official WebMCP manifest standard. The SDK
does not read files; Node filesystem access belongs to `@axiom-webmcp/cli`.

```ts
import manifest from "./axiom.json" with { type: "json" };

await axiom.inspect(manifest);
await axiom.publish(manifest);
```

Treat manifest data as untrusted input. The SDK validates it as JSON data and never executes it.

## Configuration and errors

`AxiomPublisher` accepts `baseUrl`, optional native-compatible `fetch`, copied `headers`, and
`timeoutMs` (10 seconds by default). Base URLs must be absolute HTTP(S) URLs without credentials,
query, or fragment. Deployments should use HTTPS; HTTP supports local development. Requests do not
send cookies, follow redirects, retry, cache, read environment variables, or collect telemetry.

```ts
import { AxiomPublisherError } from "@axiom-webmcp/sdk";

try {
  await axiom.publish(publication);
} catch (error) {
  if (!(error instanceof AxiomPublisherError)) throw error;
  console.error(error.code, error.status, error.requestId, error.details);
}
```

Structured server failures preserve the application code, status, details, and request ID. Local
codes cover configuration, network, timeout, unstructured API, and invalid-response failures. Raw
fetch errors are not exposed.

The MIT-licensed ESM package targets Node.js 18+ and compatible modern runtimes. Zod is its only
runtime dependency. See `@axiom-webmcp/cli` for manifest-file workflows.
