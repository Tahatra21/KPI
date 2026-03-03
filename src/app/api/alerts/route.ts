import { db } from "@/db";
import { alerts } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";

// GET /api/alerts — get current user's alerts
export async function GET() {
    try {
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const result = await db
            .select()
            .from(alerts)
            .where(eq(alerts.userId, user.id))
            .orderBy(desc(alerts.createdAt));

        const mapped = result.map((a) => ({
            id: a.id,
            user_id: a.userId,
            type: a.type,
            message: a.message,
            is_read: a.isRead,
            created_at: a.createdAt.toISOString(),
            related_kpi_id: a.relatedKpiId,
        }));

        return NextResponse.json({ alerts: mapped });
    } catch (error) {
        console.error("GET /api/alerts error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// PUT /api/alerts — mark alerts as read
export async function PUT(req: Request) {
    try {
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { ids } = await req.json();

        if (ids && Array.isArray(ids)) {
            for (const id of ids) {
                await db
                    .update(alerts)
                    .set({ isRead: true })
                    .where(and(eq(alerts.id, id), eq(alerts.userId, user.id)));
            }
        } else {
            // Mark all as read
            await db
                .update(alerts)
                .set({ isRead: true })
                .where(eq(alerts.userId, user.id));
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("PUT /api/alerts error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
