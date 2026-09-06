import "dotenv/config";

import {
  createCapabilityContentHash,
  type Capability,
  type CapabilityAnnotations,
  type CapabilitySchema,
  type Provider,
} from "@axiom/core";

import { createDatabase } from "./client.js";
import { DrizzleCapabilityRepository } from "./repositories/drizzle-capability-repository.js";
import { DrizzleProviderRepository } from "./repositories/drizzle-provider-repository.js";

interface SeedCapability {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly inputSchema: CapabilitySchema;
  readonly outputSchema: CapabilitySchema;
  readonly annotations: CapabilityAnnotations;
  readonly specVersion: string;
}

interface SeedProvider {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly domain: string;
  readonly description: string;
  readonly lastIndexedAt: string;
  readonly capabilities: readonly SeedCapability[];
}

const searchAnnotations: CapabilityAnnotations = {
  readOnly: true,
  destructive: false,
  sideEffecting: false,
  requiresConfirmation: false,
};

const actionAnnotations: CapabilityAnnotations = {
  readOnly: false,
  destructive: false,
  sideEffecting: true,
  requiresConfirmation: true,
};

const seedProviders: readonly SeedProvider[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    slug: "atlas-dining",
    name: "Atlas Dining",
    domain: "atlasdining.example",
    description:
      "Restaurant discovery and reservation infrastructure for independent dining rooms across major cities.",
    lastIndexedAt: "2026-08-29T14:22:00.000Z",
    capabilities: [
      {
        id: "a1111111-1111-4111-8111-111111111111",
        name: "search_restaurants",
        description:
          "Find restaurants by location, cuisine, party size, date, and dining preferences.",
        inputSchema: {
          type: "object",
          properties: {
            location: { type: "string", description: "City or neighborhood." },
            cuisine: { type: "string" },
            party_size: { type: "integer", minimum: 1 },
          },
          required: ["location"],
        },
        outputSchema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              restaurant_id: { type: "string" },
              name: { type: "string" },
              cuisine: { type: "string" },
            },
            required: ["restaurant_id", "name"],
          },
        },
        annotations: searchAnnotations,
        specVersion: "draft-2026-08",
      },
      {
        id: "a2222222-2222-4222-8222-222222222222",
        name: "check_availability",
        description:
          "Check live table availability for a restaurant, service date, time, and party size.",
        inputSchema: {
          type: "object",
          properties: {
            restaurant_id: { type: "string" },
            date: { type: "string", format: "date" },
            party_size: { type: "integer", minimum: 1 },
          },
          required: ["restaurant_id", "date", "party_size"],
        },
        outputSchema: {
          type: "array",
          items: { type: "string", format: "date-time" },
        },
        annotations: searchAnnotations,
        specVersion: "draft-2026-08",
      },
      {
        id: "a3333333-3333-4333-8333-333333333333",
        name: "make_reservation",
        description:
          "Reserve a restaurant table for a confirmed guest and selected time.",
        inputSchema: {
          type: "object",
          properties: {
            restaurant_id: { type: "string" },
            time: { type: "string", format: "date-time" },
            guest: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string", format: "email" },
              },
              required: ["name", "email"],
            },
          },
          required: ["restaurant_id", "time", "guest"],
        },
        outputSchema: {
          type: "object",
          properties: {
            confirmation_id: { type: "string" },
            status: { type: "string", enum: ["confirmed"] },
          },
          required: ["confirmation_id", "status"],
        },
        annotations: actionAnnotations,
        specVersion: "draft-2026-08",
      },
    ],
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    slug: "orbit-travel",
    name: "Orbit Travel",
    domain: "orbittravel.example",
    description:
      "Flight search, comparison, and reservation tools spanning domestic and international carriers.",
    lastIndexedAt: "2026-08-31T09:08:00.000Z",
    capabilities: [
      {
        id: "b1111111-1111-4111-8111-111111111111",
        name: "search_flights",
        description:
          "Find available flights by origin, destination, travel dates, and passenger count.",
        inputSchema: {
          type: "object",
          properties: {
            origin: { type: "string" },
            destination: { type: "string" },
            departure_date: { type: "string", format: "date" },
            passengers: { type: "integer", minimum: 1 },
          },
          required: ["origin", "destination", "departure_date"],
        },
        outputSchema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              itinerary_id: { type: "string" },
              carrier: { type: "string" },
              total_price: { type: "number" },
            },
            required: ["itinerary_id", "carrier", "total_price"],
          },
        },
        annotations: searchAnnotations,
        specVersion: "draft-2026-08",
      },
      {
        id: "b2222222-2222-4222-8222-222222222222",
        name: "compare_flights",
        description:
          "Compare selected itineraries by price, duration, stops, and fare conditions.",
        inputSchema: {
          type: "object",
          properties: {
            itinerary_ids: { type: "array", items: { type: "string" } },
            sort_by: { type: "string", enum: ["price", "duration", "stops"] },
          },
          required: ["itinerary_ids"],
        },
        outputSchema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              itinerary_id: { type: "string" },
              rank: { type: "integer" },
            },
            required: ["itinerary_id", "rank"],
          },
        },
        annotations: searchAnnotations,
        specVersion: "draft-2026-08",
      },
      {
        id: "b3333333-3333-4333-8333-333333333333",
        name: "reserve_flight",
        description:
          "Hold a selected itinerary and create a time-limited flight reservation.",
        inputSchema: {
          type: "object",
          properties: {
            itinerary_id: { type: "string" },
            travelers: { type: "array", items: { type: "object" } },
          },
          required: ["itinerary_id", "travelers"],
        },
        outputSchema: {
          type: "object",
          properties: {
            reservation_id: { type: "string" },
            expires_at: { type: "string", format: "date-time" },
          },
          required: ["reservation_id", "expires_at"],
        },
        annotations: actionAnnotations,
        specVersion: "draft-2026-08",
      },
    ],
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    slug: "pulse-events",
    name: "Pulse Events",
    domain: "pulseevents.example",
    description:
      "Live event discovery and ticket reservation across music, culture, sport, and local venues.",
    lastIndexedAt: "2026-09-01T18:40:00.000Z",
    capabilities: [
      {
        id: "c1111111-1111-4111-8111-111111111111",
        name: "search_events",
        description:
          "Find concerts, performances, sports, and community events by place and date.",
        inputSchema: {
          type: "object",
          properties: {
            location: { type: "string" },
            category: { type: "string" },
            date: { type: "string", format: "date" },
          },
          required: ["location"],
        },
        outputSchema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              event_id: { type: "string" },
              name: { type: "string" },
              venue: { type: "string" },
            },
            required: ["event_id", "name", "venue"],
          },
        },
        annotations: searchAnnotations,
        specVersion: "draft-2026-08",
      },
      {
        id: "c2222222-2222-4222-8222-222222222222",
        name: "check_tickets",
        description:
          "Check ticket inventory, sections, quantities, and current prices for an event.",
        inputSchema: {
          type: "object",
          properties: {
            event_id: { type: "string" },
            quantity: { type: "integer", minimum: 1 },
          },
          required: ["event_id"],
        },
        outputSchema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              ticket_type_id: { type: "string" },
              price: { type: "number" },
              currency: { type: "string" },
            },
            required: ["ticket_type_id", "price", "currency"],
          },
        },
        annotations: searchAnnotations,
        specVersion: "draft-2026-08",
      },
      {
        id: "c3333333-3333-4333-8333-333333333333",
        name: "reserve_ticket",
        description:
          "Reserve tickets for a selected event and ticket type before checkout.",
        inputSchema: {
          type: "object",
          properties: {
            event_id: { type: "string" },
            ticket_type_id: { type: "string" },
            quantity: { type: "integer", minimum: 1 },
          },
          required: ["event_id", "ticket_type_id", "quantity"],
        },
        outputSchema: {
          type: "object",
          properties: {
            hold_id: { type: "string" },
            expires_at: { type: "string", format: "date-time" },
            subtotal: { type: "number" },
          },
          required: ["hold_id", "expires_at", "subtotal"],
        },
        annotations: actionAnnotations,
        specVersion: "draft-2026-08",
      },
    ],
  },
];

