import { User, KPI, Alert } from "./types";

/**
 * Returns all user IDs that are subordinates (direct and indirect) of the given user.
 */
export function getSubordinateIds(userId: string, allUsers: User[]): string[] {
    const directReports = allUsers.filter((u) => u.reporting_to_id === userId);
    const ids: string[] = directReports.map((u) => u.id);
    for (const report of directReports) {
        ids.push(...getSubordinateIds(report.id, allUsers));
    }
    return ids;
}

/**
 * Returns the set of users visible to the current user (including self).
 */
export function getVisibleUsers(currentUser: User, allUsers: User[]): User[] {
    if (currentUser.level === 1 || currentUser.level === 0) return allUsers;
    const subIds = getSubordinateIds(currentUser.id, allUsers);
    return allUsers.filter((u) => u.id === currentUser.id || subIds.includes(u.id));
}

/**
 * Returns the set of KPIs visible to the current user.
 */
export function getVisibleKPIs(currentUser: User, allKPIs: KPI[], allUsers: User[]): KPI[] {
    const visibleUserIds = getVisibleUsers(currentUser, allUsers).map((u) => u.id);
    return allKPIs.filter((kpi) => visibleUserIds.includes(kpi.user_id));
}

/**
 * Returns alerts for the current user only.
 */
export function getUserAlerts(currentUser: User, allAlerts: Alert[]): Alert[] {
    return allAlerts.filter((a) => a.user_id === currentUser.id);
}

/**
 * Returns KPIs that are pending approval from direct/indirect subordinates.
 */
export function getPendingApprovals(currentUser: User, allKPIs: KPI[], allUsers: User[]): KPI[] {
    const subIds = getSubordinateIds(currentUser.id, allUsers);
    return allKPIs.filter((kpi) => subIds.includes(kpi.user_id) && kpi.status === "PendingApproval");
}

/**
 * Returns the level label string.
 */
export function getLevelLabel(level: number): string {
    const labels: Record<number, string> = {
        0: "Administrator",
        1: "VP",
        2: "Manager",
        3: "Asst. Manager",
        4: "Staff",
    };
    return labels[level] ?? "Unknown";
}
