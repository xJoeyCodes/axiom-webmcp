import { randomUUID } from "node:crypto";

import cors from "@fastify/cors";
import Fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
} from "fastify";

import type { Environment } from "./config/environment.js";
import { registerErrorHandling } from "./http/error-handler.js";
import { registerHealthRoute } from "./routes/health.js";

export interface CreateAppOptions {
  readonly environment: Environment;
  readonly logger?: FastifyServerOptions["logger"];
}

export async function createApp(
  options: CreateAppOptions,
): Promise<FastifyInstance> {
  const app = Fastify({
    bodyLimit: 1_048_576,
    genReqId: () => randomUUID(),
    logger:
      options.logger ??
      ({
        level: options.environment.LOG_LEVEL,
        redact: {
          paths: [
            "req.headers.authorization",
            "req.headers.cookie",
            "request.headers.authorization",
            "request.headers.cookie",
          ],
          censor: "[REDACTED]",
        },
      } satisfies FastifyServerOptions["logger"]),
    trustProxy: false,
  });

  await app.register(cors, {
    origin: options.environment.CORS_ORIGINS,
    credentials: false,
    methods: ["GET", "HEAD", "OPTIONS"],
  });

  registerErrorHandling(app);
  await app.register(registerHealthRoute);

  return app;
}
