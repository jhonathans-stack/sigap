"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@/lib/types";
import { clearSession, getStoredToken, getStoredUser, saveSession } from "@/lib/storage";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setSession: (token: string, user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(getStoredUser());
    setToken(getStoredToken());
    setIsLoading(false);
  }, []);

  const setSession = useCallback((nextToken: string, nextUser: User) => {
    saveSession(nextToken, nextUser);
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      setSession,
      logout
    }),
    [isLoading, logout, setSession, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth precisa ser usado dentro de AuthProvider.");
  }

  return context;
}
