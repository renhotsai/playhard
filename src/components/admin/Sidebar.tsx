"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "儀表板", exact: true },
  { href: "/admin/scripts", label: "劇本管理" },
  { href: "/admin/sessions", label: "場次管理" },
  { href: "/admin/reservations", label: "預約管理" },
  { href: "/admin/banners", label: "橫幅管理" },
  { href: "/admin/announcements", label: "公告管理" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-white flex flex-col flex-shrink-0">
      <div className="p-6 border-b border-gray-700">
        <Link href="/admin" className="text-lg font-bold text-yellow-400">
          PlayHard 後台
        </Link>
      </div>
      <nav className="flex-1 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block px-6 py-3 text-sm font-medium transition-colors hover:bg-gray-700 hover:text-yellow-400 ${
                    isActive ? "bg-gray-700 text-yellow-400 border-l-4 border-yellow-400" : "text-gray-300"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-700">
        <Link href="/" className="text-xs text-gray-400 hover:text-gray-200 transition-colors">
          ← 前往前台
        </Link>
      </div>
    </aside>
  );
}
