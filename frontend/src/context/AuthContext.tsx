import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const API = "http://localhost:8000";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  song_ids: string[];
  credits: number;
  is_pro: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<string | null>;
  signup: (name: string, email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  updateProfile: (name?: string, avatarFile?: File) => Promise<string | null>;
  deleteAccount: () => Promise<string | null>;
  refreshUser: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, check if cookie is valid
  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch(`${API}/me`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = async (
    email: string,
    password: string,
    rememberMe: boolean
  ): Promise<string | null> => {
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, remember_me: rememberMe }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return err.detail || "Login failed";
      }
      const data = await res.json();
      setUser(data);
      return null; // no error
    } catch {
      return "Network error";
    }
  };

  const signup = async (
    name: string,
    email: string,
    password: string
  ): Promise<string | null> => {
    try {
      const res = await fetch(`${API}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return err.detail || "Signup failed";
      }
      const data = await res.json();
      setUser(data);
      return null;
    } catch {
      return "Network error";
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore
    }
    setUser(null);
  };

  const updateProfile = async (
    name?: string,
    avatarFile?: File
  ): Promise<string | null> => {
    try {
      const formData = new FormData();
      if (name) formData.append("name", name);
      if (avatarFile) formData.append("avatar", avatarFile);

      const res = await fetch(`${API}/me`, {
        method: "PUT",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return err.detail || "Update failed";
      }
      const data = await res.json();
      setUser(data);
      return null;
    } catch {
      return "Network error";
    }
  };

  const deleteAccount = async (): Promise<string | null> => {
    try {
      const res = await fetch(`${API}/me`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return err.detail || "Delete failed";
      }
      setUser(null);
      return null;
    } catch {
      return "Network error";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        logout,
        updateProfile,
        deleteAccount,
        refreshUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
