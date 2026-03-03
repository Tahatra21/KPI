"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { Menu } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { currentUser, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (!isLoading) {
            if (!currentUser) {
                router.push("/login");
            } else if (currentUser.level !== 0) {
                // If not Admin, redirect to standard dashboard
                router.replace("/dashboard");
            }
        }
    }, [currentUser, isLoading, router]);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        // Only run logic if sidebar is already open
        if (sidebarOpen) {
            setSidebarOpen(false);
        }
    }, [pathname, sidebarOpen]);

    if (isLoading || !currentUser || currentUser.level !== 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="flex items-center gap-3 text-slate-500">
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium">Memuat Admin Center...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar — hidden on mobile, shown on md+ */}
            <div
                className={`
                    fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out
                    md:relative md:translate-x-0 md:z-auto
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                `}
            >
                <AdminSidebar />
            </div>

            <div className="flex flex-col flex-1 overflow-hidden min-w-0">
                {/* Mobile Header for Admin */}
                <header className="md:hidden h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center px-4 justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
                            <span className="text-white font-bold text-xs">AC</span>
                        </div>
                        <span className="font-semibold text-sm">Admin Center</span>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
