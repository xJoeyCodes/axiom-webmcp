"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createAtlasDiningApplication,
  getWebMcpModelContext,
  registerAtlasDiningTools,
  type AtlasDiningSnapshot,
} from "@/lib/webmcp/atlas-dining";

const emptySnapshot: AtlasDiningSnapshot = {
  restaurants: [],
  availability: null,
  reservations: [],
  lastAction: "Waiting for an action.",
};

const demoToolNames = new Set([
  "search_restaurants",
  "check_availability",
  "make_reservation",
]);

export function AtlasDiningDemo() {
  const [snapshot, setSnapshot] = useState(emptySnapshot);
  const [location, setLocation] = useState("Cape Town");
  const [cuisine, setCuisine] = useState("");
  const [webMcpStatus, setWebMcpStatus] = useState(
    "Checking browser support...",
  );
  const [toolOutput, setToolOutput] = useState("");
  const application = useMemo(
    () => createAtlasDiningApplication(setSnapshot),
    [],
  );

  useEffect(() => {
    const modelContext = getWebMcpModelContext(document);
    if (!modelContext) {
      setWebMcpStatus(
        "WebMCP is unavailable. Enable the experimental browser feature to register tools.",
      );
      return;
    }

    let disposed = false;
    const controller = new AbortController();
    let disposeRegistration: (() => void) | undefined;
    void registerAtlasDiningTools(modelContext, application, {
      signal: controller.signal,
    })
      .then((registration) => {
        if (disposed) {
          registration.dispose();
          return;
        }
        disposeRegistration = registration.dispose;
        setWebMcpStatus(
          `${registration.names.length} WebMCP tools registered on document.modelContext.`,
        );
      })
      .catch(() => {
        if (disposed) return;
        setWebMcpStatus(
          "The browser rejected WebMCP registration. Check the feature flag and permissions.",
        );
      });

    return () => {
      disposed = true;
      controller.abort();
      disposeRegistration?.();
    };
  }, [application]);

  function search(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    application.searchRestaurants({ location, cuisine });
  }

  async function verifyTools(): Promise<void> {
    const modelContext = getWebMcpModelContext(document);
    if (!modelContext?.getTools) {
      setWebMcpStatus("This browser does not expose WebMCP tool inspection.");
      return;
    }
    try {
      const tools = await modelContext.getTools();
      const registered = tools.filter((tool) => demoToolNames.has(tool.name));
      setWebMcpStatus(
        `${registered.length}/3 Atlas tools visible: ${registered.map((tool) => tool.name).join(", ") || "none"}.`,
      );
    } catch {
      setWebMcpStatus("The browser could not inspect registered WebMCP tools.");
    }
  }

  async function executeSearchTool(): Promise<void> {
    const modelContext = getWebMcpModelContext(document);
    if (!modelContext?.getTools || !modelContext.executeTool) {
      setToolOutput("WebMCP tool execution is unavailable in this browser.");
      return;
    }
    try {
      const tools = await modelContext.getTools();
      const tool = tools.find((item) => item.name === "search_restaurants");
      if (!tool) {
        setToolOutput("search_restaurants is not visible to this document.");
        return;
      }
      const result = await modelContext.executeTool(
        tool,
        JSON.stringify({ location: "Cape Town", cuisine: "Italian" }),
      );
      setToolOutput(result ?? "Tool completed without a text result.");
    } catch {
      setToolOutput("The browser could not execute search_restaurants.");
    }
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
      <section aria-labelledby="atlas-human-ui">
        <h2
          id="atlas-human-ui"
          className="text-foreground text-xl tracking-[-0.02em]"
        >
          Human interface
        </h2>
        <p className="text-secondary mt-3 max-w-xl text-sm leading-6">
          These controls and the registered WebMCP tools call the same in-page
          application functions.
        </p>

        <form onSubmit={search} className="border-border mt-8 border-t pt-7">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-secondary text-xs">
              Location
              <Input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="mt-2"
                required
              />
            </label>
            <label className="text-secondary text-xs">
              Cuisine
              <Input
                value={cuisine}
                onChange={(event) => setCuisine(event.target.value)}
                className="mt-2"
                placeholder="Optional"
              />
            </label>
          </div>
          <Button type="submit" className="mt-5">
            Search restaurants
          </Button>
        </form>

        <div className="border-border mt-8 border-t" aria-live="polite">
          {snapshot.restaurants.length ? (
            <ul>
              {snapshot.restaurants.map((restaurant) => (
                <li
                  key={restaurant.id}
                  className="border-border grid gap-3 border-b py-5 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <p className="text-foreground">{restaurant.name}</p>
                    <p className="text-muted mt-1 font-mono text-[11px]">
                      {restaurant.cuisine} / {restaurant.location}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      application.checkAvailability({
                        restaurantId: restaurant.id,
                        date: "2026-09-06",
                        partySize: 2,
                      })
                    }
                  >
                    Check availability
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted py-7 text-sm">No search run yet.</p>
          )}
        </div>

        {snapshot.availability ? (
          <div className="border-border mt-8 border p-5">
            <p className="text-muted font-mono text-[10px] tracking-[0.12em] uppercase">
              Available times
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {snapshot.availability.slots.map((slot) => (
                <Button
                  key={slot}
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    application.makeReservation({
                      restaurantId: snapshot.availability!.restaurantId,
                      time: slot,
                      guest: { name: "Demo Guest", email: "demo@example.com" },
                    })
                  }
                >
                  Reserve {slot}
                </Button>
              ))}
            </div>
          </div>
        ) : null}

        <p className="text-secondary mt-6 font-mono text-xs" aria-live="polite">
          {snapshot.lastAction}
        </p>
      </section>

      <aside className="border-border border-t pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
        <p className="text-muted font-mono text-[10px] tracking-[0.14em] uppercase">
          WebMCP proof
        </p>
        <p className="text-secondary mt-4 text-sm leading-6" aria-live="polite">
          {webMcpStatus}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button variant="secondary" onClick={() => void verifyTools()}>
            Verify registered tools
          </Button>
          <Button variant="secondary" onClick={() => void executeSearchTool()}>
            Execute search_restaurants
          </Button>
        </div>
        {toolOutput ? (
          <pre className="border-border text-secondary mt-6 max-h-56 overflow-auto border-t pt-5 font-mono text-[10px] leading-5 break-all whitespace-pre-wrap">
            {toolOutput}
          </pre>
        ) : null}
        <p className="text-muted mt-7 text-xs leading-5">
          Requires a browser build with the experimental WebMCP API enabled.
          Without it, the normal interface remains fully usable.
        </p>
      </aside>
    </div>
  );
}
