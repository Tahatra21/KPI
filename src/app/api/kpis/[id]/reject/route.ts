import { db } from "@/db";
import { kpis, alerts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSessionUser, getSubordinateIds } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

// POST /api/kpis/[id]/reject — reject KPI
export async function POST(req: Request, { params }: Params) {
    try {
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const [kpi] = await db.select().from(kpis).where(eq(kpis.id, id));
        if (!kpi) return NextResponse.json({ error: "KPI not found" }, { status: 404 });

        const subIds = await getSubordinateIds(user.id);
        if (!subIds.includes(kpi.userId)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await db.update(kpis).set({ status: "Rejected" }).where(eq(kpis.id, id));

        await db.insert(alerts).values({
            id: `ALT-REJ-${Date.now()}`,
            userId: kpi.userId,
            type: "Approval",
            message: `KPI "${kpi.indicator}" ditolak oleh ${user.name}. Silakan revisi dan ajukan kembali.`,
            isRead: false,
            relatedKpiId: id,
        });

        return NextResponse.json({ ok: true, status: "Rejected" });
    } catch (error) {
        console.error("Reject error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
