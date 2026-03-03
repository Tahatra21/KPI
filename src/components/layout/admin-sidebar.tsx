"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { getLevelLabel } from "@/lib/rbac";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Settings,
    Users,
    ShieldAlert,
    LayoutDashboard,
    LogOut,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Manajemen User", icon: Users },
    { href: "/admin/audit", label: "Log Audit", icon: ShieldAlert },
    { href: "/admin/config", label: "Konfigurasi Sistem", icon: Settings },
];

export function AdminSidebar() {
    const { currentUser, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    if (!currentUser) return null;

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    return (
        <aside className="w-64 flex-shrink-0 h-screen flex flex-col bg-slate-900 text-slate-100 border-r border-slate-800">
            {/* Logo */}
            <div className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-900/50 flex-shrink-0">
                    <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                    <p className="font-bold text-sm text-slate-50">Admin Center</p>
                    <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">System Config</p>
                </div>
            </div>

            <Separator className="bg-slate-800" />

            {/* User card */}
            <div className="p-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <Avatar className="w-9 h-9 border-2 border-indigo-500/30">
                        <AvatarFallback className="bg-indigo-950 text-indigo-400 font-bold text-sm">
                            {currentUser.name.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-200 truncate">{currentUser.name}</p>
                        <p className="text-xs text-slate-400 truncate">{currentUser.department}</p>
                    </div>
                </div>
                <div className="mt-2 px-1">
                    <span className="text-xs px-2 py-0.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 font-medium">
                        Level {currentUser.level} — {getLevelLabel(currentUser.level)}
                    </span>
                </div>
            </div>

            <Separator className="bg-slate-800" />

            {/* Navigation */}
            <ScrollArea className="flex-1 px-3 py-3">
                <nav className="space-y-1">
                    {navItems.map(({ href, label, icon: Icon }) => {
                        // Check active strictly or if pathname starts with href for subpages
                        const isActive = pathname === href || (pathname.startsWith(href) && href !== "/admin/dashboard");

                        return (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                                    isActive
                                        ? "bg-indigo-600/90 text-white shadow-md shadow-indigo-900/50"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon className="w-4 h-4 flex-shrink-0" />
                                    <span>{label}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <ChevronRight className={cn("w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity", isActive && "opacity-60")} />
                                </div>
                            </Link>
                        );
                    })}
                </nav>
            </ScrollArea>

            <Separator className="bg-slate-800" />

            {/* Logout */}
            <div className="p-3">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar Administrator</span>
                </button>
            </div>
        </aside>
    );
}
