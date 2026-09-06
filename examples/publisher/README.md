# Northstar Commerce publisher example

This directory contains an Axiom manifest for four WebMCP capability contracts:
`search_products`, `get_product`, `add_to_cart`, and `checkout`.

From the repository root, build the packages and run:

```bash
npm exec --workspace @axiom-webmcp/cli -- axiom inspect --file ./examples/publisher/axiom.json
npm exec --workspace @axiom-webmcp/cli -- axiom publish --yes --file ./examples/publisher/axiom.json
npm exec --workspace @axiom-webmcp/cli -- axiom search "put something in my shopping basket"
```

The first command validates the local JSON and previews backend changes. The second publishes the
same manifest through the transactional ingestion pipeline and reports indexing status. The third
tests discoverability through the agent client.

For a live semantic result, configure `DATABASE_URL` and `OPENAI_API_KEY`, run the checked-in
migrations, start the API, and ensure embeddings are ready. Re-run inspect to see unchanged results,
then edit the `add_to_cart` description to preview one update. No command visits the fictional
provider URL or executes any manifest content.