async function seed(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to seed the registry.");
  }

  const database = createDatabase(databaseUrl);
  const providerRepository = new DrizzleProviderRepository(database.db);
  const capabilityRepository = new DrizzleCapabilityRepository(database.db);
  const now = new Date();

  try {
    for (const seedProvider of seedProviders) {
      const existingProvider = await providerRepository.findByDomain(
        seedProvider.domain,
      );
      const provider: Provider = {
        id: existingProvider?.id ?? seedProvider.id,
        slug: seedProvider.slug,
        name: seedProvider.name,
        domain: seedProvider.domain,
        canonicalUrl: `https://${seedProvider.domain}`,
        description: seedProvider.description,
        verificationStatus: "verified",
        status: "active",
        lastIndexedAt: new Date(seedProvider.lastIndexedAt),
        createdAt: existingProvider?.createdAt ?? now,
        updatedAt: now,
      };
      const storedProvider = await providerRepository.upsert(provider);

      for (const seedCapability of seedProvider.capabilities) {
        const existingCapability =
          await capabilityRepository.findByProviderAndName(
            storedProvider.id,
            seedCapability.name,
          );
        const capabilityContract = {
          name: seedCapability.name,
          description: seedCapability.description,
          inputSchema: seedCapability.inputSchema,
          outputSchema: seedCapability.outputSchema,
          annotations: seedCapability.annotations,
        };
        const capability: Capability = {
          id: existingCapability?.id ?? seedCapability.id,
          providerId: storedProvider.id,
          ...capabilityContract,
          specVersion: seedCapability.specVersion,
          source: "manifest",
          status: "active",
          contentHash: createCapabilityContentHash(capabilityContract),
          createdAt: existingCapability?.createdAt ?? now,
          updatedAt: now,
        };
        await capabilityRepository.upsert(capability);
      }
    }

    process.stdout.write(
      `Seeded ${seedProviders.length} providers and ${seedProviders.reduce((total, provider) => total + provider.capabilities.length, 0)} capabilities.\n`,
    );
  } finally {
    await database.client.end({ timeout: 5 });
  }
}

seed().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown seed error";
  process.stderr.write(`Registry seed failed: ${message}\n`);
  process.exitCode = 1;
});
