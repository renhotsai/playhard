"use client";

import { useAuth } from "@/lib/auth-context";
import LoginDialog from "@/components/login-dialog";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

export default function AuthGuard({ 
  children, 
  fallback,
  requireAuth = true 
}: AuthGuardProps) {
  const { user, loading } = useAuth();

  // If not requiring auth, always show children
  if (!requireAuth) {
    return <>{children}</>;
  }

  // Show loading state
  if (loading) {
    return (
      <Button disabled variant="outline" className="opacity-50">
        <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
        載入中...
      </Button>
    );
  }

  // If user is authenticated, show the protected content
  if (user) {
    return <>{children}</>;
  }

  // If no custom fallback provided, use default login dialog trigger
  if (!fallback) {
    return (
      <LoginDialog>
        <Button variant="outline">
          <LogIn className="h-4 w-4 mr-2" />
          登入後預約
        </Button>
      </LoginDialog>
    );
  }

  // Use custom fallback
  return <>{fallback}</>;
}