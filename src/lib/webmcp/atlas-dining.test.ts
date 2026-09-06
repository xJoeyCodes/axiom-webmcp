import { describe, expect, it, vi } from "vitest";

import {
  createAtlasDiningApplication,
  registerAtlasDiningTools,
  type WebMcpModelContext,
} from "./atlas-dining";

describe("Atlas Dining WebMCP demonstration", () => {
  it("uses the same application behavior for human and WebMCP actions", async () => {
    const changes = vi.fn();
    const application = createAtlasDiningApplication(changes);

    expect(
      application.searchRestaurants({
        location: "Cape Town",
        cuisine: "Italian",
      }),
    ).toHaveLength(1);

    const tools: Array<{
      name: string;
      execute(input: unknown): string | Promise<string>;
    }> = [];
    let registrationSignal: AbortSignal | undefined;
    const modelContext: WebMcpModelContext = {
      registerTool(tool, options) {
        tools.push(tool);
        registrationSignal = options?.signal;
      },
    };

    const registration = await registerAtlasDiningTools(
      modelContext,
      application,
    );
    expect(registration.names).toEqual([
      "search_restaurants",
      "check_availability",
      "make_reservation",
    ]);

    const reservationTool = tools.find(
      (tool) => tool.name === "make_reservation",
    );
    expect(reservationTool).toBeDefined();
    const result = await reservationTool?.execute({
      restaurant_id: "atlas-corso",
      time: "20:00",
      guest: { name: "Ada", email: "ada@example.com" },
    });

    expect(JSON.parse(result ?? "{}")).toMatchObject({
      confirmationId: "AX-0001",
      restaurantId: "atlas-corso",
    });
    expect(application.getSnapshot().reservations).toHaveLength(1);
    expect(changes).toHaveBeenCalled();

    registration.dispose();
    expect(registrationSignal?.aborted).toBe(true);
  });

  it("rejects malformed tool input instead of executing manifest data", async () => {
    const application = createAtlasDiningApplication();
    const tools: Array<{
      name: string;
      execute(input: unknown): string | Promise<string>;
    }> = [];
    await registerAtlasDiningTools(
      {
        registerTool(tool) {
          tools.push(tool);
        },
      },
      application,
    );

    const searchTool = tools.find((tool) => tool.name === "search_restaurants");
    expect(() => searchTool?.execute({ location: "" })).toThrow(
      "location must be a non-empty string.",
    );
  });
});
