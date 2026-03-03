export type UserLevel = 0 | 1 | 2 | 3 | 4; // 0 is Admin
export type UserStatus = "active" | "inactive";

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  level: UserLevel;
  reporting_to_id: string | null;
  department: string;
  position: string;
  status?: UserStatus;
};

export type KPIStatus = "Draft" | "PendingApproval" | "Approved" | "Rejected";
export type ScoringType = "normal" | "reverse" | "deduction";
export type KPICategory = "bersama" | "bidang" | null;

export type KPI = {
  id: string;
  user_id: string;
  parent_kpi_id: string | null;
  indicator: string;
  formula: string;
  unit: string;
  weight: number; // 0-100
  target: number;
  achievement: number;
  status: KPIStatus;
  deadline: string; // ISO date string
  scoring_type: ScoringType;
  category: KPICategory;
  max_deduction?: number; // only for deduction type
};

export type AlertType = "MissedTarget" | "Deadline" | "Changed" | "Approval";

export type Alert = {
  id: string;
  user_id: string;
  type: AlertType;
  message: string;
  is_read: boolean;
  created_at: string;
  related_kpi_id?: string;
};

// ── Admin Related Types ──
export type SystemConfig = {
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
};

export type AuditActionType = "CREATE" | "UPDATE" | "DELETE" | "CONFIG_CHANGE";

export type AuditLog = {
  id: string;
  user_id: string;
  action: AuditActionType;
  entity_type: string;
  entity_id: string;
  details: string; // JSON
  created_at: string;
};
