"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User } from "@/lib/types";
import { api } from "@/lib/api";

type AuthContextType = {
    currentUser: User | null;
    allUsers: User[];
    login: (email: string, password: string) => Promise<User | null>;
    loginById: (userId: string) => Promise<User | null>;
    logout: () => Promise<void>;
    refreshUsers: () => Promise<void>;
    isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUsers = useCallback(async () => {
        try {
            const { users } = await api.users.list();
            setAllUsers(users as User[]);
        } catch {
            // Fallback
        }
    }, []);

    // Check session on mount
    useEffect(() => {
        (async () => {
            try {
                const { user } = await api.auth.me();
                if (user) setCurrentUser(user as User);
            } catch {
                // Not logged in
            }

            await refreshUsers();
            setIsLoading(false);
        })();
    }, [refreshUsers]);

    const login = useCallback(async (email: string, password: string): Promise<User | null> => {
        try {
            const user = await api.auth.login(email, password);
            setCurrentUser(user as User);
            return user as User;
        } catch {
            return null;
        }
    }, []);

    const loginById = useCallback(async (userId: string): Promise<User | null> => {
        // Find user and login with their credentials (demo only)
        const user = allUsers.find((u) => u.id === userId);
        if (user) {
            return await login(user.email, "password");
        }
        return null;
    }, [allUsers, login]);

    const logout = useCallback(async () => {
        try {
            await api.auth.logout();
        } catch {
            // Ignore
        }
        setCurrentUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ currentUser, allUsers, login, loginById, logout, refreshUsers, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
