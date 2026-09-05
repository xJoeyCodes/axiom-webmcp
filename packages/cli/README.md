# @axiom-webmcp/cli

The website-developer CLI for validating, inspecting, publishing, and testing Axiom capability
manifests. It reads JSON contracts as data and communicates with the Axiom API; it does not launch a
browser, inspect runtime page APIs, execute WebMCP capabilities, or run semantic indexing locally.

## Install and run

The package is prepared for publication but has not been published by this phase.

```bash
npm install --global @axiom-webmcp/cli
axiom --help
```

The package exposes an executable named `axiom`. Before publication, use the workspace command
`npm exec --workspace @axiom-webmcp/cli -- axiom ...`. Once published, the scoped-package form is
`npx @axiom-webmcp/cli ...`; the ideal `npx axiom` package-name experience requires a separate npm
branding decision.

## Commands

```bash
axiom init
axiom inspect
axiom publish --yes
axiom search "book a restaurant"
```

`init` safely creates `./axiom.json` with a starter contract and never overwrites an existing file.
`inspect` validates the manifest locally, then calls `POST /v1/inspect` and prints the publication
plan. `publish` reuses inspection, skips a no-change publication, confirms changes interactively,
then calls `POST /v1/publish`. In CI, `--yes` is required. `search` delegates to
`@axiom-webmcp/client` and prints provider scores plus matched capability names.

Inspect and publish accept exactly one override convention:

```bash
axiom inspect --file ./config/axiom.json
axiom publish --file ./config/axiom.json --yes
```

The default is only `./axiom.json`; the CLI does not recursively search directories. Manifests must
be valid JSON, use Axiom manifest version `1`, pass the shared schema, and remain within 2 MB. The
manifest is an Axiom ingestion convention rather than an official WebMCP standard. Schema and
manifest contents are never executed or dynamically imported.

## Configuration

Resolution order is command flag, environment, then local development default:

```text
--base-url
AXIOM_BASE_URL
http://127.0.0.1:4000
```

```bash
AXIOM_BASE_URL=http://127.0.0.1:4000 axiom inspect
axiom --base-url http://127.0.0.1:4000 publish --yes
```

Authentication is not implemented. The design leaves custom SDK headers available for future
trusted callers, but the CLI does not accept or store an API key in this phase.

## Machine-readable output

```bash
axiom inspect --json
axiom publish --yes --json
axiom search "search products" --json
```

Success writes only valid JSON to stdout. Errors leave stdout empty and write a JSON error object to
stderr. Publish JSON contains `{ inspection, publication }`; an up-to-date publication returns
`{ status: "unchanged", inspection }`; cancellation returns `{ status: "cancelled" }`.

Exit codes are stable:

- `0`: success, no changes, or user cancellation;
- `1`: network, timeout, server, or unexpected failure;
- `2`: command, configuration, manifest, or request validation failure.

`--debug` appends a stack trace to stderr. It does not log headers, payloads, environment values, or
secrets. Normal output is deterministic, monochrome, and meaningful without terminal color.

## Local demo

Use `examples/publisher/axiom.json` with the local backend:

```bash
axiom inspect --file ./examples/publisher/axiom.json
axiom publish --yes --file ./examples/publisher/axiom.json
axiom search "put something in my shopping basket"
```

With PostgreSQL, OpenAI credentials, migrations, and indexing configured, Northstar Commerce should
rank strongly for product and shopping-cart intents. Unit tests inject SDK/client services and do
not require OpenAI or a running API. See the example README for the optional live workflow.

The package is MIT licensed and targets Node.js 20+.
