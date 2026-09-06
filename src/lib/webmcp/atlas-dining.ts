export interface AtlasRestaurant {
  readonly id: string;
  readonly name: string;
  readonly cuisine: string;
  readonly location: string;
}

export interface AtlasAvailability {
  readonly restaurantId: string;
  readonly date: string;
  readonly partySize: number;
  readonly slots: readonly string[];
}

export interface AtlasReservation {
  readonly confirmationId: string;
  readonly restaurantId: string;
  readonly time: string;
  readonly guest: {
    readonly name: string;
    readonly email: string;
  };
}

export interface AtlasDiningSnapshot {
  readonly restaurants: readonly AtlasRestaurant[];
  readonly availability: AtlasAvailability | null;
  readonly reservations: readonly AtlasReservation[];
  readonly lastAction: string;
}

export interface SearchRestaurantsInput {
  readonly location: string;
  readonly cuisine?: string;
}

export interface CheckAvailabilityInput {
  readonly restaurantId: string;
  readonly date: string;
  readonly partySize: number;
}

export interface MakeReservationInput {
  readonly restaurantId: string;
  readonly time: string;
  readonly guest: {
    readonly name: string;
    readonly email: string;
  };
}

export interface AtlasDiningApplication {
  getSnapshot(): AtlasDiningSnapshot;
  searchRestaurants(input: SearchRestaurantsInput): readonly AtlasRestaurant[];
  checkAvailability(input: CheckAvailabilityInput): AtlasAvailability;
  makeReservation(input: MakeReservationInput): AtlasReservation;
}

interface WebMcpTool {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: Readonly<Record<string, unknown>>;
  readonly annotations?: Readonly<Record<string, boolean>>;
  execute(input: unknown): string | Promise<string>;
}

export interface RegisteredWebMcpTool {
  readonly name: string;
  readonly description?: string;
}

export interface WebMcpModelContext {
  registerTool(
    tool: WebMcpTool,
    options?: { readonly signal?: AbortSignal },
  ): void | Promise<void>;
  getTools?(): Promise<readonly RegisteredWebMcpTool[]>;
  executeTool?(
    tool: RegisteredWebMcpTool,
    inputArguments: string,
  ): Promise<string | null>;
}

const restaurants: readonly AtlasRestaurant[] = [
  {
    id: "atlas-ember",
    name: "Ember Room",
    cuisine: "Modern African",
    location: "Cape Town",
  },
  {
    id: "atlas-corso",
    name: "Corso",
    cuisine: "Italian",
    location: "Cape Town",
  },
  {
    id: "atlas-kumo",
    name: "Kumo",
    cuisine: "Japanese",
    location: "Johannesburg",
  },
];

const initialSnapshot: AtlasDiningSnapshot = {
  restaurants: [],
  availability: null,
  reservations: [],
  lastAction: "Waiting for an action.",
};

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function createAtlasDiningApplication(
  onChange: (snapshot: AtlasDiningSnapshot) => void = () => undefined,
): AtlasDiningApplication {
  let snapshot = initialSnapshot;

  function update(next: AtlasDiningSnapshot): void {
    snapshot = next;
    onChange(snapshot);
  }

  return {
    getSnapshot: () => snapshot,

    searchRestaurants(input) {
      const location = normalized(input.location);
      const cuisine = normalized(input.cuisine ?? "");
      const matches = restaurants.filter(
        (restaurant) =>
          normalized(restaurant.location).includes(location) &&
          (!cuisine || normalized(restaurant.cuisine).includes(cuisine)),
      );
      update({
        ...snapshot,
        restaurants: matches,
        lastAction: `Found ${matches.length} restaurant${matches.length === 1 ? "" : "s"}.`,
      });
      return matches;
    },

    checkAvailability(input) {
      const availability: AtlasAvailability = {
        restaurantId: input.restaurantId,
        date: input.date,
        partySize: input.partySize,
        slots: ["18:30", "20:00", "21:15"],
      };
      update({
        ...snapshot,
        availability,
        lastAction: `Availability loaded for ${input.restaurantId}.`,
      });
      return availability;
    },

    makeReservation(input) {
      const reservation: AtlasReservation = {
        confirmationId: `AX-${String(snapshot.reservations.length + 1).padStart(4, "0")}`,
        restaurantId: input.restaurantId,
        time: input.time,
        guest: input.guest,
      };
      update({
        ...snapshot,
        reservations: [...snapshot.reservations, reservation],
        lastAction: `Reservation ${reservation.confirmationId} confirmed.`,
      });
      return reservation;
    },
  };
}

