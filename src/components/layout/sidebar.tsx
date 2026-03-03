"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useAppStore } from "@/context/app-store";
import { getLevelLabel } from "@/lib/rbac";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    BarChart3,
    LayoutDashboard,
    Target,
    CheckSquare,
    Bell,
    LogOut,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getPendingApprovals } from "@/lib/rbac";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/kpi-management", label: "Manajemen KPI", icon: Target },
    { href: "/approvals", label: "Persetujuan", icon: CheckSquare },
];

export function Sidebar() {
    const { currentUser, allUsers, logout } = useAuth();
    const { kpis, alerts } = useAppStore();
    const pathname = usePathname();
    const router = useRouter();

    if (!currentUser) return null;

    const pendingCount = getPendingApprovals(currentUser, kpis, allUsers).length;
    const unreadAlertCount = alerts.filter(
        (a) => a.user_id === currentUser.id && !a.is_read
    ).length;

    const levelColors: Record<number, string> = {
        1: "bg-primary/20 text-primary border-primary/30",
        2: "bg-secondary/20 text-secondary border-secondary/30",
        3: "bg-accent text-accent-foreground border-accent",
        4: "bg-chart-1/20 text-chart-1 border-chart-1/30",
    };

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    return (
        <aside className="w-64 flex-shrink-0 h-screen flex flex-col bg-card border-r border-border/50">
            {/* Logo */}
            <div className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/30 flex-shrink-0">
                    <BarChart3 className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                    <p className="font-bold text-sm text-foreground">KPI Monitor</p>
                    <p className="text-xs text-muted-foreground">On-Premise</p>
                </div>
            </div>

            <Separator />

            {/* User card */}
            <div className="p-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <Avatar className="w-9 h-9 border-2 border-primary/30">
                        <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm">
                            {currentUser.name.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{currentUser.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{currentUser.department}</p>
                    </div>
                </div>
                <div className="mt-2 px-1">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", levelColors[currentUser.level])}>
                        Level {currentUser.level} — {getLevelLabel(currentUser.level)}
                    </span>
                </div>
            </div>

            <Separator />

            {/* Navigation */}
            <ScrollArea className="flex-1 px-3 py-3">
                <nav className="space-y-1">
                    {navItems.map(({ href, label, icon: Icon }) => {
                        const isActive = pathname === href;
                        const badge =
                            href === "/approvals" && pendingCount > 0
                                ? pendingCount
                                : href === "/notifications" && unreadAlertCount > 0
                                    ? unreadAlertCount
                                    : null;

                        return (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon className="w-4 h-4 flex-shrink-0" />
                                    <span>{label}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    {badge !== null && (
                                        <span className={cn("text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold", isActive ? "bg-primary-foreground/20" : "bg-primary text-primary-foreground")}>
                                            {badge > 9 ? "9+" : badge}
                                        </span>
                                    )}
                                    <ChevronRight className={cn("w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity", isActive && "opacity-60")} />
                                </div>
                            </Link>
                        );
                    })}
                </nav>
            </ScrollArea>

            <Separator />

            {/* Logout */}
            <div className="p-3">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar</span>
                </button>
            </div>
        </aside>
    );
}
