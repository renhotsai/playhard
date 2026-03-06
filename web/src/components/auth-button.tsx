"use client";

import { useAuth } from "@/lib/auth-context";
import LoginDialog from "@/components/login-dialog";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

interface AuthButtonProps extends React.ComponentProps<typeof Button> {
  children: React.ReactNode;
  loginText?: string;
  loginIcon?: React.ReactNode;
  requireAuth?: boolean;
}

export default function AuthButton({ 
  children,
  loginText = "登入後使用",
  loginIcon,
  requireAuth = true,
  ...buttonProps
}: AuthButtonProps) {
  const { user, loading } = useAuth();

  // If not requiring auth, always show children
  if (!requireAuth) {
    return <>{children}</>;
  }

  // Show loading state
  if (loading) {
    return (
      <Button {...buttonProps} disabled className="opacity-50">
        <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
        載入中...
      </Button>
    );
  }

  // If user is authenticated, show the protected content
  if (user) {
    return <>{children}</>;
  }

  // Show login dialog trigger
  return (
    <LoginDialog>
      <Button {...buttonProps}>
        {loginIcon || <LogIn className="h-4 w-4 mr-2" />}
        {loginText}
      </Button>
    </LoginDialog>
  );
}