import { db } from "@/db";
import { users, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";

// GET /api/admin/users — List all users
export async function GET() {
    try {
        const adminUser = await getSessionUser();
        if (!adminUser || adminUser.level !== 0) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const allUsers = await db.select().from(users);

        // Remove passwords and normalize field names before sending to client
        const safeUsers = allUsers.map(u => {
            const { passwordHash, reportingToId, ...safe } = u;
            return {
                ...safe,
                reportingToId,
                // Normalize to snake_case so frontend User type is satisfied
                reporting_to_id: reportingToId ?? null,
            };
        });

        return NextResponse.json({ users: safeUsers });
    } catch (error) {
        console.error("GET /api/admin/users error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// POST /api/admin/users — Create a new user
export async function POST(req: Request) {
    try {
        const adminUser = await getSessionUser();
        if (!adminUser || adminUser.level !== 0) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();

        // Validate required
        if (!body.id || !body.name || !body.email || !body.password || body.level === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check ID/email conflict
        const existing = await db.select().from(users).where(eq(users.id, body.id)).limit(1);
        if (existing.length > 0) {
            return NextResponse.json({ error: "User ID already exists" }, { status: 400 });
        }

        const emailCheck = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
        if (emailCheck.length > 0) {
            return NextResponse.json({ error: "Email already exists" }, { status: 400 });
        }

        // Verify reportingToId exists if provided
        if (body.reporting_to_id) {
            const [manager] = await db.select().from(users).where(eq(users.id, body.reporting_to_id));
            if (!manager) {
                return NextResponse.json({ error: `Atasan dengan ID ${body.reporting_to_id} tidak ditemukan` }, { status: 400 });
            }
        }

        await db.insert(users).values({
            id: body.id,
            name: body.name,
            email: body.email,
            passwordHash: body.password, // Keep simple for demo
            level: body.level,
            reportingToId: body.reporting_to_id || null,
            department: body.department,
            position: body.position,
            status: body.status || "active",
        });

        // Insert audit log
        await db.insert(auditLogs).values({
            id: `AL-${Date.now()}`,
            userId: adminUser.id,
            action: "CREATE",
            entityType: "users",
            entityId: body.id,
            details: JSON.stringify({
                name: body.name,
                email: body.email,
                level: body.level,
                department: body.department,
                position: body.position,
                status: body.status || "active",
            })
        });

        return NextResponse.json({ ok: true }, { status: 201 });
    } catch (error) {
        console.error("POST /api/admin/users error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
