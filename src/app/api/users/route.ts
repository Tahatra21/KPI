import { db } from "@/db";
import { users } from "@/db/schema";
import { NextResponse } from "next/server";

// GET /api/users — list all users (for login page demo + admin)
export async function GET() {
    try {
        const result = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            level: users.level,
            reportingToId: users.reportingToId,
            department: users.department,
            position: users.position,
        }).from(users);

        const mapped = result.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            level: u.level,
            reporting_to_id: u.reportingToId,
            department: u.department,
            position: u.position,
        }));

        return NextResponse.json({ users: mapped });
    } catch (error) {
        console.error("GET /api/users error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
