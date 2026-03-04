import { db } from "@/db";
import { kpis, alerts, users } from "@/db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSessionUser, getVisibleUserIds } from "@/lib/session";

// GET /api/kpis — list visible KPIs
export async function GET() {
    try {
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const visibleIds = await getVisibleUserIds(user);
        const result = await db.select().from(kpis).where(inArray(kpis.userId, visibleIds));

        // Map to frontend format
        const mapped = result.map((k) => ({
            id: k.id,
            user_id: k.userId,
            parent_kpi_id: k.parentKpiId,
            year: k.year,
            indicator: k.indicator,
            formula: k.formula || "",
            unit: k.unit,
            weight: Number(k.weight),
            target: Number(k.target),
            target_s1: Number(k.targetS1),
            target_s2: Number(k.targetS2),
            achievement: Number(k.achievement),
            scoring_type: k.scoringType,
            category: k.category,
            max_deduction: k.maxDeduction ? Number(k.maxDeduction) : undefined,
            status: k.status,
            deadline: k.deadline,
        }));

        return NextResponse.json({ kpis: mapped });
    } catch (error) {
        console.error("GET /api/kpis error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// POST /api/kpis — create KPI
export async function POST(req: Request) {
    try {
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const parentId = body.parent_kpi_id || null;

        if (user.level === 0) {
            return NextResponse.json({ error: "Administrator cannot create operational KPIs" }, { status: 403 });
        }

        if (user.level === 1) {
            if (parentId) {
                return NextResponse.json({ error: "Level 1 KPIs cannot have a parent" }, { status: 400 });
            }
        } else {
            if (!parentId) {
                return NextResponse.json({ error: "KPI Induk (Cascading) is required for this level" }, { status: 400 });
            }

            // Verify parent exists and belongs to the correct level/category
            const [parent] = await db.select().from(kpis).where(eq(kpis.id, parentId));
            if (!parent) {
                return NextResponse.json({ error: "Parent KPI not found" }, { status: 404 });
            }

            const [parentOwner] = await db.select().from(users).where(eq(users.id, parent.userId));
            if (!parentOwner) {
                return NextResponse.json({ error: "Parent KPI owner not found" }, { status: 404 });
            }

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

        const id = `KPI-${user.id}-${Date.now()}`;

        await db.insert(kpis).values({
            id,
            userId: user.id,
            parentKpiId: parentId,
            year: body.year || 2026,
            indicator: body.indicator,
            formula: body.formula || "",
            unit: body.unit,
            weight: String(body.weight || 0),
            targetS1: String(body.target_s1 ?? 0),
            targetS2: String(body.target_s2 ?? 0),
            target: String((Number(body.target_s1 ?? 0) + Number(body.target_s2 ?? 0)) || Number(body.target ?? 0)),
            achievement: String(body.achievement || 0),
            scoringType: body.scoring_type || "normal",
            category: user.level === 1 ? (body.category || null) : null, // only L1 uses category
            maxDeduction: body.max_deduction != null ? String(body.max_deduction) : null,
            status: "Draft",
            deadline: body.deadline || "2026-12-31",
        });

        // Fetch the created KPI
        const [created] = await db.select().from(kpis).where(eq(kpis.id, id));

        return NextResponse.json({
            kpi: {
                id: created.id,
                user_id: created.userId,
                parent_kpi_id: created.parentKpiId,
                year: created.year,
                indicator: created.indicator,
                formula: created.formula || "",
                unit: created.unit,
                weight: Number(created.weight),
                target: Number(created.target),
                target_s1: Number(created.targetS1),
                target_s2: Number(created.targetS2),
                achievement: Number(created.achievement),
                scoring_type: created.scoringType,
                category: created.category,
                max_deduction: created.maxDeduction ? Number(created.maxDeduction) : undefined,
                status: created.status,
                deadline: created.deadline,
            },
        }, { status: 201 });
    } catch (error) {
        console.error("POST /api/kpis error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
