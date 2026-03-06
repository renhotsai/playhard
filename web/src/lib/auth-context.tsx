"use client";

import { createContext, useContext } from "react";
import { useSession } from "@/lib/auth-client";
import type { Session } from "better-auth/types";

interface AuthContextType {
  session: any | null;
  user: any | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();

  const contextValue: AuthContextType = {
    session: session || null,
    user: session?.user || null,
    loading: isPending,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}