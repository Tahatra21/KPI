import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { mockUsers, mockKPIs, mockAlerts, mockConfigs } from "../lib/mock-data";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://jmaharyuda@localhost:5432/kpiv3_db";

async function seed() {
    console.log("🌱 Seeding database...");
    const client = postgres(DATABASE_URL, { max: 1 });
    const db = drizzle(client, { schema });

    // Clear existing data (in reverse dependency order)
    console.log("  Clearing existing data...");
    await db.delete(schema.auditLogs);
    await db.delete(schema.alerts);
    await db.delete(schema.kpis);
    await db.delete(schema.users);
    await db.delete(schema.systemConfigs);

    // ── Seed Users ──
    console.log(`  Inserting ${mockUsers.length} users...`);
    for (const user of mockUsers) {
        await db.insert(schema.users).values({
            id: user.id,
            name: user.name,
            email: user.email,
            passwordHash: user.password, // Plain text for demo, hash in production
            level: user.level,
            reportingToId: user.reporting_to_id,
            department: user.department,
            position: user.position,
            status: user.status || "active",
        });
    }

    // ── Seed KPIs ──
    // Insert parent KPIs first (where parent_kpi_id is null), then children
    const parentKPIs = mockKPIs.filter(k => !k.parent_kpi_id);
    const childKPIs = mockKPIs.filter(k => k.parent_kpi_id);

    console.log(`  Inserting ${parentKPIs.length} parent KPIs...`);
    for (const kpi of parentKPIs) {
        await db.insert(schema.kpis).values({
            id: kpi.id,
            userId: kpi.user_id,
            parentKpiId: kpi.parent_kpi_id,
            year: 2026,
            indicator: kpi.indicator,
            formula: kpi.formula,
            unit: kpi.unit,
            weight: String(kpi.weight),
            target: String(kpi.target),
            achievement: String(kpi.achievement),
            scoringType: kpi.scoring_type,
            category: kpi.category,
            maxDeduction: kpi.max_deduction != null ? String(kpi.max_deduction) : null,
            status: kpi.status,
            deadline: kpi.deadline,
        });
    }

    console.log(`  Inserting ${childKPIs.length} child KPIs...`);
    for (const kpi of childKPIs) {
        await db.insert(schema.kpis).values({
            id: kpi.id,
            userId: kpi.user_id,
            parentKpiId: kpi.parent_kpi_id,
            year: 2026,
            indicator: kpi.indicator,
            formula: kpi.formula,
            unit: kpi.unit,
            weight: String(kpi.weight),
            target: String(kpi.target),
            achievement: String(kpi.achievement),
            scoringType: kpi.scoring_type,
            category: kpi.category,
            maxDeduction: kpi.max_deduction != null ? String(kpi.max_deduction) : null,
            status: kpi.status,
            deadline: kpi.deadline,
        });
    }

    // ── Seed Alerts ──
    console.log(`  Inserting ${mockAlerts.length} alerts...`);
    for (const alert of mockAlerts) {
        await db.insert(schema.alerts).values({
            id: alert.id,
            userId: alert.user_id,
            type: alert.type,
            message: alert.message,
            isRead: alert.is_read,
            createdAt: new Date(alert.created_at),
            relatedKpiId: alert.related_kpi_id || null,
        });
    }

    // ── Seed System Configs ──
    console.log(`  Inserting ${mockConfigs.length} system configs...`);
    for (const config of mockConfigs) {
        await db.insert(schema.systemConfigs).values({
            key: config.key,
            value: config.value,
            description: config.description,
            updatedAt: new Date(config.updated_at),
        });
    }

    // Audit logs initially empty
    console.log(`✅ Seeded: ${mockUsers.length} users, ${mockKPIs.length} KPIs, ${mockAlerts.length} alerts, ${mockConfigs.length} configs`);
    await client.end();
    process.exit(0);
}

seed().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});
