CREATE TYPE "public"."alert_type" AS ENUM('MissedTarget', 'Deadline', 'Changed', 'Approval');--> statement-breakpoint
CREATE TYPE "public"."kpi_category" AS ENUM('bersama', 'bidang');--> statement-breakpoint
CREATE TYPE "public"."kpi_status" AS ENUM('Draft', 'PendingApproval', 'Approved', 'Rejected');--> statement-breakpoint
CREATE TYPE "public"."scoring_type" AS ENUM('normal', 'reverse', 'deduction');--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" varchar(32) NOT NULL,
	"type" "alert_type" NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"related_kpi_id" varchar(64)
);
--> statement-breakpoint
CREATE TABLE "kpis" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" varchar(32) NOT NULL,
	"parent_kpi_id" varchar(64),
	"year" integer DEFAULT 2026 NOT NULL,
	"indicator" varchar(500) NOT NULL,
	"formula" text DEFAULT '',
	"unit" varchar(50) NOT NULL,
	"weight" numeric(5, 2) DEFAULT '0' NOT NULL,
	"target" numeric(15, 4) DEFAULT '0' NOT NULL,
	"achievement" numeric(15, 4) DEFAULT '0' NOT NULL,
	"scoring_type" "scoring_type" DEFAULT 'normal' NOT NULL,
	"category" "kpi_category",
	"max_deduction" numeric(5, 2),
	"status" "kpi_status" DEFAULT 'Draft' NOT NULL,
	"deadline" varchar(20) DEFAULT '2026-12-31' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"level" integer NOT NULL,
	"reporting_to_id" varchar(32),
	"department" varchar(255) NOT NULL,
	"position" varchar(255) NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_related_kpi_id_kpis_id_fk" FOREIGN KEY ("related_kpi_id") REFERENCES "public"."kpis"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpis" ADD CONSTRAINT "kpis_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpis" ADD CONSTRAINT "kpis_parent_kpi_id_kpis_id_fk" FOREIGN KEY ("parent_kpi_id") REFERENCES "public"."kpis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_reporting_to_id_users_id_fk" FOREIGN KEY ("reporting_to_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;