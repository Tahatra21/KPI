"use client";

import { useState, useMemo } from "react";
import { KPI, User, KPIStatus } from "@/lib/types";
import { useAppStore } from "@/context/app-store";
import { useAuth } from "@/context/auth-context";
import { getAchievementPct, calculateScore, getColorCategory } from "@/lib/scoring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ChevronRight,
    ChevronDown,
    Edit2,
    Trash2,
    SendHorizonal,
    Plus,
    TrendingUp,
    TrendingDown,
    Minus,
    ArrowDownRight,
    BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KPIFormDialog } from "./kpi-form-dialog";
import { UpdateProgressDialog } from "./update-progress-dialog";
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

const statusConfig: Record<KPIStatus, { label: string; className: string }> = {
    Draft: { label: "Draft", className: "bg-muted text-muted-foreground border-border" },
    PendingApproval: { label: "Menunggu", className: "bg-chart-4/20 text-chart-4 border-chart-4/30" },
    Approved: { label: "Disetujui", className: "bg-chart-1/20 text-chart-1 border-chart-1/30" },
    Rejected: { label: "Ditolak", className: "bg-destructive/20 text-destructive border-destructive/30" },
};

const scoringTypeConfig = {
    normal: { icon: TrendingUp, label: "Normal", className: "text-chart-1" },
    reverse: { icon: TrendingDown, label: "Reverse", className: "text-chart-4" },
    deduction: { icon: ArrowDownRight, label: "Deduction", className: "text-destructive" },
};

function colorClass(pct: number) {
    const cat = getColorCategory(pct);
    return {
        green: { bar: "bg-chart-1", text: "text-chart-1" },
        yellow: { bar: "bg-chart-4", text: "text-chart-4" },
        red: { bar: "bg-destructive", text: "text-destructive" },
    }[cat];
}

function ProgressBar({ kpi }: { kpi: KPI }) {
    if (kpi.scoring_type === "deduction") {
        const deduction = kpi.achievement;
        const maxD = kpi.max_deduction ?? 10;
        return (
            <div className="flex items-center gap-2 min-w-[120px]">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full bg-destructive transition-all"
                        style={{ width: `${maxD > 0 ? Math.min((deduction / maxD) * 100, 100) : 0}%` }}
                    />
                </div>
                <span className="text-xs font-semibold tabular-nums w-12 text-right text-destructive">
                    -{deduction}
                </span>
            </div>
        );
    }

    const pct = getAchievementPct(kpi);
    const colors = colorClass(pct);
    return (
        <div className="flex items-center gap-2 min-w-[120px]">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                    className={cn("h-full rounded-full transition-all", colors.bar)}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                />
            </div>
            <span className={cn("text-xs font-semibold tabular-nums w-10 text-right", colors.text)}>
                {Math.round(pct)}%
            </span>
        </div>
    );
}

