# Align Frontend with kpi.md Spec

## Phase 1: Data Model
- [ ] Update `types.ts` — add `scoring_type`, `category`, `max_deduction`
- [ ] Create `scoring.ts` — scoring engine with 3 types + total calculation

## Phase 2: Mock Data
- [ ] Replace VP001 KPIs (3 → 10 sesuai spec)
- [ ] Update child KPI parent references
- [ ] Update color threshold logic globally (>100% green, 90-100% yellow, <90% red)

## Phase 3: UI Components
- [ ] Update KPI table — scoring display, category grouping, scoring type badge
- [ ] Update KPI form dialog — add scoring_type, category, max_deduction fields
- [ ] Update dashboard — use calculateTotalScore, separate Bersama/Bidang stats

## Phase 4: Verification
- [ ] Build passes (npm run build)
- [ ] Browser test — CRUD, scoring, approve/reject flow
