import { db } from "@/db";
import { kpis, alerts, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSessionUser, getSubordinateIds } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

// POST /api/kpis/[id]/approve — approve KPI
export async function POST(req: Request, { params }: Params) {
    try {
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const [kpi] = await db.select().from(kpis).where(eq(kpis.id, id));
        if (!kpi) return NextResponse.json({ error: "KPI not found" }, { status: 404 });

        // Only superior can approve
        const subIds = await getSubordinateIds(user.id);
        if (!subIds.includes(kpi.userId)) {
            return NextResponse.json({ error: "Anda tidak berhak menyetujui KPI ini" }, { status: 403 });
        }

        await db.update(kpis).set({ status: "Approved" }).where(eq(kpis.id, id));

        // Alert KPI owner
        await db.insert(alerts).values({
            id: `ALT-APR-${Date.now()}`,
            userId: kpi.userId,
            type: "Approval",
            message: `KPI "${kpi.indicator}" telah disetujui oleh ${user.name}.`,
            isRead: false,
            relatedKpiId: id,
        });

        return NextResponse.json({ ok: true, status: "Approved" });
    } catch (error) {
        console.error("Approve error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
