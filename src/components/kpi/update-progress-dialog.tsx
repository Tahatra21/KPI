"use client";

import { useState, useEffect } from "react";
import { KPI } from "@/lib/types";
import { useAppStore } from "@/context/app-store";
import { getAchievementPct, calculateScore, getColorCategory } from "@/lib/scoring";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, ArrowDownRight, History } from "lucide-react";

type UpdateProgressDialogProps = {
    open: boolean;
    onClose: () => void;
    kpi: KPI;
};

export function UpdateProgressDialog({ open, onClose, kpi }: UpdateProgressDialogProps) {
    const { updateKPI, addAlert, kpis } = useAppStore();
    const [achievement, setAchievement] = useState(String(kpi.achievement));

    const hasChildren = kpis.some(k => k.parent_kpi_id === kpi.id);

    useEffect(() => {
        setAchievement(String(kpi.achievement));
    }, [kpi]);

    const newValue = parseFloat(achievement) || 0;
    const oldValue = kpi.achievement;
    const difference = newValue - oldValue;

    // Preview scoring
    const previewKPI: KPI = { ...kpi, achievement: newValue };
    const previewPct = getAchievementPct(previewKPI);
    const previewScore = calculateScore(previewKPI);
    const previewColor = getColorCategory(previewPct);
    const currentPct = getAchievementPct(kpi);
    const currentScore = calculateScore(kpi);

    const colorMap = {
        green: "text-chart-1",
        yellow: "text-chart-4",
        red: "text-destructive",
    };

    const scoringLabel = {
        normal: { icon: TrendingUp, text: "Normal — Semakin tinggi semakin baik" },
        reverse: { icon: TrendingDown, text: "Reverse — Semakin rendah semakin baik" },
        deduction: { icon: ArrowDownRight, text: "Deduction — Nilai pengurang" },
    };

    const ScoringIcon = scoringLabel[kpi.scoring_type].icon;

    const handleSave = () => {
        if (newValue === oldValue) {
            onClose();
            return;
        }

        updateKPI(kpi.id, { achievement: newValue });

        // Add an alert about the progress update
        addAlert({
            id: `ALT-PROG-${Date.now()}`,
            user_id: kpi.user_id,
            type: "Changed",
            message: `Progress KPI "${kpi.indicator}" diperbarui: ${oldValue} → ${newValue} ${kpi.unit}`,
            is_read: false,
            created_at: new Date().toISOString(),
            related_kpi_id: kpi.id,
        });

        toast.success(`Progress "${kpi.indicator}" berhasil diperbarui.`);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History className="w-5 h-5 text-primary" />
                        Update Progress
                    </DialogTitle>
                    <DialogDescription>
                        Perbarui capaian/realisasi KPI tanpa mengubah status approval.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* KPI Info */}
                    <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                        <p className="text-sm font-semibold text-foreground">{kpi.indicator}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                            <ScoringIcon className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{scoringLabel[kpi.scoring_type].text}</span>
                        </div>
                        {kpi.scoring_type !== "deduction" && (
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span>Target: <strong className="text-foreground">{kpi.target.toLocaleString("id-ID")} {kpi.unit}</strong></span>
                                <span>Bobot: <strong className="text-foreground">{kpi.weight}%</strong></span>
                            </div>
                        )}
                        {kpi.scoring_type === "deduction" && (
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span>Max Pengurang: <strong className="text-destructive">-{kpi.max_deduction ?? 10}</strong></span>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">
                            {kpi.scoring_type === "deduction" ? "Nilai Pengurang Saat Ini" : `Capaian / Realisasi (${kpi.unit})`}
                        </label>
                        <Input
                            type="number"
                            value={achievement}
                            onChange={(e) => setAchievement(e.target.value)}
                            placeholder="0"
                            className="text-lg font-semibold"
                            autoFocus
                            disabled={hasChildren}
                        />
                        <p className="text-xs text-muted-foreground">
                            Nilai sebelumnya: <strong>{oldValue.toLocaleString("id-ID")} {kpi.unit}</strong>
                            {difference !== 0 && (
                                <span className={cn("ml-2 font-bold", difference > 0 ? "text-chart-1" : "text-destructive")}>
                                    ({difference > 0 ? "+" : ""}{difference.toLocaleString("id-ID")})
                                </span>
                            )}
                        </p>
                        {hasChildren && (
                            <p className="text-xs text-amber-600 dark:text-amber-500 font-medium mt-2 bg-amber-50 dark:bg-amber-950/30 p-2 rounded border border-amber-200 dark:border-amber-900/50">
                                🔒 Capaian KPI ini dihitung otomatis (average) dari progres KPI bawahannya. Anda tidak dapat mengubahnya secara manual.
                            </p>
                        )}
                    </div>

                    {/* Preview */}
                    <div className="p-3 rounded-lg border border-border/50 bg-card">
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-2">Preview Skor</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] text-muted-foreground">Sebelum</p>
                                <p className="text-lg font-bold tabular-nums text-muted-foreground">
                                    {currentScore.toFixed(1)}
                                </p>
                                <p className="text-xs text-muted-foreground">{Math.round(currentPct)}%</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground">Sesudah</p>
                                <p className={cn("text-lg font-bold tabular-nums", colorMap[previewColor])}>
                                    {previewScore.toFixed(1)}
                                </p>
                                <p className={cn("text-xs", colorMap[previewColor])}>{Math.round(previewPct)}%</p>
                            </div>
                        </div>
                        {/* Progress bar preview */}
                        <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className={cn("h-full rounded-full transition-all",
                                    previewColor === "green" ? "bg-chart-1" :
                                        previewColor === "yellow" ? "bg-chart-4" : "bg-destructive"
                                )}
                                style={{ width: `${Math.min(previewPct, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Batal</Button>
                    <Button onClick={handleSave} disabled={newValue === oldValue || hasChildren}>
                        Simpan Progress
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
