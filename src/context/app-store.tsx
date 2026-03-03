"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { KPI, Alert } from "@/lib/types";
import { api } from "@/lib/api";
import { useAuth } from "./auth-context";

type AppStoreContextType = {
    kpis: KPI[];
    alerts: Alert[];
    isLoading: boolean;
    refreshKPIs: () => Promise<void>;
    refreshAlerts: () => Promise<void>;
    addKPI: (kpi: Omit<KPI, "id">) => Promise<void>;
    updateKPI: (id: string, updates: Partial<KPI>) => Promise<void>;
    deleteKPI: (id: string) => Promise<void>;
    submitKPI: (id: string) => Promise<void>;
    approveKPI: (id: string) => Promise<void>;
    rejectKPI: (id: string) => Promise<void>;
    addAlert: (alert: Alert) => void;
    markAlertRead: (id: string) => Promise<void>;
    markAllAlertsRead: () => Promise<void>;
};

const AppStoreContext = createContext<AppStoreContextType | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
    const { currentUser } = useAuth();
    const [kpis, setKPIs] = useState<KPI[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshKPIs = useCallback(async () => {
        try {
            const { kpis: data } = await api.kpis.list();
            setKPIs(data as KPI[]);
        } catch {
            // Not logged in or error
        }
    }, []);

    const refreshAlerts = useCallback(async () => {
        try {
            const { alerts: data } = await api.alerts.list();
            setAlerts(data as Alert[]);
        } catch {
            // Not logged in or error
        }
    }, []);

    // Load data when user changes
    useEffect(() => {
        if (currentUser) {
            setIsLoading(true);
            Promise.all([refreshKPIs(), refreshAlerts()]).finally(() => setIsLoading(false));
        } else {
            setKPIs([]);
            setAlerts([]);
            setIsLoading(false);
        }
    }, [currentUser, refreshKPIs, refreshAlerts]);

    const addKPI = useCallback(async (kpiData: Omit<KPI, "id">) => {
        const { kpi } = await api.kpis.create(kpiData);
        setKPIs((prev) => [...prev, kpi as KPI]);
    }, []);

    const updateKPI = useCallback(async (id: string, updates: Partial<KPI>) => {
        const { kpi } = await api.kpis.update(id, updates);
        setKPIs((prev) => prev.map((k) => (k.id === id ? (kpi as KPI) : k)));
    }, []);

    const deleteKPI = useCallback(async (id: string) => {
        await api.kpis.delete(id);
        setKPIs((prev) => prev.filter((k) => k.id !== id && k.parent_kpi_id !== id));
    }, []);

    const submitKPI = useCallback(async (id: string) => {
        await api.kpis.submit(id);
        setKPIs((prev) => prev.map((k) => (k.id === id ? { ...k, status: "PendingApproval" as const } : k)));
        await refreshAlerts();
    }, [refreshAlerts]);

    const approveKPI = useCallback(async (id: string) => {
        await api.kpis.approve(id);
        setKPIs((prev) => prev.map((k) => (k.id === id ? { ...k, status: "Approved" as const } : k)));
        await refreshAlerts();
    }, [refreshAlerts]);

    const rejectKPI = useCallback(async (id: string) => {
        await api.kpis.reject(id);
        setKPIs((prev) => prev.map((k) => (k.id === id ? { ...k, status: "Rejected" as const } : k)));
        await refreshAlerts();
    }, [refreshAlerts]);

    const addAlert = useCallback((alert: Alert) => {
        setAlerts((prev) => [alert, ...prev]);
    }, []);

    const markAlertRead = useCallback(async (id: string) => {
        await api.alerts.markRead([id]);
        setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: true } : a)));
    }, []);

    const markAllAlertsRead = useCallback(async () => {
        await api.alerts.markRead();
        setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    }, []);

    return (
        <AppStoreContext.Provider
            value={{
                kpis,
                alerts,
                isLoading,
                refreshKPIs,
                refreshAlerts,
                addKPI,
                updateKPI,
                deleteKPI,
                submitKPI,
                approveKPI,
                rejectKPI,
                addAlert,
                markAlertRead,
                markAllAlertsRead,
            }}
        >
            {children}
        </AppStoreContext.Provider>
    );
}

export function useAppStore() {
    const ctx = useContext(AppStoreContext);
    if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider");
    return ctx;
}
