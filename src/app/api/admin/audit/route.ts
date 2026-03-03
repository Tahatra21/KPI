import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";

export async function GET() {
    try {
        const adminUser = await getSessionUser();
        if (!adminUser || adminUser.level !== 0) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Fetch logs with user join for actor name
        const logs = await db
            .select({
                id: auditLogs.id,
                action: auditLogs.action,
                entityType: auditLogs.entityType,
                entityId: auditLogs.entityId,
                details: auditLogs.details,
                createdAt: auditLogs.createdAt,
                actorId: users.id,
                actorName: users.name,
            })
            .from(auditLogs)
            .leftJoin(users, eq(auditLogs.userId, users.id))
            .orderBy(desc(auditLogs.createdAt))
            .limit(100);

        return NextResponse.json({ logs });
    } catch (error) {
        console.error("GET /api/admin/audit error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
