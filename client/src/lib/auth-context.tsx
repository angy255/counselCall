"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiFetch } from "./api";
import { User } from "./types";

type RegisterInput = {
  email: string;
  password: string;
  name: string;
  role: "CLIENT" | "ATTORNEY";
};

type LoginInput = {
  email: string;
  password: string;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await apiFetch<{ user: User }>("/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const register = useCallback(async (input: RegisterInput) => {
    await apiFetch<{ user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const data = await apiFetch<{ user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await apiFetch<{ success: boolean }>("/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, refreshUser, register, login, logout }),
    [user, loading, refreshUser, register, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
