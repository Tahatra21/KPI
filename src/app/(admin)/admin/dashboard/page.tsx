"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";
import { Users, ShieldAlert, Settings, Activity } from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboardPage() {
    const { currentUser } = useAuth();
    const [stats, setStats] = useState({
        totalUsers: 0,
        onlineStatus: "Online",
        maintenanceMode: false,
        activePeriod: "...",
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch users for count
                const usersRes = await fetch("/api/admin/users", { credentials: "include" });
                if (!usersRes.ok) throw new Error("Gagal memuat pengguna");
                const usersData = await usersRes.json();

                // Fetch config for period and maintenance
                const configRes = await fetch("/api/admin/config", { credentials: "include" });
                if (!configRes.ok) throw new Error("Gagal memuat konfigurasi");
                const configData = await configRes.json();

                const maintenanceConfig = configData.configs.find((c: { key: string }) => c.key === "maintenance_mode");
                const periodConfig = configData.configs.find((c: { key: string }) => c.key === "active_kpi_period");

                setStats({
                    totalUsers: usersData.users.length,
                    onlineStatus: maintenanceConfig?.value === "true" ? "Maintenance" : "Online",
                    maintenanceMode: maintenanceConfig?.value === "true",
                    activePeriod: periodConfig?.value || "2026",
                });
            } catch (error) {
                console.error("Dashboard error:", error);
                toast.error("Gagal memuat data dashboard");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Administrator Dashboard
                </h1>
                <p className="text-slate-500 mt-1">
                    Selamat datang di panel kontrol sistem KPI Monitoring, {currentUser?.name}.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Users Stat */}
                <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-medium text-slate-500">Total Pengguna Aktif</p>
                        <Users className="w-5 h-5 text-indigo-500/50" />
                    </div>
                    {isLoading ? (
                        <div className="h-9 w-16 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
                    ) : (
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalUsers}</p>
                    )}
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <Link href="/admin/users" className="text-xs text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1 w-fit">
                            Kelola Pengguna &rarr;
                        </Link>
                    </div>
                </div>

                {/* System Status */}
                <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-medium text-slate-500">Sistem Status</p>
                        <Activity className={`w-5 h-5 ${stats.maintenanceMode ? 'text-amber-500/50' : 'text-emerald-500/50'}`} />
                    </div>
                    {isLoading ? (
                        <div className="h-9 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
                    ) : (
                        <p className={`text-3xl font-bold ${stats.maintenanceMode ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {stats.onlineStatus}
                        </p>
                    )}
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <Link href="/admin/config" className="text-xs text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1 w-fit">
                            Ubah Mode Pemeliharaan &rarr;
                        </Link>
                    </div>
                </div>

                {/* Active Period */}
                <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-medium text-slate-500">Periode Aktif KPI</p>
                        <Settings className="w-5 h-5 text-indigo-500/50" />
                    </div>
                    {isLoading ? (
                        <div className="h-9 w-20 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
                    ) : (
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.activePeriod}</p>
                    )}
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <Link href="/admin/config" className="text-xs text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1 w-fit">
                            Konfigurasi Periode &rarr;
                        </Link>
                    </div>
                </div>
            </div>

            <div className="mt-8 p-8 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left bg-slate-50/50 dark:bg-slate-900/50">
                <div>
                    <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 flex items-center justify-center sm:justify-start gap-2">
                        <ShieldAlert className="w-5 h-5 text-indigo-600" />
                        Pantau Aktivitas Sistem
                    </h3>
                    <p className="text-sm text-slate-500 mt-2 max-w-lg">
                        Seluruh perubahan pengaturan sistem dan data pengguna tingkat lanjut direkam ke dalam log audit untuk keperluan keamanan.
                    </p>
                </div>
                <Link href="/admin/audit" className="shrink-0 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium shadow-sm">
                    Lihat Log Audit
                </Link>
            </div>
        </div>
    );
}
