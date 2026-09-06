# Axiom

Axiom is the open discovery layer for WebMCP. The frontend consumes the real discovery, registry, inspection, and publication APIs through a typed HttpAxiomClient boundary. The backend provides a real registry,
transactional publication pipeline, and semantic capability discovery through PostgreSQL/pgvector.

## Repository structure

```text
src/                  Next.js frontend (kept at the repository root)
apps/api/             Fastify HTTP transport, process lifecycle, and maintenance commands
packages/core/        Framework-independent domain, ports, errors, and utilities
packages/contracts/   Shared Zod transport and Axiom manifest contracts
packages/registry/    Provider and capability application services
packages/ingestion/   Source adapters, normalization, validation, diffing, and publishing
packages/discovery/   Search documents, embedding adapters, indexing, ranking, and evaluation
packages/db/          Drizzle schema, PostgreSQL/pgvector repositories, migrations, and seed
packages/client/      Agent-oriented discovery client
packages/sdk/         Website-developer publishing SDK
packages/cli/         Website-developer manifest CLI
```

Core knows only the `EmbeddingProvider` and repository ports. It does not import OpenAI, Fastify,
Drizzle, PostgreSQL, Next.js, browser APIs, or an embedding SDK. The OpenAI adapter is isolated in
`packages/discovery`; tests use a deterministic fake provider and never call OpenAI.

## Prerequisites and environment

- Node.js 22+
- npm 11+
- Docker with Compose, or PostgreSQL 17 with pgvector

Copy `.env.example` to `.env`. Do not commit `.env`.

| Variable                      | Purpose                                            | Default/example                                 |
| ----------------------------- | -------------------------------------------------- | ----------------------------------------------- |
| `NEXT_PUBLIC_AXIOM_DATA_MODE` | Frontend data source (`http` or explicit `mock`)   | `http`                                          |
| `NEXT_PUBLIC_AXIOM_API_URL`   | Public API origin used by the frontend             | `http://127.0.0.1:4000`                         |
| `DATABASE_URL`                | API, migration, and indexing PostgreSQL connection | `postgresql://axiom:axiom@localhost:5432/axiom` |
| `EMBEDDING_PROVIDER`          | Explicit semantic provider (`openai` or `fake`)    | `openai`                                        |
| `OPENAI_API_KEY`              | Required when `EMBEDDING_PROVIDER=openai`          | No default                                      |
| `EMBEDDING_MODEL`             | Schema-compatible embedding model                  | `text-embedding-3-small`                        |
| `API_HOST`                    | API bind address                                   | `127.0.0.1`                                     |
| `PORT`                        | API port                                           | `4000`                                          |
| `LOG_LEVEL`                   | Fastify/Pino log level                             | `info`                                          |
| `CORS_ORIGINS`                | Comma-separated allowed browser origins            | `http://localhost:3000`                         |

With `EMBEDDING_PROVIDER=openai`, the API can start without `OPENAI_API_KEY`; registry and inspection remain usable, publication reports failed indexing, and discovery returns a controlled 503. For an offline demo, set `EMBEDDING_PROVIDER=fake` explicitly. The API logs a warning and uses deterministic 1024-dimensional fixtures; it never silently falls back. `EMBEDDING_MODEL` is deliberately restricted to
`text-embedding-3-small`: the database schema fixes vectors at 1024 dimensions.

## Local development

```bash
npm install
docker compose up -d postgres
npm run demo:setup
```

`demo:setup` migrates the database, seeds Atlas Dining, Orbit Travel, and Pulse Events, then indexes them. It deliberately leaves Northstar Commerce unpublished for the live publication demo. `demo:reset` removes only the four known demo-provider slugs before rebuilding this state.

Start the API and web application in separate terminals:

```bash
npm run dev:api
npm run dev:web
```

The web app defaults to `NEXT_PUBLIC_AXIOM_DATA_MODE=http`. Set it to `mock` only for explicit offline frontend work; HTTP failures never fall back to mock data.

## End-to-end architecture

```text
Website Developer
      |
  CLI / SDK
      v
Publication API -> Registry -> Semantic Index
                              ^
                              |
                       Discovery API
                              ^
                        Agent Client
                              |
                       Agent Developer
```

A WebMCP tool is normalized into an Axiom capability. Axiom discovers capabilities and returns provider contracts; WebMCP executes them on the provider website.

## HTTP API

```text
GET  /health

POST  /v1/providers
GET   /v1/providers
GET   /v1/providers/:slug
PATCH /v1/providers/:slug

POST /v1/providers/:slug/capabilities
GET  /v1/providers/:slug/capabilities
GET  /v1/providers/:slug/capabilities/:capabilityName
PUT  /v1/providers/:slug/capabilities/:capabilityName

POST /v1/inspect
POST /v1/publish
POST /v1/discover
```

Discovery accepts a compact agent-oriented request:

```json
{ "intent": "book somewhere for dinner", "limit": 10 }
```

It returns providers ordered by relevance with their matched capability contracts. Scores are
0-1 relevance values, not calibrated probabilities or confidence claims. Embeddings are never
returned.

## Semantic index

Migration `0001_soft_peter_quill.sql` adds nullable `vector(1024)` storage plus pending/ready/failed
status, provider/model/dimension/version metadata, search-document version, fingerprint, and update
timestamp. Retrieval uses exact cosine distance and only active providers with active, ready
capabilities. No ANN index is required at hackathon scale.

