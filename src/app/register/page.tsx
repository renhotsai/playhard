"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { authClient } from "@/lib/auth-client";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: signUpError } = await authClient.signUp.email({
        email: form.email,
        password: form.password,
        name: form.name,
      });

      if (signUpError) {
        setError(signUpError.message || "註冊失敗，請稍後再試");
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
        <div className="bg-surface border border-white/10 rounded-lg shadow-xl p-8 w-full max-w-sm">
          <h1 className="text-2xl font-bold font-heading text-gold mb-2 text-center">會員註冊</h1>
          <p className="text-white/60 text-sm text-center mb-6">建立帳號以查看您的預約紀錄</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">姓名</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-white/90 border border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
                placeholder="請輸入您的姓名"
                required
                autoComplete="name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">電子信箱</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-white/90 border border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
                placeholder="請輸入電子信箱"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">密碼</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-white/90 border border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
                placeholder="請輸入密碼"
                required
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold text-background py-2.5 rounded-lg font-semibold hover:bg-gold-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "註冊中..." : "註冊"}
            </button>
          </form>

          <p className="text-center text-sm text-white/60 mt-6">
            已經有帳號了嗎？{" "}
            <Link href="/login" className="text-gold hover:text-gold-dark font-medium">
              前往登入
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
