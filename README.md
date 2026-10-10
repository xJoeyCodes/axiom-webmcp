# Axiom

Axiom is an open discovery layer for WebMCP. Website developers publish the actions their sites expose. Agents search those capabilities by intent and find the right website to visit. WebMCP handles the action on that website.

## How it works

1. Describe a website's actions in an Axiom `axiom.json` manifest.
2. Axiom validates, stores, and indexes them.
3. Search for a goal such as “reserve dinner” to find matching websites and actions.

Website developers can use the web app, [CLI](packages/cli/README.md), or [publishing SDK](packages/sdk/README.md). Agent developers can use the [discovery client](packages/client/README.md).

Currently, Axiom inspects supplied manifests and capability contracts. Live website URL scanning is not implemented yet.

## Run locally

Requires Node.js 22+, npm 11+, and Docker with Compose.

```bash
npm install
cp .env.example .env
docker compose up -d postgres
npm run demo:setup
```

Set `OPENAI_API_KEY` in `.env` for OpenAI embeddings, or set `EMBEDDING_PROVIDER=fake` for an offline local demo.

Start the API and web app in separate terminals:

```bash
npm run dev:api
npm run dev:web
```

Open `http://localhost:3000` and search for “reserve dinner” to see Atlas Dining. The API runs at `http://127.0.0.1:4000`.

To try publishing, use the [Northstar Commerce example](examples/publisher/README.md). Once indexed, search for “put a product in my basket” to find its `add_to_cart` capability.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build:all
```
