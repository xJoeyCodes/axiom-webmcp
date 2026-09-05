# Agent discovery example

This example resolves an intent to a provider and retrieves its capability metadata. It uses no
LLM, browser automation, or execution adapter.

From the repository root:

```bash
npm install
npm run build:client
node examples/agent-discovery/index.mjs http://127.0.0.1:4000 "reserve dinner"
```

For real semantic results, first configure PostgreSQL and OpenAI, apply migrations, seed Atlas
Dining/Orbit Travel/Pulse Events, publish the Northstar Commerce fixture, rebuild the semantic
index, and start the API as described in the root README. This example is a manually invoked live
integration check and is excluded from unit tests.

Other useful goals are `compare flights`, `buy concert tickets`, and `put a product in my basket`.
The script prints the best result plus provider/capability lookup responses, or a controlled SDK
error. Returned URLs are routing information for the caller; the example does not visit them.
