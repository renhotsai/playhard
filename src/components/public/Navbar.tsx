"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function Navbar() {
  const { data: session } = authClient.useSession();

  return (
    <nav className="bg-gray-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-yellow-400 hover:text-yellow-300 transition-colors">
          PlayHard 劇本殺
        </Link>
        <div className="flex gap-6 text-sm font-medium items-center">
          <Link href="/" className="hover:text-yellow-400 transition-colors">
            首頁
          </Link>
          <Link href="/scripts" className="hover:text-yellow-400 transition-colors">
            劇本列表
          </Link>
          {session?.user ? (
            <Link href="/account" className="hover:text-yellow-400 transition-colors">
              會員中心
            </Link>
          ) : (
            <>
              <Link href="/login" className="hover:text-yellow-400 transition-colors">
                登入
              </Link>
              <Link href="/register" className="hover:text-yellow-400 transition-colors">
                註冊
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