Search document version `1` deterministically includes capability name/description, provider
name/description, meaningful input field names/descriptions/enums, and a compact behavior cue. It
excludes IDs, timestamps, hashes, and raw schema JSON. Documents are capped at 6,000 characters;
indexing uses batches of at most 32 capabilities. Its fingerprint covers capability content,
provider semantic metadata, embedding provider/model/dimensions/version, and document version.

Publishing indexes created/changed capabilities after the registry transaction commits. Identical
capabilities are not re-embedded. Provider metadata changes reindex all of that provider's active
capabilities when published. Direct provider metadata PATCHes are excluded from discovery until
`index:rebuild` refreshes their fingerprints. Discovery also rejects embeddings from a different
model or document version. Capability updates invalidate stored vectors immediately; failed
external indexing leaves valid registry records with `embedding_status = failed`.

Ranking centralizes three signals: 90% cosine similarity, an 8% deterministic lexical boost, and a
2% verification boost. Providers are grouped by their best capability with a capped bonus for
additional relevant capabilities. Candidate retrieval intentionally fetches more capabilities than
the final provider limit.

## Maintenance and evaluation

```bash
npm run index:rebuild
npm run eval:discovery
```

`index:rebuild` scans active capabilities and skips ready records whose fingerprints are current.
`eval:discovery` is manual: it requires PostgreSQL, indexed demo data, and `OPENAI_API_KEY`. It runs
the checked-in 12-query fixture and prints measured top-1 provider, top-3 provider, and expected
capability hit counts. It is excluded from normal tests and never fabricates results.

## Axiom manifest

`axiom.json` is an Axiom ingestion format, not an official WebMCP specification. Send it inline as:

```json
{
  "source": "manifest",
  "mode": "merge",
  "manifest": {
    "version": "1",
    "provider": {
      "name": "Atlas Dining",
      "domain": "atlas.example",
      "canonicalUrl": "https://atlas.example",
      "description": "Restaurant discovery and reservation services."
    },
    "capabilities": [
      {
        "name": "search_restaurants",
        "description": "Search available restaurants.",
        "inputSchema": { "type": "object" },
        "annotations": { "readOnly": true }
      }
    ]
  }
}
```

Axiom does not fetch arbitrary manifest URLs. Publication mode remains non-destructive `merge`.

## Database and validation workflow

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build:all
```

Checked-in Drizzle SQL migrations are the production deployment mechanism. The frontend defaults to HttpAxiomClient and composes the read client with the publishing SDK behind explicit transport-to-UI mappers. MockAxiomClient remains available only through explicit mock data mode. Live WebMCP inspection, agent execution,
authentication, ownership verification, LLM rewriting, queues, and external vector databases
remain outside this phase.

## Optional PostgreSQL regression test

Set `AXIOM_TEST_DATABASE_URL` to a dedicated test database with migrations applied, then run:

```bash
npx vitest run packages/db/src/vector.integration.test.ts
```

The test checks cosine ordering, readiness/status filtering, capability invalidation, and rejection
of superseded embedding writes. It creates a uniquely identified provider and removes only that
fixture afterward. Without this environment variable it is explicitly skipped; normal tests use
deterministic embeddings and do not measure real OpenAI retrieval accuracy.

## For agent developers

`packages/client` provides the ESM `@axiom-webmcp/client` agent consumption SDK with discovery,
provider lookup, and capability lookup. It uses shared runtime-validated contracts, native or
injected fetch, bounded deadlines, and typed API/network errors. It does not execute WebMCP tools.

```bash
npm install @axiom-webmcp/client
```

```ts
import { Axiom } from "@axiom-webmcp/client";

const axiom = new Axiom({ baseUrl: "http://127.0.0.1:4000" });
const result = await axiom.discover({ intent: "reserve dinner" });
```

Build and test it locally with:

```bash
npm run build:client
npm run test:client
node examples/agent-discovery/index.mjs http://127.0.0.1:4000 "reserve dinner"
```

See `packages/client/README.md` for usage and packaging details. The package is not yet published;
the client package is MIT licensed.

## For website developers

Website developers can send validated capability contracts through the distinct publishing SDK, or
use the CLI with a local `axiom.json` manifest:

```bash
npm install @axiom-webmcp/sdk
```

```ts
import { AxiomPublisher } from "@axiom-webmcp/sdk";

const publisher = new AxiomPublisher({ baseUrl: "http://127.0.0.1:4000" });
const preview = await publisher.inspect(manifest);
const publication = await publisher.publish(manifest);
```

```bash
npm run build:packages
npm exec --workspace @axiom-webmcp/cli -- axiom init
npm exec --workspace @axiom-webmcp/cli -- axiom inspect
npm exec --workspace @axiom-webmcp/cli -- axiom publish --yes
npm exec --workspace @axiom-webmcp/cli -- axiom search "book a restaurant"
```

The manifest is read as untrusted JSON and is never executed. `inspect` validates locally before
requesting a non-persistent publication plan; `publish` confirms that plan and delegates all
normalization, diffing, persistence, and semantic indexing to the backend. `search` reuses the
agent client to test discoverability. See `packages/sdk/README.md`, `packages/cli/README.md`, and
`examples/publisher/README.md`. Both packages are publish-ready, not published, and MIT licensed.
