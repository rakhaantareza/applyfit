CREATE TYPE "public"."evidence_type" AS ENUM('project', 'cert', 'work', 'internship', 'github', 'portfolio');--> statement-breakpoint
CREATE TYPE "public"."requirement_priority" AS ENUM('required', 'preferred');--> statement-breakpoint
CREATE TYPE "public"."requirement_type" AS ENUM('skill', 'tool', 'education', 'experience');--> statement-breakpoint
CREATE TABLE "evidences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"title" text NOT NULL,
	"type" "evidence_type" NOT NULL,
	"url" text,
	"description" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_postings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"company" text NOT NULL,
	"source" text,
	"source_url" text,
	"raw_description" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "requirement_type" NOT NULL,
	"priority" "requirement_priority" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job_requirements" ADD CONSTRAINT "job_requirements_job_id_job_postings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "evidences_profile_id_idx" ON "evidences" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "evidences_profile_type_idx" ON "evidences" USING btree ("profile_id","type");--> statement-breakpoint
CREATE INDEX "job_postings_user_id_idx" ON "job_postings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "job_postings_user_created_at_idx" ON "job_postings" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "job_requirements_job_id_idx" ON "job_requirements" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "job_requirements_job_type_idx" ON "job_requirements" USING btree ("job_id","type");