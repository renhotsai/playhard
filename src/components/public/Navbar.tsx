"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function Navbar() {
  const { data: session } = authClient.useSession();

  return (
    <nav className="bg-surface border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold font-heading text-gold hover:text-gold-dark transition-colors">
          PlayHard 劇本殺
        </Link>
        <div className="flex gap-6 text-sm font-medium items-center">
          <Link href="/" className="hover:text-gold transition-colors">
            首頁
          </Link>
          <Link href="/scripts" className="hover:text-gold transition-colors">
            劇本列表
          </Link>
          <Link href="/about" className="hover:text-gold transition-colors">
            關於我們
          </Link>
          {session?.user ? (
            <Link href="/account" className="hover:text-gold transition-colors">
              會員中心
            </Link>
          ) : (
            <>
              <Link href="/login" className="hover:text-gold transition-colors">
                登入
              </Link>
              <Link href="/register" className="hover:text-gold transition-colors">
                註冊
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
