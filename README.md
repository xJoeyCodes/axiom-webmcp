# Axiom

Axiom is the open discovery layer for WebMCP. The frontend demonstrates discovery, provider
inspection, and publishing against a typed mock client. The backend workspace now provides a real
provider and capability registry behind a versioned HTTP API.

## Repository structure

```text
src/                  Next.js frontend (kept at the repository root)
apps/api/             Fastify HTTP transport and process lifecycle
packages/core/        Framework-independent domain, repository ports, errors, and utilities
packages/contracts/   Zod request/response contracts shared by clients and the API
packages/registry/    Provider and capability application services
packages/db/          Drizzle schema, PostgreSQL mappings, repositories, migrations, and seed
```

The dependency direction is deliberate:

```text
HTTP route -> registry service -> repository interface -> Drizzle implementation
                         |
                    Axiom Core
```

Core does not import Fastify, Drizzle, PostgreSQL, Next.js, browser APIs, or an embedding provider.
Future WebMCP adapters will normalize draft/spec-specific contracts before handing them to Core;
the optional `raw_contract` database field preserves source material for debugging and migrations.

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
```

All resource responses use a `{ "data": ... }` envelope. Lists add pagination where relevant, and
capability PUT responses include `meta.outcome` as `created`, `updated`, or `unchanged`. Public
provider requests cannot set verification, lifecycle, indexing, or timestamp fields.

Discovery, inspection, authentication, crawling, embeddings, and capability execution are not
implemented in this phase.

## Database workflow

`packages/db/src/schema.ts` is the source of truth. Checked-in SQL migrations are the production
deployment mechanism; automatic schema synchronization is not used.

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:studio
```

The initial migration creates `providers` and `capabilities`, their enums, uniqueness constraints,
foreign key, and lookup indexes. It enables pgvector for future use but intentionally defines no
embedding column, dimension, generation logic, or ANN index.

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

## Frontend compatibility

The frontend's `AxiomClient` continues to use `MockAxiomClient`. The registry transport schemas now
cover provider and capability retrieval needed by a future `HttpAxiomClient`. That adapter should
map ISO timestamps and normalized backend entities into existing UI models rather than importing
database types into React code.
