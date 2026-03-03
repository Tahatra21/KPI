"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { useAppStore } from "@/context/app-store";
import { getUserAlerts } from "@/lib/rbac";
import { Alert, AlertType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
    AlertTriangle,
    Clock,
    Info,
    CheckSquare,
    Bell,
    BellOff,
    CheckCheck,
    Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const alertConfig: Record<AlertType, { icon: React.ElementType; color: string; label: string }> = {
    MissedTarget: {
        icon: AlertTriangle,
        color: "text-destructive bg-destructive/10 border-destructive/20",
        label: "Peringatan Target",
    },
    Deadline: {
        icon: Clock,
        color: "text-chart-4 bg-chart-4/10 border-chart-4/20",
        label: "Pengingat Deadline",
    },
    Changed: {
        icon: Info,
        color: "text-chart-1 bg-chart-1/10 border-chart-1/20",
        label: "Perubahan Data",
    },
    Approval: {
        icon: CheckSquare,
        color: "text-secondary bg-secondary/10 border-secondary/20",
        label: "Permintaan Approval",
    },
};

function AlertItem({
    alert,
    onMarkRead,
}: {
    alert: Alert;
    onMarkRead: (id: string) => void;
}) {
    const config = alertConfig[alert.type];
    const Icon = config.icon;
    const timeAgo = formatDistanceToNow(new Date(alert.created_at), {
        addSuffix: true,
        locale: idLocale,
    });

    return (
        <div
            className={cn(
                "flex items-start gap-3 p-4 rounded-xl border transition-all",
                alert.is_read
                    ? "bg-card/50 border-border/30 opacity-60"
                    : "bg-card border-border/50 hover:border-border/80"
            )}
        >
            <div
                className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border",
                    config.color
                )}
            >
                <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        {config.label}
                    </span>
                    {!alert.is_read && (
                        <Circle className="w-2 h-2 fill-primary text-primary" />
                    )}
                </div>
                <p className={cn("text-sm leading-relaxed", alert.is_read ? "text-muted-foreground" : "text-foreground")}>
                    {alert.message}
                </p>
                <p className="text-[11px] text-muted-foreground/70 mt-1">{timeAgo}</p>
            </div>
            {!alert.is_read && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={() => onMarkRead(alert.id)}
                    title="Tandai sudah dibaca"
                >
                    <CheckCheck className="w-3.5 h-3.5" />
                </Button>
            )}
        </div>
    );
}

export default function NotificationsPage() {
    const { currentUser } = useAuth();
    const { alerts, markAlertRead, markAllAlertsRead } = useAppStore();

    const userAlerts = useMemo(() => {
        if (!currentUser) return [];
        return getUserAlerts(currentUser, alerts);
    }, [currentUser, alerts]);

    const unreadCount = userAlerts.filter((a) => !a.is_read).length;

    if (!currentUser) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Notifikasi & Alert</h2>
                    <p className="text-sm text-muted-foreground">
                        {unreadCount > 0
                            ? `${unreadCount} notifikasi belum dibaca`
                            : "Semua notifikasi sudah dibaca"}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAllAlertsRead()}
                        className="h-8 text-xs"
                    >
                        <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
                        Tandai Semua Dibaca
                    </Button>
                )}
            </div>

            {/* Stat Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(["MissedTarget", "Deadline", "Changed", "Approval"] as AlertType[]).map((type) => {
                    const config = alertConfig[type];
                    const Icon = config.icon;
                    const count = userAlerts.filter((a) => a.type === type && !a.is_read).length;
                    return (
                        <div
                            key={type}
                            className={cn(
                                "rounded-lg border p-3 flex items-center gap-2.5",
                                config.color
                            )}
                        >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <div>
                                <p className="text-lg font-bold tabular-nums">{count}</p>
                                <p className="text-[10px] opacity-70">{config.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Alerts List */}
            {userAlerts.length > 0 ? (
                <div className="space-y-2">
                    {userAlerts.map((alert) => (
                        <AlertItem key={alert.id} alert={alert} onMarkRead={markAlertRead} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-border/50 bg-card">
                    <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                        <BellOff className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Tidak Ada Notifikasi</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                        Belum ada notifikasi untuk Anda saat ini.
                    </p>
                </div>
            )}
        </div>
    );
}
