"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Session {
  id: string;
  scriptId: string;
  date: Date | string;
  maxPlayers: number;
  currentPlayers: number;
  open: boolean;
}

interface Script {
  id: string;
  title: string;
}

function toLocalDatetimeString(date: Date | string): string {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditSessionForm({
  session,
  scripts,
}: {
  session: Session;
  scripts: Script[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    scriptId: session.scriptId,
    date: toLocalDatetimeString(session.date),
    maxPlayers: String(session.maxPlayers),
    open: session.open,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/sessions/${session.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scriptId: form.scriptId,
          date: new Date(form.date).toISOString(),
          maxPlayers: Number(form.maxPlayers),
          open: form.open,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "更新失敗");
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

  async function handleDelete() {
    if (!confirm("確定要刪除此場次嗎？此操作無法復原，並將刪除所有相關預約。")) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/sessions/${session.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/admin/sessions");
        router.refresh();
      } else {
        setError("刪除失敗");
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          劇本 <span className="text-red-500">*</span>
        </label>
        <select
          value={form.scriptId}
          onChange={(e) => setForm({ ...form, scriptId: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
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
          min={session.currentPlayers}
          value={form.maxPlayers}
          onChange={(e) => setForm({ ...form, maxPlayers: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <p className="text-xs text-gray-500 mt-1">目前已報名 {session.currentPlayers} 人</p>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="open"
          checked={form.open}
          onChange={(e) => setForm({ ...form, open: e.target.checked })}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="open" className="text-sm font-medium text-gray-700">
          開放報名
        </label>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? "儲存中..." : "儲存變更"}
          </button>
          <Link
            href="/admin/sessions"
            className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            取消
          </Link>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
        >
          {deleting ? "刪除中..." : "刪除場次"}
        </button>
      </div>
    </form>
  );
}
