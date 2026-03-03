import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Email dan password wajib diisi" }, { status: 400 });
        }

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

        if (!user || user.passwordHash !== password) {
            return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
        }

        if (user.status === "inactive") {
            return NextResponse.json({ error: "Akun Anda telah dinonaktifkan. Hubungi Administrator." }, { status: 403 });
        }

        // Set session cookie (simple token = user ID for demo)
        const cookieStore = await cookies();
        cookieStore.set("session", user.id, {
            httpOnly: true,
            secure: false, // on-premise HTTP
            path: "/",
            maxAge: 60 * 30, // 30 minutes
            sameSite: "lax",
        });

        return NextResponse.json({
            id: user.id,
            name: user.name,
            email: user.email,
            level: user.level,
            reporting_to_id: user.reportingToId,
            department: user.department,
            position: user.position,
            status: user.status,
        });
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
    }
}