function inputRecord(value: unknown): Readonly<Record<string, unknown>> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeError("Tool input must be an object.");
  }
  return value as Readonly<Record<string, unknown>>;
}

function requiredString(
  value: Readonly<Record<string, unknown>>,
  key: string,
): string {
  const item = value[key];
  if (typeof item !== "string" || !item.trim()) {
    throw new TypeError(`${key} must be a non-empty string.`);
  }
  return item.trim();
}

function optionalString(
  value: Readonly<Record<string, unknown>>,
  key: string,
): string | undefined {
  const item = value[key];
  return typeof item === "string" && item.trim() ? item.trim() : undefined;
}

function positiveInteger(
  value: Readonly<Record<string, unknown>>,
  key: string,
): number {
  const item = value[key];
  if (typeof item !== "number" || !Number.isInteger(item) || item < 1) {
    throw new TypeError(`${key} must be a positive integer.`);
  }
  return item;
}

export function getWebMcpModelContext(
  source: unknown,
): WebMcpModelContext | null {
  if (typeof source !== "object" || source === null) return null;
  const candidate = (source as { readonly modelContext?: unknown })
    .modelContext;
  if (typeof candidate !== "object" || candidate === null) return null;
  if (!("registerTool" in candidate)) return null;
  if (typeof candidate.registerTool !== "function") return null;
  return candidate as WebMcpModelContext;
}

export async function registerAtlasDiningTools(
  modelContext: WebMcpModelContext,
  application: AtlasDiningApplication,
  options: { readonly signal?: AbortSignal } = {},
): Promise<{ readonly names: readonly string[]; dispose(): void }> {
  const controller = new AbortController();
  const signal = options.signal ?? controller.signal;
  const tools: readonly WebMcpTool[] = [
    {
      name: "search_restaurants",
      description:
        "Find restaurants by location and optional cuisine preference.",
      inputSchema: {
        type: "object",
        properties: {
          location: { type: "string", description: "City or neighborhood." },
          cuisine: { type: "string", description: "Optional cuisine." },
        },
        required: ["location"],
      },
      annotations: { readOnlyHint: true },
      execute(input) {
        const record = inputRecord(input);
        return JSON.stringify(
          application.searchRestaurants({
            location: requiredString(record, "location"),
            cuisine: optionalString(record, "cuisine"),
          }),
        );
      },
    },
    {
      name: "check_availability",
      description:
        "Check reservation times for a restaurant, date, and party size.",
      inputSchema: {
        type: "object",
        properties: {
          restaurant_id: { type: "string" },
          date: { type: "string", format: "date" },
          party_size: { type: "integer", minimum: 1 },
        },
        required: ["restaurant_id", "date", "party_size"],
      },
      annotations: { readOnlyHint: true },
      execute(input) {
        const record = inputRecord(input);
        return JSON.stringify(
          application.checkAvailability({
            restaurantId: requiredString(record, "restaurant_id"),
            date: requiredString(record, "date"),
            partySize: positiveInteger(record, "party_size"),
          }),
        );
      },
    },
    {
      name: "make_reservation",
      description: "Reserve a selected restaurant time for a confirmed guest.",
      inputSchema: {
        type: "object",
        properties: {
          restaurant_id: { type: "string" },
          time: { type: "string" },
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
      annotations: { readOnlyHint: false, consequentialHint: true },
      execute(input) {
        const record = inputRecord(input);
        const guest = inputRecord(record.guest);
        return JSON.stringify(
          application.makeReservation({
            restaurantId: requiredString(record, "restaurant_id"),
            time: requiredString(record, "time"),
            guest: {
              name: requiredString(guest, "name"),
              email: requiredString(guest, "email"),
            },
          }),
        );
      },
    },
  ];

  for (const tool of tools) {
    await modelContext.registerTool(tool, { signal });
  }

  return {
    names: tools.map((tool) => tool.name),
    dispose: () => controller?.abort(),
  };
}
