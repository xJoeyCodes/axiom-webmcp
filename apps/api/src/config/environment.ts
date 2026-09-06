import { ApplicationError, DEFAULT_EMBEDDING_MODEL } from "@axiom/core";
import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  API_HOST: z.string().min(1).default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4_000),
  DATABASE_URL: z
    .string()
    .min(1)
    .refine(
      (value) =>
        value.startsWith("postgres://") || value.startsWith("postgresql://"),
      { message: "DATABASE_URL must use the postgres or postgresql scheme." },
    ),
  OPENAI_API_KEY: z
    .string()
    .trim()
    .transform((value) => value || undefined)
    .optional(),
  EMBEDDING_PROVIDER: z.enum(["openai", "fake"]).default("openai"),
  EMBEDDING_MODEL: z
    .literal(DEFAULT_EMBEDDING_MODEL)
    .default(DEFAULT_EMBEDDING_MODEL),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:3000")
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    )
    .refine(
      (origins) => origins.length > 0,
      "At least one CORS origin is required.",
    )
    .refine(
      (origins) => !origins.includes("*"),
      "Wildcard CORS origins are not permitted.",
    ),
});

type ParsedEnvironment = z.infer<typeof environmentSchema>;
export type Environment = Omit<
  ParsedEnvironment,
  "EMBEDDING_MODEL" | "EMBEDDING_PROVIDER"
> & {
  readonly EMBEDDING_MODEL?: typeof DEFAULT_EMBEDDING_MODEL;
  readonly EMBEDDING_PROVIDER?: "openai" | "fake";
};

export function loadEnvironment(
  source: NodeJS.ProcessEnv = process.env,
): Environment {
  const result = environmentSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`,
    );
    throw new ApplicationError(
      "VALIDATION_ERROR",
      `Invalid API environment: ${issues.join("; ")}`,
      { details: { fields: issues } },
    );
  }
  return result.data;
}
