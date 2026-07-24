"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Script {
  id: string;
  title: string;
}

export default function NewSessionForm({ scripts }: { scripts: Script[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    scriptId: scripts[0]?.id ?? "",
    date: "",
    maxPlayers: "8",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scriptId: form.scriptId,
          date: new Date(form.date).toISOString(),
          maxPlayers: Number(form.maxPlayers),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "新增失敗");
      } else {
        router.push("/admin/sessions");
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
          選擇劇本 <span className="text-red-500">*</span>
        </label>
        <select
          value={form.scriptId}
          onChange={(e) => setForm({ ...form, scriptId: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          {scripts.length === 0 && (
            <option value="">-- 尚無劇本，請先新增劇本 --</option>
          )}
          {scripts.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          場次日期時間 <span className="text-red-500">*</span>
        </label>
        <input
          type="datetime-local"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          最大報名人數 <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          min="1"
          value={form.maxPlayers}
          onChange={(e) => setForm({ ...form, maxPlayers: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading || scripts.length === 0}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? "儲存中..." : "新增場次"}
        </button>
        <Link
          href="/admin/sessions"
          className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          取消
        </Link>
      </div>
    </form>
  );
}
