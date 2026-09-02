import type { AxiomClient } from "@/lib/api/axiom-client";
import { MockAxiomClient } from "@/lib/mock/mock-axiom-client";

let client: AxiomClient | undefined;

export function getAxiomClient(): AxiomClient {
  client ??= new MockAxiomClient();
  return client;
}
