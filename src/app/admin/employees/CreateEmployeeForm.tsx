"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function CreateEmployeeForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: createError } = await authClient.admin.createUser({
        email: form.email,
        password: form.password,
        name: form.name,
        role: "employee",
      });

      if (createError) {
        setError(createError.message || "新增失敗");
      } else {
        setForm({ name: "", email: "", password: "" });
        router.refresh();
      }
    } catch {
      setError("網路錯誤，請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          姓名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="請輸入員工姓名"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          電子信箱 <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="請輸入電子信箱"
          required
          autoComplete="off"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          密碼 <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="請設定初始密碼"
          required
          autoComplete="new-password"
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
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {loading ? "新增中..." : "新增員工"}
      </button>
    </form>
  );
}
