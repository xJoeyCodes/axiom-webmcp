CREATE TYPE "public"."embedding_status" AS ENUM('pending', 'ready', 'failed');--> statement-breakpoint
ALTER TABLE "capabilities" ADD COLUMN "embedding" vector(1024);--> statement-breakpoint
ALTER TABLE "capabilities" ADD COLUMN "embedding_status" "embedding_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "capabilities" ADD COLUMN "embedding_provider" varchar(80);--> statement-breakpoint
ALTER TABLE "capabilities" ADD COLUMN "embedding_model" varchar(120);--> statement-breakpoint
ALTER TABLE "capabilities" ADD COLUMN "embedding_dimensions" integer;--> statement-breakpoint
ALTER TABLE "capabilities" ADD COLUMN "embedding_version" varchar(80);--> statement-breakpoint
ALTER TABLE "capabilities" ADD COLUMN "search_document_version" varchar(40);--> statement-breakpoint
ALTER TABLE "capabilities" ADD COLUMN "embedding_fingerprint" varchar(64);--> statement-breakpoint
ALTER TABLE "capabilities" ADD COLUMN "embedding_updated_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "capabilities_embedding_status_idx" ON "capabilities" USING btree ("embedding_status");--> statement-breakpoint
CREATE INDEX "capabilities_embedding_fingerprint_idx" ON "capabilities" USING btree ("embedding_fingerprint");