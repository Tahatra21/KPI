import { db } from "@/db";
import { users, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

// PUT /api/admin/users/[id] — Update a user
export async function PUT(req: Request, { params }: Params) {
    try {
        const adminUser = await getSessionUser();
        if (!adminUser || adminUser.level !== 0) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;
        const [existing] = await db.select().from(users).where(eq(users.id, id));
        if (!existing) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const body = await req.json();
        const updateData: Record<string, any> = {};

        if (body.id !== undefined && body.id !== id) {
            const [exists] = await db.select().from(users).where(eq(users.id, body.id));
            if (exists) {
                return NextResponse.json({ error: `User ID ${body.id} sudah digunakan` }, { status: 400 });
            }
            updateData.id = body.id;
        }

        if (body.name !== undefined) updateData.name = body.name;
        if (body.email !== undefined) updateData.email = body.email;
        if (body.password !== undefined && body.password.trim() !== '') updateData.passwordHash = body.password;
        if (body.level !== undefined) updateData.level = body.level;
        if (body.reporting_to_id !== undefined) updateData.reportingToId = body.reporting_to_id || null;
        if (body.department !== undefined) updateData.department = body.department;
        if (body.position !== undefined) updateData.position = body.position;
        if (body.status !== undefined) updateData.status = body.status;

        // Verify reportingToId exists if provided
        if (updateData.reportingToId) {
            const [manager] = await db.select().from(users).where(eq(users.id, updateData.reportingToId));
            if (!manager) {
                return NextResponse.json({ error: `Atasan dengan ID ${updateData.reportingToId} tidak ditemukan` }, { status: 400 });
            }
        }

        await db.update(users).set(updateData).where(eq(users.id, id));

        // Insert audit log
        await db.insert(auditLogs).values({
            id: `AL-${Date.now()}`,
            userId: adminUser.id,
            action: "UPDATE",
            entityType: "users",
            entityId: id,
            details: JSON.stringify({
                before: {
                    name: existing.name,
                    email: existing.email,
                    level: existing.level,
                    department: existing.department,
                    position: existing.position,
                    status: existing.status,
                },
                after: updateData
            })
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("PUT /api/admin/users error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// DELETE /api/admin/users/[id] — Delete a user
export async function DELETE(req: Request, { params }: Params) {
    try {
        const adminUser = await getSessionUser();
        if (!adminUser || adminUser.level !== 0) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;
        const [existing] = await db.select().from(users).where(eq(users.id, id));
        if (!existing) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Prevent self-deletion
        if (id === adminUser.id) {
            return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
        }

        await db.delete(users).where(eq(users.id, id));

        // Insert audit log
        await db.insert(auditLogs).values({
            id: `AL-${Date.now()}`,
            userId: adminUser.id,
            action: "DELETE",
            entityType: "users",
            entityId: id,
            details: JSON.stringify({
                deletedUser: existing.email
            })
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("DELETE /api/admin/users error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
