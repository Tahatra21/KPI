"use client";

import { useState, useEffect } from "react";
import { User } from "@/lib/types";
import { getLevelLabel } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
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
import { Plus, Search, Edit2, ShieldAlert, Trash2 } from "lucide-react";
import { UserFormDialog } from "@/components/admin/user-form-dialog";
import { Checkbox } from "@/components/ui/checkbox";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/admin/users", { credentials: "include" });
            if (!res.ok) throw new Error("Gagal mengambil data pengguna");
            const data = await res.json();
            setUsers(data.users);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Kesalahan server");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan.")) return;

        try {
            const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE", credentials: "include" });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Gagal menghapus pengguna");
            }
            toast.success("Pengguna berhasil dihapus");
            fetchUsers();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Gagal menghapus");
        }
    };

    const filteredUsers = users.filter((u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.department.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleSelectAll = () => {
        if (selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0) {
            setSelectedUserIds([]);
        } else {
            setSelectedUserIds(filteredUsers.map((u) => u.id));
        }
    };

    const toggleSelectOne = (id: string) => {
        setSelectedUserIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedUserIds.length} pengguna terpilih? Tindakan ini tidak dapat dibatalkan.`)) return;

        try {
            // Delete sequentially or via Promise.all
            setIsLoading(true);
            const deletePromises = selectedUserIds.map((id) =>
                fetch(`/api/admin/users/${id}`, { method: "DELETE", credentials: "include" })
            );

            const results = await Promise.allSettled(deletePromises);
            const failedCount = results.filter(r => r.status === "rejected" || (r.status === "fulfilled" && !r.value.ok)).length;

            if (failedCount === 0) {
                toast.success(`${selectedUserIds.length} pengguna berhasil dihapus`);
            } else {
                toast.warning(`${selectedUserIds.length - failedCount} dihapus, ${failedCount} gagal dihapus`);
            }
            setSelectedUserIds([]);
            fetchUsers();
        } catch (error) {
            toast.error("Gagal melakukan penghapusan massal");
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Manajemen Pengguna
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Kelola akun, role, dan status aktif pengguna dalam sistem.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {selectedUserIds.length > 0 && (
                        <Button onClick={handleBulkDelete} variant="destructive" className="bg-red-600 hover:bg-red-700">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Hapus {selectedUserIds.length} Terpilih
                        </Button>
                    )}
                    <Button onClick={() => { setEditingUser(null); setIsFormOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Pengguna
                    </Button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Cari ID, Nama, atau Divisi..."
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
                                <TableHead className="w-12">
                                    <Checkbox
                                        checked={selectedUserIds.length > 0 && selectedUserIds.length === filteredUsers.length}
                                        onCheckedChange={toggleSelectAll}
                                        aria-label="Select all"
                                    />
                                </TableHead>
                                <TableHead>ID</TableHead>
                                <TableHead>Nama Pengguna</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Level & Role</TableHead>
                                <TableHead>Divisi</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                                        Memuat data...
                                    </TableCell>
                                </TableRow>
                            ) : filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                                        Tidak ada pengguna yang ditemukan.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.id} className={selectedUserIds.includes(user.id) ? "bg-indigo-50/50 dark:bg-indigo-900/10" : ""}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedUserIds.includes(user.id)}
                                                onCheckedChange={() => toggleSelectOne(user.id)}
                                                aria-label={`Select ${user.name}`}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-900 dark:text-slate-100">{user.id}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{user.name}</span>
                                                <span className="text-xs text-slate-500">{user.position}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-500">{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={user.level === 0 ? "bg-indigo-50 text-indigo-700 border-indigo-200" : ""}>
                                                Level {user.level}: {getLevelLabel(user.level)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-slate-500">{user.department}</TableCell>
                                        <TableCell>
                                            <Badge variant={user.status === "inactive" ? "destructive" : "default"} className={user.status === "active" ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                                                {user.status === "inactive" ? "Nonaktif" : "Aktif"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => { setEditingUser(user); setIsFormOpen(true); }}
                                                    className="h-8 w-8 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                {user.level !== 0 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(user.id)}
                                                        className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {isFormOpen && (
                <UserFormDialog
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    onSuccess={fetchUsers}
                    editingUser={editingUser}
                />
            )}
        </div>
    );
}
