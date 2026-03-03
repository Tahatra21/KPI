"use client";

import { useState, useEffect } from "react";
import { SystemConfig } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Settings, Save } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function AdminConfigPage() {
    const [configs, setConfigs] = useState<SystemConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [savingKey, setSavingKey] = useState<string | null>(null);

    const fetchConfigs = async () => {
        try {
            const res = await fetch("/api/admin/config", { credentials: "include" });
            if (!res.ok) throw new Error("Gagal mengambil data konfigurasi");
            const data = await res.json();
            setConfigs(data.configs);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Kesalahan server");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchConfigs();
    }, []);

    const handleSave = async (key: string, newValue: string) => {
        setSavingKey(key);
        try {
            const res = await fetch("/api/admin/config", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ key, value: newValue }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Gagal menyimpan konfigurasi");
            }

            toast.success("Konfigurasi berhasil disimpan");
            fetchConfigs();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Kesalahan server");
        } finally {
            setSavingKey(null);
        }
    };

    const renderConfigInput = (config: SystemConfig) => {
        if (config.key === "maintenance_mode") {
            const isMaintenance = config.value === "true";
            return (
                <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <div>
                        <Label className="text-base font-semibold block mb-1">Mode Pemeliharaan</Label>
                        <span className="text-xs text-slate-500">{config.description}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-600">{isMaintenance ? "ON" : "OFF"}</span>
                        <Switch
                            checked={isMaintenance}
                            onCheckedChange={(c) => handleSave(config.key, c ? "true" : "false")}
                            disabled={savingKey === config.key}
                        />
                    </div>
                </div>
            );
        }

        // Generic text/number input for others
        return (
            <div className="flex flex-col gap-2 p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900">
                <div>
                    <Label className="text-base font-semibold block mb-1">{config.key.replace(/_/g, " ").toUpperCase()}</Label>
                    <span className="text-xs text-slate-500">{config.description}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                    <Input
                        defaultValue={config.value}
                        key={`${config.key}-${config.value}`} // Force re-render on sync
                        className="flex-1 font-mono text-sm max-w-sm"
                        onBlur={(e) => {
                            if (e.target.value !== config.value) {
                                handleSave(config.key, e.target.value);
                            }
                        }}
                        disabled={savingKey === config.key}
                    />
                    <Button variant="outline" size="sm" disabled={savingKey === config.key} className="shrink-0 text-slate-500">
                        {savingKey === config.key ? "Menyimpan..." : <><Save className="w-4 h-4 mr-2" /> Simpan</>}
                    </Button>
                </div>
                <p className="text-[10px] text-slate-400">Terakhir diperbarui: {new Date(config.updated_at).toLocaleString()}</p>
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col justify-between items-start gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                    <Settings className="w-6 h-6 text-indigo-600" />
                    Konfigurasi Sistem
                </h1>
                <p className="text-slate-500">
                    Atur parameter global sistem seperti periode KPI, zona waktu, dan maintenance mode.
                </p>
            </div>

            {isLoading ? (
                <div className="py-12 text-center text-slate-500">Memuat konfigurasi...</div>
            ) : (
                <div className="grid gap-4 mt-6">
                    {configs.map((config) => (
                        <div key={config.key}>
                            {renderConfigInput(config)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
