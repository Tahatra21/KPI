"use client";

import { useState, useEffect } from "react";
import { KPI, KPIStatus, ScoringType, KPICategory } from "@/lib/types";
import { useAppStore } from "@/context/app-store";
import { useAuth } from "@/context/auth-context";

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
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type KPIFormDialogProps = {
    open: boolean;
    onClose: () => void;
    existingKPI?: KPI;
};

export function KPIFormDialog({ open, onClose, existingKPI }: KPIFormDialogProps) {
    const { currentUser, allUsers } = useAuth();
    const { addKPI, updateKPI, kpis } = useAppStore();

    const [indicator, setIndicator] = useState("");
    const [formula, setFormula] = useState("");
    const [unit, setUnit] = useState("");
    const [weight, setWeight] = useState("");
    const [target, setTarget] = useState("");
    const [targetS1, setTargetS1] = useState("0");
    const [targetS2, setTargetS2] = useState("0");
    const computedTarget = (parseFloat(targetS1) || 0) + (parseFloat(targetS2) || 0);
    const [achievement, setAchievement] = useState("");
    const [deadline, setDeadline] = useState("2026-12-31");
    const [parentKpiId, setParentKpiId] = useState<string>("none");
    const [scoringType, setScoringType] = useState<ScoringType>("normal");
    const [category, setCategory] = useState<string>("none");
    const [maxDeduction, setMaxDeduction] = useState("10");

    const hasChildren = existingKPI ? kpis.some(k => k.parent_kpi_id === existingKPI.id) : false;

    useEffect(() => {
        if (existingKPI) {
            setIndicator(existingKPI.indicator);
            setFormula(existingKPI.formula);
            setUnit(existingKPI.unit);
            setWeight(String(existingKPI.weight));
            setTarget(String(existingKPI.target));
            setTargetS1(String(existingKPI.target_s1 ?? 0));
            setTargetS2(String(existingKPI.target_s2 ?? 0));
            setAchievement(String(existingKPI.achievement));
            setDeadline(existingKPI.deadline);
            setParentKpiId(existingKPI.parent_kpi_id ?? "none");
            setScoringType(existingKPI.scoring_type);
            setCategory(existingKPI.category ?? "none");
            setMaxDeduction(String(existingKPI.max_deduction ?? 10));
        }
    }, [existingKPI]);

    if (!currentUser) return null;

    // Potential parent KPIs — enforce strict cascading
    // L1: Cannot have parent
    // L2: Can only select L1 Bidang (cannot be Bersama/Korporat)
    // L3: Can only select L2
    // L4: Can only select L3
    const potentialParents = kpis.filter((k) => {
        const owner = allUsers.find(u => u.id === k.user_id);
        if (!owner) return false;

        if (currentUser.level === 1) return false; // L1 has no parents
        if (currentUser.level === 2 && owner.level === 1 && k.category === "bidang") return true;
        if (currentUser.level === 3 && owner.level === 2) return true;
        if (currentUser.level === 4 && owner.level === 3) return true;

        return false;
    });

    const isParentMandatory = currentUser.level > 1;

    const handleSave = () => {
        if (!indicator.trim() || !unit.trim() || !weight || !target) {
            // For deduction type, target and weight are not required
            if (scoringType !== "deduction" && (!weight || !target)) {
                toast.error("Mohon lengkapi semua field yang diperlukan.");
                return;
            }
        }

        if (isParentMandatory && parentKpiId === "none") {
            toast.error("KPI Induk (Cascading) wajib dipilih untuk Level Anda.");
            return;
        }

        const categoryValue: KPICategory = category === "none" ? null : (category as "bersama" | "bidang");

        if (existingKPI) {
            updateKPI(existingKPI.id, {
                indicator: indicator.trim(),
                formula: formula.trim(),
                unit: unit.trim(),
                weight: parseFloat(weight) || 0,
                target: computedTarget,
                target_s1: parseFloat(targetS1) || 0,
                target_s2: parseFloat(targetS2) || 0,
                achievement: parseFloat(achievement) || 0,
                deadline,
                parent_kpi_id: parentKpiId === "none" ? null : parentKpiId,
                status: "Draft",
                scoring_type: scoringType,
                category: categoryValue,
                max_deduction: scoringType === "deduction" ? parseFloat(maxDeduction) || 10 : undefined,
            });
            toast.success("KPI berhasil diperbarui.");
        } else {
            const newKPI = {
                user_id: currentUser.id,
                parent_kpi_id: parentKpiId === "none" ? null : parentKpiId,
                indicator: indicator.trim(),
                formula: formula.trim(),
                unit: unit.trim(),
                weight: parseFloat(weight) || 0,
                target: computedTarget,
                target_s1: parseFloat(targetS1) || 0,
                target_s2: parseFloat(targetS2) || 0,
                achievement: parseFloat(achievement) || 0,
                deadline,
                status: "Draft" as const,
                scoring_type: scoringType,
                category: categoryValue,
                max_deduction: scoringType === "deduction" ? parseFloat(maxDeduction) || 10 : undefined,
            };
            addKPI(newKPI);
            toast.success("KPI baru berhasil ditambahkan.");
        }
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{existingKPI ? "Edit KPI" : "Tambah KPI Baru"}</DialogTitle>
                    <DialogDescription>
                        {existingKPI ? "Perbarui detail KPI Anda." : "Isi detail KPI baru untuk periode ini."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Indikator Kinerja Kunci *</label>
                        <Input
                            placeholder="e.g. Tingkat Penyelesaian Laporan"
                            value={indicator}
                            onChange={(e) => setIndicator(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Formula / Rumus</label>
                        <Textarea
                            placeholder="Jelaskan cara perhitungan capaian KPI ini..."
                            value={formula}
                            onChange={(e) => setFormula(e.target.value)}
                            rows={2}
                        />
                    </div>

                    {/* Scoring Type & Category */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">Tipe Scoring *</label>
                            <Select value={scoringType} onValueChange={(v) => setScoringType(v as ScoringType)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="normal">Normal ↗ (Semakin tinggi semakin baik)</SelectItem>
                                    <SelectItem value="reverse">Reverse ↙ (Semakin rendah semakin baik)</SelectItem>
                                    <SelectItem value="deduction">Deduction ↓ (Nilai Pengurang)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">Kategori</label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">— Tidak ada —</SelectItem>
                                    <SelectItem value="bersama">KPI Bersama</SelectItem>
                                    <SelectItem value="bidang">KPI Bidang</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">Satuan *</label>
                            <Input
                                placeholder="%, Rp Miliar, Hari..."
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">
                                {scoringType === "deduction" ? "Max Pengurang" : "Bobot (%) *"}
                            </label>
                            {scoringType === "deduction" ? (
                                <Input
                                    type="number"
                                    placeholder="10"
                                    value={maxDeduction}
                                    onChange={(e) => setMaxDeduction(e.target.value)}
                                />
                            ) : (
                                <Input
                                    type="number"
                                    placeholder="0-100"
                                    min={0}
                                    max={100}
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                />
                            )}
                        </div>
                        {/* Target Semester 1 & 2 */}
                        <div className="col-span-3">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground">Target S1 (Jan–Jun) *</label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={targetS1}
                                        onChange={(e) => setTargetS1(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground">Target S2 (Jul–Des) *</label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={targetS2}
                                        onChange={(e) => setTargetS2(e.target.value)}
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1.5">
                                Total Target Tahunan: <span className="font-semibold text-foreground">{computedTarget.toLocaleString("id-ID")}</span>
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">Capaian (Realisasi)</label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={achievement}
                                disabled={hasChildren}
                                onChange={(e) => setAchievement(e.target.value)}
                            />
                            {hasChildren && (
                                <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-1">
                                    🔒 Dihitung otomatis dari turunan.
                                </p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">Deadline</label>
                            <Input
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                            />
                        </div>
                    </div>

                    {currentUser.level > 1 && (
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">KPI Induk (Cascading) *</label>
                            <Select value={parentKpiId} onValueChange={setParentKpiId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih KPI Atasan..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">— Pilih KPI Atasan —</SelectItem>
                                    {potentialParents.map((k) => {
                                        const owner = allUsers.find((u) => u.id === k.user_id);
                                        return (
                                            <SelectItem key={k.id} value={k.id}>
                                                {k.indicator} ({owner?.name})
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                            {potentialParents.length === 0 && (
                                <p className="text-xs text-destructive">Belum ada KPI atasan yang tersedia untuk diturunkan.</p>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Batal</Button>
                    <Button onClick={handleSave}>
                        {existingKPI ? "Simpan Perubahan" : "Tambah KPI"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
