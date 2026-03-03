"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { getLevelLabel } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { BarChart3, Lock, Mail, Users, ChevronRight } from "lucide-react";

export default function LoginPage() {
    const { login, loginById, allUsers } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const user = await login(email, password);
        setLoading(false);
        if (user) {
            if (user.level === 0) {
                router.push("/admin/dashboard");
            } else {
                router.push("/dashboard");
            }
        } else {
            toast.error("Email atau password salah.");
        }
    };

    const quickLogin = async (userId: string) => {
        setLoading(true);
        const user = await loginById(userId);
        setLoading(false);
        if (user) {
            if (user.level === 0) {
                router.push("/admin/dashboard");
            } else {
                router.push("/dashboard");
            }
        }
    };

    const levelColors: Record<number, string> = {
        1: "bg-primary/20 text-primary border-primary/30",
        2: "bg-secondary/20 text-secondary border-secondary/30",
        3: "bg-accent text-accent-foreground border-accent",
        4: "bg-chart-1/20 text-chart-1 border-chart-1/30",
    };

    const demoIds = ["VP001", "MGR001", "MGR002", "AM001", "STF003"];
    const demoAccounts = demoIds
        .map((id) => allUsers.find((u) => u.id === id))
        .filter(Boolean) as typeof allUsers;

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            {/* Background gradient blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 relative">
                {/* Left: Brand */}
                <div className="flex flex-col justify-center space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                                <BarChart3 className="w-7 h-7 text-primary-foreground" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">KPI Monitor</h1>
                                <p className="text-muted-foreground text-sm">On-Premise</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold text-foreground leading-tight">
                                Kelola Kinerja<br />
                                <span className="text-primary">Seluruh Organisasi</span>
                            </h2>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Platform terpusat untuk memantau KPI dari Level 4 (Staff) hingga Level 1 (VP) dengan sistem approval berjenjang.
                            </p>
                        </div>
                    </div>

                    {/* Quick login demo accounts */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span>Demo — Masuk sebagai:</span>
                        </div>
                        <div className="space-y-2">
                            {demoAccounts.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => quickLogin(user.id)}
                                    disabled={loading}
                                    className="w-full flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/50 hover:bg-card hover:border-primary/50 transition-all group cursor-pointer disabled:opacity-50"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-medium text-foreground">{user.name}</p>
                                            <p className="text-xs text-muted-foreground">{user.position}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${levelColors[user.level]}`}>
                                            L{user.level} – {getLevelLabel(user.level)}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                </button>
                            ))}
                            {demoAccounts.length === 0 && (
                                <p className="text-sm text-muted-foreground animate-pulse">Memuat akun demo...</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Login form */}
                <Card className="border-border/50 shadow-2xl bg-card/80 backdrop-blur-sm">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-2xl font-bold">Masuk</CardTitle>
                        <CardDescription>Gunakan email & password akun Anda</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="email@company.id atau username"
                                        className="pl-10"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-10"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Password default: <code className="bg-muted px-1 rounded">password</code></p>
                            </div>
                            <Button type="submit" className="w-full shadow-lg" disabled={loading}>
                                {loading ? "Memproses..." : "Masuk"}
                            </Button>
                        </form>

                        <div className="mt-6 pt-4 border-t border-border/50">
                            <p className="text-xs text-muted-foreground text-center mb-3">Atau pilih akun demo di sebelah kiri →</p>
                            <div className="grid grid-cols-2 gap-2">
                                {demoAccounts.map((user) => (
                                    <Button
                                        key={user.id}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => quickLogin(user.id)}
                                        className="text-xs h-8 truncate"
                                        disabled={loading}
                                    >
                                        {user.id}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
