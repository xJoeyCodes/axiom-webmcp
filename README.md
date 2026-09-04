# Axiom

Axiom is the open discovery layer for WebMCP. The frontend demonstrates discovery, provider
inspection, and publishing behind a typed client boundary. The backend workspace provides a real
provider/capability registry plus a normalized, transactional publication pipeline.

## Repository structure

```text
src/                  Next.js frontend (kept at the repository root)
apps/api/             Fastify HTTP transport and process lifecycle
packages/core/        Framework-independent domain, repository ports, errors, and utilities
packages/contracts/   Zod request/response and Axiom manifest contracts
packages/registry/    Provider and capability application services
packages/ingestion/   Source adapters, normalization, validation, diffing, and publishing
packages/db/          Drizzle schema, PostgreSQL mappings, repositories, migrations, and seed
```

The dependency direction is deliberate:

```text
HTTP route -> publication service -> ingestion / diff -> registry service
                                                        |
                                             repository interfaces
                                                        |
                                               Drizzle/PostgreSQL
```

Core does not import Fastify, Drizzle, PostgreSQL, Next.js, browser APIs, or an embedding provider.
Source adapters normalize API contracts and the Axiom manifest into one stable capability model.
The normalized representation powers the registry, while `raw_contract` preserves source material
for debugging, re-indexing, and future WebMCP spec migrations.

## Prerequisites

- Node.js 22+
- npm 11+
- Docker with Compose, or another PostgreSQL 17 server with the `vector` extension available

Copy `.env.example` to `.env` and adjust values for your environment. Do not commit `.env`.

| Variable       | Purpose                                      | Example                                         |
| -------------- | -------------------------------------------- | ----------------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection used by API/migrations | `postgresql://axiom:axiom@localhost:5432/axiom` |
| `API_HOST`     | API bind address                             | `127.0.0.1`                                     |
| `PORT`         | API port                                     | `4000`                                          |
| `LOG_LEVEL`    | Pino/Fastify log level                       | `info`                                          |
| `NODE_ENV`     | Runtime environment                          | `development`                                   |
| `CORS_ORIGINS` | Comma-separated allowed browser origins      | `http://localhost:3000`                         |

## Local development

```bash
docker compose up -d postgres
npm run db:migrate
npm run db:seed
npm run dev:api
```

The seed is idempotent and registers Atlas Dining, Orbit Travel, Pulse Events, and their nine demo
capabilities. It is never run automatically in production.

## HTTP API

The internal liveness endpoint remains unversioned:

```text
GET /health
```

Registry product endpoints are versioned:

```text
POST  /v1/providers
GET   /v1/providers?limit=20&offset=0&status=active
GET   /v1/providers/:slug
PATCH /v1/providers/:slug

POST /v1/providers/:slug/capabilities
GET  /v1/providers/:slug/capabilities
GET  /v1/providers/:slug/capabilities/:capabilityName
PUT  /v1/providers/:slug/capabilities/:capabilityName

POST /v1/inspect
POST /v1/publish
```

`POST /v1/inspect` validates, normalizes, hashes, and diffs a publication without writing it.
`POST /v1/publish` repeats the same plan inside a database transaction and persists provider and
capability changes atomically. Publication mode is currently `merge`: missing registry capabilities
are retained, never deleted or disabled. Identical repeat publications return `unchanged` and avoid
capability writes.

All resource responses use a `{ "data": ... }` envelope. Public requests cannot set verification,
lifecycle, indexing, ownership, or timestamp fields. The API body limit is 2 MiB; a publication may
contain at most 100 capabilities, and each capability's combined schemas may be at most 128 KiB.

## Axiom manifest

`axiom.json` is an Axiom ingestion format, not an official WebMCP specification. It provides a
stable handoff for developer tools while WebMCP continues to evolve.

```json
{
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
      "inputSchema": {
        "type": "object",
        "properties": { "location": { "type": "string" } }
      },
      "annotations": { "readOnly": true }
    }
  ]
}
```

Send the manifest directly—Axiom does not fetch arbitrary URLs in this phase:

```json
{
  "source": "manifest",
  "mode": "merge",
  "manifest": { "version": "1", "provider": {}, "capabilities": [] }
}
```

Direct contract ingestion uses `source: "api"` with top-level `provider` and `capabilities` fields.
The `packages/ingestion` Northstar Commerce fixture demonstrates the full four-capability payload.

## Database workflow

`packages/db/src/schema.ts` is the source of truth. Checked-in SQL migrations are the production
deployment mechanism; automatic schema synchronization is not used.

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:studio
```

The initial migration already includes optional raw-contract storage, provider/capability
uniqueness constraints, and lookup indexes. It enables pgvector for future use but intentionally
defines no embedding column, model, dimension, generation logic, query, or ANN index.

## Validation

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build:all
```

The frontend remains independently available through `npm run dev` and `npm run build`. The API
can be built with `npm run build:api` and started from compiled output with `npm run start:api`.

## Current boundaries

The frontend still uses `MockAxiomClient`; HTTP client wiring is intentionally deferred until the
backend discovery phase. Live website fetching/runtime inspection, semantic discovery, embeddings,
authentication, ownership verification, execution, CLI packages, and SDK packages are not part of
this phase.
