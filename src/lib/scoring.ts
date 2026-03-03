import { KPI } from "./types";

/**
 * Calculate the score for a single KPI based on its scoring type.
 * 
 * - Normal:    (achievement / target) × weight
 * - Reverse:   (target / achievement) × weight  (lower is better)
 * - Deduction: Returns the deduction value (capped at max_deduction)
 */
export function calculateScore(kpi: KPI): number {
    if (kpi.scoring_type === "deduction") {
        // Deduction: achievement = total penalty points
        // Score is negative, capped at max_deduction
        const deduction = Math.min(kpi.achievement, kpi.max_deduction ?? 10);
        return -deduction;
    }

    if (kpi.target === 0) return 0;

    if (kpi.scoring_type === "reverse") {
        // Reverse: lower is better → (target / achievement) × weight
        if (kpi.achievement === 0) return kpi.weight; // perfect score if 0
        return (kpi.target / kpi.achievement) * kpi.weight;
    }

    // Normal: (achievement / target) × weight
    return (kpi.achievement / kpi.target) * kpi.weight;
}

/**
 * Calculate achievement percentage for a single KPI.
 * Used for display in progress bars.
 */
export function getAchievementPct(kpi: KPI): number {
    if (kpi.scoring_type === "deduction") {
        // Deduction: show how much deduction was applied
        const maxD = kpi.max_deduction ?? 10;
        // percentage of deduction used — 0% means full deduction, 100% means no deduction
        return maxD === 0 ? 100 : Math.max(0, (1 - kpi.achievement / maxD)) * 100;
    }

    if (kpi.target === 0) return 0;

    if (kpi.scoring_type === "reverse") {
        // Reverse: 100% means exactly on target, >100% means better than target
        if (kpi.achievement === 0) return 150; // capped perfect
        return Math.min((kpi.target / kpi.achievement) * 100, 150);
    }

    // Normal
    return Math.min((kpi.achievement / kpi.target) * 100, 150);
}

/**
 * Get color category based on spec thresholds.
 * >100% → green (hijau)
 * 90-100% → yellow (kuning)
 * <90% → red (merah)
 */
export function getColorCategory(pct: number): "green" | "yellow" | "red" {
    if (pct > 100) return "green";
    if (pct >= 90) return "yellow";
    return "red";
}

/**
 * Calculate total score for a user's KPIs.
 * Total = (sum of Bersama scores) + (sum of Bidang scores) - Compliance Deduction
 */
export function calculateTotalScore(kpis: KPI[]): {
    bersamaScore: number;
    bersamaMax: number;
    bidangScore: number;
    bidangMax: number;
    complianceDeduction: number;
    totalScore: number;
    totalMax: number;
} {
    let bersamaScore = 0;
    let bersamaMax = 0;
    let bidangScore = 0;
    let bidangMax = 0;
    let complianceDeduction = 0;

    for (const kpi of kpis) {
        const score = calculateScore(kpi);

        if (kpi.scoring_type === "deduction") {
            complianceDeduction = Math.abs(score);
            continue;
        }

        if (kpi.category === "bersama") {
            bersamaScore += score;
            bersamaMax += kpi.weight;
        } else if (kpi.category === "bidang") {
            bidangScore += score;
            bidangMax += kpi.weight;
        } else {
            // uncategorized — add to bersama by default
            bersamaScore += score;
            bersamaMax += kpi.weight;
        }
    }

    const totalMax = bersamaMax + bidangMax;
    const totalScore = bersamaScore + bidangScore - complianceDeduction;

    return {
        bersamaScore: Math.round(bersamaScore * 100) / 100,
        bersamaMax,
        bidangScore: Math.round(bidangScore * 100) / 100,
        bidangMax,
        complianceDeduction: Math.round(complianceDeduction * 100) / 100,
        totalScore: Math.round(totalScore * 100) / 100,
        totalMax,
    };
}
