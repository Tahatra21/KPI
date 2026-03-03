import { db } from "@/db";
import { systemConfigs, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";

// GET /api/admin/config — List all system configs
export async function GET() {
    try {
        const adminUser = await getSessionUser();
        if (!adminUser || adminUser.level !== 0) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const configs = await db.select().from(systemConfigs);
        return NextResponse.json({ configs });
    } catch (error) {
        console.error("GET /api/admin/config error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// PUT /api/admin/config — Update a single system config
export async function PUT(req: Request) {
    try {
        const adminUser = await getSessionUser();
        if (!adminUser || adminUser.level !== 0) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { key, value } = await req.json();

        if (!key || value === undefined) {
            return NextResponse.json({ error: "Key and value are required" }, { status: 400 });
        }

        const [existing] = await db.select().from(systemConfigs).where(eq(systemConfigs.key, key));
        if (!existing) {
            return NextResponse.json({ error: "Config key not found" }, { status: 404 });
        }

        await db.update(systemConfigs)
            .set({ value, updatedAt: new Date() })
            .where(eq(systemConfigs.key, key));

        // Insert audit log
        await db.insert(auditLogs).values({
            id: `AL-${Date.now()}`,
            userId: adminUser.id,
            action: "CONFIG_CHANGE",
            entityType: "system_configs",
            entityId: key,
            details: JSON.stringify({
                before: existing.value,
                after: value,
            })
        });

        const [updated] = await db.select().from(systemConfigs).where(eq(systemConfigs.key, key));
        return NextResponse.json({ config: updated });
    } catch (error) {
        console.error("PUT /api/admin/config error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
