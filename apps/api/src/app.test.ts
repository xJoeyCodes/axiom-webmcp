import { afterEach, describe, expect, it } from "vitest";

import { createApp } from "./app.js";
import type { Environment } from "./config/environment.js";

const environment: Environment = {
  NODE_ENV: "test",
  API_HOST: "127.0.0.1",
  PORT: 4_000,
  DATABASE_URL: "postgresql://axiom:axiom@localhost:5432/axiom_test",
  LOG_LEVEL: "silent",
  CORS_ORIGINS: ["http://localhost:3000"],
};

const applications: Awaited<ReturnType<typeof createApp>>[] = [];

afterEach(async () => {
  await Promise.all(applications.splice(0).map((app) => app.close()));
});

describe("API application", () => {
  it("responds to the health endpoint", async () => {
    const app = await createApp({ environment, logger: false });
    applications.push(app);

    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok", service: "axiom-api" });
    expect(response.headers["x-powered-by"]).toBeUndefined();
  });

  it("returns a stable not-found response without exposing internals", async () => {
    const app = await createApp({ environment, logger: false });
    applications.push(app);

    const response = await app.inject({
      method: "GET",
      url: "/v1/not-implemented",
    });
    const body = response.json<{
      error: { code: string; requestId: string };
    }>();

    expect(response.statusCode).toBe(404);
    expect(body.error.code).toBe("NOT_FOUND");
    expect(body.error.requestId).toBeTruthy();
  });

  it("only permits configured CORS origins", async () => {
    const app = await createApp({ environment, logger: false });
    applications.push(app);

    const allowed = await app.inject({
      method: "GET",
      url: "/health",
      headers: { origin: "http://localhost:3000" },
    });
    const denied = await app.inject({
      method: "GET",
      url: "/health",
      headers: { origin: "https://untrusted.example" },
    });

    expect(allowed.headers["access-control-allow-origin"]).toBe(
      "http://localhost:3000",
    );
    expect(denied.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
