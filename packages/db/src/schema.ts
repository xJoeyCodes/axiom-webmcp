import type {
  CapabilityAnnotations,
  CapabilitySchema,
  JsonValue,
} from "@axiom/core";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  vector,
} from "drizzle-orm/pg-core";

export const providerVerificationStatusEnum = pgEnum(
  "provider_verification_status",
  ["unverified", "pending", "verified"],
);

export const providerStatusEnum = pgEnum("provider_status", [
  "draft",
  "active",
  "suspended",
  "archived",
]);

export const capabilityStatusEnum = pgEnum("capability_status", [
  "active",
  "disabled",
  "deprecated",
]);

export const capabilitySourceEnum = pgEnum("capability_source", [
  "cli",
  "api",
  "manifest",
  "browser-inspection",
  "manual",
]);

export const embeddingStatusEnum = pgEnum("embedding_status", [
  "pending",
  "ready",
  "failed",
]);

export const providers = pgTable(
  "providers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 200 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    domain: varchar("domain", { length: 253 }).notNull(),
    canonicalUrl: text("canonical_url").notNull(),
    description: text("description").notNull(),
    verificationStatus: providerVerificationStatusEnum("verification_status")
      .notNull()
      .default("unverified"),
    status: providerStatusEnum("status").notNull().default("draft"),
    lastIndexedAt: timestamp("last_indexed_at", {
      withTimezone: true,
      mode: "date",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("providers_slug_unique").on(table.slug),
    uniqueIndex("providers_domain_unique").on(table.domain),
    index("providers_status_idx").on(table.status),
  ],
);

export const capabilities = pgTable(
  "capabilities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providers.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    description: text("description").notNull(),
    inputSchema: jsonb("input_schema").$type<CapabilitySchema>().notNull(),
    outputSchema: jsonb("output_schema").$type<CapabilitySchema | null>(),
    annotations: jsonb("annotations")
      .$type<CapabilityAnnotations>()
      .notNull()
      .default({}),
    specVersion: varchar("spec_version", { length: 80 }),
    source: capabilitySourceEnum("source").notNull(),
    status: capabilityStatusEnum("status").notNull().default("active"),
    contentHash: varchar("content_hash", { length: 64 }).notNull(),
    rawContract: jsonb("raw_contract").$type<JsonValue | null>(),
    embedding: vector("embedding", { dimensions: 1_024 }),
    embeddingStatus: embeddingStatusEnum("embedding_status")
      .notNull()
      .default("pending"),
    embeddingProvider: varchar("embedding_provider", { length: 80 }),
    embeddingModel: varchar("embedding_model", { length: 120 }),
    embeddingDimensions: integer("embedding_dimensions"),
    embeddingVersion: varchar("embedding_version", { length: 80 }),
    searchDocumentVersion: varchar("search_document_version", { length: 40 }),
    embeddingFingerprint: varchar("embedding_fingerprint", { length: 64 }),
    embeddingUpdatedAt: timestamp("embedding_updated_at", {
      withTimezone: true,
      mode: "date",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("capabilities_provider_name_unique").on(
      table.providerId,
      table.name,
    ),
    index("capabilities_provider_idx").on(table.providerId),
    index("capabilities_status_idx").on(table.status),
    index("capabilities_content_hash_idx").on(table.contentHash),
    index("capabilities_embedding_status_idx").on(table.embeddingStatus),
    index("capabilities_embedding_fingerprint_idx").on(
      table.embeddingFingerprint,
    ),
  ],
);

export type ProviderRow = typeof providers.$inferSelect;
export type NewProviderRow = typeof providers.$inferInsert;
export type CapabilityRow = typeof capabilities.$inferSelect;
export type NewCapabilityRow = typeof capabilities.$inferInsert;
