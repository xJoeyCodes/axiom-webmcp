import type { Provider } from "@/lib/types/axiom";

export const mockProviders: Provider[] = [
  {
    id: "provider_atlas_dining",
    slug: "atlas-dining",
    name: "Atlas Dining",
    domain: "atlasdining.example",
    description:
      "Restaurant discovery and reservation infrastructure for independent dining rooms across major cities.",
    verified: true,
    verificationStatus: "verified",
    lastIndexed: "2026-08-29T14:22:00.000Z",
    metadata: {
      industry: "Hospitality",
      location: "Global",
      documentationUrl: "https://atlasdining.example/developers/webmcp",
    },
    capabilities: [
      {
        id: "cap_atlas_search_restaurants",
        name: "search_restaurants",
        description:
          "Find restaurants by location, cuisine, party size, date, and dining preferences.",
        inputs: [
          {
            name: "location",
            description: "City, neighborhood, or geographic search area.",
            required: true,
            schema: { type: "string", examples: ["Cape Town"] },
          },
          {
            name: "cuisine",
            description: "Optional cuisine or dining style.",
            required: false,
            schema: { type: "string", examples: ["Japanese"] },
          },
          {
            name: "party_size",
            description: "Number of guests.",
            required: false,
            schema: { type: "integer", default: 2 },
          },
        ],
        output: {
          description: "Ranked restaurants matching the requested constraints.",
          schema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                restaurant_id: { type: "string" },
                name: { type: "string" },
                cuisine: { type: "string" },
                neighborhood: { type: "string" },
              },
              required: ["restaurant_id", "name"],
            },
          },
        },
        metadata: {
          version: "1.2.0",
          category: "discovery",
          tags: ["restaurant", "dining", "dinner", "food", "find"],
          transport: "webmcp",
          destructive: false,
          requiresConfirmation: false,
        },
      },
      {
        id: "cap_atlas_check_availability",
        name: "check_availability",
        description:
          "Check live table availability for a restaurant, service date, time, and party size.",
        inputs: [
          {
            name: "restaurant_id",
            description: "Atlas restaurant identifier.",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "date",
            description: "Local service date.",
            required: true,
            schema: { type: "string", format: "date" },
          },
          {
            name: "party_size",
            description: "Number of guests.",
            required: true,
            schema: { type: "integer" },
          },
        ],
        output: {
          description: "Available reservation times.",
          schema: {
            type: "array",
            items: { type: "string", format: "date-time" },
          },
        },
        metadata: {
          version: "1.1.0",
          category: "availability",
          tags: ["restaurant", "table", "availability", "dinner"],
          transport: "webmcp",
          destructive: false,
          requiresConfirmation: false,
        },
      },
      {
        id: "cap_atlas_make_reservation",
        name: "make_reservation",
        description:
          "Reserve a restaurant table for a confirmed guest and selected time.",
        inputs: [
          {
            name: "restaurant_id",
            description: "Atlas restaurant identifier.",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "time",
            description: "Selected reservation time.",
            required: true,
            schema: { type: "string", format: "date-time" },
          },
          {
            name: "guest",
            description: "Lead guest details.",
            required: true,
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string", format: "email" },
              },
              required: ["name", "email"],
            },
          },
        ],
        output: {
          description: "Confirmed reservation record.",
          schema: {
            type: "object",
            properties: {
              confirmation_id: { type: "string" },
              status: { type: "string", enum: ["confirmed"] },
            },
            required: ["confirmation_id", "status"],
          },
        },
        metadata: {
          version: "1.3.0",
          category: "transaction",
          tags: [
            "restaurant",
            "reserve",
            "reservation",
            "book",
            "dinner",
            "table",
          ],
          transport: "webmcp",
          destructive: true,
          requiresConfirmation: true,
        },
      },
    ],
  },
  {
    id: "provider_orbit_travel",
    slug: "orbit-travel",
    name: "Orbit Travel",
    domain: "orbittravel.example",
    description:
      "Flight search, comparison, and reservation tools spanning domestic and international carriers.",
    verified: true,
    verificationStatus: "verified",
    lastIndexed: "2026-08-31T09:08:00.000Z",
    metadata: {
      industry: "Travel",
      location: "Global",
      documentationUrl: "https://orbittravel.example/webmcp",
    },
    capabilities: [
      {
        id: "cap_orbit_search_flights",
        name: "search_flights",
        description:
          "Find available flights by origin, destination, travel dates, and passenger count.",
        inputs: [
          {
            name: "origin",
            description: "Origin airport IATA code.",
            required: true,
            schema: { type: "string", examples: ["CPT"] },
          },
          {
            name: "destination",
            description: "Destination airport IATA code.",
            required: true,
            schema: { type: "string", examples: ["LHR"] },
          },
          {
            name: "departure_date",
            description: "Requested departure date.",
            required: true,
            schema: { type: "string", format: "date" },
          },
          {
            name: "passengers",
            description: "Number of travelers.",
            required: false,
            schema: { type: "integer", default: 1 },
          },
        ],
        output: {
          description: "Available flight itineraries.",
          schema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                itinerary_id: { type: "string" },
                carrier: { type: "string" },
                total_price: { type: "number" },
                currency: { type: "string" },
              },
              required: ["itinerary_id", "carrier", "total_price", "currency"],
            },
          },
        },
        metadata: {
          version: "2.0.0",
          category: "discovery",
          tags: ["flight", "fly", "airfare", "travel", "trip", "find"],
          transport: "webmcp",
          destructive: false,
          requiresConfirmation: false,
        },
      },
      {
        id: "cap_orbit_compare_flights",
        name: "compare_flights",
        description:
          "Compare selected itineraries by price, duration, stops, and fare conditions.",
        inputs: [
          {
            name: "itinerary_ids",
            description: "Two or more Orbit itinerary identifiers.",
            required: true,
            schema: { type: "array", items: { type: "string" } },
          },
          {
            name: "sort_by",
            description: "Preferred comparison priority.",
            required: false,
            schema: {
              type: "string",
              enum: ["price", "duration", "stops"],
              default: "price",
            },
          },
        ],
        output: {
          description: "Normalized comparison of selected flights.",
          schema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                itinerary_id: { type: "string" },
                rank: { type: "integer" },
                summary: { type: "string" },
              },
              required: ["itinerary_id", "rank"],
            },
          },
        },
        metadata: {
          version: "1.4.0",
          category: "comparison",
          tags: ["flight", "compare", "airfare", "travel"],
          transport: "webmcp",
          destructive: false,
          requiresConfirmation: false,
        },
      },
      {
        id: "cap_orbit_reserve_flight",
        name: "reserve_flight",
        description:
          "Hold a selected itinerary and create a time-limited flight reservation.",
        inputs: [
          {
            name: "itinerary_id",
            description: "Selected Orbit itinerary identifier.",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "travelers",
            description: "Passenger identity details.",
            required: true,
            schema: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  given_name: { type: "string" },
                  family_name: { type: "string" },
                },
                required: ["given_name", "family_name"],
              },
            },
          },
        ],
        output: {
          description: "A held itinerary with an expiration time.",
          schema: {
            type: "object",
            properties: {
              reservation_id: { type: "string" },
              expires_at: { type: "string", format: "date-time" },
            },
            required: ["reservation_id", "expires_at"],
          },
        },
        metadata: {
          version: "1.7.0",
          category: "transaction",
          tags: ["flight", "reserve", "reservation", "book", "travel"],
          transport: "webmcp",
          destructive: true,
          requiresConfirmation: true,
        },
      },
    ],
  },
  {
    id: "provider_pulse_events",
    slug: "pulse-events",
    name: "Pulse Events",
    domain: "pulseevents.example",
    description:
      "Live event discovery and ticket reservation across music, culture, sport, and local venues.",
    verified: true,
    verificationStatus: "verified",
    lastIndexed: "2026-09-01T18:40:00.000Z",
    metadata: {
      industry: "Events",
      location: "Global",
      documentationUrl: "https://pulseevents.example/platform/webmcp",
    },
    capabilities: [
      {
        id: "cap_pulse_search_events",
        name: "search_events",
        description:
          "Find concerts, performances, sports, and community events by place and date.",
        inputs: [
          {
            name: "location",
            description: "City or geographic search area.",
            required: true,
            schema: { type: "string", examples: ["Johannesburg"] },
          },
          {
            name: "date_range",
            description: "Inclusive event date range.",
            required: false,
            schema: {
              type: "object",
              properties: {
                start: { type: "string", format: "date" },
                end: { type: "string", format: "date" },
              },
            },
          },
          {
            name: "category",
            description: "Optional event category.",
            required: false,
            schema: { type: "string", examples: ["music"] },
          },
        ],
        output: {
          description: "Events matching the requested filters.",
          schema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                event_id: { type: "string" },
                name: { type: "string" },
                venue: { type: "string" },
                starts_at: { type: "string", format: "date-time" },
              },
              required: ["event_id", "name", "venue", "starts_at"],
            },
          },
        },
        metadata: {
          version: "1.5.0",
          category: "discovery",
          tags: ["event", "concert", "show", "sport", "find"],
          transport: "webmcp",
          destructive: false,
          requiresConfirmation: false,
        },
      },
      {
        id: "cap_pulse_check_tickets",
        name: "check_tickets",
        description:
          "Check ticket inventory, sections, quantities, and current prices for an event.",
        inputs: [
          {
            name: "event_id",
            description: "Pulse event identifier.",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "quantity",
            description: "Number of tickets needed.",
            required: false,
            schema: { type: "integer", default: 1 },
          },
        ],
        output: {
          description: "Available ticket groups and prices.",
          schema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ticket_type_id: { type: "string" },
                section: { type: "string" },
                price: { type: "number" },
                currency: { type: "string" },
              },
              required: ["ticket_type_id", "price", "currency"],
            },
          },
        },
        metadata: {
          version: "1.2.0",
          category: "availability",
          tags: ["event", "ticket", "tickets", "availability", "price"],
          transport: "webmcp",
          destructive: false,
          requiresConfirmation: false,
        },
      },
      {
        id: "cap_pulse_reserve_ticket",
        name: "reserve_ticket",
        description:
          "Reserve tickets for a selected event and ticket type before checkout.",
        inputs: [
          {
            name: "event_id",
            description: "Pulse event identifier.",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "ticket_type_id",
            description: "Selected ticket group identifier.",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "quantity",
            description: "Number of tickets to reserve.",
            required: true,
            schema: { type: "integer" },
          },
        ],
        output: {
          description: "A temporary ticket hold ready for checkout.",
          schema: {
            type: "object",
            properties: {
              hold_id: { type: "string" },
              expires_at: { type: "string", format: "date-time" },
              subtotal: { type: "number" },
            },
            required: ["hold_id", "expires_at", "subtotal"],
          },
        },
        metadata: {
          version: "1.6.0",
          category: "transaction",
          tags: ["event", "ticket", "tickets", "reserve", "buy", "book"],
          transport: "webmcp",
          destructive: true,
          requiresConfirmation: true,
        },
      },
    ],
  },
];
