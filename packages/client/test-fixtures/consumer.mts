import {
  Axiom,
  AxiomError,
  type AxiomOptions,
  type Capability,
  type DiscoveryResponse,
  type Provider,
} from "@axiom-webmcp/client";

const options: AxiomOptions = {
  baseUrl: "https://api.example.com",
  fetch: async (url, init) => {
    if (
      String(url) !== "https://api.example.com/v1/discover" ||
      init?.method !== "POST"
    ) {
      throw new Error("Unexpected SDK request");
    }
    return new Response(
      JSON.stringify({
        data: { query: { intent: "dinner" }, results: [], count: 0 },
      }),
    );
  },
};

const client = new Axiom(options);
const result: DiscoveryResponse = await client.discover({ intent: "dinner" });
const providerLookup: Promise<Provider> | undefined = undefined;
const capabilityLookup: Promise<Capability[]> | undefined = undefined;
void providerLookup;
void capabilityLookup;

if (result.count !== 0 || result.query.intent !== "dinner") {
  throw new Error("Unexpected SDK result");
}
try {
  await client.discover({ intent: " " });
  throw new Error("Invalid input unexpectedly accepted");
} catch (error) {
  if (!(error instanceof AxiomError) || error.code !== "VALIDATION_ERROR")
    throw error;
}
console.info(
  "Packed SDK: ESM imports, declarations, discovery, and validation passed.",
);
