"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { getLevelLabel } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { BarChart3, Lock, Mail, ChevronRight, TrendingUp, Users2, ShieldCheck, Building2 } from "lucide-react";

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

    const demoIds = ["VP001", "MGR001", "MGR002", "AM001", "AM002"];
    const demoAccounts = demoIds
        .map((id) => allUsers.find((u) => u.id === id))
        .filter(Boolean) as typeof allUsers;

    const levelBadge: Record<number, { bg: string; text: string; label: string }> = {
        1: { bg: "bg-violet-100", text: "text-violet-700", label: "VP" },
        2: { bg: "bg-blue-100", text: "text-blue-700", label: "MGR" },
        3: { bg: "bg-cyan-100", text: "text-cyan-700", label: "AM" },
        4: { bg: "bg-slate-100", text: "text-slate-600", label: "STF" },
    };

    const stats = [
        { icon: TrendingUp, label: "KPI Dimonitor", value: "120+" },
        { icon: Users2, label: "Pengguna Aktif", value: `${allUsers.length}` },
        { icon: ShieldCheck, label: "Approval Berjenjang", value: "4 Level" },
    ];

    return (
        <div className="min-h-screen flex">
            {/* ── LEFT PANEL: Dark Corporate Brand ── */}
            <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between overflow-hidden"
                style={{ background: "linear-gradient(145deg, #0f172a 0%, #1e2d4a 50%, #0f2444 100%)" }}>

                {/* Subtle grid overlay */}
                <div className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                        backgroundSize: "48px 48px"
                    }} />

                {/* Glowing orbs */}
                <div className="absolute top-[-120px] right-[-80px] w-[420px] h-[420px] rounded-full opacity-10"
                    style={{ background: "radial-gradient(circle, #3b82f6, transparent 70%)" }} />
                <div className="absolute bottom-[-100px] left-[-100px] w-[350px] h-[350px] rounded-full opacity-10"
                    style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }} />

                {/* Top logo bar */}
                <div className="relative z-10 p-10">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
                            style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}>
                            <BarChart3 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-white font-bold text-lg tracking-wide leading-none">KPI Monitor</p>
                            <p className="text-blue-300 text-xs tracking-widest uppercase mt-0.5">Enterprise Platform</p>
                        </div>
                    </div>
                </div>

                {/* Center content */}
                <div className="relative z-10 px-10 space-y-8">
                    {/* Headline */}
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10">
                            <Building2 className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-blue-300 text-xs font-medium tracking-wide">PT PLN ICON Plus</span>
                        </div>
                        <h1 className="text-4xl font-bold text-white leading-tight">
                            Pantau Kinerja<br />
                            <span style={{ background: "linear-gradient(135deg, #60a5fa, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                                Seluruh Organisasi
                            </span>
                        </h1>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                            Platform terpusat untuk memantau, mengelola, dan mengverifikasi KPI dari seluruh divisi secara real-time dengan sistem approval berjenjang.
                        </p>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-4">
                        {stats.map(({ icon: Icon, label, value }) => (
                            <div key={label} className="rounded-xl p-4 border border-white/8"
                                style={{ background: "rgba(255,255,255,0.04)" }}>
                                <Icon className="w-5 h-5 text-blue-400 mb-2" />
                                <p className="text-white font-bold text-lg leading-none">{value}</p>
                                <p className="text-slate-400 text-xs mt-1">{label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Org hierarchy visual */}
                    <div className="rounded-xl border border-white/8 p-5 space-y-2"
                        style={{ background: "rgba(255,255,255,0.03)" }}>
                        <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-3">Hierarki Organisasi</p>
                        {[
                            { level: "L1", title: "Vice President / BOD", color: "bg-violet-500" },
                            { level: "L2", title: "General Manager", color: "bg-blue-500" },
                            { level: "L3", title: "Asst. Manager", color: "bg-cyan-500" },
                            { level: "L4", title: "Staff", color: "bg-slate-400" },
                        ].map((row, i) => (
                            <div key={row.level} className="flex items-center gap-3"
                                style={{ paddingLeft: `${i * 16}px` }}>
                                <div className={`w-1.5 h-1.5 rounded-full ${row.color} flex-shrink-0`} />
                                <span className="text-slate-400 text-xs w-8 font-mono">{row.level}</span>
                                <span className="text-slate-300 text-xs">{row.title}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10 px-10 pb-8">
                    <p className="text-slate-600 text-xs">© 2025 PT PLN ICON Plus. Confidential & Proprietary.</p>
                </div>
            </div>

            {/* ── RIGHT PANEL: Login Form ── */}
            <div className="flex-1 flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-950 px-6 py-12">
                <div className="w-full max-w-md space-y-8">

                    {/* Mobile-only logo */}
                    <div className="flex lg:hidden items-center gap-3 justify-center">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-xl text-slate-900 dark:text-white">KPI Monitor</span>
                    </div>

                    {/* Form header */}
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Selamat Datang</h2>
                        <p className="text-sm text-slate-500">Masuk ke akun Anda untuk melanjutkan</p>
                    </div>

                    {/* Login form */}
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email / Username</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    type="text"
                                    placeholder="email@iconpln.co.id"
                                    className="pl-10 h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10 h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                                Password default: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">password</code>
                            </p>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 text-sm font-semibold shadow-lg"
                            style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                                    </svg>
                                    Memproses...
                                </span>
                            ) : "Masuk →"}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                        <span className="text-xs text-slate-400 font-medium">ATAU AKSES DEMO</span>
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                    </div>

                    {/* Quick login cards */}
                    <div className="space-y-2">
                        {demoAccounts.length === 0 ? (
                            <div className="text-center py-4 text-sm text-slate-400 animate-pulse">Memuat akun demo...</div>
                        ) : (
                            demoAccounts.map((user) => {
                                const badge = levelBadge[user.level] ?? { bg: "bg-slate-100", text: "text-slate-600", label: "—" };
                                return (
                                    <button
                                        key={user.id}
                                        onClick={() => quickLogin(user.id)}
                                        disabled={loading}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-400 hover:shadow-sm transition-all group cursor-pointer disabled:opacity-50 text-left"
                                    >
                                        {/* Avatar */}
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                            {user.name.charAt(0)}
                                        </div>
                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{user.name}</p>
                                            <p className="text-xs text-slate-400 truncate">{user.position}</p>
                                        </div>
                                        {/* Level badge + arrow */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${badge.bg} ${badge.text}`}>
                                                {user.id}
                                            </span>
                                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Bottom note */}
                    <p className="text-center text-xs text-slate-400">
                        Sistem ini hanya untuk penggunaan internal PT PLN ICON Plus.
                    </p>
                </div>
            </div>
        </div>
    );
}
