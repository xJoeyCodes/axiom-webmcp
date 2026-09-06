# Axiom hackathon demo

This walkthrough proves the complete MVP loop in about three minutes. It uses the real registry,
publication pipeline, semantic index, HTTP frontend client, agent client, and CLI. Run setup before
the judged walkthrough so infrastructure time is not part of the demo.

## Prepare a deterministic state

1. Copy `.env.example` to `.env` and set `DATABASE_URL`.
2. Use `EMBEDDING_PROVIDER=openai` with a valid `OPENAI_API_KEY`, or explicitly choose
   `EMBEDDING_PROVIDER=fake` for an offline deterministic demo.
3. Start PostgreSQL and prepare the three discovery providers:

```bash
docker compose up -d postgres
npm install
npm run db:migrate
npm run demo:reset
```

`demo:reset` removes only Atlas Dining, Orbit Travel, Pulse Events, and Northstar Commerce, then
recreates Atlas, Orbit, and Pulse and indexes their capabilities. Northstar remains absent for the
live publication step.

Start the API and web application in separate terminals:

```bash
npm run dev:api
npm run dev:web
```

## Judge walkthrough

### 1. Discover by intent

Open `http://localhost:3000` and search for `reserve dinner`. Explain that the browser calls the
real `POST /v1/discover` endpoint and does not contain a query-to-provider lookup. Open Atlas Dining
and expand `make_reservation` to show its normalized input and output contract.

### 2. Publish a new provider

From the repository root, preview and publish the checked-in Northstar Commerce manifest:

```bash
npm exec --workspace @axiom-webmcp/cli -- axiom inspect --file examples/publisher/axiom.json
npm exec --workspace @axiom-webmcp/cli -- axiom publish --yes --file examples/publisher/axiom.json
```

The preview should report four creates. Publication persists the provider and capabilities, then
indexes the changed capabilities. A second inspection should report four unchanged capabilities.

### 3. Prove publish to discover

```bash
npm exec --workspace @axiom-webmcp/cli -- axiom search "put something in my shopping basket"
node examples/agent-discovery/index.mjs http://127.0.0.1:4000 "reserve dinner"
```

The CLI query should rank Northstar Commerce with `add_to_cart`; the agent-client example should
rank Atlas Dining. The web UI, CLI, and agent client all use the same discovery API and registry.

### 4. Show the WebMCP boundary

Open `http://localhost:3000/webmcp-demo` in a compatible Chrome build. For local testing, enable
`chrome://flags/#enable-webmcp-testing` and relaunch Chrome. Select **Verify registered tools** to
read the tools back through `document.modelContext.getTools()`, then select
**Execute search_restaurants** to invoke the browser-mediated tool. The human controls and WebMCP
handlers share the same application functions.

WebMCP is an evolving draft. If the judge environment does not support the experimental browser
API, the page reports that limitation without breaking the normal interface; use the source and
unit test as the registration proof rather than claiming execution occurred.

## Fast acceptance checklist

- `reserve dinner` -> Atlas Dining / `make_reservation`
- `compare flights` -> Orbit Travel / `compare_flights`
- `concert tickets` -> Pulse Events / `check_tickets` or `reserve_ticket`
- publish Northstar -> four capabilities indexed
- `put something in my shopping basket` -> Northstar Commerce / `add_to_cart`
- discovery outage -> explicit unavailable state, never an empty-results message

For a clean rerun, stop the applications and run `npm run demo:reset` again.
