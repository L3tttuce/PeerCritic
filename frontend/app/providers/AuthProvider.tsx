"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import axios from "axios";
import { usePathname } from "next/navigation";
import api from "@/app/apiClient";
import { AUTH_CHANGED_EVENT } from "@/app/authEvents";

export type AuthUser = {
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoggedIn: boolean;
  authLoading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const pathname = usePathname();

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    if (!token && !refreshToken) {
      setUser(null);
      setAuthLoading(false);
      return;
    }

    try {
      const response = await api.get("/current_user");
      const data = response.data;
      setUser({
        userId: data.userId ?? data.user_id,
        username: data.username,
        firstName: data.firstName ?? data.first_name,
        lastName: data.lastName ?? data.last_name,
        avatar: data.avatar ?? null,
      });
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      if (status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setUser(null);
      }
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    void refreshUser();
  }, [pathname, refreshUser]);

  useEffect(() => {
    const handleAuthChanged = () => {
      void refreshUser();
    };

    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
  }, [refreshUser]);

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: user !== null,
        authLoading,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
