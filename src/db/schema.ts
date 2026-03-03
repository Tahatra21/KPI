import { pgTable, uuid, varchar, integer, decimal, text, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Enums ──
export const kpiStatusEnum = pgEnum("kpi_status", ["Draft", "PendingApproval", "Approved", "Rejected"]);
export const scoringTypeEnum = pgEnum("scoring_type", ["normal", "reverse", "deduction"]);
export const kpiCategoryEnum = pgEnum("kpi_category", ["bersama", "bidang"]);
export const alertTypeEnum = pgEnum("alert_type", ["MissedTarget", "Deadline", "Changed", "Approval"]);
export const userStatusEnum = pgEnum("user_status", ["active", "inactive"]);
export const auditActionTypeEnum = pgEnum("audit_action_type", ["CREATE", "UPDATE", "DELETE", "CONFIG_CHANGE"]);

// ── Users Table ──
export const users = pgTable("users", {
    id: varchar("id", { length: 32 }).primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    level: integer("level").notNull(), // 1-4
    reportingToId: varchar("reporting_to_id", { length: 32 }).references((): any => users.id, { onUpdate: "cascade", onDelete: "set null" }),
    department: varchar("department", { length: 255 }).notNull(),
    position: varchar("position", { length: 255 }).notNull(),
    status: userStatusEnum("status").notNull().default("active"),
});

// ── KPIs Table ──
export const kpis = pgTable("kpis", {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: varchar("user_id", { length: 32 }).notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    parentKpiId: varchar("parent_kpi_id", { length: 64 }).references((): any => kpis.id),
    year: integer("year").notNull().default(2026),
    indicator: varchar("indicator", { length: 500 }).notNull(),
    formula: text("formula").default(""),
    unit: varchar("unit", { length: 50 }).notNull(),
    weight: decimal("weight", { precision: 5, scale: 2 }).notNull().default("0"),
    target: decimal("target", { precision: 15, scale: 4 }).notNull().default("0"),
    achievement: decimal("achievement", { precision: 15, scale: 4 }).notNull().default("0"),
    scoringType: scoringTypeEnum("scoring_type").notNull().default("normal"),
    category: kpiCategoryEnum("category"),
    maxDeduction: decimal("max_deduction", { precision: 5, scale: 2 }),
    status: kpiStatusEnum("status").notNull().default("Draft"),
    deadline: varchar("deadline", { length: 20 }).notNull().default("2026-12-31"),
});

// ── Alerts Table ──
export const alerts = pgTable("alerts", {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: varchar("user_id", { length: 32 }).notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    type: alertTypeEnum("type").notNull(),
    message: text("message").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    relatedKpiId: varchar("related_kpi_id", { length: 64 }).references(() => kpis.id, { onDelete: "set null" }),
});

// ── System Configs Table ──
export const systemConfigs = pgTable("system_configs", {
    key: varchar("key", { length: 255 }).primaryKey(),
    value: text("value").notNull(),
    description: text("description"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Audit Logs Table ──
export const auditLogs = pgTable("audit_logs", {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: varchar("user_id", { length: 32 }).notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    action: auditActionTypeEnum("action").notNull(),
    entityType: varchar("entity_type", { length: 255 }).notNull(),
    entityId: varchar("entity_id", { length: 64 }).notNull(),
    details: text("details").notNull(), // JSON stringized before/after states
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Relations ──
export const usersRelations = relations(users, ({ many, one }) => ({
    kpis: many(kpis),
    alerts: many(alerts),
    auditLogs: many(auditLogs),
    reportingTo: one(users, {
        fields: [users.reportingToId],
        references: [users.id],
        relationName: "reporting",
    }),
    subordinates: many(users, { relationName: "reporting" }),
}));

export const kpisRelations = relations(kpis, ({ one, many }) => ({
    user: one(users, { fields: [kpis.userId], references: [users.id] }),
    parentKpi: one(kpis, {
        fields: [kpis.parentKpiId],
        references: [kpis.id],
        relationName: "cascading",
    }),
    childKpis: many(kpis, { relationName: "cascading" }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
    user: one(users, { fields: [alerts.userId], references: [users.id] }),
    relatedKpi: one(kpis, { fields: [alerts.relatedKpiId], references: [kpis.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
    user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));
