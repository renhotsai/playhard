"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: signInError } = await authClient.signIn.email({
        email: form.email,
        password: form.password,
      });

      if (signInError) {
        // Better Auth's returned message is English ("Invalid email or
        // password"); the UI must always show a Traditional Chinese message.
        setError("帳號或密碼錯誤");
      } else {
        router.push("/account");
        router.refresh();
      }
    } catch {
      setError("網路錯誤，請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">會員登入</h1>
          <p className="text-gray-500 text-sm text-center mb-6">登入以查看您的預約紀錄</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">電子信箱</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="請輸入電子信箱"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="請輸入密碼"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "登入中..." : "登入"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            還沒有帳號嗎？{" "}
            <Link href="/register" className="text-blue-600 hover:text-blue-800 font-medium">
              前往註冊
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