function KPIRow({
    kpi,
    depth,
    allKPIs,
    currentUser,
}: {
    kpi: KPI;
    depth: number;
    allKPIs: KPI[];
    currentUser: User;
}) {
    const [expanded, setExpanded] = useState(depth === 0);
    const [editOpen, setEditOpen] = useState(false);
    const [progressOpen, setProgressOpen] = useState(false);
    const { deleteKPI, submitKPI } = useAppStore();

    const children = allKPIs.filter((k) => k.parent_kpi_id === kpi.id);
    const hasChildren = children.length > 0;
    const { allUsers } = useAuth();
    const owner = allUsers.find((u) => u.id === kpi.user_id);
    const isOwner = currentUser.id === kpi.user_id;
    const status = statusConfig[kpi.status];
    const scoringConf = scoringTypeConfig[kpi.scoring_type];
    const ScoringIcon = scoringConf.icon;
    const pct = getAchievementPct(kpi);
    const score = calculateScore(kpi);

    const handleDelete = () => {
        deleteKPI(kpi.id);
        toast.success("KPI berhasil dihapus.");
    };

    const handleSubmit = () => {
        submitKPI(kpi.id);
        toast.success("KPI diajukan untuk persetujuan.");
    };

    return (
        <>
            <tr
                className={cn(
                    "group border-b border-border/30 hover:bg-muted/30 transition-colors",
                    depth > 0 && "bg-muted/10"
                )}
            >
                {/* Indicator */}
                <td className="py-3 px-4">
                    <div className="flex items-start gap-2" style={{ paddingLeft: `${depth * 20}px` }}>
                        {hasChildren ? (
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {expanded ? (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                    <ChevronRight className="w-3.5 h-3.5" />
                                )}
                            </button>
                        ) : (
                            <span className="w-3.5 flex-shrink-0" />
                        )}
                        <div>
                            <div className="flex items-center gap-1.5">
                                <p className={cn("text-sm font-medium text-foreground leading-tight", depth > 0 && "text-muted-foreground")}>
                                    {kpi.indicator}
                                </p>
                                <ScoringIcon className={cn("w-3 h-3 flex-shrink-0", scoringConf.className)} />
                            </div>
                            {owner && (
                                <p className="text-xs text-muted-foreground/70 mt-0.5">{owner.name} · {owner.position}</p>
                            )}
                        </div>
                    </div>
                </td>

                {/* Unit */}
                <td className="py-3 px-3 text-xs text-muted-foreground whitespace-nowrap">{kpi.unit}</td>

                {/* Weight / Scoring */}
                <td className="py-3 px-3 text-sm text-center">
                    {kpi.scoring_type === "deduction" ? (
                        <span className="text-destructive font-medium text-xs">Max -{kpi.max_deduction ?? 10}</span>
                    ) : (
                        <span className="text-muted-foreground font-medium">{kpi.weight}%</span>
                    )}
                </td>

                {/* Target */}
                <td className="py-3 px-3 text-sm text-right tabular-nums text-muted-foreground">
                    {kpi.scoring_type === "deduction" ? "—" : kpi.target.toLocaleString("id-ID")}
                </td>

                {/* Achievement */}
                <td className="py-3 px-3 text-sm text-right tabular-nums font-semibold">
                    {kpi.scoring_type === "deduction" ? (
                        <span className="text-destructive">-{kpi.achievement}</span>
                    ) : (
                        <span className={colorClass(pct).text}>
                            {kpi.achievement.toLocaleString("id-ID")}
                        </span>
                    )}
                </td>

                {/* Score */}
                <td className="py-3 px-3 text-sm text-right tabular-nums font-bold">
                    <span className={kpi.scoring_type === "deduction" ? "text-destructive" : colorClass(pct).text}>
                        {score > 0 ? score.toFixed(1) : score.toFixed(1)}
                    </span>
                </td>

                {/* Progress */}
                <td className="py-3 px-3">
                    <ProgressBar kpi={kpi} />
                </td>

                {/* Status */}
                <td className="py-3 px-3">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap", status.className)}>
                        {status.label}
                    </span>
                </td>

                {/* Actions */}
                <td className="py-3 px-4">
                    {isOwner && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {kpi.status === "Draft" || kpi.status === "Rejected" ? (
                                <>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditOpen(true)}>
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10"
                                        onClick={handleSubmit}
                                        title="Ajukan untuk persetujuan"
                                    >
                                        <SendHorizonal className="w-3.5 h-3.5" />
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Hapus KPI?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Tindakan ini tidak dapat dibatalkan. KPI &ldquo;{kpi.indicator}&rdquo; akan dihapus permanen.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                                                    Ya, Hapus
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </>
                            ) : kpi.status === "Approved" ? (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
                                    onClick={() => setProgressOpen(true)}
                                >
                                    <BarChart3 className="w-3.5 h-3.5" />
                                    Update
                                </Button>
                            ) : kpi.status === "PendingApproval" ? (
                                <span className="text-xs text-muted-foreground px-2">Menunggu...</span>
                            ) : null}
                        </div>
                    )}
                </td>
            </tr>

            {editOpen && (
                <KPIFormDialog
                    open={editOpen}
                    onClose={() => setEditOpen(false)}
                    existingKPI={kpi}
                />
            )}

            {progressOpen && (
                <UpdateProgressDialog
                    open={progressOpen}
                    onClose={() => setProgressOpen(false)}
                    kpi={kpi}
                />
            )}

            {expanded &&
                hasChildren &&
                children.map((child) => (
                    <KPIRow
                        key={child.id}
                        kpi={child}
                        depth={depth + 1}
                        allKPIs={allKPIs}
                        currentUser={currentUser}
                    />
                ))}
        </>
    );
}

