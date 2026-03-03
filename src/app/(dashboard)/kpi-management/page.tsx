"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useAppStore } from "@/context/app-store";

import { KPITable } from "@/components/kpi/kpi-table";
import { KPIFormDialog } from "@/components/kpi/kpi-form-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Filter, BarChart3 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { KPIStatus } from "@/lib/types";

export default function KPIManagementPage() {
    const { currentUser } = useAuth();
    const { kpis } = useAppStore();
    const [addOpen, setAddOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const visibleKPIs = useMemo(() => {
        if (!currentUser) return [];
        let visible = kpis;
        if (statusFilter !== "all") {
            visible = visible.filter((k) => k.status === statusFilter);
        }
        return visible;
    }, [currentUser, kpis, statusFilter]);

    const myKPIs = useMemo(() => {
        if (!currentUser) return [];
        return kpis.filter((k) => k.user_id === currentUser.id);
    }, [currentUser, kpis]);

    if (!currentUser) return null;

    const statusCounts = {
        all: myKPIs.length,
        Draft: myKPIs.filter((k) => k.status === "Draft").length,
        PendingApproval: myKPIs.filter((k) => k.status === "PendingApproval").length,
        Approved: myKPIs.filter((k) => k.status === "Approved").length,
        Rejected: myKPIs.filter((k) => k.status === "Rejected").length,
    };

    const filterTabs: { value: string; label: string }[] = [
        { value: "all", label: "Semua" },
        { value: "Draft", label: "Draft" },
        { value: "PendingApproval", label: "Menunggu" },
        { value: "Approved", label: "Disetujui" },
        { value: "Rejected", label: "Ditolak" },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Manajemen KPI</h2>
                    <p className="text-sm text-muted-foreground">
                        Kelola semua indikator kinerja Anda dan tim
                    </p>
                </div>
                <Button onClick={() => setAddOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah KPI
                </Button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-lg border border-border/50 w-fit">
                {filterTabs.map((tab) => {
                    const count = statusCounts[tab.value as keyof typeof statusCounts] ?? 0;
                    const isActive = statusFilter === tab.value;
                    return (
                        <button
                            key={tab.value}
                            onClick={() => setStatusFilter(tab.value)}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
                                isActive
                                    ? "bg-card shadow-sm text-foreground border border-border/50"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <span>{tab.label}</span>
                            <span
                                className={cn(
                                    "text-[10px] tabular-nums rounded-full px-1.5 py-0.5",
                                    isActive ? "bg-primary/20 text-primary" : "bg-muted/50"
                                )}
                            >
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* KPI Table */}
            <KPITable kpis={visibleKPIs} currentUser={currentUser} showAddButton={false} />

            {/* Add KPI Dialog */}
            {addOpen && (
                <KPIFormDialog open={addOpen} onClose={() => setAddOpen(false)} />
            )}
        </div>
    );
}
