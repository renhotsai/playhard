"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LoginDialog from "@/components/login-dialog";
import { User, Settings, History, LogOut, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UserMenu() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const signOut = async () => {
    await authClient.signOut();
    router.refresh();
  };

  if (loading) {
    return (
      <div className="h-8 w-8 bg-nav-primary-foreground/20 rounded-full animate-pulse" />
    );
  }

  if (!user) {
    return (
      <LoginDialog>
        <Button variant="outline" size="sm" className="text-foreground border-border hover:bg-accent hover:text-accent-foreground">
          <LogIn className="h-4 w-4 mr-2" />
          登入
        </Button>
      </LoginDialog>
    );
  }

  const displayName = user.name || user.email?.split('@')[0] || "用戶";
  const avatarUrl = user.image;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 hover:bg-nav-primary-foreground/10">
          <UserAvatar 
            displayName={displayName}
            avatarUrl={avatarUrl}
            size="md"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User className="mr-2 h-4 w-4" />
            <span>個人資料</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile?tab=settings">
            <Settings className="mr-2 h-4 w-4" />
            <span>帳號設定</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile?tab=history">
            <History className="mr-2 h-4 w-4" />
            <span>預約記錄</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>登出</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}