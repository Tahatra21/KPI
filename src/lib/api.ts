// API helper functions for frontend → backend communication

const BASE = "/api";

async function fetchJSON<T>(url: string, opts?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${url}`, {
        headers: { "Content-Type": "application/json", ...opts?.headers },
        ...opts,
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
    }
    return res.json();
}

// ── Auth ──
export const api = {
    auth: {
        login: (email: string, password: string) =>
            fetchJSON<any>("/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            }),
        logout: () =>
            fetchJSON<any>("/auth/logout", { method: "POST" }),
        me: () =>
            fetchJSON<{ user: any }>("/auth/me"),
    },

    // ── Users ──
    users: {
        list: () =>
            fetchJSON<{ users: any[] }>("/users"),
    },

    // ── KPIs ──
    kpis: {
        list: () =>
            fetchJSON<{ kpis: any[] }>("/kpis"),
        create: (data: any) =>
            fetchJSON<{ kpi: any }>("/kpis", {
                method: "POST",
                body: JSON.stringify(data),
            }),
        update: (id: string, data: any) =>
            fetchJSON<{ kpi: any }>(`/kpis/${id}`, {
                method: "PUT",
                body: JSON.stringify(data),
            }),
        delete: (id: string) =>
            fetchJSON<{ ok: boolean }>(`/kpis/${id}`, { method: "DELETE" }),
        submit: (id: string) =>
            fetchJSON<any>(`/kpis/${id}/submit`, { method: "POST" }),
        approve: (id: string) =>
            fetchJSON<any>(`/kpis/${id}/approve`, { method: "POST" }),
        reject: (id: string) =>
            fetchJSON<any>(`/kpis/${id}/reject`, { method: "POST" }),
    },

    // ── Alerts ──
    alerts: {
        list: () =>
            fetchJSON<{ alerts: any[] }>("/alerts"),
        markRead: (ids?: string[]) =>
            fetchJSON<{ ok: boolean }>("/alerts", {
                method: "PUT",
                body: JSON.stringify({ ids }),
            }),
    },
};
