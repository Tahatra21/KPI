import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export type SessionUser = {
    id: string;
    name: string;
    email: string;
    level: number;
    reporting_to_id: string | null;
    department: string;
    position: string;
    status?: "active" | "inactive";
};

/**
 * Get the current session user from the cookie.
 * Returns null if not authenticated.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
    const cookieStore = await cookies();
    const session = cookieStore.get("session");
    if (!session?.value) return null;

    const [user] = await db.select().from(users).where(eq(users.id, session.value)).limit(1);
    if (!user) return null;

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        level: user.level,
        reporting_to_id: user.reportingToId,
        department: user.department,
        position: user.position,
        status: user.status as "active" | "inactive",
    };
}

/**
 * Get subordinate IDs recursively.
 */
export async function getSubordinateIds(userId: string): Promise<string[]> {
    const allUsers = await db.select().from(users);
    return _getSubIds(userId, allUsers);
}

function _getSubIds(userId: string, allUsers: { id: string; reportingToId: string | null }[]): string[] {
    const directReports = allUsers.filter((u) => u.reportingToId === userId);
    const ids: string[] = directReports.map((u) => u.id);
    for (const report of directReports) {
        ids.push(..._getSubIds(report.id, allUsers));
    }
    return ids;
}

/**
 * Get all user IDs visible to current user (self + subordinates).
 */
export async function getVisibleUserIds(user: SessionUser): Promise<string[]> {
    if (user.level === 1 || user.level === 0) {
        const allUsers = await db.select({ id: users.id }).from(users);
        return allUsers.map((u) => u.id);
    }
    const subIds = await getSubordinateIds(user.id);
    return [user.id, ...subIds];
}

/**
 * Get all users from DB (for listing).
 */
export async function getAllUsers() {
    return db.select().from(users);
}
