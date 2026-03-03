import { db } from "@/db";
import { kpis, alerts, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

// POST /api/kpis/[id]/submit — submit KPI for approval
export async function POST(req: Request, { params }: Params) {
    try {
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const [kpi] = await db.select().from(kpis).where(eq(kpis.id, id));
        if (!kpi) return NextResponse.json({ error: "KPI not found" }, { status: 404 });
        if (kpi.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        await db.update(kpis).set({ status: "PendingApproval" }).where(eq(kpis.id, id));

        // Create alert for the user's manager
        if (user.reporting_to_id) {
            await db.insert(alerts).values({
                id: `ALT-SUB-${Date.now()}`,
                userId: user.reporting_to_id,
                type: "Approval",
                message: `KPI "${kpi.indicator}" dari ${user.name} menunggu persetujuan Anda.`,
                isRead: false,
                relatedKpiId: id,
            });
        }

        return NextResponse.json({ ok: true, status: "PendingApproval" });
    } catch (error) {
        console.error("Submit error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
