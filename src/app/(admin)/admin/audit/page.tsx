"use client";

import { useState, useEffect } from "react";
import { getLevelLabel } from "@/lib/rbac";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, ShieldAlert, FileJson } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

type AuditLogJoined = {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    details: string; // JSON
    createdAt: string;
    actorId: string;
    actorName: string;
};

export default function AdminAuditPage() {
    const [logs, setLogs] = useState<AuditLogJoined[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchLogs = async () => {
        try {
            const res = await fetch("/api/admin/audit", { credentials: "include" });
            if (!res.ok) throw new Error("Gagal mengambil data log audit");
            const data = await res.json();
            setLogs(data.logs);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Kesalahan server");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter((log) =>
        log.actorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.entityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.entityId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getActionBadgeColor = (action: string) => {
        switch (action) {
            case "CREATE": return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "UPDATE": return "bg-blue-100 text-blue-700 border-blue-200";
            case "DELETE": return "bg-red-100 text-red-700 border-red-200";
            case "CONFIG_CHANGE": return "bg-purple-100 text-purple-700 border-purple-200";
            default: return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <ShieldAlert className="w-6 h-6 text-indigo-600" />
                        Log Audit Sistem
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Pantau seluruh aktivitas manajemen dan konfigurasi yang terjadi dalam sistem (100 log terbaru).
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Cari berdasarkan Aktor, Aksi, atau Entitas..."
                            className="pl-9 bg-slate-50 dark:bg-slate-950"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-950/50">
                            <TableRow>
                                <TableHead>Waktu</TableHead>
                                <TableHead>Pelaku (Aktor)</TableHead>
                                <TableHead>Aksi</TableHead>
                                <TableHead>Target Entitas</TableHead>
                                <TableHead>ID Entitas</TableHead>
                                <TableHead className="text-right">Rincian</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                        Memuat data...
                                    </TableCell>
                                </TableRow>
                            ) : filteredLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                        Tidak ada log audit yang ditemukan.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLogs.map((log) => (
                                    <TableRow key={log.id} className="group">
                                        <TableCell className="whitespace-nowrap text-xs text-slate-500">
                                            {new Date(log.createdAt).toLocaleString("id-ID", {
                                                year: 'numeric', month: 'short', day: 'numeric',
                                                hour: '2-digit', minute: '2-digit', second: '2-digit'
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-900 dark:text-slate-100">{log.actorName || "Unknown"}</span>
                                                <span className="text-xs text-slate-400">{log.actorId}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={getActionBadgeColor(log.action)}>
                                                {log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-700 dark:text-slate-300">
                                            {log.entityType}
                                        </TableCell>
                                        <TableCell className="text-slate-500 font-mono text-xs">
                                            {log.entityId}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 h-8 w-8">
                                                        <FileJson className="w-4 h-4" />
                                                    </button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-[600px]">
                                                    <DialogHeader>
                                                        <DialogTitle className="flex items-center gap-2">
                                                            <FileJson className="w-5 h-5 text-indigo-600" />
                                                            Rincian Perubahan Data
                                                        </DialogTitle>
                                                    </DialogHeader>
                                                    <div className="bg-slate-900 rounded-lg p-4 mt-4 overflow-auto max-h-[60vh]">
                                                        <pre className="text-xs text-green-400 font-mono">
                                                            {JSON.stringify(JSON.parse(log.details), null, 2)}
                                                        </pre>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
