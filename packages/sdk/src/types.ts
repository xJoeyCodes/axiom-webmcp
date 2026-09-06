import type { z } from "zod";

import type {
  apiPublicationRequestSchema,
  AxiomManifest,
  InspectPublicationResponse as WireInspectPublicationResponse,
  PublishResponse as WirePublishResponse,
  publicationRequestSchema,
} from "../../contracts/src/ingestion.js";

export interface AxiomPublisherOptions {
  readonly baseUrl: string;
  readonly fetch?: typeof globalThis.fetch;
  readonly headers?: NonNullable<RequestInit["headers"]>;
  readonly timeoutMs?: number;
}

export type DirectPublication = Omit<
  z.input<typeof apiPublicationRequestSchema>,
  "source" | "mode"
> & { readonly mode?: "merge" };

export type PublicationInput =
  z.input<typeof publicationRequestSchema> | AxiomManifest | DirectPublication;

export type InspectResult = WireInspectPublicationResponse["data"];
export type PublishResult = WirePublishResponse["data"];
export type {
  AxiomManifest,
  PublicationPlan,
  PublicationWarning,
  PublicationCapabilityChange,
} from "../../contracts/src/ingestion.js";
