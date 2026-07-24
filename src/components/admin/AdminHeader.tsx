"use client";

import { useRouter } from "next/navigation";

interface AdminHeaderProps {
  title: string;
}

export default function AdminHeader({ title }: AdminHeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      <button
        onClick={handleLogout}
        className="text-sm text-gray-600 hover:text-red-600 transition-colors font-medium"
      >
        登出
      </button>
    </header>
  );
}
