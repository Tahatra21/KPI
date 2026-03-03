import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get("session");

        if (!session?.value) {
            return NextResponse.json({ user: null }, { status: 401 });
        }

        const [user] = await db.select().from(users).where(eq(users.id, session.value)).limit(1);

        if (!user) {
            cookieStore.delete("session");
            return NextResponse.json({ user: null }, { status: 401 });
        }

        return NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                level: user.level,
                reporting_to_id: user.reportingToId,
                department: user.department,
                position: user.position,
            },
        });
    } catch (error) {
        console.error("Auth check error:", error);
        return NextResponse.json({ user: null }, { status: 500 });
    }
}
