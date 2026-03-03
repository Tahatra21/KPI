import { db } from "./index";
import { sql } from "drizzle-orm";

async function main() {
    try {
        await db.execute(sql`ALTER TABLE "alerts" DROP CONSTRAINT IF EXISTS "alerts_user_id_users_id_fk"`);
        await db.execute(sql`ALTER TABLE "kpis" DROP CONSTRAINT IF EXISTS "kpis_user_id_users_id_fk"`);
        await db.execute(sql`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_reporting_to_id_users_id_fk"`);
        await db.execute(sql`ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_user_id_users_id_fk"`);

        await db.execute(sql`ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade`);
        await db.execute(sql`ALTER TABLE "kpis" ADD CONSTRAINT "kpis_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade`);
        await db.execute(sql`ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade`);
        await db.execute(sql`ALTER TABLE "users" ADD CONSTRAINT "users_reporting_to_id_users_id_fk" FOREIGN KEY ("reporting_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade`);
        console.log("Applied constraints successfully!");
    } catch (error) {
        console.error("Error applying constraints:", error);
    } finally {
        process.exit(0);
    }
}

main();
