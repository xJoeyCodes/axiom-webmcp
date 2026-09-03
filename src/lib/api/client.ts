import type { AxiomClient } from "@/lib/api/axiom-client";
import { mockInspectionProvider } from "@/lib/mock/inspection-provider";
import { MockAxiomClient } from "@/lib/mock/mock-axiom-client";
import { mockProviders } from "@/lib/mock/providers";

let client: AxiomClient | undefined;

export function getAxiomClient(): AxiomClient {
  client ??= new MockAxiomClient([...mockProviders, mockInspectionProvider]);
  return client;
}
