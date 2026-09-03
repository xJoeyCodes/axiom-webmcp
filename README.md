# Axiom

Axiom is the open discovery layer for WebMCP. The completed frontend demonstrates discovery,
provider inspection, and publishing against a typed mock client. The Backend Phase 0 workspace
adds the domain, transport, persistence, and HTTP foundations that will replace that mock over
later phases.

## Repository structure

```text
src/                  Next.js frontend (kept at the repository root)
apps/api/             Fastify HTTP transport and process lifecycle
packages/core/        Framework-independent domain, repository ports, errors, and utilities
packages/contracts/   Zod request/response contracts shared by clients and the API
packages/db/          Drizzle schema, PostgreSQL mappings, repositories, and migrations
```

The dependency direction is deliberate:

```text
HTTP route -> application service -> repository interface -> Drizzle implementation
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
npm run dev:api
```

The API exposes one internal liveness endpoint in this phase:

```text
GET http://127.0.0.1:4000/health
```

```json
{ "status": "ok", "service": "axiom-api" }
```

Public product endpoints will be introduced under `/v1` in later backend phases. Discovery,
inspection, publishing, authentication, crawling, embeddings, and capability execution are not
implemented here.

## Database workflow

`packages/db/src/schema.ts` is the source of truth. Checked-in SQL migrations are the production
deployment mechanism; automatic schema synchronization is not used.

```bash
npm run db:generate
npm run db:migrate
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

The frontend's `AxiomClient` continues to use `MockAxiomClient`. The transport schemas define the
future HTTP shapes for `discover`, `getProvider`, `inspect`, and `publish`. An eventual
`HttpAxiomClient` should map ISO timestamps and normalized backend entities into the existing UI
models rather than importing database types into React code.
