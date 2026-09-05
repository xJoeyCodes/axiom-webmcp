import {
  axiomManifestSchema,
  inspectPublicationResponseSchema,
  publicationRequestSchema,
  publishResponseSchema,
  type InspectPublicationRequest,
} from "../../contracts/src/ingestion.js";
import { PublisherTransport, validate } from "./transport.js";
import type {
  AxiomPublisherOptions,
  InspectResult,
  PublicationInput,
  PublishResult,
} from "./types.js";

function normalizePublication(
  input: PublicationInput,
): InspectPublicationRequest {
  if ("source" in input) {
    return validate(publicationRequestSchema, input);
  }
  if ("version" in input) {
    return {
      source: "manifest",
      mode: "merge",
      manifest: validate(axiomManifestSchema, input),
    };
  }
  return validate(publicationRequestSchema, {
    source: "api",
    mode: input.mode ?? "merge",
    provider: input.provider,
    capabilities: input.capabilities,
  });
}

/** Programmatic inspection and publishing client for website developers. */
export class AxiomPublisher {
  private readonly transport: PublisherTransport;

  constructor(options: AxiomPublisherOptions) {
    this.transport = new PublisherTransport(options);
  }

  /** Validate and preview a publication without persisting registry changes. */
  async inspect(publication: PublicationInput): Promise<InspectResult> {
    const input = normalizePublication(publication);
    return (
      await this.transport.post(
        "/v1/inspect",
        input,
        inspectPublicationResponseSchema,
      )
    ).data;
  }

  /** Publish normalized contracts and return registry and indexing outcomes. */
  async publish(publication: PublicationInput): Promise<PublishResult> {
    const input = normalizePublication(publication);
    return (
      await this.transport.post("/v1/publish", input, publishResponseSchema)
    ).data;
  }
}
