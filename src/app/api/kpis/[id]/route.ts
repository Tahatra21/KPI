import { db } from "@/db";
import { kpis, alerts, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

// PUT /api/kpis/[id] — update KPI
export async function PUT(req: Request, { params }: Params) {
    try {
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const [existing] = await db.select().from(kpis).where(eq(kpis.id, id));
        if (!existing) return NextResponse.json({ error: "KPI not found" }, { status: 404 });

        // Only owner can edit
        if (existing.userId !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();

        // Validate parent changes
        if (body.parent_kpi_id !== undefined && body.parent_kpi_id !== existing.parentKpiId) {
            const newParentId = body.parent_kpi_id || null;

            if (user.level === 1) {
                if (newParentId) return NextResponse.json({ error: "Level 1 KPIs cannot have a parent" }, { status: 400 });
            } else {
                if (!newParentId) return NextResponse.json({ error: "KPI Induk (Cascading) is required for this level" }, { status: 400 });

                const [parent] = await db.select().from(kpis).where(eq(kpis.id, newParentId));
                if (!parent) return NextResponse.json({ error: "Parent KPI not found" }, { status: 404 });

                const [parentOwner] = await db.select().from(users).where(eq(users.id, parent.userId));
                if (!parentOwner) return NextResponse.json({ error: "Parent KPI owner not found" }, { status: 404 });

                if (user.level === 2 && (parentOwner.level !== 1 || parent.category !== "bidang")) {
                    return NextResponse.json({ error: "Level 2 KPIs must cascade from Level 1 Bidang KPIs" }, { status: 400 });
                }
                if (user.level === 3 && parentOwner.level !== 2) {
                    return NextResponse.json({ error: "Level 3 KPIs must cascade from Level 2 KPIs" }, { status: 400 });
                }
                if (user.level === 4 && parentOwner.level !== 3) {
                    return NextResponse.json({ error: "Level 4 KPIs must cascade from Level 3 KPIs" }, { status: 400 });
                }
            }
        }

        // Build update object
        const updateData: Record<string, any> = {};
        if (body.indicator !== undefined) updateData.indicator = body.indicator;
        if (body.formula !== undefined) updateData.formula = body.formula;
        if (body.unit !== undefined) updateData.unit = body.unit;
        if (body.weight !== undefined) updateData.weight = String(body.weight);
        if (body.target_s1 !== undefined) updateData.targetS1 = String(body.target_s1);
        if (body.target_s2 !== undefined) updateData.targetS2 = String(body.target_s2);
        // Recompute total target from semesters if either is updated
        if (body.target_s1 !== undefined || body.target_s2 !== undefined) {
            const s1 = body.target_s1 !== undefined ? Number(body.target_s1) : Number(existing.targetS1);
            const s2 = body.target_s2 !== undefined ? Number(body.target_s2) : Number(existing.targetS2);
            updateData.target = String(s1 + s2);
        } else if (body.target !== undefined) {
            updateData.target = String(body.target);
        }
        if (body.achievement !== undefined) updateData.achievement = String(body.achievement);
        if (body.scoring_type !== undefined) updateData.scoringType = body.scoring_type;
        if (body.category !== undefined) updateData.category = user.level === 1 ? body.category : null;
        if (body.max_deduction !== undefined) updateData.maxDeduction = body.max_deduction != null ? String(body.max_deduction) : null;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.deadline !== undefined) updateData.deadline = body.deadline;
        if (body.parent_kpi_id !== undefined) updateData.parentKpiId = body.parent_kpi_id;

        await db.update(kpis).set(updateData).where(eq(kpis.id, id));

        // Wait for rollup to complete if achievement changed and it has a parent
        if (body.achievement !== undefined && body.achievement !== Number(existing.achievement) && existing.parentKpiId) {
            await rollupKpiAchievement(existing.parentKpiId);
        }

        // Fetch updated
        const [updated] = await db.select().from(kpis).where(eq(kpis.id, id));

        return NextResponse.json({
            kpi: {
                id: updated.id,
                user_id: updated.userId,
                parent_kpi_id: updated.parentKpiId,
                year: updated.year,
                indicator: updated.indicator,
                formula: updated.formula || "",
                unit: updated.unit,
                weight: Number(updated.weight),
                target: Number(updated.target),
                target_s1: Number(updated.targetS1),
                target_s2: Number(updated.targetS2),
                achievement: Number(updated.achievement),
                scoring_type: updated.scoringType,
                category: updated.category,
                max_deduction: updated.maxDeduction ? Number(updated.maxDeduction) : undefined,
                status: updated.status,
                deadline: updated.deadline,
            },
        });
    } catch (error) {
        console.error("PUT /api/kpis error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// Helper for Auto-Calculation (Bottom-Up)
async function rollupKpiAchievement(parentId: string) {
    const [parent] = await db.select().from(kpis).where(eq(kpis.id, parentId));
    if (!parent) return;

    // Get all children
    const children = await db.select().from(kpis).where(eq(kpis.parentKpiId, parentId));
    if (children.length === 0) return;

    let totalProgressPct = 0;

    for (const child of children) {
        const target = Number(child.target);
        const achievement = Number(child.achievement);
        let pct = 0;

        if (child.scoringType === "deduction") {
            const maxD = Number(child.maxDeduction || 10);
            pct = maxD === 0 ? 100 : Math.max(0, (1 - achievement / maxD)) * 100;
        } else if (target > 0) {
            if (child.scoringType === "reverse") {
                pct = achievement === 0 ? 100 : Math.min((target / achievement) * 100, 150); // cap at 150%
            } else {
                pct = Math.min((achievement / target) * 100, 150); // normal
            }
        }
        totalProgressPct += pct;
    }

    const averageProgressPct = totalProgressPct / children.length;

    // Calculate new achievement for parent based on average progress
    let newParentAchievement = 0;
    const parentTarget = Number(parent.target);

    if (parent.scoringType === "deduction") {
        const maxD = Number(parent.maxDeduction || 10);
        // reverse the percentage to get raw deduction points
        newParentAchievement = maxD * (1 - (averageProgressPct / 100));
    } else if (parent.scoringType === "reverse") {
        if (averageProgressPct > 0) {
            newParentAchievement = (parentTarget * 100) / averageProgressPct;
        }
    } else {
        // normal
        newParentAchievement = (averageProgressPct / 100) * parentTarget;
    }

    // Update parent
    await db.update(kpis)
        .set({ achievement: String(newParentAchievement) })
        .where(eq(kpis.id, parentId));

    // Propagate up recursively if parent also has a parent
    if (parent.parentKpiId) {
        await rollupKpiAchievement(parent.parentKpiId);
    }
}

// DELETE /api/kpis/[id]
export async function DELETE(req: Request, { params }: Params) {
    try {
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const [existing] = await db.select().from(kpis).where(eq(kpis.id, id));
        if (!existing) return NextResponse.json({ error: "KPI not found" }, { status: 404 });

        // Only owner can delete
        if (existing.userId !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Delete child KPIs first, then the KPI itself
        await db.delete(alerts).where(eq(alerts.relatedKpiId, id));
        await db.delete(kpis).where(eq(kpis.parentKpiId, id));
        await db.delete(kpis).where(eq(kpis.id, id));

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("DELETE /api/kpis error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
