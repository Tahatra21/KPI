"use client";

import { useState, useEffect } from "react";
import { User } from "@/lib/types";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type UserFormDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingUser?: User | null;
};

export function UserFormDialog({ isOpen, onClose, onSuccess, editingUser }: UserFormDialogProps) {
    const isEdit = !!editingUser;
    const { refreshUsers, allUsers } = useAuth();

    // Form state
    const [id, setId] = useState(editingUser?.id || "");
    const [name, setName] = useState(editingUser?.name || "");
    const [email, setEmail] = useState(editingUser?.email || "");
    const [password, setPassword] = useState("");
    const [level, setLevel] = useState<string>(editingUser ? String(editingUser.level) : "");
    const [department, setDepartment] = useState(editingUser?.department || "");
    const [position, setPosition] = useState(editingUser?.position || "");
    const [status, setStatus] = useState(editingUser?.status || "active");
    // @ts-ignore - API returns reportingToId, but we might also get it as reporting_to_id from other sources
    const [reportingToId, setReportingToId] = useState(editingUser?.reportingToId || editingUser?.reporting_to_id || "");

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Determine which level the supervisor must be from
    const supervisorLevel = level === "2" ? 1 : level === "3" ? 2 : level === "4" ? 3 : null;

    // Filter users who can be a supervisor for the selected level
    const supervisorList = supervisorLevel !== null
        ? allUsers.filter((u) => u.level === supervisorLevel && u.id !== editingUser?.id)
        : [];

    // Auto-generate ID when level changes; also reset reportingToId when level changes
    useEffect(() => {
        if (!level) return;

        // If editing and level hasn't changed from original, keep all originals intact
        if (isEdit && editingUser && String(editingUser.level) === level) {
            setId(editingUser.id);
            // @ts-ignore
            setReportingToId(editingUser.reportingToId || editingUser.reporting_to_id || "");
            return;
        }

        // Level changed (or creating new user) — reset supervisor selection
        setReportingToId("");

        let prefix = "STF";
        if (level === "0") prefix = "ADM";
        else if (level === "1") prefix = "VP";
        else if (level === "2") prefix = "MGR";
        else if (level === "3") prefix = "AM";
        else if (level === "4") prefix = "STF";

        const existingIds = allUsers
            .map(u => u.id)
            .filter(id => id.startsWith(prefix))
            .map(id => parseInt(id.replace(prefix, ""), 10))
            .filter(num => !isNaN(num));

        const nextNum = (existingIds.length > 0 ? Math.max(...existingIds) : 0) + 1;
        setId(`${prefix}${nextNum.toString().padStart(3, "0")}`);
    }, [level, isEdit, editingUser, allUsers]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const payload = {
            id,
            name,
            email,
            password: password.trim() !== "" ? password : undefined,
            level: Number(level),
            department,
            position,
            status,
            reporting_to_id: reportingToId || null,
        };

        try {
            const url = isEdit ? `/api/admin/users/${editingUser.id}` : "/api/admin/users";
            const method = isEdit ? "PUT" : "POST";

            // if not editing, password is required
            if (!isEdit && !payload.password) {
                throw new Error("Password wajib diisi untuk pengguna baru");
            }

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Gagal menyimpan pengguna");
            }

            toast.success(isEdit ? "Pengguna berhasil diperbarui" : "Pengguna berhasil ditambahkan");
            await refreshUsers();
            onSuccess();
            onClose();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Kesalahan server");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{isEdit ? "Edit Pengguna" : "Tambah Pengguna Baru"}</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="id" className="text-right">User ID</Label>
                            <Input
                                id="id"
                                value={id}
                                onChange={(e) => setId(e.target.value)}
                                className="col-span-3"
                                disabled={isEdit}
                                placeholder="STF001"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Nama</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="password" className="text-right">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="col-span-3"
                                placeholder={isEdit ? "Kosongkan jika tidak diubah" : "Minimal 6 karakter"}
                                required={!isEdit}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="level" className="text-right">Level</Label>
                            <div className="col-span-3">
                                <Select value={level} onValueChange={setLevel} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih level..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">0 — Administrator</SelectItem>
                                        <SelectItem value="1">1 — VP / BOD-1</SelectItem>
                                        <SelectItem value="2">2 — Manager</SelectItem>
                                        <SelectItem value="3">3 — Asst. Manager</SelectItem>
                                        <SelectItem value="4">4 — Staff</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="department" className="text-right">Divisi</Label>
                            <Input
                                id="department"
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="position" className="text-right">Jabatan</Label>
                            <Input
                                id="position"
                                value={position}
                                onChange={(e) => setPosition(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                        {/* Lapor Ke — Only for L2, L3, L4 */}
                        {level !== "0" && level !== "1" && level !== "" && (
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label htmlFor="reportingTo" className="text-right pt-2">Lapor Ke <span className="text-red-500">*</span></Label>
                                <div className="col-span-3">
                                    {supervisorList.length === 0 ? (
                                        <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
                                            ⚠️ Belum terdapat atasan pada level di atas (Level {supervisorLevel}). Harap hubungi Administrator.
                                        </div>
                                    ) : (
                                        <Select
                                            value={reportingToId || ""}
                                            onValueChange={(v) => setReportingToId(v)}
                                            required
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={`Pilih atasan (Level ${supervisorLevel})...`} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {supervisorList.map((u) => (
                                                    <SelectItem key={u.id} value={u.id}>
                                                        [{u.id}] {u.position}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Level {level} melaporkan ke Level {supervisorLevel}
                                    </p>
                                </div>
                            </div>
                        )}
                        {/* Level 1: no supervisor */}
                        {level === "1" && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Lapor Ke</Label>
                                <div className="col-span-3 text-sm text-muted-foreground italic">
                                    — Level 1 (VP) adalah level tertinggi, tidak memiliki atasan langsung —
                                </div>
                            </div>
                        )}
                        {level !== "0" && (
                            <div className="grid grid-cols-4 items-center gap-4 mt-2">
                                <Label className="text-right">Status Akun</Label>
                                <div className="col-span-3 flex items-center gap-2">
                                    <Switch
                                        checked={status === "active"}
                                        onCheckedChange={(c) => setStatus(c ? "active" : "inactive")}
                                    />
                                    <span className="text-sm text-slate-500">
                                        {status === "active" ? "Aktif" : "Nonaktif"}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700">
                            {isSubmitting ? "Menyimpan..." : "Simpan Pengguna"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
