"use client";
// lib/auth-context.tsx

import React, { createContext, useContext, useState } from "react";
import type { User, UserRole } from "@/types";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void; // For demo only
}

const AuthContext = createContext<AuthContextType | null>(null);

const mockUsers: Record<string, User> = {
  "admin@warranty.com": { id: "u1", name: "Super Admin", email: "admin@warranty.com", role: "superadmin" },
  "sales@warranty.com": { id: "u2", name: "Ahmad Sales", email: "sales@warranty.com", role: "sales" },
  "dealer@warranty.com": { id: "u3", name: "PT Maju Teknologi", email: "dealer@warranty.com", role: "dealer", dealerId: "d1" },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, _password: string) => {
    await new Promise((r) => setTimeout(r, 800));
    const found = mockUsers[email];
    if (!found) throw new Error("Invalid credentials");
    setUser(found);
  };

  const logout = () => setUser(null);

  const switchRole = (role: UserRole) => {
    const userForRole = Object.values(mockUsers).find((u) => u.role === role);
    if (userForRole) setUser(userForRole);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
