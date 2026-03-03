"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useAppStore } from "@/context/app-store";

import { getPendingApprovals, getLevelLabel } from "@/lib/rbac";
import { KPI } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    CheckCircle2,
    XCircle,
    RotateCcw,
    Clock,
    User,
    Target,
    ChevronDown,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function getAchievementPercent(kpi: KPI): number {
    if (kpi.target === 0) return 0;
    return Math.min((kpi.achievement / kpi.target) * 100, 150);
}

function ApprovalCard({ kpi }: { kpi: KPI }) {
    const { approveKPI, rejectKPI, updateKPI } = useAppStore();
    const { currentUser, allUsers } = useAuth();
    const owner = allUsers.find((u) => u.id === kpi.user_id);
    const pct = getAchievementPercent(kpi);
    const [expanded, setExpanded] = useState(false);

    if (!currentUser) return null;

    const handleApprove = () => {
        approveKPI(kpi.id);
        toast.success(`KPI "${kpi.indicator}" telah disetujui.`);
    };

    const handleReject = () => {
        rejectKPI(kpi.id);
        toast.error(`KPI "${kpi.indicator}" telah ditolak.`);
    };

    const handleRevise = () => {
        updateKPI(kpi.id, { status: "Draft" });
        toast.info(`KPI "${kpi.indicator}" dikembalikan untuk revisi.`);
    };

    const progressColor =
        pct >= 90 ? "bg-chart-1" : pct >= 70 ? "bg-chart-4" : "bg-destructive";
    const progressTextColor =
        pct >= 90 ? "text-chart-1" : pct >= 70 ? "text-chart-4" : "text-destructive";

    return (
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden transition-all hover:border-border/80">
            {/* Main row */}
            <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-lg bg-chart-4/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Clock className="w-4 h-4 text-chart-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground leading-tight">
                                {kpi.indicator}
                            </p>
                            {owner && (
                                <div className="flex items-center gap-2 mt-1">
                                    <User className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                        {owner.name} · {owner.position}
                                    </span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted font-medium text-muted-foreground">
                                        L{owner.level}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Achievement */}
                    <div className="text-right flex-shrink-0">
                        <p className={cn("text-lg font-bold tabular-nums", progressTextColor)}>
                            {Math.round(pct)}%
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                            {kpi.achievement.toLocaleString("id-ID")} / {kpi.target.toLocaleString("id-ID")} {kpi.unit}
                        </p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                        className={cn("h-full rounded-full transition-all", progressColor)}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                </div>

                {/* Expandable detail */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    Detail
                </button>

                {expanded && (
                    <div className="mt-3 grid grid-cols-3 gap-3 p-3 rounded-lg bg-muted/30">
                        <div>
                            <p className="text-[10px] text-muted-foreground font-medium mb-0.5">Formula</p>
                            <p className="text-xs text-foreground">{kpi.formula || "—"}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground font-medium mb-0.5">Bobot</p>
                            <p className="text-xs text-foreground">{kpi.weight}%</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground font-medium mb-0.5">Deadline</p>
                            <p className="text-xs text-foreground">
                                {new Date(kpi.deadline).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                })}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 px-4 py-3 bg-muted/20 border-t border-border/30">
                <Button
                    size="sm"
                    onClick={handleApprove}
                    className="h-8 text-xs"
                >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    Setujui
                </Button>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                        >
                            <XCircle className="w-3.5 h-3.5 mr-1.5" />
                            Tolak
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Tolak KPI?</AlertDialogTitle>
                            <AlertDialogDescription>
                                KPI &ldquo;{kpi.indicator}&rdquo; milik {owner?.name} akan ditolak. Mereka akan mendapat notifikasi untuk melakukan perbaikan.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={handleReject} className="bg-destructive hover:bg-destructive/90">
                                Ya, Tolak
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRevise}
                    className="h-8 text-xs text-chart-4 border-chart-4/30 hover:bg-chart-4/10"
                >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    Revisi
                </Button>
            </div>
        </div>
    );
}

export default function ApprovalsPage() {
    const { currentUser, allUsers } = useAuth();
    const { kpis } = useAppStore();

    const pendingKPIs = useMemo(() => {
        if (!currentUser) return [];
        return getPendingApprovals(currentUser, kpis, allUsers);
    }, [currentUser, kpis]);

    if (!currentUser) return null;

    if (currentUser.level === 4) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Tidak Ada Akses</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    Halaman persetujuan hanya tersedia untuk Manager, Assistant Manager, dan VP.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-lg font-semibold text-foreground">Persetujuan KPI</h2>
                <p className="text-sm text-muted-foreground">
                    {pendingKPIs.length > 0
                        ? `${pendingKPIs.length} KPI menunggu persetujuan Anda`
                        : "Tidak ada KPI yang menunggu persetujuan"}
                </p>
            </div>

            {/* Cards List */}
            {pendingKPIs.length > 0 ? (
                <div className="grid gap-4">
                    {pendingKPIs.map((kpi) => (
                        <ApprovalCard key={kpi.id} kpi={kpi} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-border/50 bg-card">
                    <div className="w-14 h-14 rounded-2xl bg-chart-1/10 flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-7 h-7 text-chart-1" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Semua Beres!</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                        Tidak ada KPI bawahan yang menunggu persetujuan saat ini.
                    </p>
                </div>
            )}
        </div>
    );
}
