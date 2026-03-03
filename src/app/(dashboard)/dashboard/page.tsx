"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { useAppStore } from "@/context/app-store";
import { getSubordinateIds, getPendingApprovals, getLevelLabel } from "@/lib/rbac";
import { calculateTotalScore, getColorCategory } from "@/lib/scoring";
import { KPITable } from "@/components/kpi/kpi-table";
import {
    Target,
    TrendingUp,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Users,
    BarChart3,
    FileText,
    Layers,
    Briefcase,
    ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    variant = "default",
}: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType;
    variant?: "success" | "warning" | "danger" | "info" | "default";
}) {
    const variantMap = {
        success: { iconBg: "bg-chart-1/20", text: "text-chart-1" },
        warning: { iconBg: "bg-chart-4/20", text: "text-chart-4" },
        danger: { iconBg: "bg-destructive/20", text: "text-destructive" },
        info: { iconBg: "bg-secondary/20", text: "text-secondary" },
        default: { iconBg: "bg-muted", text: "text-muted-foreground" },
    };
    const v = variantMap[variant];

    return (
        <div className="rounded-xl border border-border/50 bg-card p-4 flex items-start gap-4">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", v.iconBg)}>
                <Icon className={cn("w-5 h-5", v.text)} />
            </div>
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">{title}</p>
                <p className={cn("text-2xl font-bold mt-0.5", v.text)}>{value}</p>
                {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
        </div>
    );
}

function pctVariant(pct: number): "success" | "warning" | "danger" {
    const cat = getColorCategory(pct);
    return cat === "green" ? "success" : cat === "yellow" ? "warning" : "danger";
}

export default function DashboardPage() {
    const { currentUser } = useAuth();
    const { kpis, alerts } = useAppStore();

    const { allUsers } = useAuth();

    const stats = useMemo(() => {
        if (!currentUser) return null;

        const myKPIs = kpis.filter((k) => k.user_id === currentUser.id);
        const subIds = getSubordinateIds(currentUser.id, allUsers);
        const pendingApprovals = getPendingApprovals(currentUser, kpis, allUsers);

        // Score calculation using new scoring engine
        const scores = calculateTotalScore(myKPIs);
        const totalPct = scores.totalMax > 0 ? (scores.totalScore / scores.totalMax) * 100 : 0;
        const bersamaPct = scores.bersamaMax > 0 ? (scores.bersamaScore / scores.bersamaMax) * 100 : 0;
        const bidangPct = scores.bidangMax > 0 ? (scores.bidangScore / scores.bidangMax) * 100 : 0;

        const approvedCount = myKPIs.filter((k) => k.status === "Approved").length;
        const draftCount = myKPIs.filter((k) => k.status === "Draft" || k.status === "Rejected").length;

        return {
            totalKPIs: myKPIs.length,
            scores,
            totalPct: Math.round(totalPct * 10) / 10,
            bersamaPct: Math.round(bersamaPct * 10) / 10,
            bidangPct: Math.round(bidangPct * 10) / 10,
            approvedCount,
            draftCount,
            pendingCount: pendingApprovals.length,
            subordinateCount: subIds.length,
            visibleKPIs: kpis,
        };
    }, [currentUser, kpis, alerts]);

    if (!currentUser || !stats) return null;

    const hasCategorized = stats.scores.bersamaMax > 0 || stats.scores.bidangMax > 0;

    return (
        <div className="space-y-6">
            {/* Welcome */}
            <div>
                <h2 className="text-lg font-semibold text-foreground">
                    Selamat Datang, {currentUser.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                    {getLevelLabel(currentUser.level)} · {currentUser.department}
                </p>
            </div>

            {/* Total Score */}
            <div className="rounded-xl border border-border/50 bg-card p-5">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <p className="text-xs text-muted-foreground font-medium">Total Skor KPI 2026</p>
                        <p className={cn("text-3xl font-bold mt-0.5",
                            pctVariant(stats.totalPct) === "success" ? "text-chart-1" :
                                pctVariant(stats.totalPct) === "warning" ? "text-chart-4" : "text-destructive"
                        )}>
                            {stats.scores.totalScore.toFixed(1)}
                            <span className="text-base font-normal text-muted-foreground ml-1">/ {stats.scores.totalMax}</span>
                        </p>
                    </div>
                    <div className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-bold",
                        pctVariant(stats.totalPct) === "success" ? "bg-chart-1/20 text-chart-1" :
                            pctVariant(stats.totalPct) === "warning" ? "bg-chart-4/20 text-chart-4" : "bg-destructive/20 text-destructive"
                    )}>
                        {stats.totalPct}%
                    </div>
                </div>
                {hasCategorized && (
                    <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border/30">
                        <div>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">KPI Bersama</p>
                            <p className="text-lg font-bold tabular-nums text-foreground mt-0.5">
                                {stats.scores.bersamaScore.toFixed(1)}<span className="text-xs text-muted-foreground font-normal">/{stats.scores.bersamaMax}</span>
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">KPI Bidang</p>
                            <p className="text-lg font-bold tabular-nums text-foreground mt-0.5">
                                {stats.scores.bidangScore.toFixed(1)}<span className="text-xs text-muted-foreground font-normal">/{stats.scores.bidangMax}</span>
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Compliance</p>
                            <p className="text-lg font-bold tabular-nums text-destructive mt-0.5">
                                -{stats.scores.complianceDeduction.toFixed(1)}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="KPI Disetujui"
                    value={stats.approvedCount}
                    subtitle={`dari ${stats.totalKPIs} total`}
                    icon={CheckCircle2}
                    variant="success"
                />
                <StatCard
                    title="Perlu Tindakan"
                    value={stats.draftCount}
                    subtitle="Draft / Ditolak"
                    icon={FileText}
                    variant={stats.draftCount > 0 ? "warning" : "default"}
                />
                {currentUser.level < 4 ? (
                    <StatCard
                        title="Menunggu Persetujuan"
                        value={stats.pendingCount}
                        subtitle={`dari ${stats.subordinateCount} bawahan`}
                        icon={Clock}
                        variant={stats.pendingCount > 0 ? "info" : "default"}
                    />
                ) : (
                    <StatCard
                        title="Total KPI"
                        value={stats.totalKPIs}
                        subtitle="KPI aktif"
                        icon={Target}
                        variant="info"
                    />
                )}
                <StatCard
                    title="Compliance Deduction"
                    value={`-${stats.scores.complianceDeduction}`}
                    subtitle="dari max -10"
                    icon={ShieldAlert}
                    variant={stats.scores.complianceDeduction > 0 ? "danger" : "success"}
                />
            </div>

            {/* KPI Table */}
            <KPITable kpis={stats.visibleKPIs} currentUser={currentUser} showAddButton />
        </div>
    );
}
