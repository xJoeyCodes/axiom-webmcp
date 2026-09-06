CREATE EXTENSION IF NOT EXISTS "vector";--> statement-breakpoint
CREATE TYPE "public"."capability_source" AS ENUM('cli', 'api', 'manifest', 'browser-inspection', 'manual');--> statement-breakpoint
CREATE TYPE "public"."capability_status" AS ENUM('active', 'disabled', 'deprecated');--> statement-breakpoint
CREATE TYPE "public"."provider_status" AS ENUM('draft', 'active', 'suspended', 'archived');--> statement-breakpoint
CREATE TYPE "public"."provider_verification_status" AS ENUM('unverified', 'pending', 'verified');--> statement-breakpoint
CREATE TABLE "capabilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"name" varchar(160) NOT NULL,
	"description" text NOT NULL,
	"input_schema" jsonb NOT NULL,
	"output_schema" jsonb,
	"annotations" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"spec_version" varchar(80),
	"source" "capability_source" NOT NULL,
	"status" "capability_status" DEFAULT 'active' NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"raw_contract" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(200) NOT NULL,
	"name" varchar(200) NOT NULL,
	"domain" varchar(253) NOT NULL,
	"canonical_url" text NOT NULL,
	"description" text NOT NULL,
	"verification_status" "provider_verification_status" DEFAULT 'unverified' NOT NULL,
	"status" "provider_status" DEFAULT 'draft' NOT NULL,
	"last_indexed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "capabilities" ADD CONSTRAINT "capabilities_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "capabilities_provider_name_unique" ON "capabilities" USING btree ("provider_id","name");--> statement-breakpoint
CREATE INDEX "capabilities_provider_idx" ON "capabilities" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "capabilities_status_idx" ON "capabilities" USING btree ("status");--> statement-breakpoint
CREATE INDEX "capabilities_content_hash_idx" ON "capabilities" USING btree ("content_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "providers_slug_unique" ON "providers" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "providers_domain_unique" ON "providers" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "providers_status_idx" ON "providers" USING btree ("status");
