ALTER TABLE "users" DROP CONSTRAINT "users_reporting_to_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_reporting_to_id_users_id_fk" FOREIGN KEY ("reporting_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;