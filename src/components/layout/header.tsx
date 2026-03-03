"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useAppStore } from "@/context/app-store";
import { Bell, Menu } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const pageTitles: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/kpi-management": "Manajemen KPI",
    "/approvals": "Persetujuan KPI",
    "/notifications": "Notifikasi & Alert",
};

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
    const pathname = usePathname();
    const { currentUser } = useAuth();
    const { alerts } = useAppStore();

    const unreadCount = alerts.filter(
        (a) => currentUser && a.user_id === currentUser.id && !a.is_read
    ).length;

    const title = pageTitles[pathname] ?? "KPI Monitor";

    return (
        <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-border/50 bg-card/50 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center gap-3">
                {/* Hamburger menu — mobile only */}
                {onMenuClick && (
                    <button
                        onClick={onMenuClick}
                        className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
                    >
                        <Menu className="w-5 h-5 text-muted-foreground" />
                    </button>
                )}
                <div>
                    <h1 className="text-base font-semibold text-foreground">{title}</h1>
                    <p className="text-xs text-muted-foreground">
                        {currentUser?.department}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Link href="/notifications" className="relative">
                    <div className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-muted",
                        pathname === "/notifications" ? "bg-muted" : ""
                    )}>
                        <Bell className="w-4.5 h-4.5 text-muted-foreground" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-primary rounded-full text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </div>
                </Link>
            </div>
        </header>
    );
}