export function KPITable({
    kpis,
    currentUser,
    showAddButton = false,
}: {
    kpis: KPI[];
    currentUser: User;
    showAddButton?: boolean;
}) {
    const [addOpen, setAddOpen] = useState(false);

    // Group by category
    const bersamaKPIs = kpis.filter(k => k.user_id === currentUser.id && k.category === "bersama" && !k.parent_kpi_id);
    const bidangKPIs = kpis.filter(k => k.user_id === currentUser.id && k.category === "bidang" && !k.parent_kpi_id);
    const otherKPIs = kpis.filter(k => k.user_id === currentUser.id && k.category === null && !k.parent_kpi_id);

    const hasCategorized = bersamaKPIs.length > 0 || bidangKPIs.length > 0;

    const renderHeader = () => (
        <tr className="border-b border-border/30 bg-muted/20">
            <th className="text-left text-xs font-medium text-muted-foreground py-2.5 px-4">Indikator Kinerja</th>
            <th className="text-left text-xs font-medium text-muted-foreground py-2.5 px-3">Satuan</th>
            <th className="text-center text-xs font-medium text-muted-foreground py-2.5 px-3">Bobot</th>
            <th className="text-right text-xs font-medium text-muted-foreground py-2.5 px-3">Target</th>
            <th className="text-right text-xs font-medium text-muted-foreground py-2.5 px-3">Capaian</th>
            <th className="text-right text-xs font-medium text-muted-foreground py-2.5 px-3">Skor</th>
            <th className="text-left text-xs font-medium text-muted-foreground py-2.5 px-3 min-w-[140px]">Progres</th>
            <th className="text-left text-xs font-medium text-muted-foreground py-2.5 px-3">Status</th>
            <th className="text-left text-xs font-medium text-muted-foreground py-2.5 px-4">Aksi</th>
        </tr>
    );

    const renderCategoryHeader = (label: string, weight: string) => (
        <tr className="bg-primary/5 border-b border-primary/10">
            <td colSpan={9} className="py-2 px-4">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">{label}</span>
                <span className="text-xs text-muted-foreground ml-2">({weight})</span>
            </td>
        </tr>
    );

    const allKPIs = kpis;

    return (
        <div className="rounded-xl border border-border/50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border/30">
                <p className="text-sm font-medium text-foreground">KPI Saya & Tim</p>
                {showAddButton && (
                    <Button size="sm" onClick={() => setAddOpen(true)} className="h-7 text-xs">
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Tambah KPI
                    </Button>
                )}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        {renderHeader()}
                    </thead>
                    <tbody>
                        {bersamaKPIs.length === 0 && bidangKPIs.length === 0 && otherKPIs.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="py-12 text-center text-muted-foreground text-sm">
                                    Belum ada KPI. Tambahkan KPI baru untuk memulai.
                                </td>
                            </tr>
                        ) : (
                            <>
                                {hasCategorized && bersamaKPIs.length > 0 && (
                                    <>
                                        {renderCategoryHeader("KPI Bersama", "Bobot 40%")}
                                        {bersamaKPIs.map((kpi) => (
                                            <KPIRow key={kpi.id} kpi={kpi} depth={0} allKPIs={allKPIs} currentUser={currentUser} />
                                        ))}
                                    </>
                                )}
                                {hasCategorized && bidangKPIs.length > 0 && (
                                    <>
                                        {renderCategoryHeader("KPI Bidang", "Bobot 60%")}
                                        {bidangKPIs.map((kpi) => (
                                            <KPIRow key={kpi.id} kpi={kpi} depth={0} allKPIs={allKPIs} currentUser={currentUser} />
                                        ))}
                                    </>
                                )}
                                {otherKPIs.length > 0 && (
                                    <>
                                        {hasCategorized && renderCategoryHeader("Lainnya", "—")}
                                        {otherKPIs.map((kpi) => (
                                            <KPIRow key={kpi.id} kpi={kpi} depth={0} allKPIs={allKPIs} currentUser={currentUser} />
                                        ))}
                                    </>
                                )}
                            </>
                        )}
                    </tbody>
                </table>
            </div>
            {addOpen && (
                <KPIFormDialog open={addOpen} onClose={() => setAddOpen(false)} />
            )}
        </div>
    );
}
